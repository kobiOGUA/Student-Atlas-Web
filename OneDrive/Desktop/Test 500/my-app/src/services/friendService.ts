import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    orderBy,
    limit,
    arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { FriendRequest, User } from '../types';

// Send a friend request
export const sendFriendRequest = async (fromUserId: string, toUserId: string): Promise<void> => {
    try {
        // Check if request already exists
        const q = query(
            collection(db, 'friendRequests'),
            where('fromUserId', '==', fromUserId),
            where('toUserId', '==', toUserId)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            throw new Error('Friend request already sent');
        }

        // Check if they are already friends (reverse check might be needed too depending on implementation)
        // For For now, we assume the UI handles hiding the button if already friends

        const requestRef = doc(collection(db, 'friendRequests'));
        const newRequest: FriendRequest = {
            id: requestRef.id,
            fromUserId,
            toUserId,
            status: 'pending',
            timestamp: Date.now()
        };

        await setDoc(requestRef, newRequest);

        // Optionally update user's friendRequests array if you want to denormalize for speed
        // But querying the collection is safer for consistency
    } catch (error) {
        console.error('Error sending friend request:', error);
        throw error;
    }
};

// Get pending friend requests for a user
export const getPendingFriendRequests = async (userId: string): Promise<FriendRequest[]> => {
    try {
        const q = query(
            collection(db, 'friendRequests'),
            where('toUserId', '==', userId),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as FriendRequest);
    } catch (error) {
        console.error('Error getting friend requests:', error);
        throw error;
    }
};

// Get list of friends for a user
export const getFriends = async (userId: string): Promise<User[]> => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) return [];

        const userData = userDoc.data() as User;
        const friendIds = userData.friends || [];

        if (friendIds.length === 0) return [];

        // Fetch user details for each friend
        // Firestore 'in' query supports up to 10 items. If more, we need to batch or loop.
        // For simplicity in this demo, we'll Loop if > 10, or just fetch all individually parallel

        const friends: User[] = [];
        // Batching by 10 for 'in' query
        for (let i = 0; i < friendIds.length; i += 10) {
            const batch = friendIds.slice(i, i + 10);
            const q = query(
                collection(db, 'users'),
                where('uid', 'in', batch)
            );
            const snapshot = await getDocs(q);
            snapshot.docs.forEach(doc => friends.push(doc.data() as User));
        }

        return friends;
    } catch (error) {
        console.error('Error getting friends:', error);
        return [];
    }
};

// Check friendship status between two users
export const checkFriendshipStatus = async (currentUserId: string, otherUserId: string): Promise<'none' | 'pending_sent' | 'pending_received' | 'friends'> => {
    try {
        console.log('Checking friendship status:', { currentUserId, otherUserId });

        // Check if friends (this logic depends on how we store friends - assuming 'friends' array in User for now or a separate collection)
        // Let's check the 'friends' array in User document first as it's faster
        const userDoc = await getDoc(doc(db, 'users', currentUserId));
        if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            console.log('User data:', userData);

            if (userData.friends && userData.friends.includes(otherUserId)) {
                console.log('Users are friends');
                return 'friends';
            } else {
                console.log('Users are not friends. Friends array:', userData.friends);
            }
        } else {
            console.log('User document not found');
        }

        // Check for pending requests sent by current user
        const sentQuery = query(
            collection(db, 'friendRequests'),
            where('fromUserId', '==', currentUserId),
            where('toUserId', '==', otherUserId),
            where('status', '==', 'pending')
        );
        const sentSnapshot = await getDocs(sentQuery);
        if (!sentSnapshot.empty) {
            console.log('Pending sent request found');
            return 'pending_sent';
        }

        // Check for pending requests received by current user
        const receivedQuery = query(
            collection(db, 'friendRequests'),
            where('fromUserId', '==', otherUserId),
            where('toUserId', '==', currentUserId),
            where('status', '==', 'pending')
        );
        const receivedSnapshot = await getDocs(receivedQuery);
        if (!receivedSnapshot.empty) {
            console.log('Pending received request found');
            return 'pending_received';
        }

        console.log('No friendship status found, returning none');
        return 'none';
    } catch (error) {
        console.error('Error checking friendship status:', error);
        return 'none';
    }
};

