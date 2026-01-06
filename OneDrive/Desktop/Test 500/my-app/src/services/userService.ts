import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { User } from '../types';

export async function getAllUsers(): Promise<User[]> {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('lastActive', 'desc'));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            ...doc.data(),
            uid: doc.id,
        } as User));
    } catch (error) {
        console.error('Error getting all users:', error);
        throw error;
    }
}

export async function searchUsers(searchTerm: string): Promise<User[]> {
    try {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);

        const searchLower = searchTerm.toLowerCase();

        // Filter users by username or email
        const users = querySnapshot.docs
            .map(doc => ({
                ...doc.data(),
                uid: doc.id,
            } as User))
            .filter(user =>
                user.username?.toLowerCase().includes(searchLower) ||
                user.email?.toLowerCase().includes(searchLower)
            );

        return users;
    } catch (error) {
        console.error('Error searching users:', error);
        throw error;
    }
}

export async function getUserById(userId: string): Promise<User | null> {
    try {
        console.log('Getting user by ID:', userId);
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            const userData = {
                ...userDoc.data(),
                uid: userDoc.id,
            } as User;
            console.log('User data found:', userData);
            return userData;
        }
        console.log('User not found');
        return null;
    } catch (error) {
        console.error('Error getting user by ID:', error);
        throw error;
    }
}
