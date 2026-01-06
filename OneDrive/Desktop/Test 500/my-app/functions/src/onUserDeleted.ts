/**
 * Firebase Cloud Function to cascade delete user data
 * 
 * This function triggers when a user document is deleted from the 'users' collection
 * and automatically deletes all associated data:
 * - Auth record
 * - Posts
 * - Replies
 * - Messages (sent and received)
 * - Friend requests
 * - Notifications
 * 
 * Deploy with: firebase deploy --only functions:onUserDeleted
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

export const onUserDeleted = functions.firestore
    .document('users/{userId}')
    .onDelete(async (snapshot, context) => {
        const userId = context.params.userId;
        const userData = snapshot.data();

        console.log(`Starting cascade delete for user: ${userId} (${userData?.email})`);

        const batch = db.batch();
        let deleteCount = 0;

        try {
            // 1. Delete auth record
            const authRef = db.collection('auth').doc(userId);
            batch.delete(authRef);
            deleteCount++;
            console.log(`Queued auth record for deletion`);

            // 2. Delete all posts by this user
            const postsSnapshot = await db.collection('posts')
                .where('authorId', '==', userId)
                .get();

            postsSnapshot.forEach(doc => {
                batch.delete(doc.ref);
                deleteCount++;
            });
            console.log(`Queued ${postsSnapshot.size} posts for deletion`);

            // 3. Delete all replies by this user
            const repliesSnapshot = await db.collection('replies')
                .where('authorId', '==', userId)
                .get();

            repliesSnapshot.forEach(doc => {
                batch.delete(doc.ref);
                deleteCount++;
            });
            console.log(`Queued ${repliesSnapshot.size} replies for deletion`);

            // 4. Delete all messages sent by this user
            const sentMessagesSnapshot = await db.collection('messages')
                .where('senderId', '==', userId)
                .get();

            sentMessagesSnapshot.forEach(doc => {
                batch.delete(doc.ref);
                deleteCount++;
            });
            console.log(`Queued ${sentMessagesSnapshot.size} sent messages for deletion`);

            // 5. Delete all messages received by this user
            const receivedMessagesSnapshot = await db.collection('messages')
                .where('receiverId', '==', userId)
                .get();

            receivedMessagesSnapshot.forEach(doc => {
                batch.delete(doc.ref);
                deleteCount++;
            });
            console.log(`Queued ${receivedMessagesSnapshot.size} received messages for deletion`);

            // 6. Delete all friend requests sent by this user
            const sentRequestsSnapshot = await db.collection('friendRequests')
                .where('fromUserId', '==', userId)
                .get();

            sentRequestsSnapshot.forEach(doc => {
                batch.delete(doc.ref);
                deleteCount++;
            });
            console.log(`Queued ${sentRequestsSnapshot.size} sent friend requests for deletion`);

            // 7. Delete all friend requests received by this user
            const receivedRequestsSnapshot = await db.collection('friendRequests')
                .where('toUserId', '==', userId)
                .get();

            receivedRequestsSnapshot.forEach(doc => {
                batch.delete(doc.ref);
                deleteCount++;
            });
            console.log(`Queued ${receivedRequestsSnapshot.size} received friend requests for deletion`);

            // 8. Delete all notifications for this user
            const notificationsSnapshot = await db.collection('notifications')
                .where('userId', '==', userId)
                .get();

            notificationsSnapshot.forEach(doc => {
                batch.delete(doc.ref);
                deleteCount++;
            });
            console.log(`Queued ${notificationsSnapshot.size} notifications for deletion`);

            // 9. Remove user from other users' friends arrays
            const friendsSnapshot = await db.collection('users')
                .where('friends', 'array-contains', userId)
                .get();

            friendsSnapshot.forEach(doc => {
                const friends = doc.data().friends || [];
                const updatedFriends = friends.filter((id: string) => id !== userId);
                batch.update(doc.ref, { friends: updatedFriends });
                deleteCount++;
            });
            console.log(`Queued ${friendsSnapshot.size} friend list updates`);

            // Commit all deletions in batch
            await batch.commit();

            console.log(`✅ Successfully deleted ${deleteCount} records for user ${userId}`);

            return {
                success: true,
                userId,
                deletedRecords: deleteCount,
                message: `Cascade delete completed for user ${userId}`
            };

        } catch (error) {
            console.error(`❌ Error during cascade delete for user ${userId}:`, error);
            throw new functions.https.HttpsError(
                'internal',
                `Failed to cascade delete user data: ${error}`
            );
        }
    });
