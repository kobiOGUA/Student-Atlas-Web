import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { User, FriendRequest, Post, Reply, ChatMessage } from '../types';

// ==================== USER PROFILE ====================

export async function createUserProfile(userId: string, username: string, email: string) {
  const userRef = doc(db, 'users', userId);
  const userProfile: User = {
    uid: userId,
    email,
    username,
    friends: [],
    achievements: [],
    streak: 0,
    lastActive: Date.now(),
    createdAt: Date.now(),
  };
  await setDoc(userRef, userProfile);
  return userProfile;
}

export async function getUserProfile(userId: string): Promise<User | null> {
  console.log('Getting user profile:', userId);
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  if (userDoc.exists()) {
    const userData = userDoc.data() as User;
    console.log('User profile found:', userData);
    return userData;
  }
  console.log('User profile not found');
  return null;
}

export async function updateUserProfile(userId: string, updates: Partial<User>) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { ...updates, lastActive: Date.now() });
}

export async function searchUsersByUsername(searchTerm: string): Promise<User[]> {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('username', '>=', searchTerm),
    where('username', '<=', searchTerm + '\uf8ff'),
    limit(20)
  );
  const querySnapshot = await getDocs(q);
  const users: User[] = [];
  querySnapshot.forEach((doc) => {
    users.push(doc.data() as User);
  });
  return users;
}

// ==================== FRIEND SYSTEM ====================

export async function sendFriendRequest(fromUserId: string, toUserId: string) {
  const requestRef = doc(collection(db, 'friendRequests'));
  const request: FriendRequest = {
    id: requestRef.id,
    fromUserId,
    toUserId,
    status: 'pending',
    timestamp: Date.now(),
  };
  await setDoc(requestRef, request);
  return request;
}

export async function respondToFriendRequest(
  requestId: string,
  status: 'accepted' | 'rejected'
) {
  const requestRef = doc(db, 'friendRequests', requestId);
  await updateDoc(requestRef, { status });

  if (status === 'accepted') {
    const requestDoc = await getDoc(requestRef);
    if (requestDoc.exists()) {
      const request = requestDoc.data() as FriendRequest;
      // Add to both users' friends lists
      await updateDoc(doc(db, 'users', request.fromUserId), {
        friends: arrayUnion(request.toUserId),
      });
      await updateDoc(doc(db, 'users', request.toUserId), {
        friends: arrayUnion(request.fromUserId),
      });
    }
  }
}

export async function getFriendRequests(userId: string): Promise<FriendRequest[]> {
  const requestsRef = collection(db, 'friendRequests');
  const q = query(requestsRef, where('toUserId', '==', userId), where('status', '==', 'pending'));
  const querySnapshot = await getDocs(q);
  const requests: FriendRequest[] = [];
  querySnapshot.forEach((doc) => {
    requests.push(doc.data() as FriendRequest);
  });
  return requests;
}

export async function getFriends(userId: string): Promise<User[]> {
  console.log('Getting friends for user:', userId);
  const userProfile = await getUserProfile(userId);
  if (!userProfile || !userProfile.friends || userProfile.friends.length === 0) {
    console.log('No friends found for user');
    return [];
  }

  const friends: User[] = [];
  for (const friendId of userProfile.friends) {
    const friend = await getUserProfile(friendId);
    if (friend) friends.push(friend);
  }
  console.log('Found friends:', friends.length);
  return friends;
}

// ==================== POSTS ====================

export async function createPost(
  authorId: string,
  username: string,
  profilePicture: string | undefined,
  contentText?: string,
  contentLink?: string,
  contentImage?: string
) {
  const postRef = doc(collection(db, 'posts'));
  const post: any = {
    id: postRef.id,
    authorId,
    username,
    timestamp: Date.now(),
    likes: [],
    replies: [],
  };

  // Only add fields that have values to avoid Firestore errors
  if (profilePicture !== undefined) post.profilePicture = profilePicture;
  if (contentText !== undefined) post.contentText = contentText;
  if (contentLink !== undefined) post.contentLink = contentLink;
  if (contentImage !== undefined) post.contentImage = contentImage;

  await setDoc(postRef, post);
  return post;
}

