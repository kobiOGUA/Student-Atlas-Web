// Semester Service
import { db } from '../firebase-config.js';
import { collection, query, getDocs, doc, setDoc, deleteDoc, updateDoc, orderBy } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

export async function fetchSemesters(userId) {
    try {
        const semRef = collection(db, 'users', userId, 'semesters');
        const q = query(semRef, orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);

        const semesters = [];
        snapshot.forEach(doc => {
            semesters.push({ id: doc.id, ...doc.data() });
        });
        return semesters;
    } catch (error) {
        console.error('Fetch semesters error:', error);
        return [];
    }
}

export async function createSemester(userId, name, type, gpa = 0, totalUnits = 0) {
    try {
        const semRef = doc(collection(db, 'users', userId, 'semesters'));
        const newSem = {
            id: semRef.id,
            name,
            type,
            timestamp: Date.now(),
            courses: [],
            gpa,
            totalUnits
        };
        await setDoc(semRef, newSem);
        return newSem;
    } catch (error) {
        console.error('Create semester error:', error);
        throw error;
    }
}

export async function deleteSemester(userId, semesterId) {
    try {
        await deleteDoc(doc(db, 'users', userId, 'semesters', semesterId));
    } catch (error) {
        console.error('Delete semester error:', error);
        throw error;
    }
}
