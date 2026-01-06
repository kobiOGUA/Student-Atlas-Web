import { collection, addDoc, query, where, getDocs, orderBy, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { ChatMessage } from '../types';

export async function sendMessage(
    senderId: string,
    receiverId: string,
    text: string
): Promise<void> {
    try {
        const messagesRef = collection(db, 'messages');
        await addDoc(messagesRef, {
            senderId,
            receiverId,
            text,
            timestamp: Date.now(),
            read: false,
        });
        console.log('Message sent successfully');
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
}

export async function getMessages(
    userId: string,
    otherUserId: string
): Promise<ChatMessage[]> {
    try {
        const messagesRef = collection(db, 'messages');

        // Get messages sent by userId to otherUserId
        const q1 = query(
            messagesRef,
            where('senderId', '==', userId),
            where('receiverId', '==', otherUserId)
        );

        // Get messages sent by otherUserId to userId
        const q2 = query(
            messagesRef,
            where('senderId', '==', otherUserId),
            where('receiverId', '==', userId)
        );

        const [snapshot1, snapshot2] = await Promise.all([
            getDocs(q1),
            getDocs(q2)
        ]);

        const messages: ChatMessage[] = [];

        snapshot1.forEach(doc => {
            const messageData = doc.data();
            // Filter out deleted messages
            if (!messageData.deleted) {
                messages.push({
                    ...messageData,
                    id: doc.id,
                } as ChatMessage);
            }
        });

        snapshot2.forEach(doc => {
            const messageData = doc.data();
            // Filter out deleted messages
            if (!messageData.deleted) {
                messages.push({
                    ...messageData,
                    id: doc.id,
                } as ChatMessage);
            }
        });

        // Sort by timestamp
        messages.sort((a, b) => a.timestamp - b.timestamp);

        return messages;
    } catch (error) {
        console.error('Error getting messages:', error);
        throw error;
    }
}

export async function markMessagesAsRead(
    userId: string,
    otherUserId: string
): Promise<void> {
    try {
        const messagesRef = collection(db, 'messages');
        const q = query(
            messagesRef,
            where('senderId', '==', otherUserId),
            where('receiverId', '==', userId),
            where('read', '==', false)
        );

        const querySnapshot = await getDocs(q);

        const updatePromises = querySnapshot.docs.map(messageDoc =>
            updateDoc(doc(db, 'messages', messageDoc.id), { read: true })
        );

        await Promise.all(updatePromises);
    } catch (error) {
        console.error('Error marking messages as read:', error);
        // Don't throw - this is not critical
    }
}

export async function getUnreadCount(userId: string): Promise<number> {
    try {
        const messagesRef = collection(db, 'messages');
        const q = query(
            messagesRef,
            where('receiverId', '==', userId),
            where('read', '==', false)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.size;
    } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }
}

export async function deleteMessage(messageId: string): Promise<void> {
    try {
        const messageRef = doc(db, 'messages', messageId);
        await setDoc(messageRef, { deleted: true }, { merge: true });
    } catch (error) {
        console.error('Error deleting message:', error);
        throw error;
    }
}
