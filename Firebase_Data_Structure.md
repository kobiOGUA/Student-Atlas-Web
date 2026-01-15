# Firebase Data Structure for Kobi's Student Atlas

This document describes the complete data structure used in Firebase Firestore for the Kobi's Student Atlas application.

## Collections

### 1. users
Stores user profile information

**Document Structure:**
```json
{
  "uid": "string",
  "email": "string",
  "username": "string (optional)",
  "displayName": "string (optional)",
  "profilePicture": "string (Base64 encoded image, optional)",
  "bio": "string (optional)",
  "friends": "array of userIds",
  "achievements": "array of achievementIds",
  "streak": "number",
  "lastActive": "timestamp",
  "totalSemesters": "number (optional)",
  "lastAcademicUpdate": "timestamp (optional)"
}
```

### 2. userAuth
Stores user authentication data (separate from profile for security)

**Document Structure:**
```json
{
  "userId": "string",
  "email": "string",
  "pinHash": "string (SHA256 hashed PIN)",
  "createdAt": "timestamp",
  "lastUpdated": "timestamp"
}
```

### 3. posts
Stores community posts

**Document Structure:**
```json
{
  "id": "string",
  "authorId": "string",
  "username": "string",
  "profilePicture": "string (Base64 encoded image, optional)",
  "contentText": "string (optional)",
  "contentLink": "string (optional)",
  "contentImage": "string (Base64 encoded image, optional)",
  "timestamp": "timestamp",
  "likes": "array of userIds",
  "replies": "array of replyIds"
}
```

### 4. replies
Stores replies to community posts

**Document Structure:**
```json
{
  "id": "string",
  "postId": "string",
  "authorId": "string",
  "username": "string",
  "profilePicture": "string (Base64 encoded image, optional)",
  "contentText": "string",
  "contentImage": "string (Base64 encoded image, optional)",
  "timestamp": "timestamp",
  "likes": "array of userIds"
}
```

### 5. messages
Stores chat messages between users

**Document Structure:**
```json
{
  "id": "string",
  "senderId": "string",
  "receiverId": "string",
  "text": "string",
  "timestamp": "timestamp",
  "read": "boolean"
}
```

### 6. friendRequests
Stores friend requests between users

**Document Structure:**
```json
{
  "id": "string",
  "fromUserId": "string",
  "toUserId": "string",
  "status": "string (pending, accepted, rejected, blocked)",
  "timestamp": "timestamp"
}
```

## Subcollections

### users/{userId}/semesters
Stores academic semesters for each user

**Document Structure:**
```json
{
  "id": "string",
  "name": "string",
  "type": "string (current, past)",
  "timestamp": "timestamp",
  "gpa": "number (optional)",
  "predictedGPA": "number (optional)",
  "courses": "array of Course objects"
}
```

### users/{userId}/semesters/{semesterId}/courses
Stores individual courses within semesters (embedded in semester document)

**Course Object Structure:**
```json
{
  "id": "string",
  "name": "string",
  "code": "string",
  "unitHours": "number",
  "caScores": {
    "midSemester": "number (0-15)",
    "assignment": "number (0-10)",
    "quiz": "number (0-10)",
    "attendance": "number (0-5)"
  },
  "targetGrade": "string (A, B, C) (optional)",
  "difficulty": "number (1-5)",
  "finalScore": "number (optional)",
  "grade": "string (A, B, C, D, E, F) (optional)",
  "predictedGrade": "string (A, B, C, D, E, F) (optional)"
}
```

### users/{userId}/exams
Stores exam schedules for each user

**Document Structure:**
```json
{
  "id": "string",
  "courseId": "string",
  "courseName": "string",
  "date": "string (ISO date)",
  "time": "string",
  "notes": "string (optional)"
}
```

### users/{userId}/studySessions
Stores study sessions for each user

**Document Structure:**
```json
{
  "id": "string",
  "userId": "string",
  "courseId": "string",
  "courseName": "string",
  "startTime": "string (ISO date)",
  "endTime": "string (ISO date)",
  "dayOfWeek": "number (0-6)",
  "notes": "string (optional)"
}
```

## Data Synchronization

All user data is automatically synchronized to Firebase Firestore in real-time. The application uses the `userDataService` to ensure all data is properly stored and kept up to date.

## Security

- PINs are never stored in plain text; they are hashed using SHA256 before storage
- Authentication data is stored separately from profile data for enhanced security
- All data is stored with proper timestamps for tracking updates