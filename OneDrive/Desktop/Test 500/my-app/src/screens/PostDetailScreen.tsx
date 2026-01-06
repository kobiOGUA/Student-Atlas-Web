import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    RefreshControl,
    Alert,
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getPost, getReplies, createReply, likePost, unlikePost, likeReply, unlikeReply, getUserProfile, deletePost, deleteReply } from '../services/socialService';
import { Post, Reply } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { ErrorMessages } from '../utils/errorMessages';
import { showConfirm } from '../utils/alerts';
import OwnerBadge, { isOwner } from '../components/OwnerBadge';

export default function PostDetailScreen({ route, navigation }: any) {
    const { theme } = useTheme();
    const { user } = useAuth();
    const { postId } = route.params;
    const [post, setPost] = useState<Post | null>(null);
    const [replies, setReplies] = useState<Reply[]>([]);
    const [newReply, setNewReply] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        console.log('PostDetailScreen: useEffect triggered with postId:', postId);
        if (postId) {
            loadPostAndReplies();
        } else {
            console.error('PostDetailScreen: No postId provided!');
        }
    }, [postId]);

    const loadPostAndReplies = async () => {
        try {
            console.log('Loading post with ID:', postId);

            let postData: Post | null = null;
            let repliesData: Reply[] = [];

            try {
                postData = await getPost(postId);
                console.log('Post data received:', postData);
            } catch (error) {
                console.error('Error fetching post:', error);
                throw error;
            }

            try {
                repliesData = await getReplies(postId);
                console.log('Replies data received, count:', repliesData.length);
            } catch (error) {
                console.error('Error fetching replies:', error);
                // Don't throw - we can still show the post without replies
                repliesData = [];
            }

            if (!postData) {
                console.error('Post not found with ID:', postId);
                Alert.alert(ErrorMessages.POST_NOT_FOUND.title, ErrorMessages.POST_NOT_FOUND.message);
                navigation.goBack();
                return;
            }

            console.log('Setting post and replies state');
            setPost(postData);
            setReplies(repliesData);
            console.log('State updated successfully');
        } catch (error) {
            console.error('Error loading post:', error);
            Alert.alert(ErrorMessages.LOAD_FAILED.title, ErrorMessages.LOAD_FAILED.message);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPostAndReplies();
        setRefreshing(false);
    };

    const handleCreateReply = async () => {
        if (!user?.uid || !newReply.trim() || !post) return;

        setLoading(true);
        try {
            const userProfile = await getUserProfile(user.uid);
            const username = userProfile?.username || userProfile?.email || 'Anonymous';

            await createReply(
                postId,
                user.uid,
                username,
                newReply.trim(),
                userProfile?.profilePicture
            );
            setNewReply('');
            await loadPostAndReplies();
        } catch (error) {
            console.error('Error creating reply:', error);
            Alert.alert(ErrorMessages.CREATE_REPLY_FAILED.title, ErrorMessages.CREATE_REPLY_FAILED.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLikePost = async () => {
        if (!user?.uid || !post) return;

        const isLiked = post.likes.includes(user.uid);
        try {
            if (isLiked) {
                await unlikePost(post.id, user.uid);
            } else {
                await likePost(post.id, user.uid);
            }
            await loadPostAndReplies();
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    const handleLikeReply = async (reply: Reply) => {
        if (!user?.uid) return;

        try {
            const isLiked = reply.likes.includes(user.uid);
            if (isLiked) {
                await unlikeReply(reply.id, user.uid);
            } else {
                await likeReply(reply.id, user.uid);
            }
            // Refresh replies to show updated like count
            await loadPostAndReplies();
        } catch (error) {
            console.error('Error toggling reply like:', error);
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!user?.uid || !post) return;

        try {
            await deletePost(postId);
            navigation.goBack();
        } catch (error) {
            console.error('Error deleting post:', error);
            Alert.alert(ErrorMessages.DELETE_POST_FAILED.title, ErrorMessages.DELETE_POST_FAILED.message);
        }
    };

    const handleDeleteReply = async (replyId: string) => {
        if (!user?.uid) return;

        showConfirm(
            'Delete Reply',
            'Are you sure you want to delete this reply?',
            async () => {
                try {
                    await deleteReply(replyId);
                    // Refresh replies to remove deleted reply
                    await loadPostAndReplies();
                } catch (error) {
                    console.error('Error deleting reply:', error);
                    Alert.alert(ErrorMessages.DELETE_REPLY_FAILED.title, ErrorMessages.DELETE_REPLY_FAILED.message);
                }
            }
        );
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (!post) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={[styles.header, { backgroundColor: theme.primary }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Post</Text>
                </View>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.primary }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Post</Text>
            </View>

            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Original Post */}
                <View style={[styles.postCard, { backgroundColor: theme.card }]}>
                    <View style={styles.postHeader}>
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center' }}
                            onPress={() => navigation.navigate('UserProfile', { userId: post.authorId })}
                        >
                            {post.profilePicture ? (
                                <Image source={{ uri: post.profilePicture }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                                    <Text style={styles.avatarText}>{post.username[0].toUpperCase()}</Text>
                                </View>
                            )}
                            <View style={styles.postInfo}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={[styles.username, { color: theme.text }]}>{post.username}</Text>
                                    {isOwner(post.authorId) && <OwnerBadge size={14} />}
                                </View>
                                <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
                                    {formatTime(post.timestamp)}
                                </Text>
                            </View>
                        </TouchableOpacity>
                        {post.authorId === user?.uid && (
                            <TouchableOpacity onPress={() => handleDeletePost(post.id)}>
                                <Ionicons name="trash-outline" size={20} color={theme.error} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {post.contentText && (
                        <Text style={[styles.postText, { color: theme.text }]}>{post.contentText}</Text>
                    )}

                    {post.contentImage && (
                        <Image source={{ uri: post.contentImage }} style={styles.postImage} />
                    )}

                    <View style={[styles.actions, { borderTopColor: theme.border }]}>
                        <TouchableOpacity style={[styles.actionButton, { flexDirection: 'row', alignItems: 'center' }]} onPress={handleLikePost}>
                            <Ionicons
                                name={post.likes.includes(user?.uid || '') ? "heart" : "heart-outline"}
                                size={24}
                                color={post.likes.includes(user?.uid || '') ? theme.error : theme.textSecondary}
                            />
                            <Text style={[styles.actionText, { color: theme.textSecondary, marginLeft: 6 }]}>
                                {post.likes.length}
                            </Text>
                        </TouchableOpacity>
                        <View style={[styles.actionButton, { flexDirection: 'row', alignItems: 'center' }]}>
                            <Ionicons name="chatbubble-outline" size={22} color={theme.textSecondary} />
                            <Text style={[styles.actionText, { color: theme.textSecondary, marginLeft: 6 }]}>
                                {replies.length}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Reply Input */}
                <View style={[styles.replyInputCard, { backgroundColor: theme.card }]}>
                    <TextInput
                        style={[styles.replyInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                        placeholder="Write a reply..."
                        placeholderTextColor={theme.textSecondary}
                        value={newReply}
                        onChangeText={setNewReply}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[styles.replyButton, { backgroundColor: theme.primary }]}
                        onPress={handleCreateReply}
                        disabled={loading || !newReply.trim()}
                    >
                        <Text style={styles.replyButtonText}>Reply</Text>
                    </TouchableOpacity>
                </View>

                {/* Replies */}
                <View style={styles.repliesSection}>
                    <Text style={[styles.repliesTitle, { color: theme.text }]}>
                        Replies ({replies.length})
                    </Text>

                    {replies.map((reply) => (
                        <View key={reply.id} style={[styles.replyCard, { backgroundColor: theme.card }]}>
                            <TouchableOpacity onLongPress={() => reply.authorId === user?.uid && handleDeleteReply(reply.id)}>
                                <View style={styles.replyHeader}>
                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center' }}
                                        onPress={() => navigation.navigate('UserProfile', { userId: reply.authorId })}
                                    >
                                        {reply.profilePicture ? (
                                            <Image source={{ uri: reply.profilePicture }} style={styles.replyAvatar} />
                                        ) : (
                                            <View style={[styles.replyAvatarPlaceholder, { backgroundColor: theme.primary }]}>
                                                <Text style={styles.replyAvatarText}>{reply.username[0].toUpperCase()}</Text>
                                            </View>
                                        )}
                                        <View style={styles.replyInfo}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <Text style={[styles.replyUsername, { color: theme.text }]}>{reply.username}</Text>
                                                {isOwner(reply.authorId) && <OwnerBadge size={12} />}
                                            </View>
                                            <Text style={[styles.replyTimestamp, { color: theme.textSecondary }]}>
                                                {formatTime(reply.timestamp)}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                <Text style={[styles.replyText, { color: theme.text }]}>{reply.contentText}</Text>

                                {reply.contentImage && (
                                    <Image source={{ uri: reply.contentImage }} style={styles.replyImage} />
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.replyLikeButton, { flexDirection: 'row', alignItems: 'center' }]}
                                onPress={() => handleLikeReply(reply)}
                            >
                                <Ionicons
                                    name={reply.likes.includes(user?.uid || '') ? "heart" : "heart-outline"}
                                    size={16}
                                    color={reply.likes.includes(user?.uid || '') ? theme.error : theme.textSecondary}
                                />
                                <Text style={[styles.replyLikeText, { color: theme.textSecondary, marginLeft: 4 }]}>
                                    {reply.likes.length}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}

                    {replies.length === 0 && (
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                            No replies yet. Be the first to reply!
                        </Text>
                    )}
                </View>
            </ScrollView>
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
    postCard: {
        margin: 15,
        padding: 15,
        borderRadius: 12,
    },
    postHeader: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    postInfo: {
        marginLeft: 10,
        justifyContent: 'center',
    },
    username: {
        fontSize: 16,
        fontWeight: '600',
    },
    timestamp: {
        fontSize: 12,
    },
    postText: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 10,
    },
    postImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 10,
    },
    actions: {
        flexDirection: 'row',
        paddingTop: 10,
        borderTopWidth: 1,
    },
    actionButton: {
        marginRight: 20,
    },
    actionText: {
        fontSize: 14,
    },
    replyInputCard: {
        margin: 15,
        marginTop: 0,
        padding: 15,
        borderRadius: 12,
    },
    replyInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        minHeight: 60,
        textAlignVertical: 'top',
        marginBottom: 10,
    },
    replyButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    replyButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    repliesSection: {
        padding: 15,
        paddingTop: 0,
    },
    repliesTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
    },
    replyCard: {
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
    },
    replyHeader: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    replyAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    replyAvatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    replyAvatarText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    replyInfo: {
        marginLeft: 8,
        justifyContent: 'center',
    },
    replyUsername: {
        fontSize: 14,
        fontWeight: '600',
    },
    replyTimestamp: {
        fontSize: 11,
    },
    replyText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    replyImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginBottom: 8,
    },
    replyLikeButton: {
        alignSelf: 'flex-start',
    },
    replyLikeText: {
        fontSize: 13,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
        marginTop: 20,
    },
});
