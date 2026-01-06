import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../context/AuthContext'; // Use useAuth instead of direct auth import
import { getUserProfile, updateUserProfile, createUserProfile, searchUsersByUsername } from '../services/socialService';
import * as ImagePicker from 'expo-image-picker';
import { compressProfilePicture, imageToBase64 } from '../utils/imageCompression';
import * as ImageManipulator from 'expo-image-manipulator';

export default function ProfileSettingsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth(); // Get user from context
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [user]); // Reload when user changes

  const loadProfile = async () => {
    if (!user?.uid) {
      setLoading(false); // Ensure loading stops if no user
      return;
    }

    try {
      let profile = await getUserProfile(user.uid);

      // Create profile if doesn't exist
      if (!profile) {
        profile = await createUserProfile(
          user.uid,
          (user as any).email?.split('@')[0] || 'user',
          (user as any).email || ''
        );
      }

      setUsername(profile.username || '');
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setAboutMe(profile.aboutMe || '');
      setProfilePicture(profile.profilePicture || '');
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const validateUsername = (name: string): boolean => {
    // Alphanumeric and underscores only, max 20 chars
    const regex = /^[a-zA-Z0-9_]{1,20}$/;
    return regex.test(name);
  };

  const checkUsernameUnique = async (name: string): Promise<boolean> => {
    if (!user?.uid) return false;

    const users = await searchUsersByUsername(name);
    const existingUser = users.find(u => u.username === name && u.uid !== user.uid);
    return !existingUser;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1, // Get full quality, we'll compress it
    });

    if (!result.canceled && result.assets[0].uri) {
      try {
        setLoading(true);
        // Use compression utility
        const compressedUri = await compressProfilePicture(result.assets[0].uri);
        const base64Image = await imageToBase64(compressedUri, 300, 0.7);
        setProfilePicture(base64Image);
      } catch (error) {
        console.error('Error processing image:', error);
        Alert.alert('Error', 'Failed to process image');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    if (!username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }

    if (!validateUsername(username)) {
      Alert.alert('Error', 'Username must be alphanumeric and underscores only, max 20 characters');
      return;
    }

    // Check if username is unique
    const isUnique = await checkUsernameUnique(username);
    if (!isUnique) {
      Alert.alert('Error', 'Username is already taken. Please choose another.');
      return;
    }

    // Confirmation dialog before saving
    Alert.alert(
      'Save Changes',
      'Are you sure you want to save these profile changes?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async () => {
            try {
              await updateUserProfile(user.uid, {
                username,
                displayName,
                bio,
                aboutMe,
                profilePicture,
              });

              Alert.alert('Success', 'Profile updated successfully!');
            } catch (error) {
              console.error('Error updating profile:', error);
              Alert.alert('Error', 'Failed to update profile');
            }
          }
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Edit Profile</Text>

        <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
          {profilePicture ? (
            <Image source={{ uri: profilePicture }} style={styles.profileImage} />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: theme.primary }]}>
              <Text style={styles.imagePlaceholderText}>
                {username ? username[0].toUpperCase() : 'U'}
              </Text>
            </View>
          )}
          <Text style={[styles.changePhotoText, { color: theme.primary }]}>Change Photo</Text>
        </TouchableOpacity>

        <Text style={[styles.label, { color: theme.text }]}>Username *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
          value={username}
          onChangeText={setUsername}
          placeholder="Enter username"
          placeholderTextColor={theme.textSecondary}
          maxLength={20}
        />
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          Alphanumeric and underscores only, max 20 characters
        </Text>

        <Text style={[styles.label, { color: theme.text }]}>Display Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Enter display name"
          placeholderTextColor={theme.textSecondary}
        />

        <Text style={[styles.label, { color: theme.text }]}>Bio (Short)</Text>
        <TextInput
          style={[styles.input, styles.bioInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
          value={bio}
          onChangeText={setBio}
          placeholder="Short bio (e.g. CS Student @ MIT)"
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={2}
          maxLength={100}
        />

        <Text style={[styles.label, { color: theme.text }]}>About Me (Detailed)</Text>
        <TextInput
          style={[styles.input, styles.aboutMeInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
          value={aboutMe}
          onChangeText={setAboutMe}
          placeholder="Tell us more about yourself, your interests, and what you're studying..."
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={6}
          maxLength={500}
        />

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 48,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  changePhotoText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 5,
  },
  bioInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  aboutMeInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    marginBottom: 10,
  },
  saveButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
