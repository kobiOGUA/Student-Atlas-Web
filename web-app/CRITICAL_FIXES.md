# CRITICAL FIXES NEEDED FOR WEB APP

## 1. FIX MESSAGES SYNC

**Problem:** Messages created on Android don't show on web because web uses `setDoc` with manual ID, Android uses `addDoc` with auto ID.

**Fix in sendMessage function (around line 3160):**

REPLACE:
```javascript
const messageRef = doc(collection(db, 'messages'));
await setDoc(messageRef, {
    id: messageRef.id,
    senderId: uid,
    receiverId: currentChatUser.id,
    text: text,
    timestamp: Date.now()
});
```

WITH:
```javascript
const messagesRef = collection(db, 'messages');
await addDoc(messagesRef, {
    senderId: uid,
    receiverId: currentChatUser.id,
    text: text,
    timestamp: Date.now(),
    read: false
});
```

**Also update loadMessages to filter deleted messages (around line 3120):**

ADD after getting messages:
```javascript
// Filter out deleted messages
const messages = [];
snap1.forEach(doc => {
    const data = doc.data();
    if (!data.deleted) {
        messages.push({ id: doc.id, ...data });
    }
});
snap2.forEach(doc => {
    const data = doc.data();
    if (!data.deleted) {
        messages.push({ id: doc.id, ...data });
    }
});
```

## 2. ALIGN COMMUNITY HEADER BUTTONS

**Fix around line 740:**

REPLACE the header div with:
```html
<div style="display: flex; justify-content: space-between; align-items: center;">
    <h2 style="margin: 0;">Community</h2>
    <div style="display: flex; gap: 16px; align-items: center;">
        <button onclick="showUserSearch()" style="background: none; border: none; cursor: pointer;">
            <ion-icon name="search-outline" style="font-size: 24px; color: white;"></ion-icon>
        </button>
        <button onclick="showCreatePostModal()" style="background: none; border: none; cursor: pointer;">
            <ion-icon name="add-outline" style="font-size: 24px; color: white;"></ion-icon>
        </button>
        <button onclick="showNotifications()" style="background: none; border: none; cursor: pointer; position: relative;">
            <ion-icon name="notifications-outline" style="font-size: 24px; color: white;"></ion-icon>
            <span id="notification-badge" class="hidden" style="position: absolute; top: -4px; right: -4px; background: #FF3B30; color: white; border-radius: 10px; min-width: 18px; height: 18px; font-size: 10px; font-weight: bold; display: flex; align-items: center; justify-content: center; padding: 0 4px;">0</span>
        </button>
        <button onclick="showProfileSettings()" style="background: none; border: none; cursor: pointer;">
            <ion-icon name="person-circle-outline" style="font-size: 24px; color: white;"></ion-icon>
        </button>
    </div>
</div>
```

## 3. CREATE PROPER SETTINGS SCREEN

**Replace showProfileSettings function (around line 3200) with:**

```javascript
window.showSettings = function() {
    document.getElementById('settings-modal').classList.add('show');
};

window.showProfileSettings = function() {
    showSettings();
};
```

**Add Settings Modal after Profile Settings Modal (around line 900):**

```html
<!-- Settings Modal -->
<div id="settings-modal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2 style="margin: 0;">Settings</h2>
            <button onclick="closeModal('settings-modal')" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">×</button>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h3>Account</h3>
            <button class="btn btn-primary" style="width: 100%; margin-bottom: 10px;" onclick="closeModal('settings-modal'); document.getElementById('profile-settings-modal').classList.add('show');">
                Edit Profile
            </button>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h3>About</h3>
            <div style="padding: 16px; background: #2a2a2a; border-radius: 8px;">
                <h4 style="margin: 0 0 10px 0;">Kobi's Student Atlas</h4>
                <p style="margin: 5px 0; color: #999;">Version 1.0.0</p>
                <p style="margin: 5px 0; color: #999;">By Kobi Chambers</p>
                <p style="margin: 5px 0; color: #999;">University of the West Indies</p>
                <p style="margin: 10px 0; color: #ccc;">A comprehensive student management app for tracking academic progress, managing schedules, and connecting with peers.</p>
            </div>
        </div>
        
        <button class="btn" style="width: 100%; background: #dc3545; color: white;" onclick="logout()">
            Logout
        </button>
    </div>
</div>
```

**Add logout function:**

```javascript
window.logout = function() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('kobi_atlas_uid');
        localStorage.removeItem('kobi_atlas_pin');
        window.location.reload();
    }
};
```

## 4. UPDATE USER PROFILE TO SHOW POSTS

In viewUserProfile function (around line 2790), ADD after getting user data:

```javascript
// Get user's posts
const postsRef = collection(db, 'posts');
const postsQuery = query(postsRef, where('authorId', '==', userId), orderBy('timestamp', 'desc'));
const postsSnap = await getDocs(postsQuery);
const userPosts = [];
postsSnap.forEach(doc => userPosts.push({ id: doc.id, ...doc.data() }));
```

Then in the HTML, ADD before the action buttons:

```javascript
<!-- Stats Grid -->
<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
    <div style="text-align: center; padding: 12px; background: #2a2a2a; border-radius: 8px;">
        <div style="font-size: 20px; font-weight: bold;">${userPosts.length}</div>
        <div style="font-size: 12px; color: #999;">Posts</div>
    </div>
    <div style="text-align: center; padding: 12px; background: #2a2a2a; border-radius: 8px;">
        <div style="font-size: 20px; font-weight: bold;">${currentViewingUser.friends?.length || 0}</div>
        <div style="font-size: 12px; color: #999;">Friends</div>
    </div>
    <div style="text-align: center; padding: 12px; background: #2a2a2a; border-radius: 8px;">
        <div style="font-size: 20px; font-weight: bold;">${lastSeen}</div>
        <div style="font-size: 12px; color: #999;">Last Seen</div>
    </div>
</div>

<!-- Recent Posts -->
<div style="padding: 16px; background: #2a2a2a; border-radius: 8px; margin-bottom: 16px;">
    <h3 style="margin: 0 0 10px 0;">Recent Posts (${userPosts.length})</h3>
    ${userPosts.length > 0 ? userPosts.slice(0, 5).map(post => `
        <div style="padding: 12px; background: #1a1a1a; border-radius: 8px; margin-bottom: 8px; cursor: pointer;" onclick="openPostDetail('${post.id}')">
            <p style="margin: 0 0 8px 0;">${post.contentText || 'No text'}</p>
            <div style="display: flex; gap: 16px; font-size: 12px; color: #999;">
                <span>❤️ ${post.likes?.length || 0}</span>
                <span>💬 ${post.replies?.length || 0}</span>
                <span>${formatTime(post.timestamp)}</span>
            </div>
        </div>
    `).join('') : '<p style="text-align: center; color: #999; padding: 20px;">No posts yet</p>'}
</div>
```

## IMPLEMENTATION ORDER:
1. Fix messages sync FIRST (most critical)
2. Align community buttons
3. Add Settings modal
4. Update user profile with posts

This will achieve 100% parity with Android app!
