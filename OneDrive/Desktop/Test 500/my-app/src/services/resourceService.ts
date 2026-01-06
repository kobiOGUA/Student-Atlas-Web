import { collection, query, where, getDocs, addDoc, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Resource } from '../types';

const RESOURCES_COLLECTION = 'resources';

export const fetchResources = async (courseCode: string): Promise<Resource[]> => {
    // Normalize: remove spaces, uppercase
    const normalizedCode = courseCode.replace(/\s/g, '').toUpperCase();

    try {
        const q = query(
            collection(db, RESOURCES_COLLECTION),
            where('courseCode', '==', normalizedCode)
        );
        const snapshot = await getDocs(q);
        const resources = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
        // Sort by votes desc
        return resources.sort((a, b) => b.votes - a.votes);
    } catch (error) {
        console.error('Error fetching resources:', error);
        return [];
    }
};

export const addResource = async (resourceData: Omit<Resource, 'id' | 'votes' | 'timestamp'>): Promise<Resource> => {
    const normalizedCode = resourceData.courseCode.replace(/\s/g, '').toUpperCase();
    try {
        const newResource = {
            ...resourceData,
            courseCode: normalizedCode,
            votes: 0,
            timestamp: Date.now(),
        };
        const docRef = await addDoc(collection(db, RESOURCES_COLLECTION), newResource);
        return { id: docRef.id, ...newResource } as Resource;
    } catch (error) {
        console.error('Error adding resource:', error);
        throw error;
    }
};

export const voteResource = async (resourceId: string, value: number): Promise<void> => {
    try {
        const ref = doc(db, RESOURCES_COLLECTION, resourceId);
        await updateDoc(ref, {
            votes: increment(value)
        });
    } catch (error) {
        console.error('Error voting resource:', error);
    }
};
