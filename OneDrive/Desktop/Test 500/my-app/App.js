import 'react-native-get-random-values'; // Must be first
import React from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './src/utils/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

// Web-specific CSS injection - ONLY for image fixes
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    /* Image Fixes Only - Full Screen Layout Preserved */
    
    /* Prevent Horizontal Scroll */
    html, body { 
      overflow-x: hidden; 
      margin: 0;
      padding: 0;
    }
    
    /* Fix Images - Prevent Stretching */
    img { 
      max-width: 100% !important; 
      height: auto !important; 
      object-fit: cover; 
      display: block;
    }
    
    /* Post/Content Images - Proper Aspect Ratio */
    [class*="post"] img,
    [class*="content"] img,
    [class*="Image"] img { 
      width: 100%; 
      max-height: 500px; 
      object-fit: cover; 
      border-radius: 8px; 
    }
    
    /* Avatar/Profile Images - Fixed Size */
    [class*="avatar"] img,
    [class*="profile"] img { 
      width: 40px; 
      height: 40px; 
      border-radius: 50%; 
      object-fit: cover; 
      flex-shrink: 0; 
    }
    
    /* Large Profile Images */
    [style*="width: 120"] img,
    [style*="height: 120"] img {
      width: 120px;
      height: 120px;
      border-radius: 60px;
      object-fit: cover;
    }
    
    /* NUMPAD FIX - Display as Grid */
    [style*="flex-wrap: wrap"] {
      display: grid !important;
      grid-template-columns: repeat(3, 80px) !important;
      gap: 15px !important;
      justify-content: center;
      width: 100%;
      max-width: 300px;
      margin: 0 auto;
    }
    
    /* Numpad Buttons */
    [style*="width: 80"][style*="height: 80"] {
      width: 80px !important;
      height: 80px !important;
      border-radius: 40px !important;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: transform 0.1s;
    }
    
    [style*="width: 80"][style*="height: 80"]:hover {
      transform: scale(1.05);
    }
    
    [style*="width: 80"][style*="height: 80"]:active {
      transform: scale(0.95);
    }
    
    /* Prevent Images from Breaking Layout */
    * { 
      box-sizing: border-box; 
    }
    
    /* Smooth Scrolling */
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: #f1f1f1; }
    ::-webkit-scrollbar-thumb { background: #888; border-radius: 4px; }
    
    /* Button Hover Effects */
    button:hover { opacity: 0.9; cursor: pointer; }
    button:active { transform: scale(0.98); }
  `;
  document.head.appendChild(style);
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
