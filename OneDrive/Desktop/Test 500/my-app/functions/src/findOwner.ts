import * as admin from 'firebase-admin';
import * as serviceAccount from '../serviceAccountKey.json'; // This might not exist in the repo...

// If serviceAccountKey doesn't exist, we can't run this locally easily without auth.
// But wait, 'firebase-admin' can use default credentials if logged in via CLI?
// Let's try default init.

admin.initializeApp();

const db = admin.firestore();

async function findOwner() {
    try {
        console.log('Searching for owner...');
        const snapshot = await db.collection('users').where('email', '==', 'kobioguadinma@gmail.com').get();
        if (snapshot.empty) {
            console.log('No user found with that email.');
        } else {
            snapshot.forEach(doc => {
                console.log(`FOUND_OWNER_ID: ${doc.id}`);
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

findOwner();
