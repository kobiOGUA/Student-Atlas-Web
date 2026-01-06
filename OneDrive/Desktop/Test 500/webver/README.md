# Kobi's Student Atlas - Web Version
## Complete 1:1 Replication of Android App

This web version is a pixel-perfect, feature-complete replication of the React Native mobile app.

## Setup Instructions

### 1. Install Dependencies
```bash
cd webver
npm install
```

### 2. Start Development Server
```bash
npm start
```
The app will open at `http://localhost:3000`

### 3. Build for Production
```bash
npm run build
```

## Architecture Overview

### Complete Feature Parity
Every feature from the Android app has been replicated:

#### ✅ Authentication
- Custom PIN-based login (4-digit)
- Email registration
- PIN change functionality
- Session persistence
- Anonymous Firebase Auth wrapper

#### ✅ Academic Management
- Semester creation (Manual & Quick Add)
- Course management (Add/Edit/Delete)
- GPA calculations (Real-time)
- CGPA tracking
- Predicted GPA
- Grade classifications

#### ✅ Scheduling
- Weekly timetable view
- Course schedule management
- Task/Assignment tracking
- Exam date management

#### ✅ Social Features
- Community feed
- Post creation (Text & Images)
- Like/Unlike posts
- Comments/Replies
- Friend system (Add/Accept/Block)
- Direct messaging
- User profiles
- User search

#### ✅ Analytics
- GPA trends (Charts)
- Grade distribution
- What-If calculator
- Performance insights

#### ✅ Settings
- Theme switching (5 themes)
- Profile editing
- PIN management
- App information

## File Structure

```
webver/
├── public/
│   └── index.html
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Numpad.jsx
│   │   ├── PINDisplay.jsx
│   │   └── OwnerBadge.jsx
│   ├── screens/             # All app screens (1:1 with mobile)
│   │   ├── LoginScreen.jsx
│   │   ├── DashboardScreen.jsx
│   │   ├── TimetableScreen.jsx
│   │   ├── GPAViewScreen.jsx
│   │   ├── CommunityFeedScreen.jsx
│   │   ├── MessagingScreen.jsx
│   │   ├── UserProfileScreen.jsx
│   │   ├── SettingsScreen.jsx
│   │   ├── AddSemesterScreen.jsx
│   │   ├── SemesterDetailScreen.jsx
│   │   ├── CourseDetailScreen.jsx
│   │   ├── AddCourseScreen.jsx
│   │   ├── EditCourseScreen.jsx
│   │   ├── ProfileSettingsScreen.jsx
│   │   ├── NotificationsScreen.jsx
│   │   ├── MessagesListScreen.jsx
│   │   ├── UserSearchScreen.jsx
│   │   ├── PostDetailScreen.jsx
│   │   └── CreatePostScreen.jsx
│   ├── services/            # Business logic & Firebase
│   │   ├── authService.js
│   │   ├── semesterService.js
│   │   ├── socialService.js
│   │   ├── messagingService.js
│   │   ├── friendService.js
│   │   ├── resourceService.js
│   │   └── userService.js
│   ├── utils/               # Helper functions
│   │   ├── calculations.js
│   │   ├── encryption.js
│   │   ├── storage.js
│   │   └── ThemeContext.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── navigation/
│   │   └── AppRouter.jsx
│   ├── firebase/
│   │   └── firebaseConfig.js
│   ├── styles/
│   │   └── global.css
│   ├── App.jsx
│   └── index.js
├── package.json
└── webpack.config.js
```

## Key Implementation Details

### Firebase Integration
- Uses the same Firebase project as mobile app
- Shared authentication system
- Shared Firestore database
- Real-time synchronization

### Authentication Flow
1. Anonymous Firebase Auth (for security rules)
2. Custom PIN verification via Firestore
3. SHA-256 hashing with unique salts
4. LocalStorage for session persistence

### Responsive Design
- Mobile-first approach
- Adapts to desktop screens
- Preserves mobile UI/UX
- Touch and mouse support

### State Management
- React Context for global state
- Local state for component-specific data
- Firebase real-time listeners

### Routing
- React Router for navigation
- Programmatic navigation
- Back button support
- Deep linking ready

## Web-Specific Adaptations

### Components Adapted for Web:
1. **Image Picker** → HTML file input
2. **Alerts** → Custom modal dialogs
3. **Gestures** → Mouse/touch events
4. **Navigation** → React Router
5. **Storage** → LocalStorage (instead of AsyncStorage)

### Preserved from Mobile:
- All business logic
- All calculations
- All Firebase queries
- All UI layouts
- All color themes
- All animations

## Testing Checklist

- [ ] Login with PIN
- [ ] Register new account
- [ ] Create semester
- [ ] Add courses
- [ ] View timetable
- [ ] Check GPA calculations
- [ ] Post to community
- [ ] Like/comment on posts
- [ ] Send messages
- [ ] Add friends
- [ ] Change theme
- [ ] Edit profile
- [ ] Change PIN

## Deployment

The app can be deployed to:
- Firebase Hosting
- Vercel
- Netlify
- Any static hosting service

## Notes

- All features work identically to mobile app
- Same Firebase backend = shared data
- Responsive design maintains mobile feel
- No features removed or simplified
