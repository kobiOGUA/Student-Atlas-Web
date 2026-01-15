// Theme Management
const THEMES = {
    default: { primary: '#008080' },
    dark: { primary: '#008080' },
    blue: { primary: '#2196F3' },
    lightPink: { primary: '#EC407A' },
    light: { primary: '#616161' }
};

export function applyTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('kobi_atlas_theme', themeName);
}

export function getCurrentTheme() {
    return localStorage.getItem('kobi_atlas_theme') || 'default';
}

// Apply saved theme on load
applyTheme(getCurrentTheme());
