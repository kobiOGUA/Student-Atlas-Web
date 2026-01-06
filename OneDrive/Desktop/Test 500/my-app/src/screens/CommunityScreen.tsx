import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import CommunityFeedScreen from './CommunityFeedScreen';
import MessagesListScreen from './MessagesListScreen';
import ResourcesListScreen from './ResourcesListScreen';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { getPendingFriendRequests } from '../services/friendService';

export default function CommunityScreen({ navigation }: any) {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'feed' | 'resources' | 'messages'>('feed');
    const [notificationCount, setNotificationCount] = useState(0);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

    const loadCounts = async () => {
        if (!user?.uid) return;
        try {
            // Feed Notifications (Friend Requests + App Notifications)
            const friendRequests = await getPendingFriendRequests(user.uid);
            const notificationsRef = collection(db, 'notifications');
            const notifQuery = query(notificationsRef, where('userId', '==', user.uid), where('read', '==', false));
            const notifSnapshot = await getDocs(notifQuery);
            setNotificationCount(friendRequests.length + notifSnapshot.size);

            // Messages (Unread)
            const messagesRef = collection(db, 'messages');
            const msgQuery = query(messagesRef, where('receiverId', '==', user.uid), where('read', '==', false));
            const msgSnapshot = await getDocs(msgQuery);
            setUnreadMessagesCount(msgSnapshot.size);
        } catch (error) {
            console.error('Error loading counts in CommunityScreen:', error);
        }
    };

    useEffect(() => {
        loadCounts();
        const interval = setInterval(loadCounts, 10000); // Check every 10s
        return () => clearInterval(interval);
    }, [user?.uid]);

    const renderBadge = (count: number) => {
        if (count === 0) return null;
        return (
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Unified Header */}
            <View style={[styles.header, { backgroundColor: theme.primary }]}>
                <Text style={styles.headerTitle}>Community</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity
                        style={styles.headerIcon}
                        onPress={() => navigation.navigate('UserSearch')}
                    >
                        <Ionicons name="search-outline" size={24} color="#FFF" />
                    </TouchableOpacity>

                    {activeTab === 'feed' && (
                        <>
                            <TouchableOpacity
                                style={styles.headerIcon}
                                onPress={() => navigation.navigate('CreatePost')}
                            >
                                <Ionicons name="add-outline" size={24} color="#FFF" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.headerIcon}
                                onPress={() => navigation.navigate('Notifications')}
                            >
                                <View style={{ position: 'relative' }}>
                                    <Ionicons name="notifications-outline" size={24} color="#FFF" />
                                    {notificationCount > 0 && (
                                        <View style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#FF3B30', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 }}>
                                            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>{notificationCount > 99 ? '99+' : notificationCount}</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        </>
                    )}

                    {activeTab === 'messages' && (
                        <TouchableOpacity
                            style={styles.headerIcon}
                            onPress={() => navigation.navigate('UserSearch')}
                        >
                            <Ionicons name="create-outline" size={24} color="#FFF" />
                        </TouchableOpacity>
                    )}

                    {/* Keep search for Resources for now (already present) */}
                </View>
            </View>

            {/* Custom Tabs */}
            <View style={[styles.tabContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'feed' && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]}
                    onPress={() => setActiveTab('feed')}
                >
                    <View style={styles.tabContent}>
                        <Text style={[styles.tabText, { color: activeTab === 'feed' ? theme.primary : theme.textSecondary }]}>
                            Feed
                        </Text>
                        {renderBadge(notificationCount)}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'resources' && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]}
                    onPress={() => setActiveTab('resources')}
                >
                    <View style={styles.tabContent}>
                        <Text style={[styles.tabText, { color: activeTab === 'resources' ? theme.primary : theme.textSecondary }]}>
                            Resources
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'messages' && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]}
                    onPress={() => setActiveTab('messages')}
                >
                    <View style={styles.tabContent}>
                        <Text style={[styles.tabText, { color: activeTab === 'messages' ? theme.primary : theme.textSecondary }]}>
                            Messages
                        </Text>
                        {renderBadge(unreadMessagesCount)}
                    </View>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {activeTab === 'feed' ? (
                    <CommunityFeedScreen navigation={navigation} showHeader={false} />
                ) : activeTab === 'resources' ? (
                    <ResourcesListScreen navigation={navigation} />
                ) : (
                    <MessagesListScreen navigation={navigation} showHeader={false} />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        paddingTop: 50,
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    headerIcon: {
        padding: 5,
    },
    tabContainer: {
        flexDirection: 'row',
        height: 50,
        borderBottomWidth: 1,
    },
    tab: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    badge: {
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
