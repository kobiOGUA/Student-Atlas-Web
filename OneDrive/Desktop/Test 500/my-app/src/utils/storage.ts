import AsyncStorage from '@react-native-async-storage/async-storage';

// Save user ID (or any user info)
export const saveUserId = async (userId: string) => {
  console.log('Saving userId to AsyncStorage:', userId);
  try {
    await AsyncStorage.setItem('userId', userId);
  } catch (error) {
    console.error('Error saving userId to AsyncStorage:', error);
  }
};

// Get user ID
export const getUserId = async (): Promise<string | null> => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    console.log('Getting userId from AsyncStorage:', userId);
    return userId;
  } catch (error) {
    console.error('Error getting userId from AsyncStorage:', error);
    return null;
  }
};

// Save user email
export const saveUserEmail = async (email: string) => {
  console.log('Saving userEmail to AsyncStorage:', email);
  try {
    await AsyncStorage.setItem('userEmail', email);
  } catch (error) {
    console.error('Error saving userEmail to AsyncStorage:', error);
  }
};

// Get user email
export const getUserEmail = async (): Promise<string | null> => {
  try {
    const email = await AsyncStorage.getItem('userEmail');
    console.log('Getting userEmail from AsyncStorage:', email);
    return email;
  } catch (error) {
    console.error('Error getting userEmail from AsyncStorage:', error);
    return null;
  }
};

// Remove all auth data on logout
export const clearAuthData = async () => {
  console.log('Clearing auth data from AsyncStorage');
  try {
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('userEmail');
    await AsyncStorage.removeItem('biometricEnabled');
  } catch (error) {
    console.error('Error clearing auth data from AsyncStorage:', error);
  }
};

// Save biometric preference
export const saveBiometricPreference = async (enabled: boolean) => {
  try {
    await AsyncStorage.setItem('biometricEnabled', enabled.toString());
  } catch (error) {
    console.error('Error saving biometric preference:', error);
  }
};

// Get biometric preference
export const getBiometricPreference = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem('biometricEnabled');
    return value === 'true';
  } catch (error) {
    console.error('Error getting biometric preference:', error);
    return false;
  }
};

// Save last login timestamp
export const saveLastLogin = async () => {
  try {
    await AsyncStorage.setItem('lastLogin', Date.now().toString());
  } catch (error) {
    console.error('Error saving last login:', error);
  }
};

// Get last login timestamp
export const getLastLogin = async (): Promise<number | null> => {
  try {
    const value = await AsyncStorage.getItem('lastLogin');
    return value ? parseInt(value, 10) : null;
  } catch (error) {
    console.error('Error getting last login:', error);
    return null;
  }
};

