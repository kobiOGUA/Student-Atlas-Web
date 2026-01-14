import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import TimetableScreen from '../screens/TimetableScreen';
import GPAViewScreen from '../screens/GPAViewScreen';
import CommunityFeedScreen from '../screens/CommunityFeedScreen';
import MessagingScreen from '../screens/MessagingScreen';
import MessagesListScreen from '../screens/MessagesListScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import UserSearchScreen from '../screens/UserSearchScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileSettingsScreen from '../screens/ProfileSettingsScreen';
import AddSemesterScreen from '../screens/AddSemesterScreen';
import SemesterDetailScreen from '../screens/SemesterDetailScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import AddCourseScreen from '../screens/AddCourseScreen';
import EditCourseScreen from '../screens/EditCourseScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ChangePINUtilityScreen from '../screens/ChangePINUtilityScreen';

function AppRouter() {
    const { user } = useAuth();

    return (
        <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={!user ? <LoginScreen /> : <Navigate to="/" />} />

            {/* Protected Routes */}
            {user ? (
                <>
                    <Route path="/" element={<DashboardScreen />} />
                    <Route path="/timetable" element={<TimetableScreen />} />
                    <Route path="/gpa" element={<GPAViewScreen />} />
                    <Route path="/community" element={<CommunityFeedScreen />} />
                    <Route path="/messages" element={<MessagesListScreen />} />
                    <Route path="/messages/:userId" element={<MessagingScreen />} />
                    <Route path="/settings" element={<SettingsScreen />} />
                    <Route path="/profile" element={<ProfileSettingsScreen />} />
                    <Route path="/user/:userId" element={<UserProfileScreen />} />
                    <Route path="/search" element={<UserSearchScreen />} />
                    <Route path="/semester/add" element={<AddSemesterScreen />} />
                    <Route path="/semester/:semesterId" element={<SemesterDetailScreen />} />
                    <Route path="/course/:courseId" element={<CourseDetailScreen />} />
                    <Route path="/course/add/:semesterId" element={<AddCourseScreen />} />
                    <Route path="/course/edit/:courseId" element={<EditCourseScreen />} />
                    <Route path="/post/:postId" element={<PostDetailScreen />} />
                    <Route path="/post/create" element={<CreatePostScreen />} />
                    <Route path="/notifications" element={<NotificationsScreen />} />
                    <Route path="/change-pin" element={<ChangePINUtilityScreen />} />
                </>
            ) : (
                <Route path="*" element={<Navigate to="/login" />} />
            )}
        </Routes>
    );
}

export default AppRouter;
