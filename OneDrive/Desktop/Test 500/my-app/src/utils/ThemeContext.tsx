import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ThemeType } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Theme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  card: string;
}

interface ThemeContextType {
  theme: Theme;
  currentTheme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const themes: Record<ThemeType, Theme> = {
  default: {
    primary: '#6200EE',
    secondary: '#03DAC6',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    border: '#E0E0E0',
    error: '#B00020',
    success: '#4CAF50',
    warning: '#FF9800',
    card: '#FFFFFF',
  },
  dark: {
    primary: '#BB86FC',
    secondary: '#03DAC6',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: '#333333',
    error: '#CF6679',
    success: '#81C784',
    warning: '#FFB74D',
    card: '#2C2C2C',
  },
  blue: {
    primary: '#2196F3',
    secondary: '#00BCD4',
    background: '#E3F2FD',
    surface: '#FFFFFF',
    text: '#0D47A1',
    textSecondary: '#546E7A',
    border: '#BBDEFB',
    error: '#D32F2F',
    success: '#388E3C',
    warning: '#F57C00',
    card: '#FFFFFF',
  },
  lightPink: {
    primary: '#E91E63',
    secondary: '#FF4081',
    background: '#FCE4EC',
    surface: '#FFFFFF',
    text: '#880E4F',
    textSecondary: '#AD1457',
    border: '#F8BBD0',
    error: '#C2185B',
    success: '#7CB342',
    warning: '#FB8C00',
    card: '#FFFFFF',
  },
  light: {
    primary: '#9C27B0',
    secondary: '#E040FB',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#212121',
    textSecondary: '#757575',
    border: '#E0E0E0',
    error: '#D32F2F',
    success: '#388E3C',
    warning: '#F57C00',
    card: '#FFFFFF',
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('default');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme && savedTheme in themes) {
        setCurrentTheme(savedTheme as ThemeType);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const setTheme = async (theme: ThemeType) => {
    try {
      await AsyncStorage.setItem('theme', theme);
      setCurrentTheme(theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme: themes[currentTheme], currentTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
