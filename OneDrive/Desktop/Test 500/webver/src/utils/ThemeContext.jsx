import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export function useTheme() {
    return useContext(ThemeContext);
}

const THEMES = {
    default: {
        primary: '#008080',
        background: '#F5F5F5',
        card: '#FFFFFF',
        text: '#333333',
        textSecondary: '#666666',
        border: '#E0E0E0',
        surface: '#FFFFFF',
        error: '#D32F2F',
        success: '#388E3C',
        warning: '#FFA726'
    },
    dark: {
        primary: '#008080',
        background: '#121212',
        card: '#1E1E1E',
        text: '#FFFFFF',
        textSecondary: '#AAAAAA',
        border: '#333333',
        surface: '#1E1E1E',
        error: '#CF6679',
        success: '#81C784',
        warning: '#FFB74D'
    },
    blue: {
        primary: '#2196F3',
        background: '#E3F2FD',
        card: '#FFFFFF',
        text: '#0D47A1',
        textSecondary: '#5472d3',
        border: '#BBDEFB',
        surface: '#FFFFFF',
        error: '#B00020',
        success: '#4CAF50',
        warning: '#FF9800'
    },
    lightPink: {
        primary: '#EC407A',
        background: '#FCE4EC',
        card: '#FFFFFF',
        text: '#880E4F',
        textSecondary: '#AD1457',
        border: '#F8BBD0',
        surface: '#FFFFFF',
        error: '#C2185B',
        success: '#66BB6A',
        warning: '#FFA726'
    },
    light: {
        primary: '#616161',
        background: '#FFFFFF',
        card: '#F5F5F5',
        text: '#212121',
        textSecondary: '#757575',
        border: '#E0E0E0',
        surface: '#FAFAFA',
        error: '#D32F2F',
        success: '#388E3C',
        warning: '#FFA726'
    }
};

export function ThemeProvider({ children }) {
    const [currentTheme, setCurrentTheme] = useState('default');
    const [theme, setTheme] = useState(THEMES.default);

    useEffect(() => {
        const savedTheme = localStorage.getItem('kobi_atlas_theme') || 'default';
        applyTheme(savedTheme);
    }, []);

    const applyTheme = (themeName) => {
        if (!THEMES[themeName]) themeName = 'default';

        const selectedTheme = THEMES[themeName];
        setTheme(selectedTheme);
        setCurrentTheme(themeName);

        // Apply CSS variables
        const root = document.documentElement;
        Object.keys(selectedTheme).forEach(key => {
            const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            root.style.setProperty(`--${cssVar}`, selectedTheme[key]);
        });

        localStorage.setItem('kobi_atlas_theme', themeName);
    };

    const value = {
        theme,
        currentTheme,
        setTheme: applyTheme,
        themes: Object.keys(THEMES)
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}
