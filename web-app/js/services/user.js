// User Service
import { db } from '../firebase-config.js';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

export async function getUserProfile(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            return { id: userDoc.id, ...userDoc.data() };
        }
        return null;
    } catch (error) {
        console.error('Get user profile error:', error);
        return null;
    }
}

export async function updateUserProfile(userId, data) {
    try {
        await updateDoc(doc(db, 'users', userId), data);
        return true;
    } catch (error) {
        console.error('Update user profile error:', error);
        return false;
    }
}

export async function searchUsers(searchQuery) {
    try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);

        const users = [];
        snapshot.forEach(doc => {
            const user = { id: doc.id, ...doc.data() };
            if (user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())) {
                users.push(user);
            }
        });
        return users;
    } catch (error) {
        console.error('Search users error:', error);
        return [];
    }
}