export async function getPosts(limitCount: number = 20): Promise<Post[]> {
  const postsRef = collection(db, 'posts');
  const q = query(postsRef, orderBy('timestamp', 'desc'), limit(limitCount));
  const querySnapshot = await getDocs(q);

  let posts: Post[] = [];
  const authorIds = new Set<string>();

  querySnapshot.forEach((docSnap) => {
    const postData = docSnap.data();
    if (!postData.deleted) {
      const post = { ...postData, id: docSnap.id } as Post;
      posts.push(post);
      if (post.authorId) {
        authorIds.add(post.authorId);
      }
    }
  });

  // Batch fetch latest author profiles to ensure up-to-date images
  if (authorIds.size > 0) {
    const ids = Array.from(authorIds);
    const usersMap = new Map<string, User>();
    const chunks = [];

    // Chunk IDs for Firestore 'in' query (limit 10)
    for (let i = 0; i < ids.length; i += 10) {
      chunks.push(ids.slice(i, i + 10));
    }

    try {
      const userPromises = chunks.map(chunk => {
        return getDocs(query(collection(db, 'users'), where('uid', 'in', chunk)));
      });

      const userSnapshots = await Promise.all(userPromises);
      userSnapshots.forEach(snap => {
        snap.forEach(doc => {
          usersMap.set(doc.id, doc.data() as User);
        });
      });

      // Update posts with fresh user data
      posts = posts.map(p => {
        const user = usersMap.get(p.authorId);
        if (user) {
          return {
            ...p,
            username: user.username || p.username,
            profilePicture: user.profilePicture, // Use latest
          };
        }
        return p;
      });
    } catch (e) {
      console.warn('Error fetching latest user profiles for posts:', e);
      // Continue with original post data on error
    }
  }

  return posts;
}

export async function getPost(postId: string): Promise<Post | null> {
  try {
    console.log('getPost: Fetching post with ID:', postId);
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      console.log('getPost: Post not found');
      return null;
    }

    const postData = postDoc.data();
    // Check if post is deleted
    if (postData.deleted) {
      console.log('getPost: Post is deleted');
      return null;
    }

    const result = {
      ...postData,
      id: postDoc.id, // Ensure ID is included
    } as Post;

    console.log('getPost: Post found:', result);
    return result;
  } catch (error) {
    console.error('getPost: Error fetching post:', error);
    return null;
  }
}

export async function likePost(postId: string, userId: string) {
  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, {
    likes: arrayUnion(userId),
  });
}

export async function unlikePost(postId: string, userId: string) {
  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, {
    likes: arrayRemove(userId),
  });
}

export async function deletePost(postId: string) {
  const postRef = doc(db, 'posts', postId);
  await setDoc(postRef, { deleted: true }, { merge: true });
}

// ==================== REPLIES ====================

export async function createReply(
  postId: string,
  authorId: string,
  username: string,
  contentText: string,
  profilePicture?: string,
  contentImage?: string
) {
  const replyRef = doc(collection(db, 'replies'));
  const reply: any = {
    id: replyRef.id,
    postId,
    authorId,
    username,
    contentText,
    timestamp: Date.now(),
    likes: [],
  };

  // Only add optional fields if they have values
  if (profilePicture !== undefined) reply.profilePicture = profilePicture;
  if (contentImage !== undefined) reply.contentImage = contentImage;

  await setDoc(replyRef, reply);

  // Add reply ID to post
  await updateDoc(doc(db, 'posts', postId), {
    replies: arrayUnion(replyRef.id),
  });

  return reply;
}

export async function getReplies(postId: string): Promise<Reply[]> {
  const repliesRef = collection(db, 'replies');
  const q = query(repliesRef, where('postId', '==', postId));
  const querySnapshot = await getDocs(q);
  const replies: Reply[] = [];
  querySnapshot.forEach((doc) => {
    const replyData = doc.data();
    // Filter out deleted replies
    if (!replyData.deleted) {
      replies.push({
        ...replyData,
        id: doc.id,
      } as Reply);
    }
  });
  // Sort by timestamp client-side to avoid composite index requirement
  replies.sort((a, b) => b.timestamp - a.timestamp);
  return replies;
}

export async function likeReply(replyId: string, userId: string) {
  const replyRef = doc(db, 'replies', replyId);
  await updateDoc(replyRef, {
    likes: arrayUnion(userId),
  });
}

export async function unlikeReply(replyId: string, userId: string) {
  const replyRef = doc(db, 'replies', replyId);
  await updateDoc(replyRef, {
    likes: arrayRemove(userId),
  });
}

export async function deleteReply(replyId: string) {
  const replyRef = doc(db, 'replies', replyId);
  await setDoc(replyRef, { deleted: true }, { merge: true });
}

// ==================== CHAT ====================

export async function sendMessage(senderId: string, receiverId: string, text: string) {
  const messageRef = doc(collection(db, 'messages'));
  const message: ChatMessage = {
    id: messageRef.id,
    senderId,
    receiverId,
    text,
    timestamp: Date.now(),
    read: false,
  };
  await setDoc(messageRef, message);
  return message;
}

export async function getMessages(userId: string, friendId: string): Promise<ChatMessage[]> {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('senderId', 'in', [userId, friendId]),
    where('receiverId', 'in', [userId, friendId]),
    orderBy('timestamp', 'asc')
  );
  const querySnapshot = await getDocs(q);
  const messages: ChatMessage[] = [];
  querySnapshot.forEach((doc) => {
    messages.push(doc.data() as ChatMessage);
  });
  return messages;
}

export async function markMessageAsRead(messageId: string) {
  const messageRef = doc(db, 'messages', messageId);
  await updateDoc(messageRef, { read: true });
}
