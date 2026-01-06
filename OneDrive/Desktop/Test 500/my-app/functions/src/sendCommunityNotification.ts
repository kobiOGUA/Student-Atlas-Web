/**
 * Firebase Cloud Function to send community-wide notifications
 * 
 * This is a callable function that allows admins to send notifications to all users
 * 
 * Usage:
 * const sendCommunityNotification = httpsCallable(functions, 'sendCommunityNotification');
 * await sendCommunityNotification({ 
 *   title: 'Welcome!', 
 *   message: 'Welcome everyone to the first version of Kobi\'s Atlas!!' 
 * });
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const sendCommunityNotification = functions.https.onCall(async (data, context) => {
    const db = admin.firestore();
    const { title, message } = data;

    // Validate input
    if (!title || !message) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Title and message are required'
        );
    }

    console.log(`Sending community notification: ${title}`);

    try {
        // Get all users
        const usersSnapshot = await db.collection('users').get();
        const users = usersSnapshot.docs;
        let notificationCount = 0;
        const timestamp = Date.now();

        // Process in chunks of 500 (Firestore batch limit)
        const chunkSize = 500;
        const chunks = [];

        for (let i = 0; i < users.length; i += chunkSize) {
            chunks.push(users.slice(i, i + chunkSize));
        }

        console.log(`Processing ${users.length} users in ${chunks.length} batches`);

        for (const chunk of chunks) {
            const batch = db.batch();

            chunk.forEach(userDoc => {
                const notificationRef = db.collection('notifications').doc();
                batch.set(notificationRef, {
                    userId: userDoc.id,
                    type: 'community',
                    title: title,
                    message: message,
                    read: false,
                    timestamp: timestamp,
                    createdAt: timestamp,
                });
                notificationCount++;
            });

            await batch.commit();
            console.log(`Committed batch of ${chunk.length} notifications`);
        }

        console.log(`✅ Successfully sent ${notificationCount} community notifications`);

        return {
            success: true,
            notificationCount,
            message: `Notification sent to ${notificationCount} users`
        };

    } catch (error) {
        console.error('Error sending community notification:', error);
        throw new functions.https.HttpsError(
            'internal',
            `Failed to send community notification: ${error}`
        );
    }
});
