import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    RefreshControl,
    Animated,
    TextInput,
    Alert,
    Pressable,
    SectionList,
    ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, or, and, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { getUserById } from '../services/userService';
import { User } from '../types';
import { Ionicons } from '@expo/vector-icons';

interface Conversation {
    otherUser: User;
    lastMessage: string;
    lastMessageTime: number;
    unreadCount: number;
}

export default function MessagesListScreen({ navigation, showHeader = true }: { navigation: any, showHeader?: boolean }) {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            loadConversations();
        }, [user?.uid])
    );

    const loadConversations = async () => {
        if (!user?.uid) return;

        try {
            setLoading(true);
            const messagesRef = collection(db, 'messages');

            // Get all messages where user is sender or receiver
            const q1 = query(messagesRef, where('senderId', '==', user.uid));
            const q2 = query(messagesRef, where('receiverId', '==', user.uid));

            const [snapshot1, snapshot2] = await Promise.all([
                getDocs(q1),
                getDocs(q2)
            ]);

            // Collect all unique user IDs
            const userIds = new Set<string>();
            const messagesByUser = new Map<string, any[]>();

            snapshot1.forEach(doc => {
                const data = doc.data();
                userIds.add(data.receiverId);
                if (!messagesByUser.has(data.receiverId)) {
                    messagesByUser.set(data.receiverId, []);
                }
                messagesByUser.get(data.receiverId)!.push(data);
            });

            snapshot2.forEach(doc => {
                const data = doc.data();
                userIds.add(data.senderId);
                if (!messagesByUser.has(data.senderId)) {
                    messagesByUser.set(data.senderId, []);
                }
                messagesByUser.get(data.senderId)!.push(data);
            });

            // Fetch user details and create conversations
            const conversationsList: Conversation[] = [];

            for (const userId of userIds) {
                const otherUser = await getUserById(userId);
                if (!otherUser) continue;

                const userMessages = messagesByUser.get(userId) || [];
                // Sort by timestamp descending
                userMessages.sort((a, b) => b.timestamp - a.timestamp);

                const lastMsg = userMessages[0];
                const unread = userMessages.filter(
                    msg => msg.senderId != user.uid && (msg.read !== true && msg.read !== 'true')
                ).length;

                conversationsList.push({
                    otherUser,
                    lastMessage: lastMsg?.text || '',
                    lastMessageTime: lastMsg?.timestamp || 0,
                    unreadCount: unread,
                });
            }

            // Sort conversations by last message time
            conversationsList.sort((a, b) => b.lastMessageTime - a.lastMessageTime);

            setConversations(conversationsList);
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadConversations();
        setRefreshing(false);
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const renderSectionHeader = ({ section: { title, data } }: { section: { title: string, data: Conversation[] } }) => (
        data.length > 0 ? (
            <View style={{ paddingVertical: 8, paddingHorizontal: 16, backgroundColor: theme.background }}>
                <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 14, textTransform: 'uppercase' }}>
                    {title} ({data.length})
                </Text>
            </View>
        ) : null
    );

    const renderConversation = ({ item }: { item: Conversation }) => {
        const isOnline = item.otherUser.lastActive &&
            Date.now() - item.otherUser.lastActive < 300000;
        const hasUnread = item.unreadCount > 0;

        return (
            <TouchableOpacity
                style={[
                    styles.conversationCard,
                    { backgroundColor: theme.card },
                    hasUnread && {
                        backgroundColor: 'rgba(102, 126, 234, 0.15)',
                        borderColor: theme.primary,
                        borderWidth: 2
                    }
                ]}
                onPress={() => navigation.navigate('Messaging', { otherUser: item.otherUser })}
            >
                {hasUnread && (
                    <View style={{
                        position: 'absolute',
                        left: 4,
                        top: '50%',
                        marginTop: -4,
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#007AFF', // Explicit Blue
                        zIndex: 10
                    }} />
                )}
                <View style={styles.avatarContainer}>
                    {item.otherUser.profilePicture ? (
                        <Image
                            source={{ uri: item.otherUser.profilePicture }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                            <Text style={styles.avatarText}>
                                {(item.otherUser.username || item.otherUser.email)?.[0]?.toUpperCase() || 'U'}
                            </Text>
                        </View>
                    )}
                    {isOnline && <View style={styles.onlineIndicator} />}
                </View>

                <View style={styles.conversationInfo}>
                    <View style={styles.conversationHeader}>
                        <Text style={[
                            styles.username,
                            { color: theme.text },
                            hasUnread && { fontWeight: '900', color: theme.text } // Extra Bold
                        ]} numberOfLines={1}>
                            {item.otherUser.username || item.otherUser.email}
                        </Text>
                        <Text style={[
                            styles.time,
                            { color: hasUnread ? theme.primary : theme.textSecondary, fontWeight: hasUnread ? 'bold' : 'normal' }
                        ]}>
                            {formatTime(item.lastMessageTime)}
                        </Text>
                    </View>

                    <View style={styles.messageRow}>
                        <Text
                            style={[
                                styles.lastMessage,
                                { color: hasUnread ? theme.text : theme.textSecondary },
                                hasUnread && { fontWeight: 'bold' }
                            ]}
                            numberOfLines={1}
                        >
                            {item.lastMessage}
                        </Text>
                        {item.unreadCount > 0 && (
                            <View style={[styles.unreadBadge, { backgroundColor: '#007AFF' }]}>
                                <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {showHeader && (
                <View style={[styles.header, { backgroundColor: theme.primary }]}>
                    <Text style={styles.headerTitle}>Messages</Text>
                    <TouchableOpacity
                        style={styles.newMessageButton}
                        onPress={() => navigation.navigate('UserSearch')}
                    >
                        <Ionicons name="create-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (conversations.length === 0 ? (
                <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
                    <Ionicons
                        name="chatbubbles-outline"
                        size={64}
                        color={theme.textSecondary}
                    />
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                        No messages found.
                    </Text>
                    <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                        Start a conversation by searching for users
                    </Text>
                    <TouchableOpacity
                        style={[styles.findButton, { backgroundColor: theme.primary }]}
                        onPress={() => navigation.navigate('UserSearch')}
                    >
                        <Text style={styles.findButtonText}>Find Users</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <SectionList
                    sections={[
                        { title: 'Unread', data: conversations.filter(c => c.unreadCount > 0) },
                        { title: 'Read Messages', data: conversations.filter(c => c.unreadCount === 0) }
                    ]}
                    keyExtractor={(item) => item.otherUser.uid}
                    renderItem={renderConversation}
                    renderSectionHeader={renderSectionHeader}
                    contentContainerStyle={{ paddingBottom: 80 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                    }
                    stickySectionHeadersEnabled={false}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        paddingTop: 50,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    newMessageButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    conversationCard: {
        flexDirection: 'row',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    conversationInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    username: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    time: {
        fontSize: 12,
        marginLeft: 8,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lastMessage: {
        fontSize: 14,
        flex: 1,
    },
    unreadMessage: {
        fontWeight: '600',
    },
    unreadBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
        marginLeft: 8,
    },
    unreadCount: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    searchButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    searchButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    findButton: {
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    findButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
