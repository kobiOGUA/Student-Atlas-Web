import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Semester, Course, SemesterType } from '../types';
import { calculateSemesterGPA } from '../utils/calculations';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SEMESTERS_STORAGE_KEY = 'semesters_cache';

/**
 * Get user semesters collection reference
 */
function getSemestersCollection(userId: string) {
  return collection(db, 'users', userId, 'semesters');
}

/**
 * Save semesters to local cache
 */
async function cacheSemesters(semesters: Semester[]) {
  try {
    await AsyncStorage.setItem(SEMESTERS_STORAGE_KEY, JSON.stringify(semesters));
  } catch (error) {
    console.error('Error caching semesters:', error);
  }
}

/**
 * Load semesters from local cache
 */
async function loadCachedSemesters(): Promise<Semester[]> {
  try {
    const cached = await AsyncStorage.getItem(SEMESTERS_STORAGE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Error loading cached semesters:', error);
    return [];
  }
}

/**
 * Fetch all semesters for a user
 */
export async function fetchSemesters(userId: string): Promise<Semester[]> {
  try {
    const semestersRef = getSemestersCollection(userId);
    const q = query(semestersRef, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);

    const semesters: Semester[] = [];
    querySnapshot.forEach((doc) => {
      semesters.push({ id: doc.id, ...doc.data() } as Semester);
    });

    await cacheSemesters(semesters);
    return semesters;
  } catch (error) {
    console.error('Error fetching semesters:', error);
    // Return cached data if fetch fails
    return await loadCachedSemesters();
  }
}

/**
 * Create a new semester
 */
export async function createSemester(
  userId: string,
  name: string,
  type: SemesterType,
  gpa?: number,
  totalUnits?: number
): Promise<Semester> {
  try {
    // Check if there's already a current semester
    if (type === 'current') {
      const semesters = await fetchSemesters(userId);
      const currentSemester = semesters.find(s => s.type === 'current');
      if (currentSemester) {
        throw new Error('A current semester already exists. Please convert it to past first.');
      }
    }

    const semesterRef = doc(getSemestersCollection(userId));
    const newSemester: Semester = {
      id: semesterRef.id,
      name,
      type,
      timestamp: Date.now(),
      courses: [],
    };

    await setDoc(semesterRef, {
      name,
      type,
      timestamp: newSemester.timestamp,
      courses: [],
      ...(gpa !== undefined && { gpa }),
      ...(totalUnits !== undefined && { totalUnits }),
    });

    return newSemester;
  } catch (error) {
    console.error('Error creating semester:', error);
    throw error;
  }
}

/**
 * Update a semester
 */
export async function updateSemester(
  userId: string,
  semesterId: string,
  updates: Partial<Semester>
): Promise<void> {
  try {
    const semesterRef = doc(getSemestersCollection(userId), semesterId);
    await updateDoc(semesterRef, updates);
  } catch (error) {
    console.error('Error updating semester:', error);
    throw error;
  }
}

/**
 * Delete a semester
 */
export async function deleteSemester(userId: string, semesterId: string): Promise<void> {
  try {
    const semesterRef = doc(getSemestersCollection(userId), semesterId);
    await deleteDoc(semesterRef);
  } catch (error) {
    console.error('Error deleting semester:', error);
    throw error;
  }
}

/**
 * Add a course to a semester
 */
export async function addCourse(
  userId: string,
  semesterId: string,
  course: Course
): Promise<void> {
  try {
    const semesterRef = doc(getSemestersCollection(userId), semesterId);
    const semesterDoc = await getDoc(semesterRef);

    if (!semesterDoc.exists()) {
      throw new Error('Semester not found');
    }

    const semester = semesterDoc.data() as Semester;
    const updatedCourses = [...semester.courses, course];

    await updateDoc(semesterRef, {
      courses: updatedCourses,
      gpa: calculateSemesterGPA(updatedCourses),
      predictedGPA: calculateSemesterGPA(updatedCourses),
    });
  } catch (error) {
    console.error('Error adding course:', error);
    throw error;
  }
}

/**
 * Update a course in a semester
 */
export async function updateCourse(
  userId: string,
  semesterId: string,
  courseId: string,
  updates: Partial<Course>
): Promise<void> {
  try {
    const semesterRef = doc(getSemestersCollection(userId), semesterId);
    const semesterDoc = await getDoc(semesterRef);

    if (!semesterDoc.exists()) {
      throw new Error('Semester not found');
    }

    const semester = semesterDoc.data() as Semester;
    const updatedCourses = semester.courses.map(c =>
      c.id === courseId ? { ...c, ...updates } : c
    );

    // Check if all courses have final scores
    const allCoursesComplete = updatedCourses.every(c => c.finalScore !== undefined);

    await updateDoc(semesterRef, {
      courses: updatedCourses,
      gpa: calculateSemesterGPA(updatedCourses),
      predictedGPA: calculateSemesterGPA(updatedCourses),
      // Convert to past semester if all final scores are entered
      ...(allCoursesComplete && semester.type === 'current' ? { type: 'past' } : {}),
    });
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
}

/**
 * Delete a course from a semester
 */
export async function deleteCourse(
  userId: string,
  semesterId: string,
  courseId: string
): Promise<void> {
  try {
    const semesterRef = doc(getSemestersCollection(userId), semesterId);
    const semesterDoc = await getDoc(semesterRef);

    if (!semesterDoc.exists()) {
      throw new Error('Semester not found');
    }

    const semester = semesterDoc.data() as Semester;
    const updatedCourses = semester.courses.filter(c => c.id !== courseId);

    await updateDoc(semesterRef, {
      courses: updatedCourses,
      gpa: calculateSemesterGPA(updatedCourses),
      predictedGPA: calculateSemesterGPA(updatedCourses),
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
}
