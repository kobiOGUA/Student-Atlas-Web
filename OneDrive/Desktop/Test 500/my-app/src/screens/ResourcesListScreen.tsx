import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    TextInput,
    Modal,
    Alert,
    RefreshControl,
    Linking,
    Image
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Resource } from '../types';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { addResource, voteResource } from '../services/resourceService';

export default function ResourcesListScreen({ navigation }: any) {
    const { theme, currentTheme } = useTheme();
    const { user } = useAuth();

    const [resources, setResources] = useState<Resource[]>([]);
    const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Lightbox state
    const [lightboxVisible, setLightboxVisible] = useState(false);
    const [lightboxImage, setLightboxImage] = useState('');

    // Modal State
    const [resModalVisible, setResModalVisible] = useState(false);
    const [newResCode, setNewResCode] = useState('');
    const [newResTitle, setNewResTitle] = useState('');
    const [newResLink, setNewResLink] = useState('');
    const [newResDesc, setNewResDesc] = useState('');
    const [submittingRes, setSubmittingRes] = useState(false);

    useEffect(() => {
        loadResources();
    }, []);

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

    const onRefresh = async () => {
        setRefreshing(true);
        await loadResources();
        setRefreshing(false);
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
        setResources(prev => prev.map(r => r.id === id ? { ...r, votes: (r.votes || 0) + value } : r));
        setFilteredResources(prev => prev.map(r => r.id === id ? { ...r, votes: (r.votes || 0) + value } : r));
        try {
            await voteResource(id, value);
        } catch (error) {
            console.error("Vote failed", error);
            // Revert if needed, but keeping simple for now
        }
    };

    const handleAddResource = async () => {
        if (!newResCode || !newResTitle || !newResLink || !user) {
            Alert.alert('Error', 'Please fill in required fields (Code, Title, Link)');
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

    const renderResource = ({ item }: { item: Resource }) => (
        <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <View style={{ backgroundColor: theme.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginRight: 8 }}>
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>{item.courseCode}</Text>
                        </View>
                        <Text style={{ fontSize: 12, color: theme.textSecondary }}>{new Date(item.timestamp).toLocaleDateString()}</Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 4 }}>{item.title}</Text>
                    {item.description ? <Text style={{ color: theme.textSecondary, marginBottom: 8, fontSize: 14 }}>{item.description}</Text> : null}

                    {/* Display based on resource type */}
                    {item.type === 'image' && item.imageData ? (
                        <TouchableOpacity onPress={() => { setLightboxImage(item.imageData || ''); setLightboxVisible(true); }} style={{ marginVertical: 8 }}>
                            <Image
                                source={{ uri: item.imageData }}
                                style={{ width: '100%', height: 200, borderRadius: 8 }}
                                resizeMode="cover"
                            />
                        </TouchableOpacity>
                    ) : item.type === 'file' && item.fileData ? (
                        <View style={{ backgroundColor: theme.surface, padding: 12, borderRadius: 8, marginVertical: 8, flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="document-text-outline" size={24} color={theme.primary} style={{ marginRight: 12 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontWeight: 'bold', color: theme.text }}>{item.fileName || 'Document'}</Text>
                                <Text style={{ fontSize: 12, color: theme.textSecondary }}>{item.fileSize || 'File'}</Text>
                            </View>
                            <TouchableOpacity onPress={() => item.fileData && Linking.openURL(item.fileData)} style={{ marginRight: 12 }}>
                                <Ionicons name="eye-outline" size={24} color={theme.primary} />
                            </TouchableOpacity>
                        </View>
                    ) : item.link ? (
                        <TouchableOpacity onPress={() => item.link && Linking.openURL(item.link)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ color: theme.primary, fontWeight: '600', marginRight: 4 }}>Open Link</Text>
                            <Ionicons name="open-outline" size={16} color={theme.primary} />
                        </TouchableOpacity>
                    ) : null}
                </View>
                <View style={{ alignItems: 'center', marginLeft: 16 }}>
                    <TouchableOpacity onPress={() => handleVoteResource(item.id, 1)} style={{ padding: 4 }}>
                        <Ionicons name="caret-up" size={24} color={theme.primary} />
                    </TouchableOpacity>
                    <Text style={{ fontWeight: 'bold', color: theme.text, fontSize: 16 }}>{item.votes || 0}</Text>
                    <TouchableOpacity onPress={() => handleVoteResource(item.id, -1)} style={{ padding: 4 }}>
                        <Ionicons name="caret-down" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                {item.uploadedByProfilePicture ? (
                    <Image
                        source={{ uri: item.uploadedByProfilePicture }}
                        style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }}
                    />
                ) : (
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#444', marginRight: 8, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="person" size={14} color="#ccc" />
                    </View>
                )}
                <Text style={{ fontSize: 10, color: theme.textSecondary }}>Shared by {item.uploadedByName}</Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={{ padding: 16 }}>
                <TextInput
                    style={{
                        backgroundColor: currentTheme === 'dark' ? '#333' : '#f5f5f5',
                        color: theme.text,
                        padding: 12,
                        borderRadius: 8,
                    }}
                    placeholder="Search resources by code, title..."
                    placeholderTextColor={theme.textSecondary}
                    value={searchQuery}
                    onChangeText={filterResources}
                />
            </View>

            {loading && !refreshing ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredResources}
                    renderItem={renderResource}
                    keyExtractor={item => item.id}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
                    contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 16 }}
                    ListEmptyComponent={
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
                            <Text style={{ color: theme.textSecondary }}>No resources found. Upload one!</Text>
                        </View>
                    }
                />
            )}

            {/* FAB */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.primary }]}
                onPress={() => setResModalVisible(true)}
            >
                <Ionicons name="add" size={32} color="white" />
            </TouchableOpacity>

            {/* Modal */}
            <Modal
                visible={resModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setResModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Upload Resource</Text>
                        <TextInput
                            placeholder="Course Code (e.g. CSC 201)"
                            placeholderTextColor={theme.textSecondary}
                            value={newResCode}
                            onChangeText={setNewResCode}
                            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                        />
                        <TextInput
                            placeholder="Resource Title"
                            placeholderTextColor={theme.textSecondary}
                            value={newResTitle}
                            onChangeText={setNewResTitle}
                            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                        />
                        <TextInput
                            placeholder="Description (Optional)"
                            placeholderTextColor={theme.textSecondary}
                            value={newResDesc}
                            onChangeText={setNewResDesc}
                            multiline
                            numberOfLines={3}
                            style={[styles.input, { backgroundColor: theme.background, color: theme.text, height: 80, textAlignVertical: 'top' }]}
                        />
                        <TextInput
                            placeholder="Link (URL)"
                            placeholderTextColor={theme.textSecondary}
                            value={newResLink}
                            onChangeText={setNewResLink}
                            autoCapitalize="none"
                            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                        />
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setResModalVisible(false)}>
                                <Text style={{ fontWeight: 'bold' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: theme.primary }]} onPress={handleAddResource} disabled={submittingRes}>
                                {submittingRes ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold' }}>Upload</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Image Lightbox Modal */}
            <Modal
                visible={lightboxVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setLightboxVisible(false)}
            >
                <TouchableOpacity
                    style={styles.lightboxContainer}
                    activeOpacity={1}
                    onPress={() => setLightboxVisible(false)}
                >
                    <Image
                        source={{ uri: lightboxImage }}
                        style={styles.lightboxImage}
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
    card: {
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modalContent: {
        width: '90%',
        borderRadius: 12,
        padding: 20
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20
    },
    input: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 12
    },
    cancelBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#ccc',
        alignItems: 'center'
    },
    uploadBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center'
    },
    lightboxContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    lightboxImage: {
        width: '95%',
        height: '95%'
    }
});
