import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    Platform,
    RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getPendingFriendRequests, acceptFriendRequest, rejectFriendRequest } from '../services/friendService';
import { getUserProfile } from '../services/socialService';
import { FriendRequest, User } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

interface RequestWithUser extends FriendRequest {
    fromUser?: User;
    type: 'friend_request';
}

interface CommunityNotification {
    id: string;
    userId: string;
    type: 'community';
    title: string;
    message: string;
    read: boolean;
    timestamp: number;
    createdAt: number;
}

type NotificationItem = RequestWithUser | CommunityNotification;

export default function NotificationsScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const navigation = useNavigation<any>();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, [user]);

    const loadNotifications = async () => {
        if (!user?.uid) return;
        try {
            setLoading(true);

            // 1. Fetch Friend Requests
            const pendingRequests = await getPendingFriendRequests(user.uid);
            const requestsWithUsers = await Promise.all(
                pendingRequests.map(async (request) => {
                    const fromUser = await getUserProfile(request.fromUserId);
                    return { ...request, fromUser: fromUser || undefined, type: 'friend_request' as const };
                })
            );

            // 2. Fetch Community Notifications
            const notificationsRef = collection(db, 'notifications');
            const q = query(
                notificationsRef,
                where('userId', '==', user.uid),
                orderBy('timestamp', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const communityNotifications: CommunityNotification[] = [];
            querySnapshot.forEach((doc) => {
                communityNotifications.push({ id: doc.id, ...doc.data() } as CommunityNotification);
            });

            // 3. Combine and Sort
            const allNotifications = [...requestsWithUsers, ...communityNotifications].sort((a, b) => {
                const timeA = 'timestamp' in a ? a.timestamp : 0; // Handle potential missing timestamp in friend requests if any
                const timeB = 'timestamp' in b ? b.timestamp : 0;
                return timeB - timeA;
            });

            setNotifications(allNotifications);

            // Mark unread community notifications as read
            communityNotifications.forEach(async (notif) => {
                if (!notif.read) {
                    await updateDoc(doc(db, 'notifications', notif.id), { read: true });
                }
            });

        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (request: RequestWithUser) => {
        if (!user?.uid) return;
        try {
            await acceptFriendRequest(request.id, request.fromUserId, user.uid);
            if (Platform.OS === 'web') {
                window.alert(`You are now friends with ${request.fromUser?.displayName || 'User'}`);
            } else {
                Alert.alert('Success', `You are now friends with ${request.fromUser?.displayName || 'User'}`);
            }
            loadNotifications(); // Reload list
        } catch (error) {
            console.error('Error accepting request:', error);
            if (Platform.OS === 'web') {
                window.alert('Failed to accept request');
            } else {
                Alert.alert('Error', 'Failed to accept request');
            }
        }
    };

    const handleReject = async (requestId: string) => {
        try {
            await rejectFriendRequest(requestId);
            loadNotifications(); // Reload list
        } catch (error) {
            console.error('Error rejecting request:', error);
        }
    };

    const renderItem = ({ item }: { item: NotificationItem }) => {
        if (item.type === 'friend_request') {
            return (
                <View style={[styles.requestCard, { backgroundColor: theme.card }]}>
                    <View style={styles.userInfo}>
                        {item.fromUser?.profilePicture ? (
                            <Image
                                source={{ uri: item.fromUser.profilePicture }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={[styles.avatar, { backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' }]}>
                                <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' }}>
                                    {(item.fromUser?.username || item.fromUser?.email)?.[0]?.toUpperCase() || 'U'}
                                </Text>
                            </View>
                        )}
                        <View style={styles.textContainer}>
                            <Text style={[styles.name, { color: theme.text }]}>
                                {item.fromUser?.displayName || item.fromUser?.username || 'Unknown User'}
                            </Text>
                            <Text style={[styles.subtext, { color: theme.textSecondary }]}>
                                sent you a friend request
                            </Text>
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: theme.primary }]}
                            onPress={() => handleAccept(item)}
                        >
                            <Text style={styles.actionText}>Accept</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]}
                            onPress={() => handleReject(item.id)}
                        >
                            <Text style={[styles.actionText, { color: theme.text }]}>Reject</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        } else if (item.type === 'community') {
            return (
                <View style={[styles.requestCard, { backgroundColor: theme.card, borderLeftWidth: 4, borderLeftColor: theme.primary }]}>
                    <View style={styles.userInfo}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
                            <Ionicons name="megaphone" size={24} color={theme.primary} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={[styles.name, { color: theme.text }]}>
                                {item.title}
                            </Text>
                            <Text style={[styles.subtext, { color: theme.textSecondary }]}>
                                {item.message}
                            </Text>
                            <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
                                {new Date(item.timestamp).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>
                </View>
            );
        }
        return null;
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.primary }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={loadNotifications}
                        colors={[theme.primary]}
                        tintColor={theme.primary}
                    />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="notifications-off-outline" size={64} color={theme.textSecondary} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                No new notifications
                            </Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    listContent: {
        padding: 15,
    },
    requestCard: {
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtext: {
        fontSize: 14,
        lineHeight: 20,
    },
    timestamp: {
        fontSize: 12,
        marginTop: 5,
        opacity: 0.7,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 5,
    },
    actionButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionText: {
        fontWeight: '600',
        color: '#FFFFFF',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 10,
    },
});
