// Social/Community Service
import { db } from '../firebase-config.js';
import { collection, query, getDocs, doc, setDoc, deleteDoc, updateDoc, orderBy, limit, arrayUnion, arrayRemove, increment } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

export async function getPosts(limitCount = 50) {
    try {
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, orderBy('timestamp', 'desc'), limit(limitCount));
        const snapshot = await getDocs(q);

        const posts = [];
        snapshot.forEach(doc => {
            posts.push({ id: doc.id, ...doc.data() });
        });
        return posts;
    } catch (error) {
        console.error('Get posts error:', error);
        return [];
    }
}

export async function createPost(userId, content, imageBase64 = null) {
    try {
        const postRef = doc(collection(db, 'posts'));
        const newPost = {
            id: postRef.id,
            userId,
            content,
            image: imageBase64,
            likes: [],
            comments: [],
            timestamp: Date.now()
        };
        await setDoc(postRef, newPost);
        return newPost;
    } catch (error) {
        console.error('Create post error:', error);
        throw error;
    }
}

export async function likePost(postId, userId) {
    try {
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, {
            likes: arrayUnion(userId)
        });
    } catch (error) {
        console.error('Like post error:', error);
        throw error;
    }
}

export async function unlikePost(postId, userId) {
    try {
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, {
            likes: arrayRemove(userId)
        });
    } catch (error) {
        console.error('Unlike post error:', error);
        throw error;
    }
}

export async function deletePost(postId) {
    try {
        await deleteDoc(doc(db, 'posts', postId));
    } catch (error) {
        console.error('Delete post error:', error);
        throw error;
    }
}
