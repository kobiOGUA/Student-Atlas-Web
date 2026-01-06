import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { registerWithPIN, loginWithPIN } from '../services/authService';
import Numpad from '../components/Numpad';
import PINDisplay from '../components/PINDisplay';
import { useAuth } from '../context/AuthContext';

// Explicit modes to avoid confusion between login PIN and register PIN
type AuthMode = 'loginEmail' | 'registerEmail' | 'loginPIN' | 'registerPIN' | 'confirmPIN';

export default function PINLoginScreen() {
  const { theme } = useTheme();
  const { signIn, userEmail: storedEmail } = useAuth();

  // If stored email exists, we go straight to login PIN entry
  const [authMode, setAuthMode] = useState<AuthMode>(storedEmail ? 'loginPIN' : 'loginEmail');
  const [email, setEmail] = useState(storedEmail || '');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset UI when storedEmail changes (e.g., after logout)
  useEffect(() => {
    if (storedEmail) {
      setEmail(storedEmail);
      setAuthMode('loginPIN');
    } else {
      setEmail('');
      setAuthMode('loginEmail');
    }
    setError(null);
    setPin('');
    setConfirmPin('');
  }, [storedEmail]);

  // Helper to check if we are in a login flow (vs registration)
  const isLoginFlow = () => authMode === 'loginEmail' || authMode === 'loginPIN';

  // ----- Handlers -----------------------------------------------------
  const handleNumberPress = (num: string) => {
    setError(null); // Clear error on input
    if ((authMode === 'loginPIN' || authMode === 'registerPIN') && pin.length < 4) {
      setPin(pin + num);
    } else if (authMode === 'confirmPIN' && confirmPin.length < 4) {
      setConfirmPin(confirmPin + num);
    }
  };

  const handleBackspace = () => {
    setError(null);
    if (authMode === 'loginPIN' || authMode === 'registerPIN') {
      setPin(pin.slice(0, -1));
    } else if (authMode === 'confirmPIN') {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const handleClear = () => {
    setError(null);
    if (authMode === 'loginPIN' || authMode === 'registerPIN') {
      setPin('');
    } else if (authMode === 'confirmPIN') {
      setConfirmPin('');
    }
  };

  const handleLogin = async () => {
    if (pin.length !== 4) return;
    setLoading(true);
    setError(null);
    try {
      const result = await loginWithPIN(email, pin);
      if (!result.success) {
        if (result.error === 'AUTH_RECORD_MISSING') {
          // Special recovery case: User exists but no auth record.
          // Switch to confirmPIN to treat this as a registration/recovery.
          setAuthMode('confirmPIN');
          setError('Account needs recovery. Please confirm your PIN.');
        } else {
          setError(result.error || 'Invalid email or PIN');
          setPin('');
        }
        setLoading(false);
      } else if (result.userId) {
        await signIn(result.userId, email);
        // component will unmount
      }
    } catch (e: any) {
      setError(e.message || 'Login failed');
      setPin('');
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (pin.length !== 4 || confirmPin.length !== 4) return;
    if (pin !== confirmPin) {
      setError('PINs do not match');
      setPin('');
      setConfirmPin('');
      setAuthMode('registerPIN');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await registerWithPIN(email, pin, username);
      if (!result.success) {
        setError(result.error || 'Registration failed');
        setPin('');
        setConfirmPin('');
        setAuthMode('registerPIN');
        setLoading(false);
      } else if (result.userId) {
        Alert.alert('Success', 'Account created successfully!');
        await signIn(result.userId, email);
      }
    } catch (e: any) {
      setError(e.message || 'Registration failed');
      setPin('');
      setConfirmPin('');
      setAuthMode('registerPIN');
      setLoading(false);
    }
  };

  // Auto-submit when PIN entry is complete
  useEffect(() => {
    if (pin.length === 4) {
      if (authMode === 'loginPIN') {
        handleLogin();
      } else if (authMode === 'registerPIN') {
        // Move to confirmation step
        setAuthMode('confirmPIN');
      }
    }
  }, [pin, authMode]);

  // Auto-submit when confirm PIN is complete
  useEffect(() => {
    if (authMode === 'confirmPIN' && confirmPin.length === 4) {
      handleRegister();
    }
  }, [confirmPin, authMode]);

  const handleEmailSubmit = () => {
    setError(null);
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (authMode === 'registerEmail' && !username) {
      setError('Please enter a username');
      return;
    }

    // Transition to the appropriate PIN screen
    if (authMode === 'loginEmail') {
      setAuthMode('loginPIN');
    } else {
      setAuthMode('registerPIN');
    }
  };

  const resetToEmailEntry = () => {
    setError(null);
    setPin('');
    setConfirmPin('');
    setAuthMode(isLoginFlow() ? 'loginEmail' : 'registerEmail');
  };

  const toggleAuthMode = () => {
    setError(null);
    setEmail('');
    setUsername('');
    setPin('');
    setConfirmPin('');
    // Switch between login email and register email
    setAuthMode(authMode === 'loginEmail' ? 'registerEmail' : 'loginEmail');
  };

  // ----- Render helpers ------------------------------------------------
  const renderEmailEntry = () => (
    <View style={styles.form}>
      <Text style={[styles.title, { color: theme.text }]}>
        {authMode === 'loginEmail' ? 'Welcome Back!' : 'Create Account'}
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        {authMode === 'loginEmail' ? 'Login to your account' : 'Register a new account'}
      </Text>

      <TextInput
        style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
        placeholder="Email"
        placeholderTextColor={theme.textSecondary}
        value={email}
        onChangeText={(text) => { setEmail(text); setError(null); }}
        autoCapitalize="none"
        keyboardType="email-address"
        autoFocus
      />

      {authMode === 'registerEmail' && (
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
          placeholder="Username"
          placeholderTextColor={theme.textSecondary}
          value={username}
          onChangeText={(text) => { setUsername(text); setError(null); }}
          autoCapitalize="none"
        />
      )}

      {error && <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>}

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleEmailSubmit}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.switchButton} onPress={toggleAuthMode}>
        <Text style={[styles.switchText, { color: theme.primary }]}>
          {authMode === 'loginEmail' ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPINEntry = () => {
    let title = 'Enter PIN';
    let subtitle = 'Enter your 4-digit PIN';

    if (authMode === 'confirmPIN') {
      title = 'Confirm PIN';
      subtitle = 'Re-enter your 4-digit PIN';
    } else if (authMode === 'registerPIN') {
      title = 'Create PIN';
      subtitle = 'Create a 4-digit PIN';
    }

    return (
      <View style={styles.pinContainer}>
        <TouchableOpacity onPress={resetToEmailEntry} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: theme.primary }]}>← Back</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>

        <PINDisplay pin={authMode === 'confirmPIN' ? confirmPin : pin} theme={theme} />

        {error && <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <Numpad onNumberPress={handleNumberPress} onBackspace={handleBackspace} onClear={handleClear} theme={theme} />
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header} />
        {(authMode === 'loginEmail' || authMode === 'registerEmail') ? renderEmailEntry() : renderPINEntry()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 30 },
  form: { width: '100%' },
  input: { height: 50, borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, fontSize: 16 },
  button: { height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  switchButton: { marginTop: 20, padding: 10 },
  switchText: { textAlign: 'center', fontSize: 14 },
  pinContainer: { width: '100%', alignItems: 'center' },
  backButton: { alignSelf: 'flex-start', marginBottom: 20 },
  backButtonText: { fontSize: 16, fontWeight: '600' },
  loadingContainer: { height: 400, justifyContent: 'center', alignItems: 'center' },
  errorText: { textAlign: 'center', marginBottom: 15, fontSize: 14, fontWeight: '600' },
});
