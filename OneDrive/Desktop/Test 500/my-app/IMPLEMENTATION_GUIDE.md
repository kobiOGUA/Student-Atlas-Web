# Remaining Tasks - Exact Implementation Guide

## Current Status
✅ Cross-platform alerts working
✅ PIN change utility created
✅ Tab renamed to "Analysis"
✅ Expo build successful
❌ Notification badges not showing
❌ Settings header missing
❌ Course deletion confirmation missing

---

## TASK 1: Fix Notification Badges in AppNavigator

The badges aren't showing because the AppNavigator doesn't have the logic to load and display counts.

### What to do:
Open `src/navigation/AppNavigator.tsx` and make these changes:

1. **Add imports** (at the top, around line 1-28):
```typescript
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { getPendingFriendRequests } from '../services/friendService';
```

2. **Inside MainTabs function** (after line 37 `const { theme } = useTheme();`), add:
```typescript
const { user } = useAuth();
const [notificationCount, setNotificationCount] = useState(0);
const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

useEffect(() => {
  const loadCounts = async () => {
    if (!user?.uid) return;
    
    try {
      const friendRequests = await getPendingFriendRequests(user.uid);
      setNotificationCount(friendRequests.length);

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
    <View style={{
      position: 'absolute',
      top: -4,
      right: -8,
      backgroundColor: '#FF3B30',
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    }}>
      <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
};
```

3. **Replace Community tab** (around line 70-78):
```typescript
<Tab.Screen
  name="Community"
  component={CommunityFeedScreen}
  options={{
    headerShown: false,
    tabBarIcon: ({ color, size }) => (
      <View style={{ position: 'relative' }}>
        <Ionicons name="people" size={size} color={color} />
        {renderBadge(notificationCount)}
      </View>
    ),
  }}
/>
```

4. **Replace Messages tab** (around line 80-88):
```typescript
<Tab.Screen
  name="Messages"
  component={MessagesListScreen}
  options={{
    headerShown: false,
    tabBarIcon: ({ color, size }) => (
      <View style={{ position: 'relative' }}>
        <Ionicons name="chatbubbles" size={size} color={color} />
        {renderBadge(unreadMessagesCount)}
      </View>
    ),
  }}
/>
```

---

## TASK 2: Add Notification Badge to Community Screen Header

Open `src/screens/CommunityFeedScreen.tsx`:

1. **Add imports** (around line 15):
```typescript
import { getPendingFriendRequests } from '../services/friendService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
```

2. **Add state** (around line 24):
```typescript
const [notificationCount, setNotificationCount] = useState(0);
```

3. **Add load function** (after loadPosts function):
```typescript
const loadNotificationCount = async () => {
  if (!user?.uid) return;
  try {
    const friendRequests = await getPendingFriendRequests(user.uid);
    setNotificationCount(friendRequests.length);
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
};
```

4. **Update useEffect** (around line 38):
```typescript
useEffect(() => {
  loadPosts();
  loadNotificationCount();
}, []);
```

5. **Update onRefresh** (around line 42):
```typescript
const onRefresh = async () => {
  setRefreshing(true);
  await loadPosts();
  await loadNotificationCount();
  setRefreshing(false);
};
```

6. **Replace notification button** (around line 196-201):
```typescript
<TouchableOpacity
  style={styles.headerIcon}
  onPress={() => navigation.navigate('Notifications')}
>
  <View style={{ position: 'relative' }}>
    <Ionicons name="notifications-outline" size={24} color="#FFF" />
    {notificationCount > 0 && (
      <View style={{
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
      }}>
        <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>
          {notificationCount > 99 ? '99+' : notificationCount}
        </Text>
      </View>
    )}
  </View>
</TouchableOpacity>
```

---

## TASK 3: Add Settings Header

Open `src/screens/SettingsScreen.tsx`:

1. **Add Ionicons import** (around line 17):
```typescript
import { Ionicons } from '@expo/vector-icons';
```

2. **Wrap ScrollView** (around line 58):
```typescript
return (
  <View style={[styles.container, { backgroundColor: theme.background }]}>
    <View style={[styles.header, { backgroundColor: theme.primary }]}>
      <Text style={styles.headerTitle}>Settings</Text>
    </View>
    <ScrollView style={styles.scrollContent}>
      {/* rest of content */}
    </ScrollView>
  </View>
);
```

3. **Update styles** (around line 126):
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 15,
    paddingTop: 50,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 15,
  },
  // ... rest of styles
});
```

---

## How to Change PIN

1. Open the app
2. Go to Settings tab
3. Click "Change PIN" button
4. The form will be pre-filled with your email and new PIN (9568)
5. Click "Change PIN"
6. You'll see a success message
7. Log out and log back in with PIN 9568

---

## After Making These Changes

Run:
```bash
git add -A
git commit -m "Add notification badges and settings header"
```

Then test the app to verify:
- ✅ Community tab shows friend request count
- ✅ Messages tab shows unread message count
- ✅ Notification button shows friend request count
- ✅ Settings has a header
