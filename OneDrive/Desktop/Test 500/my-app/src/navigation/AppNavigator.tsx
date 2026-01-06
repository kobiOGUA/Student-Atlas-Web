import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddSemesterScreen from '../screens/AddSemesterScreen';
import SemesterDetailScreen from '../screens/SemesterDetailScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import AddCourseScreen from '../screens/AddCourseScreen';
import GPAViewScreen from '../screens/GPAViewScreen';
import TimetableScreen from '../screens/TimetableScreen';
import CommunityFeedScreen from '../screens/CommunityFeedScreen';
import CommunityScreen from '../screens/CommunityScreen';
import ProfileSettingsScreen from '../screens/ProfileSettingsScreen';
import EditCourseScreen from '../screens/EditCourseScreen';
import UserSearchScreen from '../screens/UserSearchScreen';
import MessagingScreen from '../screens/MessagingScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import MessagesListScreen from '../screens/MessagesListScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import MaintenanceModeScreen from '../screens/MaintenanceModeScreen';
import UpdateRequiredScreen from '../screens/UpdateRequiredScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ChangePINUtilityScreen from '../screens/ChangePINUtilityScreen';
import CommunityNotificationScreen from '../screens/CommunityNotificationScreen';
import CreatePostScreen from '../screens/CreatePostScreen';

import GradingSystemScreen from '../screens/GradingSystemScreen';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../utils/ThemeContext';
import { ActivityIndicator, View, Text, Platform } from 'react-native';
import { checkAppVersion, AppVersion } from '../services/versionService';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { getPendingFriendRequests } from '../services/friendService';

const APP_VERSION = '1.0.0'; // This should match your app.json version

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [notificationCount, setNotificationCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    const checkGrading = async () => {
      const val = await AsyncStorage.getItem('gradingSystem');
      if (!val) {
        // Force onboarding
        navigation.reset({
          index: 0,
          routes: [{ name: 'GradingSystem', params: { firstTime: true } }],
        });
      }
    };
    checkGrading();
  }, []);

  useEffect(() => {
    const loadCounts = async () => {
      if (!user?.uid) return;
      try {
        const friendRequests = await getPendingFriendRequests(user.uid);

        // Count unread community notifications
        const notificationsRef = collection(db, 'notifications');
        const notifQuery = query(notificationsRef, where('userId', '==', user.uid), where('read', '==', false));
        const notifSnapshot = await getDocs(notifQuery);

        setNotificationCount(friendRequests.length + notifSnapshot.size);
        const messagesRef = collection(db, 'messages');
        const q = query(messagesRef, where('receiverId', '==', user.uid), where('read', '==', false));
        const snapshot = await getDocs(q);
        setUnreadMessagesCount(snapshot.size);
      } catch (error) {
        console.error('Error loading notification counts:', error);
      }
    };
    loadCounts();
    const interval = setInterval(loadCounts, 30000);
    return () => clearInterval(interval);
  }, [user?.uid]);

  const renderBadge = (count: number) => {
    if (count === 0) return null;
    return (
      <View style={{ position: 'absolute', top: -4, right: -8, backgroundColor: '#FF3B30', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>{count > 99 ? '99+' : count}</Text>
      </View>
    );
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: theme.surface },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        headerStyle: { backgroundColor: theme.primary },
        headerTintColor: '#FFFFFF',
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Planner"
        component={TimetableScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="GPA"
        component={GPAViewScreen}
        options={{
          headerShown: false,
          title: 'Analysis',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons name="people" size={size} color={color} />
              {renderBadge(notificationCount + unreadMessagesCount)}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { theme } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const [versionStatus, setVersionStatus] = useState<AppVersion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Check app version
        const status = await checkAppVersion(APP_VERSION);
        setVersionStatus(status);
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  if (loading || authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // Check version status
  if (versionStatus?.maintenanceMode) {
    return <MaintenanceModeScreen message={versionStatus.maintenanceMessage} />;
  }

  if (versionStatus?.updateRequired) {
    return (
      <UpdateRequiredScreen
        currentVersion={APP_VERSION}
        requiredVersion={versionStatus.minimumVersion}
        message={versionStatus.updateMessage}
      />
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: theme.primary },
            headerTintColor: '#FFFFFF',
          }}
        >
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddSemester"
            component={AddSemesterScreen}
            options={{ title: 'Add Semester' }}
          />
          <Stack.Screen
            name="SemesterDetail"
            component={SemesterDetailScreen}
            options={{ title: 'Semester Details' }}
          />
          <Stack.Screen
            name="CourseDetail"
            component={CourseDetailScreen}
            options={{ title: 'Course Details' }}
          />
          <Stack.Screen
            name="AddCourse"
            component={AddCourseScreen}
            options={{ title: 'Add Course' }}
          />
          <Stack.Screen
            name="ProfileSettings"
            component={ProfileSettingsScreen}
            options={{ title: 'Edit Profile' }}
          />
          <Stack.Screen
            name="EditCourse"
            component={EditCourseScreen}
            options={{ title: 'Edit Course' }}
          />
          <Stack.Screen
            name="UserSearch"
            component={UserSearchScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="UserProfile"
            component={UserProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Messaging"
            component={MessagingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PostDetail"
            component={PostDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ChangePINUtility"
            component={ChangePINUtilityScreen}
            options={{ title: 'Change PIN' }}
          />
          <Stack.Screen
            name="CommunityNotification"
            component={CommunityNotificationScreen}
            options={{ title: 'Community Notification' }}
          />
          <Stack.Screen
            name="CreatePost"
            component={CreatePostScreen}
            options={{ title: 'Create Post' }}
          />
          <Stack.Screen
            name="GradingSystem"
            component={GradingSystemScreen}
            options={{ title: 'Grading System' }}
          />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default AppNavigator;
