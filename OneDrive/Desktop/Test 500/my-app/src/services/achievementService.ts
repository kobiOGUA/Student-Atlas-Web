import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export const unlockAchievement = async (userId: string, achievementId: string): Promise<boolean> => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            const currentAchievements = userData.achievements || [];

            if (!currentAchievements.includes(achievementId)) {
                await updateDoc(userRef, {
                    achievements: arrayUnion(achievementId)
                });
                return true; // Successfully unlocked new achievement
            }
        }
        return false; // Already unlocked or error
    } catch (error) {
        console.error('Error unlocking achievement:', error);
        return false;
    }
};
