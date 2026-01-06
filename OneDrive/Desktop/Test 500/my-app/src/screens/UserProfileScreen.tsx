import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Image,
    ActivityIndicator,
    Modal,
    FlatList
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getUserById } from '../services/userService';
import { getPosts } from '../services/socialService';
import {
    sendFriendRequest,
    checkFriendshipStatus,
    acceptFriendRequest,
    removeFriend,
    getPendingFriendRequests,
    getFriends
} from '../services/friendService';
import { User, Post, FriendRequest } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { showAlert, showConfirm } from '../utils/alerts';
import OwnerBadge, { isOwner } from '../components/OwnerBadge';
import { ACHIEVEMENTS } from '../utils/achievements';

export default function UserProfileScreen({ route, navigation }: any) {
    const { theme } = useTheme();
    const { user: currentUser } = useAuth();
    const { userId } = route.params;
    const [user, setUser] = useState<User | null>(null);
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [friendStatus, setFriendStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'friends'>('none');
    const [pendingRequest, setPendingRequest] = useState<FriendRequest | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Friend List Modal
    const [friendsModalVisible, setFriendsModalVisible] = useState(false);
    const [friendsList, setFriendsList] = useState<User[]>([]);
    const [loadingFriends, setLoadingFriends] = useState(false);

    useEffect(() => {
        loadUserProfile();
    }, [userId, currentUser?.uid]);

    const loadUserProfile = async () => {
        try {
            setLoading(true);
            const userData = await getUserById(userId);
            setUser(userData);

            // Load user's posts
            const allPosts = await getPosts(50);
            const filteredPosts = allPosts.filter(post => post.authorId === userId);
            setUserPosts(filteredPosts);

            // Check friendship status
            if (currentUser?.uid && currentUser.uid !== userId) {
                const status = await checkFriendshipStatus(currentUser.uid, userId);
                setFriendStatus(status);

                if (status === 'pending_received') {
                    const requests = await getPendingFriendRequests(currentUser.uid);
                    const request = requests.find(r => r.fromUserId === userId);
                    setPendingRequest(request || null);
                }
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFriendAction = async () => {
        if (!currentUser?.uid || !user) return;

        if (friendStatus === 'none') {
            setActionLoading(true);
            try {
                await sendFriendRequest(currentUser.uid, userId);
                setFriendStatus('pending_sent');
                showAlert('Success', 'Friend request sent!');
            } catch (error) {
                console.error('Error sending friend request:', error);
                showAlert('Error', 'Could not send friend request. Please try again.');
            } finally {
                setActionLoading(false);
            }
        } else if (friendStatus === 'pending_received' && pendingRequest) {
            setActionLoading(true);
            try {
                await acceptFriendRequest(pendingRequest.id, pendingRequest.fromUserId, currentUser.uid);
                setFriendStatus('friends');
                setPendingRequest(null);
                showAlert('Success', 'Friend request accepted!');
            } catch (error) {
                console.error('Error accepting friend request:', error);
                showAlert('Error', 'Could not accept friend request. Please try again.');
            } finally {
                setActionLoading(false);
            }
        } else if (friendStatus === 'friends') {
            showConfirm(
                'Remove Friend',
                'Are you sure you want to remove this friend?',
                async () => {
                    setActionLoading(true);
                    try {
                        await removeFriend(currentUser.uid, userId);
                        setFriendStatus('none');
                        setPendingRequest(null);
                        showAlert('Success', 'Friend removed successfully!');
                    } catch (error: any) {
                        console.error('Error removing friend:', error);
                        showAlert('Error', error.message || 'Failed to remove friend. Please try again.');
                    } finally {
                        setActionLoading(false);
                    }
                }
            );
        }
    };

    const handleViewFriends = async () => {
        setFriendsModalVisible(true);
        setLoadingFriends(true);
        try {
            const friends = await getFriends(userId);
            setFriendsList(friends);
        } catch (error) {
            console.error('Error loading friends list', error);
        } finally {
            setLoadingFriends(false);
        }
    };

    const formatLastSeen = (lastActive?: number) => {
        if (!lastActive) return 'Never';

        const now = Date.now();
        const diff = now - lastActive;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 5) return 'Online';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return new Date(lastActive).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatJoinDate = (createdAt?: number) => {
        if (!createdAt) return 'Unknown';
        return new Date(createdAt).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={[styles.header, { backgroundColor: theme.primary }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={[styles.header, { backgroundColor: theme.primary }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile</Text>
                </View>
                <View style={styles.errorContainer}>
                    <Ionicons name="person-outline" size={64} color={theme.textSecondary} />
                    <Text style={[styles.errorText, { color: theme.textSecondary }]}>
                        User not found
                    </Text>
                </View>
            </View>
        );
    }

    const isOwnProfile = currentUser?.uid === userId;
    const isOnline = user.lastActive && Date.now() - user.lastActive < 300000;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.primary }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
            </View>

            <ScrollView>
                {/* Profile Header */}
                <View style={[styles.profileHeader, { backgroundColor: theme.card }]}>
                    <View style={styles.avatarContainer}>
                        {user.profilePicture ? (
                            <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                                <Text style={styles.avatarText}>
                                    {(user.username || user.email)?.[0]?.toUpperCase() || 'U'}
                                </Text>
                            </View>
                        )}
                        {isOnline && <View style={styles.onlineIndicator} />}
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                        <Text style={[styles.username, { color: theme.text, marginBottom: 0 }]}>
                            {user.username || user.email?.split('@')[0] || 'Anonymous'}
                        </Text>
                        {isOwner(user.uid) && <OwnerBadge size={20} />}
                    </View>

                    {user.bio && (
                        <Text style={[styles.bio, { color: theme.textSecondary }]}>
                            {user.bio}
                        </Text>
                    )}

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.text }]}>
                                {userPosts.length}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                                Posts
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.statItem} onPress={handleViewFriends}>
                            <Text style={[styles.statValue, { color: theme.text }]}>
                                {user.friends?.length || 0}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                                Friends
                            </Text>
                        </TouchableOpacity>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: isOnline ? '#4CAF50' : theme.textSecondary }]}>
                                {formatLastSeen(user.lastActive)}
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                                Last Seen
                            </Text>
                        </View>
                    </View>

                    {!isOwnProfile && (
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.messageButton, { backgroundColor: theme.primary }]}
                                onPress={() => navigation.navigate('Messaging', { otherUser: user })}
                            >
                                <Ionicons name="chatbubble" size={20} color="#FFFFFF" />
                                <Text style={styles.messageButtonText}>Message</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.friendButton,
                                    {
                                        backgroundColor: friendStatus === 'friends' ? theme.surface : theme.primary,
                                        borderColor: theme.primary,
                                        borderWidth: friendStatus === 'friends' ? 1 : 0
                                    }
                                ]}
                                onPress={handleFriendAction}
                                disabled={friendStatus === 'pending_sent' || actionLoading}
                            >
                                <Ionicons
                                    name={
                                        friendStatus === 'friends' ? "person-remove" :
                                            friendStatus === 'pending_sent' ? "time" :
                                                friendStatus === 'pending_received' ? "person-add" : "person-add"
                                    }
                                    size={20}
                                    color={friendStatus === 'friends' ? theme.primary : "#FFFFFF"}
                                />
                                <Text style={[
                                    styles.friendButtonText,
                                    { color: friendStatus === 'friends' ? theme.primary : "#FFFFFF" }
                                ]}>
                                    {friendStatus === 'friends' ? 'Unfriend' :
                                        friendStatus === 'pending_sent' ? 'Sent' :
                                            friendStatus === 'pending_received' ? 'Accept' : 'Add Friend'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {isOwnProfile && (
                        <TouchableOpacity
                            style={[styles.editButton, { borderColor: theme.primary }]}
                            onPress={() => navigation.navigate('ProfileSettings')}
                        >
                            <Ionicons name="create-outline" size={20} color={theme.primary} />
                            <Text style={[styles.editButtonText, { color: theme.primary }]}>
                                Edit Profile
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Achievements Section */}
                <View style={[styles.infoSection, { backgroundColor: theme.card }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Achievements</Text>
                    <View style={styles.achievementsGrid}>
                        {ACHIEVEMENTS.map(ach => {
                            const isUnlocked = user.achievements?.includes(ach.id);
                            return (
                                <View key={ach.id} style={[styles.achievementItem, !isUnlocked && { opacity: 0.3 }]}>
                                    <View style={[styles.achievementIcon, { backgroundColor: isUnlocked ? theme.primary : theme.border }]}>
                                        <Ionicons name={ach.icon as any} size={20} color="#FFFFFF" />
                                    </View>
                                    <Text style={[styles.achievementTitle, { color: theme.text }]} numberOfLines={1}>
                                        {ach.title}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* About Me Section */}
                {user.aboutMe && (
                    <View style={[styles.infoSection, { backgroundColor: theme.card }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>About Me</Text>
                        <Text style={[styles.aboutMeText, { color: theme.text }]}>
                            {user.aboutMe}
                        </Text>
                    </View>
                )}

                {/* User Info */}
                <View style={[styles.infoSection, { backgroundColor: theme.card }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Information</Text>

                    <View style={styles.infoRow}>
                        <Ionicons name="mail-outline" size={20} color={theme.textSecondary} />
                        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                            {user.email}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
                        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                            Joined {formatJoinDate(user.createdAt)}
                        </Text>
                    </View>
                </View>

                {/* Recent Posts */}
                <View style={[styles.postsSection, { backgroundColor: theme.card }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Recent Posts ({userPosts.length})
                    </Text>

                    {userPosts.length === 0 ? (
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                            No posts yet
                        </Text>
                    ) : (
                        userPosts.slice(0, 5).map((post) => (
                            <TouchableOpacity
                                key={post.id}
                                style={[styles.postItem, { borderBottomColor: theme.border }]}
                                onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
                            >
                                <Text style={[styles.postText, { color: theme.text }]} numberOfLines={2}>
                                    {post.contentText}
                                </Text>
                                <View style={styles.postStats}>
                                    <Text style={[styles.postStat, { color: theme.textSecondary }]}>
                                        ❤️ {post.likes.length}
                                    </Text>
                                    <Text style={[styles.postStat, { color: theme.textSecondary }]}>
                                        💬 {post.replies.length}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Friends List Modal */}
            <Modal
                visible={friendsModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setFriendsModalVisible(false)}
            >
                <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
                    <View style={[styles.modalHeader, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Friends</Text>
                        <TouchableOpacity onPress={() => setFriendsModalVisible(false)}>
                            <Ionicons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    {loadingFriends ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.primary} />
                        </View>
                    ) : friendsList.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No friends yet.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={friendsList}
                            keyExtractor={(item) => item.uid}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.friendItem, { borderBottomColor: theme.border }]}
                                    onPress={() => {
                                        setFriendsModalVisible(false);
                                        navigation.push('UserProfile', { userId: item.uid });
                                    }}
                                >
                                    {item.profilePicture ? (
                                        <Image source={{ uri: item.profilePicture }} style={styles.friendAvatar} />
                                    ) : (
                                        <View style={[styles.friendAvatarPlaceholder, { backgroundColor: theme.primary }]}>
                                            <Text style={styles.friendAvatarText}>
                                                {(item.username || item.email || 'U')[0].toUpperCase()}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={styles.friendInfo}>
                                        <Text style={[styles.friendName, { color: theme.text }]}>
                                            {item.username || item.displayName || 'User'}
                                        </Text>
                                        <Text style={[styles.friendEmail, { color: theme.textSecondary }]}>
                                            {isOwner(item.uid) ? 'Owner' : 'Student'}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        paddingTop: 50,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginLeft: 15,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    errorText: {
        fontSize: 18,
        marginTop: 16,
    },
    profileHeader: {
        padding: 20,
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 40,
        fontWeight: 'bold',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#4CAF50',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    bio: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 20,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    actionButtons: {
        flexDirection: 'row',
        width: '100%',
        paddingHorizontal: 10,
        justifyContent: 'space-between',
    },
    messageButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginRight: 10,
    },
    messageButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    friendButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginLeft: 10,
    },
    friendButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    editButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 2,
        width: '90%',
    },
    editButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    infoSection: {
        padding: 20,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    aboutMeText: {
        fontSize: 15,
        lineHeight: 22,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoText: {
        fontSize: 14,
        marginLeft: 12,
    },
    postsSection: {
        padding: 20,
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 10,
    },
    postItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    postText: {
        fontSize: 14,
        marginBottom: 8,
    },
    postStats: {
        flexDirection: 'row',
    },
    postStat: {
        fontSize: 12,
        marginRight: 16,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
    },
    friendAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    friendAvatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    friendAvatarText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    friendInfo: {
        flex: 1,
    },
    friendName: {
        fontSize: 16,
        fontWeight: '600',
    },
    friendEmail: {
        fontSize: 14,
    },
    achievementsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    achievementItem: {
        width: '30%',
        alignItems: 'center',
        marginBottom: 15,
    },
    achievementIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    achievementTitle: {
        fontSize: 10,
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 50,
    },
});
