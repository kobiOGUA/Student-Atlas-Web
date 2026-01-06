import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { hashPINWithSalt, generateSalt } from './encryption';

/**
 * Utility to change PIN for a user by email
 * This is a one-time utility function for administrative PIN changes
 */
export async function adminChangePIN(email: string, newPIN: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Validate new PIN
        if (!/^\d{4}$/.test(newPIN)) {
            return { success: false, error: 'New PIN must be exactly 4 digits' };
        }

        // Find user by email in auth collection
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const authRef = collection(db, 'auth');
        const q = query(authRef, where('email', '==', email.toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { success: false, error: 'User not found' };
        }

        const authDoc = querySnapshot.docs[0];
        const authData = authDoc.data();
        const userId = authDoc.id;

        // Generate new salt and hash new PIN
        const newSalt = generateSalt();
        const newPinHash = hashPINWithSalt(newPIN, newSalt);

        // Update auth document with new PIN, hash, and salt
        const authDocRef = doc(db, 'auth', userId);
        await setDoc(authDocRef, {
            ...authData,
            pin: newPIN,  // Store plain PIN for debugging
            pinHash: newPinHash,
            salt: newSalt,
        });

        console.log('PIN changed successfully for user:', email);
        return { success: true };
    } catch (error: any) {
        console.error('Change PIN error:', error);
        return { success: false, error: error.message || 'Failed to change PIN' };
    }
}

// Example usage (run this in browser console or create a temporary button):
// import { adminChangePIN } from './utils/changePinUtil';
// adminChangePIN('kobioguadinma@gmail.com', '9568').then(result => console.log(result));
