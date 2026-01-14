// Authentication Service
import { db, auth } from '../firebase-config.js';
import { signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { collection, query, where, getDocs, doc, setDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { hashPINWithSalt, generateSalt } from '../utils/encryption.js';
import { storage } from '../utils/storage.js';

export async function loginWithPIN(email, pin) {
    try {
        if (!auth.currentUser) await signInAnonymously(auth);

        const authRef = collection(db, 'auth');
        let q = query(authRef, where('email', '==', email.toLowerCase()));
        let snapshot = await getDocs(q);

        if (snapshot.empty) {
            q = query(authRef, where('email', '==', email));
            snapshot = await getDocs(q);
        }

        if (snapshot.empty) {
            return { success: false, error: 'User not found' };
        }

        const authData = snapshot.docs[0].data();
        const pinHash = hashPINWithSalt(pin, authData.salt);

        if (pinHash !== authData.pinHash) {
            return { success: false, error: 'Invalid PIN' };
        }

        await updateDoc(doc(db, 'auth', authData.uid), { lastLogin: Date.now() });
        await updateDoc(doc(db, 'users', authData.uid), { lastActive: Date.now() });

        storage.setItem('kobi_atlas_uid', authData.uid);
        storage.setItem('kobi_atlas_email', authData.email);

        return { success: true, userId: authData.uid };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

export async function registerWithPIN(email, pin, username) {
    try {
        if (!/^\d{4}$/.test(pin)) {
            return { success: false, error: 'PIN must be 4 digits' };
        }

        if (!auth.currentUser) await signInAnonymously(auth);

        const normalizedEmail = email.toLowerCase();
        const usersRef = collection(db, 'users');
        const qUsers = query(usersRef, where('email', '==', normalizedEmail));
        const existing = await getDocs(qUsers);

        if (!existing.empty) {
            return { success: false, error: 'Email already registered' };
        }

        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const salt = generateSalt();
        const pinHash = hashPINWithSalt(pin, salt);

        await setDoc(doc(db, 'auth', userId), {
            uid: userId,
            email: normalizedEmail,
            pinHash,
            salt,
            createdAt: Date.now(),
            lastLogin: Date.now()
        });

        await setDoc(doc(db, 'users', userId), {
            uid: userId,
            email: normalizedEmail,
            username: username || normalizedEmail.split('@')[0],
            displayName: username || normalizedEmail.split('@')[0],
            bio: '',
            profilePicture: '',
            friends: [],
            friendRequests: [],
            achievements: [],
            streak: 0,
            lastActive: Date.now(),
            createdAt: Date.now()
        });

        storage.setItem('kobi_atlas_uid', userId);
        storage.setItem('kobi_atlas_email', normalizedEmail);

        return { success: true, userId };
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: error.message };
    }
}

export function checkAuth() {
    return storage.getItem('kobi_atlas_uid');
}

export function logout() {
    storage.removeItem('kobi_atlas_uid');
    storage.removeItem('kobi_atlas_email');
}
