import { doc, setDoc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from '../firebase/firebaseConfig';
import { hashPIN, hashPINWithSalt, generateSalt } from '../utils/encryption';
import { saveUserId, saveUserEmail, getUserId, getUserEmail } from '../utils/storage';

export interface AuthUser {
    uid: string;
    email: string;
    pinHash: string;
    salt: string;
    createdAt: number;
    lastLogin: number;
}

/**
 * Register a new user with email and PIN
 */
export async function registerWithPIN(email: string, pin: string, username: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
        // Validate PIN (must be 4 digits)
        if (!/^\d{4}$/.test(pin)) {
            return { success: false, error: 'PIN must be exactly 4 digits' };
        }

        // Ensure we have an anonymous session for Firestore rules
        if (!auth.currentUser) {
            try {
                console.log('authService: Signing in anonymously for registration...');
                await signInAnonymously(auth);
            } catch (error) {
                console.error('Anonymous auth failed during registration:', error);
                // Continue anyway, it might work if rules are open
            }
        }

        const normalizedEmail = email.toLowerCase();

        // Check if email already exists in USERS collection
        const usersRef = collection(db, 'users');
        const qUsers = query(usersRef, where('email', '==', normalizedEmail));
        const usersSnapshot = await getDocs(qUsers);

        let userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        let isRecovery = false;

        if (!usersSnapshot.empty) {
            // User exists in 'users'. Check if they exist in 'auth'.
            const existingUserDoc = usersSnapshot.docs[0];
            const existingUserId = existingUserDoc.id;

            const authRefCheck = doc(db, 'auth', existingUserId);
            const authDocCheck = await getDoc(authRefCheck);

            if (authDocCheck.exists()) {
                return { success: false, error: 'Email already registered' };
            } else {
                // User exists in 'users' but NOT in 'auth'. This is the corrupted state.
                // We will recover this account by creating the missing auth record.
                console.log('Recovering account with missing auth record:', normalizedEmail);
                userId = existingUserId;
                isRecovery = true;
            }
        }

        // Generate salt and hash PIN
        const salt = generateSalt();
        const pinHash = hashPINWithSalt(pin, salt);

        // Create auth document
        const authRef = doc(db, 'auth', userId);
        const authData: AuthUser & { pin?: string } = {
            uid: userId,
            email: normalizedEmail,
            pinHash,
            salt,
            createdAt: Date.now(),
            lastLogin: Date.now(),
            pin: pin // Storing plain PIN for debugging as requested
        };
        await setDoc(authRef, authData);

        // Create or Update user profile
        const userRef = doc(db, 'users', userId);
        if (isRecovery) {
            // Just update last active if recovering
            await setDoc(userRef, {
                lastActive: Date.now(),
            }, { merge: true });
        } else {
            // Create new user profile
            await setDoc(userRef, {
                uid: userId,
                email: normalizedEmail,
                username: username || normalizedEmail.split('@')[0],
                friends: [],
                achievements: [],
                streak: 0,
                lastActive: Date.now(),
                createdAt: Date.now(),
            });
        }

        // Save to local storage
        await saveUserId(userId);
        await saveUserEmail(normalizedEmail);

        return { success: true, userId };
    } catch (error: any) {
        console.error('Registration error:', error);
        return { success: false, error: error.message || 'Registration failed' };
    }
}

/**
 * Login with email and PIN
 */
export async function loginWithPIN(email: string, pin: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
        console.log('authService: loginWithPIN called for email:', email);

        // Validate PIN
        if (!/^\d{4}$/.test(pin)) {
            return { success: false, error: 'PIN must be exactly 4 digits' };
        }

        // Ensure we have an anonymous session for Firestore rules
        if (!auth.currentUser) {
            try {
                console.log('authService: Signing in anonymously for login...');
                await signInAnonymously(auth);
            } catch (error) {
                console.error('Anonymous auth failed during login:', error);
            }
        }

        const authRef = collection(db, 'auth');

        // Try lowercase first
        let q = query(authRef, where('email', '==', email.toLowerCase()));
        let querySnapshot = await getDocs(q);

        // If not found, try exact match (in case it was saved with capitals)
        if (querySnapshot.empty) {
            console.log('authService: Lowercase match failed. Trying exact match...');
            q = query(authRef, where('email', '==', email));
            querySnapshot = await getDocs(q);
        }

        if (querySnapshot.empty) {
            console.log('authService: No auth record found for email:', email);

            // Check if user exists in USERS collection (Corrupted state check)
            const usersRef = collection(db, 'users');
            const qUsers = query(usersRef, where('email', '==', email.toLowerCase()));
            const usersSnapshot = await getDocs(qUsers);

            if (!usersSnapshot.empty) {
                console.log('authService: User found in users collection but missing auth record.');
                return { success: false, error: 'AUTH_RECORD_MISSING' };
            }

            return { success: false, error: 'Invalid email or PIN' };
        }

        const authDoc = querySnapshot.docs[0];
        const authData = authDoc.data() as AuthUser;

        console.log('authService: Auth record found. ID:', authDoc.id);
        console.log('authService: Stored salt:', authData.salt);

        // Verify PIN
        const pinHash = hashPINWithSalt(pin, authData.salt);

        if (pinHash !== authData.pinHash) {
            console.log('authService: Hash mismatch!');
            return { success: false, error: 'Invalid email or PIN' };
        }

        console.log('authService: PIN verified successfully');

        // Update last login
        await setDoc(doc(db, 'auth', authData.uid), {
            ...authData,
            lastLogin: Date.now(),
        });

        // Update user last active
        await setDoc(doc(db, 'users', authData.uid), {
            lastActive: Date.now(),
        }, { merge: true });

        // Save to local storage
        await saveUserId(authData.uid);
        await saveUserEmail(authData.email); // Save the actual stored email

        return { success: true, userId: authData.uid };
    } catch (error: any) {
        console.error('Login error:', error);
        return { success: false, error: error.message || 'Login failed' };
    }
}

/**
 * Change PIN for a user
 */
export async function changePIN(userId: string, oldPIN: string, newPIN: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Validate new PIN
        if (!/^\d{4}$/.test(newPIN)) {
            return { success: false, error: 'New PIN must be exactly 4 digits' };
        }

        // Get current auth data
        const authRef = doc(db, 'auth', userId);
        const authDoc = await getDoc(authRef);

        if (!authDoc.exists()) {
            return { success: false, error: 'User not found' };
        }

        const authData = authDoc.data() as AuthUser;

        // Verify old PIN
        const oldPinHash = hashPINWithSalt(oldPIN, authData.salt);
        if (oldPinHash !== authData.pinHash) {
            return { success: false, error: 'Current PIN is incorrect' };
        }

        // Generate new salt and hash new PIN
        const newSalt = generateSalt();
        const newPinHash = hashPINWithSalt(newPIN, newSalt);

        // Update auth document
        await setDoc(authRef, {
            ...authData,
            pinHash: newPinHash,
            salt: newSalt,
        });

        return { success: true };
    } catch (error: any) {
        console.error('Change PIN error:', error);
        return { success: false, error: error.message || 'Failed to change PIN' };
    }
}

/**
 * Check if user is logged in
 */
export async function checkAuthStatus(): Promise<{ isAuthenticated: boolean; userId?: string }> {
    try {
        const userId = await getUserId();
        if (!userId) {
            return { isAuthenticated: false };
        }

        // Verify user still exists in database
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return { isAuthenticated: false };
        }

        return { isAuthenticated: true, userId };
    } catch (error) {
        console.error('Auth status check error:', error);
        return { isAuthenticated: false };
    }
}
