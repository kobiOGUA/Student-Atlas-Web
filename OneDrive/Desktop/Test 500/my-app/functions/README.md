# Firebase Cloud Functions - User Cascade Delete

## What This Does

When you delete a user document from the `users` collection in Firebase, this Cloud Function automatically deletes ALL associated data:

✅ Auth record (from `auth` collection)
✅ All posts created by the user
✅ All replies created by the user
✅ All messages sent by the user
✅ All messages received by the user
✅ All friend requests sent by the user
✅ All friend requests received by the user
✅ All notifications for the user
✅ Removes user from other users' friends lists

## Setup & Deployment

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Build the Functions

```bash
npm run build
```

### 3. Deploy to Firebase

```bash
npm run deploy
```

Or use the Firebase CLI directly:

```bash
firebase deploy --only functions:onUserDeleted
```

### 4. Verify Deployment

After deployment, check the Firebase Console:
1. Go to Firebase Console → Functions
2. You should see `onUserDeleted` listed
3. Check the logs to ensure it's working

## How to Use

Simply delete a user document from the `users` collection in Firestore:

### Option 1: Firebase Console
1. Go to Firestore Database
2. Navigate to `users` collection
3. Find the user document
4. Click the 3 dots → Delete document
5. The Cloud Function will automatically trigger and clean up all related data

### Option 2: Programmatically (if you add a delete account feature)
```typescript
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

async function deleteUserAccount(userId: string) {
  // Delete the user document - Cloud Function handles the rest
  await deleteDoc(doc(db, 'users', userId));
}
```

## Testing

To test locally with Firebase Emulators:

```bash
npm run serve
```

Then delete a test user from the emulator's Firestore UI.

## Monitoring

View function logs:

```bash
npm run logs
```

Or in Firebase Console → Functions → Logs

## Cost Considerations

- This function runs on the Firestore trigger (free tier: 2M invocations/month)
- Each deletion counts as a write operation
- Batch writes are used to optimize costs
- A user with many posts/messages will use more write operations

## Security

- The function runs with admin privileges
- No authentication required (triggered automatically)
- Only triggers on `users` collection deletions
- All operations are logged for audit purposes
