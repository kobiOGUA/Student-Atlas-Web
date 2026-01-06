import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Task } from '../types';

const TASKS_COLLECTION = 'tasks';

export const fetchTasks = async (userId: string): Promise<Task[]> => {
    try {
        const q = query(
            collection(db, TASKS_COLLECTION),
            where('userId', '==', userId),
            orderBy('dueDate', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    } catch (error) {
        console.error('Error fetching tasks:', error);
        // Fallback if index missing or other error
        try {
            const q = query(
                collection(db, TASKS_COLLECTION),
                where('userId', '==', userId)
            );
            const snapshot = await getDocs(q);
            const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
            return tasks.sort((a, b) => a.dueDate - b.dueDate);
        } catch (retryError) {
            console.error('Retry error fetching tasks:', retryError);
            return [];
        }
    }
};

export const addTask = async (userId: string, taskData: Omit<Task, 'id' | 'userId' | 'createdAt'>): Promise<Task> => {
    try {
        const newTask = {
            ...taskData,
            userId,
            createdAt: Date.now(),
        };
        const docRef = await addDoc(collection(db, TASKS_COLLECTION), newTask);
        return { id: docRef.id, ...newTask } as Task;
    } catch (error) {
        console.error('Error adding task:', error);
        throw error;
    }
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
    try {
        const taskRef = doc(db, TASKS_COLLECTION, taskId);
        await updateDoc(taskRef, updates);
    } catch (error) {
        console.error('Error updating task:', error);
        throw error;
    }
};

export const deleteTask = async (taskId: string): Promise<void> => {
    try {
        const taskRef = doc(db, TASKS_COLLECTION, taskId);
        await deleteDoc(taskRef);
    } catch (error) {
        console.error('Error deleting task:', error);
        throw error;
    }
};