// Accept friend request
export const acceptFriendRequest = async (requestId: string, fromUserId: string, toUserId: string): Promise<void> => {
    try {
        // 1. Update request status
        await updateDoc(doc(db, 'friendRequests', requestId), {
            status: 'accepted'
        });

        // 2. Add to both users' friend lists
        // We need to read both users first to get current friends array
        const fromUserRef = doc(db, 'users', fromUserId);
        const toUserRef = doc(db, 'users', toUserId);

        const fromUserDoc = await getDoc(fromUserRef);
        const toUserDoc = await getDoc(toUserRef);

        if (fromUserDoc.exists() && toUserDoc.exists()) {
            const fromUserData = fromUserDoc.data() as User;
            const toUserData = toUserDoc.data() as User;

            const fromUserFriends = fromUserData.friends || [];
            const toUserFriends = toUserData.friends || [];

            if (!fromUserFriends.includes(toUserId)) {
                await updateDoc(fromUserRef, {
                    friends: [...fromUserFriends, toUserId]
                });
            }

            if (!toUserFriends.includes(fromUserId)) {
                await updateDoc(toUserRef, {
                    friends: [...toUserFriends, fromUserId]
                });
            }

            // 3. Create a notification for the sender (fromUserId)
            const notificationRef = doc(collection(db, 'notifications'));
            await setDoc(notificationRef, {
                id: notificationRef.id,
                userId: fromUserId, // The user receiving the notification
                fromUserId: toUserId, // The user who accepted the request
                type: 'friend_accepted',
                message: `${toUserData.username || 'Someone'} accepted your friend request`,
                read: false,
                timestamp: Date.now()
            });

        }
    } catch (error) {
        console.error('Error accepting friend request:', error);
        throw error;
    }
};

// Reject friend request
export const rejectFriendRequest = async (requestId: string): Promise<void> => {
    try {
        await updateDoc(doc(db, 'friendRequests', requestId), {
            status: 'rejected'
        });
        // Alternatively, delete the request
        // await deleteDoc(doc(db, 'friendRequests', requestId));
    } catch (error) {
        console.error('Error rejecting friend request:', error);
        throw error;
    }
};

// Remove friend
export const removeFriend = async (currentUserId: string, friendUserId: string): Promise<void> => {
    try {
        console.log('Removing friend:', { currentUserId, friendUserId });

        // Get both user documents to check current state
        const currentUserRef = doc(db, 'users', currentUserId);
        const friendUserRef = doc(db, 'users', friendUserId);

        const [currentUserDoc, friendUserDoc] = await Promise.all([
            getDoc(currentUserRef),
            getDoc(friendUserRef)
        ]);

        console.log('Current user doc exists:', currentUserDoc.exists());
        console.log('Friend user doc exists:', friendUserDoc.exists());

        // Remove friend from current user's friends list (if exists)
        console.log('Removing friend from current user\'s friends list');
        await updateDoc(currentUserRef, {
            friends: arrayRemove(friendUserId)
        });
        console.log('Removed friend from current user\'s friends list');

        // Remove current user from friend's friends list (if exists)
        console.log('Removing current user from friend\'s friends list');
        await updateDoc(friendUserRef, {
            friends: arrayRemove(currentUserId)
        });
        console.log('Removed current user from friend\'s friends list');

        // Clean up any friend requests between them
        const requestsQuery1 = query(
            collection(db, 'friendRequests'),
            where('fromUserId', '==', currentUserId),
            where('toUserId', '==', friendUserId)
        );

        const requestsQuery2 = query(
            collection(db, 'friendRequests'),
            where('fromUserId', '==', friendUserId),
            where('toUserId', '==', currentUserId)
        );

        const [snapshot1, snapshot2] = await Promise.all([
            getDocs(requestsQuery1),
            getDocs(requestsQuery2)
        ]);

        console.log('Found friend requests to clean up:', snapshot1.docs.length + snapshot2.docs.length);

        const deletePromises = [
            ...snapshot1.docs.map(doc => deleteDoc(doc.ref)),
            ...snapshot2.docs.map(doc => deleteDoc(doc.ref))
        ];

        await Promise.all(deletePromises);

        console.log('Friend removed successfully');
    } catch (error) {
        console.error('Error removing friend:', error);
        throw new Error('Failed to remove friend. Please try again.');
    }
};
