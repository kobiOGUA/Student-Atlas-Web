import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Image,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { sendMessage, getMessages, markMessagesAsRead, deleteMessage } from '../services/messagingService';
import { ChatMessage, User } from '../types';
import { Ionicons } from '@expo/vector-icons';
import OwnerBadge, { isOwner } from '../components/OwnerBadge';

export default function MessagingScreen({ route, navigation }: any) {
    const { theme } = useTheme();
    const { user } = useAuth();
    const { otherUser } = route.params as { otherUser: User };
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (user?.uid && otherUser.uid) {
            loadMessages();
            // Mark messages as read
            markMessagesAsRead(user.uid, otherUser.uid);

            // Poll for new messages every 3 seconds
            const interval = setInterval(loadMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [user?.uid, otherUser.uid]);

    const loadMessages = async () => {
        if (!user?.uid) return;
        try {
            const msgs = await getMessages(user.uid, otherUser.uid);
            console.log('Loaded messages:', msgs.length);
            setMessages(msgs);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const handleSend = async () => {
        if (!user?.uid || !newMessage.trim()) {
            console.log('Cannot send: user or message missing', { userId: user?.uid, messageLength: newMessage.trim().length });
            return;
        }

        console.log('Sending message from', user.uid, 'to', otherUser.uid);
        setLoading(true);
        try {
            await sendMessage(user.uid, otherUser.uid, newMessage.trim());
            console.log('Message sent successfully');
            setNewMessage('');
            await loadMessages();
            // Scroll to bottom
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (error) {
            console.error('Error sending message:', error);
            Alert.alert('Send Failed', 'Could not send your message. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        }) + ' ' + date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isMine = item.senderId === user?.uid;

        return (
            <View style={[
                styles.messageContainer,
                isMine ? styles.myMessage : styles.theirMessage
            ]}>
                <TouchableOpacity onLongPress={() => isMine && handleDeleteMessage(item.id)}>
                    <View style={[
                        styles.messageBubble,
                        { backgroundColor: isMine ? theme.primary : theme.card }
                    ]}>
                        <Text style={[
                            styles.messageText,
                            { color: isMine ? '#FFFFFF' : theme.text }
                        ]}>
                            {item.text}
                        </Text>
                        <View style={styles.messageFooter}>
                            <Text style={[
                                styles.messageTime,
                                { color: isMine ? 'rgba(255,255,255,0.7)' : theme.textSecondary }
                            ]}>
                                {formatTime(item.timestamp)}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!user?.uid) return;

        Alert.alert(
            'Delete Message',
            'Are you sure you want to delete this message?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    onPress: async () => {
                        try {
                            await deleteMessage(messageId);
                            console.log('Message deleted successfully');
                            await loadMessages();
                        } catch (error) {
                            console.error('Error deleting message:', error);
                            Alert.alert('Delete Failed', 'Could not delete your message. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <View style={[styles.header, { backgroundColor: theme.primary }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.headerInfo}
                    onPress={() => navigation.navigate('UserProfile', { userId: otherUser.uid })}
                >
                    {otherUser.profilePicture ? (
                        <Image source={{ uri: otherUser.profilePicture }} style={styles.headerAvatar} />
                    ) : (
                        <View style={[styles.headerAvatarPlaceholder, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                            <Text style={styles.headerAvatarText}>
                                {(otherUser.username || otherUser.email)?.[0]?.toUpperCase() || 'U'}
                            </Text>
                        </View>
                    )}
                    <View style={styles.headerTextContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.headerTitle}>
                                {otherUser.username || otherUser.email}
                            </Text>
                            {isOwner(otherUser.uid) && <OwnerBadge size={14} />}
                        </View>
                        <Text style={styles.headerSubtitle}>
                            {otherUser.lastActive && Date.now() - otherUser.lastActive < 300000
                                ? 'Online'
                                : 'Offline'}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                ListEmptyComponent={
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                        No messages yet. Start the conversation!
                    </Text>
                }
            />

            <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
                    placeholder="Type a message..."
                    placeholderTextColor={theme.textSecondary}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.sendButton, { backgroundColor: theme.primary }]}
                    onPress={handleSend}
                    disabled={loading || !newMessage.trim()}
                >
                    <Ionicons name="send" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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
        marginRight: 10,
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    headerAvatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerAvatarText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
    },
    messagesList: {
        padding: 15,
        flexGrow: 1,
    },
    messageContainer: {
        marginBottom: 12,
        maxWidth: '75%',
    },
    myMessage: {
        alignSelf: 'flex-end',
    },
    theirMessage: {
        alignSelf: 'flex-start',
    },
    messageBubble: {
        padding: 12,
        borderRadius: 16,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    messageTime: {
        fontSize: 11,
        marginTop: 4,
    },

    emptyText: {
        textAlign: 'center',
        fontSize: 16,
        marginTop: 40,
    },

    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderTopWidth: 1,
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
        maxHeight: 100,
        fontSize: 15,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
