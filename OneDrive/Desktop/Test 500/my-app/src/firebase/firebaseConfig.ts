import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyBKA2julrxpRhXTdU_8l5pSH73ERAjKtO4",
  authDomain: "kobi-s-student-atlas.firebaseapp.com",
  projectId: "kobi-s-student-atlas",
  storageBucket: "kobi-s-student-atlas.firebasestorage.app",
  messagingSenderId: "955486974004",
  appId: "1:955486974004:web:be7d825c279d2e263c5a61",
  measurementId: "G-8260ESQ6PQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth - persistence is automatic with Firebase Web SDK
export const auth = getAuth(app);

// Initialize Firestore with offline persistence
export const db = getFirestore(app);

// Initialize Functions
export const functions = getFunctions(app);

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support offline persistence');
  }
});

export default app;
