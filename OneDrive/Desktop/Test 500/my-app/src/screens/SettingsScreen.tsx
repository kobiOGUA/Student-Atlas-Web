import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { clearAuthData } from '../utils/storage';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { useTheme } from '../utils/ThemeContext';
import { ThemeType } from '../types';
import { THEME_NAMES, APP_INFO } from '../constants';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { theme, currentTheme, setTheme } = useTheme();
  const navigation = useNavigation<any>();
  const { signOut, userEmail } = useAuth();

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      // Use browser confirmation for web
      if (window.confirm('Are you sure you want to logout?')) {
        try {
          await signOut();
        } catch (error) {
          console.error('Error during logout:', error);
        }
      }
    } else {
      // Use native Alert for mobile
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error during logout:', error);
            }
          },
        },
      ]);
    }
  };

  const themes: ThemeType[] = ['default', 'dark', 'blue', 'lightPink', 'light'];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.card }]}
            onPress={() => navigation.navigate('ProfileSettings')}
          >
            <Text style={[styles.buttonText, { color: theme.text }]}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.card }]}
            onPress={() => navigation.navigate('ChangePINUtility')}
          >
            <Text style={[styles.buttonText, { color: theme.text }]}>Change PIN</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Theme</Text>
          {themes.map((themeName) => (
            <TouchableOpacity
              key={themeName}
              style={[
                styles.themeOption,
                { backgroundColor: theme.card, borderColor: theme.border },
                currentTheme === themeName && { borderColor: theme.primary, borderWidth: 2 },
              ]}
              onPress={() => setTheme(themeName)}
            >
              <Text style={[styles.themeText, { color: theme.text }]}>
                {THEME_NAMES[themeName]}
              </Text>
              {currentTheme === themeName && (
                <Text style={[styles.checkMark, { color: theme.primary }]}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
          <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.appName, { color: theme.text }]}>{APP_INFO.name}</Text>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Version {APP_INFO.version}
            </Text>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              By {APP_INFO.developer}
            </Text>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              {APP_INFO.university}
            </Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {APP_INFO.description}
            </Text>
            <Text style={[styles.story, { color: theme.textSecondary }]}>
              {APP_INFO.story}
            </Text>
            <Text style={[styles.note, { color: theme.warning }]}>
              {APP_INFO.note}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.error }]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Logout</Text>
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
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    padding: 15,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  themeText: {
    fontSize: 16,
  },
  checkMark: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoCard: {
    padding: 20,
    borderRadius: 12,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    marginTop: 15,
    marginBottom: 10,
    lineHeight: 20,
  },
  story: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 10,
    lineHeight: 18,
  },
  note: {
    fontSize: 12,
    marginTop: 10,
    fontStyle: 'italic',
  },
  logoutButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
