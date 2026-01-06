import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/firebaseConfig';
import { showAlert, showConfirm } from '../utils/alerts';

export default function CommunityNotificationScreen({ navigation }: any) {
    const { theme } = useTheme();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const sendNotification = async () => {
        if (!title.trim() || !message.trim()) {
            showAlert('Error', 'Please enter both title and message');
            return;
        }

        showConfirm(
            'Confirm',
            `Send notification to ALL users?\n\nTitle: ${title}\nMessage: ${message}`,
            async () => {
                setLoading(true);
                try {
                    const sendCommunityNotification = httpsCallable(functions, 'sendCommunityNotification');
                    const result = await sendCommunityNotification({ title, message });

                    showAlert(
                        'Success',
                        `Notification sent to ${(result.data as any).notificationCount} users!`,
                        () => navigation.goBack()
                    );

                    setTitle('');
                    setMessage('');
                } catch (error: any) {
                    console.error('Error sending notification:', error);
                    showAlert('Error', error.message || 'Failed to send notification');
                } finally {
                    setLoading(false);
                }
            }
        );
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.title, { color: theme.text }]}>Send Community Notification</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    This will send a notification to ALL users of the app
                </Text>

                <Text style={[styles.label, { color: theme.text }]}>Title:</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Notification title"
                    placeholderTextColor={theme.textSecondary}
                />

                <Text style={[styles.label, { color: theme.text }]}>Message:</Text>
                <TextInput
                    style={[styles.textArea, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Notification message"
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    numberOfLines={4}
                />

                <TouchableOpacity
                    style={[styles.sendButton, { backgroundColor: theme.primary }]}
                    onPress={sendNotification}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.sendButtonText}>Send to All Users</Text>
                    )}
                </TouchableOpacity>

                <Text style={[styles.warning, { color: theme.error }]}>
                    ⚠️ This action cannot be undone. The notification will be sent to every user immediately.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
    },
    card: {
        padding: 20,
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    sendButton: {
        marginTop: 24,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    warning: {
        fontSize: 12,
        marginTop: 16,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
