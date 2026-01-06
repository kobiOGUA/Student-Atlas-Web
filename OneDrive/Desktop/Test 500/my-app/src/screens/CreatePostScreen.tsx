import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { createPost } from '../services/socialService';
import { getUserProfile } from '../services/socialService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function CreatePostScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImage(base64Image);
    }
  };

  const handleCreatePost = async () => {
    if (!user?.uid || (!content.trim() && !image)) {
      Alert.alert('Error', 'Please add some content or an image to your post');
      return;
    }

    setLoading(true);
    try {
      const userProfile = await getUserProfile(user.uid);
      const username = userProfile?.username || userProfile?.email || 'Anonymous';

      await createPost(
        user.uid,
        username,
        userProfile?.profilePicture,
        content.trim() || undefined,
        undefined, // contentLink
        image || undefined
      );

      setContent('');
      setImage(null);
      navigation.goBack();
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity
          onPress={handleCreatePost}
          disabled={loading || (!content.trim() && !image)}
          style={styles.postButton}
        >
          <Text style={[styles.postButtonText, { opacity: loading || (!content.trim() && !image) ? 0.5 : 1 }]}>
            Post
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
          <TextInput
            style={[styles.textInput, { color: theme.text }]}
            placeholder="What's on your mind?"
            placeholderTextColor={theme.textSecondary}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={500}
          />
        </View>

        {image && (
          <View style={styles.imageContainer}>
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setImage(null)}
            >
              <Ionicons name="close-circle" size={24} color={theme.error} />
            </TouchableOpacity>
            <Image source={{ uri: image }} style={styles.selectedImage} />
          </View>
        )}

        <TouchableOpacity style={[styles.imageButton, { backgroundColor: theme.surface }]} onPress={pickImage}>
          <Ionicons name="image-outline" size={24} color={theme.text} />
          <Text style={[styles.buttonText, { color: theme.text }]}>Add Image</Text>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    padding: 15,
    paddingTop: 50,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  postButton: {
    padding: 10,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  inputContainer: {
    borderRadius: 12,
    padding: 15,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 22,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  imageContainer: {
    position: 'relative',
    marginVertical: 15,
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});