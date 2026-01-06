import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Image,
    ActivityIndicator,
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { searchUsers, getAllUsers } from '../services/userService';
import { User } from '../types';
import { Ionicons } from '@expo/vector-icons';
import OwnerBadge, { isOwner } from '../components/OwnerBadge';

export default function UserSearchScreen({ navigation }: any) {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) {
            handleSearch();
        } else {
            loadUsers();
        }
    }, [searchQuery]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const allUsers = await getAllUsers();
            // Filter out current user
            const filteredUsers = allUsers.filter(u => u.uid !== user?.uid);
            setUsers(filteredUsers);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        try {
            setLoading(true);
            const results = await searchUsers(searchQuery);
            // Filter out current user
            const filteredResults = results.filter(u => u.uid !== user?.uid);
            setUsers(filteredResults);
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatLastActive = (timestamp?: number) => {
        if (!timestamp) return 'Never';

        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return new Date(timestamp).toLocaleDateString();
    };

    const getOnlineStatus = (timestamp?: number) => {
        if (!timestamp) return 'offline';
        const diff = Date.now() - timestamp;
        return diff < 300000 ? 'online' : 'offline'; // 5 minutes
    };

    const renderUser = ({ item }: { item: User }) => {
        const isOnline = getOnlineStatus(item.lastActive) === 'online';

        return (
            <TouchableOpacity
                style={[styles.userCard, { backgroundColor: theme.card }]}
                onPress={() => navigation.navigate('UserProfile', { userId: item.uid })}
            >
                <View style={styles.userInfo}>
                    {item.profilePicture ? (
                        <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                            <Text style={styles.avatarText}>
                                {(item.username || item.email)?.[0]?.toUpperCase() || 'U'}
                            </Text>
                        </View>
                    )}

                    <View style={styles.onlineIndicatorContainer}>
                        <View style={[
                            styles.onlineIndicator,
                            { backgroundColor: isOnline ? '#4CAF50' : '#9E9E9E' }
                        ]} />
                    </View>

                    <View style={styles.userDetails}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[styles.username, { color: theme.text }]}>
                                {item.username || item.email}
                            </Text>
                            {isOwner(item.uid) && <OwnerBadge size={14} />}
                        </View>
                        {item.bio && (
                            <Text style={[styles.bio, { color: theme.textSecondary }]} numberOfLines={1}>
                                {item.bio}
                            </Text>
                        )}
                        <Text style={[styles.lastActive, { color: theme.textSecondary }]}>
                            {isOnline ? 'Online' : `Last seen ${formatLastActive(item.lastActive)}`}
                        </Text>
                    </View>
                </View>

                <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.primary }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Find Users</Text>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
                <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
                <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder="Search by username or email..."
                    placeholderTextColor={theme.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderUser}
                    keyExtractor={(item) => item.uid}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                            {searchQuery ? 'No users found' : 'No users available'}
                        </Text>
                    }
                />
            )}
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
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 15,
        padding: 12,
        borderRadius: 10,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 15,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
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
    onlineIndicatorContainer: {
        position: 'absolute',
        left: 38,
        top: 0,
    },
    onlineIndicator: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    userDetails: {
        marginLeft: 15,
        flex: 1,
    },
    username: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    bio: {
        fontSize: 13,
        marginBottom: 2,
    },
    lastActive: {
        fontSize: 12,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
        marginTop: 40,
    },
});
