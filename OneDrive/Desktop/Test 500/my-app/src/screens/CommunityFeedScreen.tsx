import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { getPosts, likePost, unlikePost, deletePost } from '../services/socialService';
import { getPendingFriendRequests } from '../services/friendService';
import { Post, Resource } from '../types';
import { showAlert, showConfirm } from '../utils/alerts';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import OwnerBadge, { isOwner } from '../components/OwnerBadge';
import { fetchResources, addResource, voteResource } from '../services/resourceService';
import * as Linking from 'expo-linking';

export default function CommunityFeedScreen({ navigation, showHeader = true }: { navigation: any, showHeader?: boolean }) {
  const { theme, currentTheme } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'resources'>('feed');

  // Feed State
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Resources State
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [resModalVisible, setResModalVisible] = useState(false);

  // Resource Form
  const [newResCode, setNewResCode] = useState('');
  const [newResTitle, setNewResTitle] = useState('');
  const [newResLink, setNewResLink] = useState('');
  const [newResDesc, setNewResDesc] = useState('');
  const [submittingRes, setSubmittingRes] = useState(false);

  // Lightbox state
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxImage, setLightboxImage] = useState('');

  const loadPosts = async () => {
    try {
      const postsData = await getPosts(20);
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading posts:', error);
      showAlert('Error', 'Failed to load posts');
    } finally {
      if (activeTab === 'feed') setLoading(false);
    }
  };

  const loadResources = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'resources'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
      setResources(data);
      setFilteredResources(data);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationCount = async () => {
    if (!user?.uid) return;
    try {
      const friendRequests = await getPendingFriendRequests(user.uid);

      const notificationsRef = collection(db, 'notifications');
      const notifQuery = query(notificationsRef, where('userId', '==', user.uid), where('read', '==', false));
      const notifSnapshot = await getDocs(notifQuery);

      setNotificationCount(friendRequests.length + notifSnapshot.size);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleAddResource = async () => {
    if (!newResCode || !newResTitle || !newResLink || !user) {
      Alert.alert('Error', 'Please fill in all required fields (Code, Title, Link)');
      return;
    }

    try {
      setSubmittingRes(true);
      await addResource({
        courseCode: newResCode,
        title: newResTitle,
        link: newResLink,
        description: newResDesc,
        uploadedBy: user.uid,
        uploadedByName: (user as any).displayName || 'Student',
      });
      setResModalVisible(false);
      setNewResCode('');
      setNewResTitle('');
      setNewResLink('');
      setNewResDesc('');
      loadResources();
      Alert.alert('Success', 'Resource shared successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add resource');
    } finally {
      setSubmittingRes(false);
    }
  };

  const filterResources = (text: string) => {
    setSearchQuery(text);
    if (!text) {
      setFilteredResources(resources);
      return;
    }
    const lower = text.toLowerCase();
    const filtered = resources.filter(r =>
      r.title.toLowerCase().includes(lower) ||
      r.courseCode.toLowerCase().includes(lower) ||
      (r.description && r.description.toLowerCase().includes(lower))
    );
    setFilteredResources(filtered);
  };

  const handleVoteResource = async (id: string, value: number) => {
    // Optimistic update
    setResources(prev => prev.map(r => r.id === id ? { ...r, votes: r.votes + value } : r));
    setFilteredResources(prev => prev.map(r => r.id === id ? { ...r, votes: r.votes + value } : r));
    await voteResource(id, value);
  };

  useEffect(() => {
    if (activeTab === 'feed') {
      setLoading(true);
      loadPosts().then(() => setLoading(false));
    } else {
      loadResources();
    }
    loadNotificationCount();
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'feed') {
      await loadPosts();
    } else {
      await loadResources();
    }
    await loadNotificationCount();
    setRefreshing(false);
  };

  const handleLikePost = async (postId: string, isLiked: boolean) => {
    if (!user?.uid) return;

    try {
      if (isLiked) {
        await unlikePost(postId, user.uid);
      } else {
        await likePost(postId, user.uid);
      }
      await loadPosts();
    } catch (error) {
      console.error('Error liking post:', error);
      showAlert('Error', 'Failed to like post');
    }
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

  const handleDeletePost = async (postId: string) => {
    showConfirm(
      'Delete Post',
      'Are you sure you want to delete this post?',
      async () => {
        try {
          await deletePost(postId);
          await loadPosts();
          showAlert('Success', 'Post deleted successfully');
        } catch (error) {
          console.error('Error deleting post:', error);
          showAlert('Error', 'Failed to delete post');
        }
      },
      () => console.log('Delete cancelled')
    );
  };

  const renderPost = ({ item }: { item: Post }) => {
    const isLiked = item.likes.includes(user?.uid || '');
    const isAuthor = item.authorId === user?.uid;

    return (
      <View style={[styles.postCard, { backgroundColor: theme.card }]}>
        <View style={styles.postHeader}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
            onPress={() => navigation.navigate('UserProfile', { userId: item.authorId })}
          >
            {item.profilePicture ? (
              <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                <Text style={styles.avatarText}>{item.username[0].toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.postInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.username, { color: theme.text }]}>{item.username}</Text>
                {isOwner(item.authorId) && <OwnerBadge size={14} />}
              </View>
              <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
                {formatTime(item.timestamp)}
              </Text>
            </View>
          </TouchableOpacity>
          {isAuthor && (
            <TouchableOpacity
              onPress={() => handleDeletePost(item.id)}
            >
              <Ionicons name="trash-outline" size={20} color={theme.error} />
            </TouchableOpacity>
          )}
        </View>

        {item.contentText && (
          <Text style={[styles.postText, { color: theme.text }]}>{item.contentText}</Text>
        )}

        {item.contentImage && (
          <TouchableOpacity onPress={() => { setLightboxImage(item.contentImage || ''); setLightboxVisible(true); }}>
            <Image
              source={{ uri: item.contentImage }}
              style={styles.postImage}
              onError={(error) => console.log('Image load error:', error.nativeEvent.error)}
            />
          </TouchableOpacity>
        )}

        <View style={[styles.actions, { borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.actionButton, isLiked && { backgroundColor: theme.error + '20' }]}
            onPress={() => handleLikePost(item.id, isLiked)}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={20}
              color={isLiked ? theme.error : theme.textSecondary}
            />
            <Text style={[styles.actionText, { color: isLiked ? theme.error : theme.textSecondary, marginLeft: 6 }]}>
              {item.likes.length}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
          >
            <Ionicons name="chatbubble-outline" size={20} color={theme.textSecondary} />
            <Text style={[styles.actionText, { color: theme.textSecondary, marginLeft: 6 }]}>
              {item.replies.length}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {showHeader && (
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <Text style={styles.headerTitle}>Community</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => navigation.navigate('UserSearch')}
            >
              <Ionicons name="search-outline" size={24} color="#FFF" />
            </TouchableOpacity>
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
          </View>
        </View>
      )}

      {/* No nested tabs anymore */}

      {loading && !refreshing ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
              <Text style={{ textAlign: 'center', color: theme.textSecondary }}>
                No posts yet. Be the first to share!
              </Text>
            </View>
          }
        />
      )}

      {/* Image Lightbox Modal */}
      <Modal
        visible={lightboxVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLightboxVisible(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.95)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setLightboxVisible(false)}
        >
          <Image
            source={{ uri: lightboxImage }}
            style={{ width: '95%', height: '95%' }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  postCard: {
    marginBottom: 20,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  postInfo: {
    marginLeft: 12,
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 6,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 2,
  },
  postText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    borderRadius: 5,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15
  },
  headerIcon: {
    padding: 5
  }
});