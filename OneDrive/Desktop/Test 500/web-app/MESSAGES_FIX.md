# MESSAGES FIX - COMPLETE REWRITE

Replace the entire `loadConversations` function (around line 3165) with this Android-matching version:

```javascript
async function loadConversations() {
    const uid = localStorage.getItem('kobi_atlas_uid');

    try {
        const messagesRef = collection(db, 'messages');
        
        // Get all messages where user is sender or receiver (NO FRIENDS REQUIREMENT!)
        const q1 = query(messagesRef, where('senderId', '==', uid));
        const q2 = query(messagesRef, where('receiverId', '==', uid));
        
        const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        
        // Collect all unique user IDs and messages by user
        const userIds = new Set();
        const messagesByUser = new Map();
        
        snapshot1.forEach(doc => {
            const data = doc.data();
            if (data.deleted) return; // Skip deleted
            
            userIds.add(data.receiverId);
            if (!messagesByUser.has(data.receiverId)) {
                messagesByUser.set(data.receiverId, []);
            }
            messagesByUser.get(data.receiverId).push(data);
        });
        
        snapshot2.forEach(doc => {
            const data = doc.data();
            if (data.deleted) return; // Skip deleted
            
            userIds.add(data.senderId);
            if (!messagesByUser.has(data.senderId)) {
                messagesByUser.set(data.senderId, []);
            }
            messagesByUser.get(data.senderId).push(data);
        });
        
        // Fetch user details and create conversations
        const conversations = [];
        
        for (const userId of userIds) {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (!userDoc.exists()) continue; // Skip deleted users
            
            const userData = userDoc.data();
            const userMessages = messagesByUser.get(userId) || [];
            
            // Sort by timestamp descending
            userMessages.sort((a, b) => b.timestamp - a.timestamp);
            
            const lastMsg = userMessages[0];
            const unread = userMessages.filter(msg => msg.receiverId === uid && !msg.read).length;
            
            conversations.push({
                friendId: userId,
                username: userData.username || 'Anonymous',
                profilePicture: userData.profilePicture,
                lastMessage: lastMsg?.text || 'No messages yet',
                timestamp: lastMsg?.timestamp || 0,
                unreadCount: unread,
                isOnline: userData.lastActive && (Date.now() - userData.lastActive < 300000)
            });
        }
        
        console.log('Loaded conversations:', conversations.length);
        conversations.sort((a, b) => b.timestamp - a.timestamp);
        
        const html = conversations.length > 0 ? conversations.map(conv => `
            <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #2a2a2a; border-radius: 8px; margin-bottom: 10px; cursor: pointer; border-bottom: 1px solid rgba(0,0,0,0.1);" onclick="openChat('${conv.friendId}')">
                <div style="position: relative;">
                    ${conv.profilePicture ?
                    `<img src="${conv.profilePicture}" style="width: 50px; height: 50px; border-radius: 25px; object-fit: cover;">` :
                    `<div style="width: 50px; height: 50px; border-radius: 25px; background: #667eea; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px;">${conv.username?.[0]?.toUpperCase() || 'U'}</div>`
                }
                    ${conv.isOnline ? '<div style="position: absolute; bottom: 2px; right: 2px; width: 14px; height: 14px; border-radius: 7px; background: #4CAF50; border: 2px solid #1a1a1a;"></div>' : ''}
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <div style="font-weight: 600; font-size: 16px;">${conv.username}</div>
                        <div style="font-size: 12px; color: #999;">${conv.timestamp ? formatTime(conv.timestamp) : ''}</div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-size: 14px; color: ${conv.unreadCount > 0 ? '#fff' : '#999'}; ${conv.unreadCount > 0 ? 'font-weight: 600;' : ''} flex: 1;">${conv.lastMessage.substring(0, 50)}${conv.lastMessage.length > 50 ? '...' : ''}</div>
                        ${conv.unreadCount > 0 ? `
                            <div style="min-width: 20px; height: 20px; border-radius: 10px; background: #667eea; display: flex; align-items: center; justify-content: center; padding: 0 6px; margin-left: 8px;">
                                <span style="color: white; font-size: 11px; font-weight: bold;">${conv.unreadCount}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('') : `
            <div style="text-align: center; padding: 60px 20px;">
                <ion-icon name="chatbubbles-outline" style="font-size: 64px; color: #666;"></ion-icon>
                <p style="font-size: 20px; font-weight: 600; margin: 16px 0 8px 0;">No messages yet</p>
                <p style="font-size: 14px; color: #999; margin-bottom: 24px;">Start a conversation by searching for users</p>
                <button class="btn btn-primary" onclick="showUserSearch()">Find Users</button>
            </div>
        `;
        
        document.getElementById('conversations-list').innerHTML = html;
        
    } catch (error) {
        console.error('Load conversations error:', error);
        showToast('Error loading conversations', 'error');
    }
}
```

This new version:
1. ✅ NO FRIENDS REQUIREMENT - loads ALL messages
2. ✅ Unread count badges (purple circle with number)
3. ✅ Online indicators (green dot)
4. ✅ Filters deleted messages
5. ✅ Better formatting matching Android
6. ✅ Empty state with "Find Users" button
