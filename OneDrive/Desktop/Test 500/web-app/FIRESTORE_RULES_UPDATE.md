# FIRESTORE RULES UPDATE NEEDED

The web app login is failing because Firestore security rules don't allow anonymous users to query the `users` collection.

## Required Firestore Rules Update:

Please update your Firestore security rules in the Firebase Console:

1. Go to: https://console.firebase.google.com/project/kobi-atlas/firestore/rules
2. Update the rules to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow anonymous users to read users collection (for login)
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow anonymous users to read auth collection (for PIN verification)
    match /auth/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Allow authenticated users to read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Messages - allow read/write for authenticated users
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
    
    // Posts - allow read for all authenticated, write for owner
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Friend requests - allow read/write for authenticated users
    match /friendRequests/{requestId} {
      allow read, write: if request.auth != null;
    }
    
    // Friends - allow read/write for authenticated users
    match /friends/{friendId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Why This Is Needed:

- The web app uses **anonymous authentication** (like the Android app)
- Anonymous users need permission to:
  1. Query the `users` collection to find user by email
  2. Read the `auth` collection to verify PIN
  3. Access their own data after login

## After Updating Rules:

The login will work instantly without timeouts!
