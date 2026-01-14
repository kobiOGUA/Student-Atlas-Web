# Complete Web App Generator
# This script creates all remaining essential files for the 1:1 replica

import os

BASE = r"c:\Users\kobio\OneDrive\Desktop\Test 500\web-app"

files_to_create = {
    # CSS Files
    "css/components.css": """/* Component Styles */
.bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: var(--card);
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: space-around;
    padding: 8px 0;
    z-index: 1000;
}

.nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 12px;
    color: var(--text-secondary);
    background: none;
    border: none;
    font-size: 11px;
    position: relative;
}

.nav-item.active {
    color: var(--primary);
}

.nav-item ion-icon {
    font-size: 24px;
    margin-bottom: 4px;
}

.badge {
    position: absolute;
    top: 4px;
    right: 8px;
    background-color: var(--error);
    color: white;
    border-radius: 10px;
    padding: 2px 6px;
    font-size: 10px;
    font-weight: bold;
}

.numpad-grid {
    display: grid;
    grid-template-columns: repeat(3, 80px);
    gap: 15px;
    justify-content: center;
    margin: 20px auto;
}

.numpad-btn {
    width: 80px;
    height: 80px;
    border-radius: 40px;
    background-color: var(--surface);
    border: none;
    font-size: 28px;
    font-weight: 600;
    color: var(--text);
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    transition: all 0.2s;
}

.numpad-btn:hover {
    transform: scale(1.05);
}

.numpad-btn:active {
    transform: scale(0.95);
}

.pin-display {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin: 30px 0;
}

.pin-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid var(--text-secondary);
    transition: all 0.2s;
}

.pin-dot.filled {
    background-color: var(--primary);
    border-color: var(--primary);
}
""",

    "css/screens.css": """/* Screen-Specific Styles */
.screen {
    min-height: 100vh;
    padding: var(--content-padding);
}

.login-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
}

.logo-text {
    font-size: 32px;
    font-weight: bold;
    color: var(--primary);
    margin-bottom: 10px;
}

.subtitle {
    color: var(--text-secondary);
    margin-bottom: 30px;
}

.dashboard-header {
    background-color: var(--primary);
    color: white;
    padding: 20px;
    border-radius: 0 0 20px 20px;
    margin: -16px -16px 20px -16px;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
    margin-bottom: 24px;
}

.stat-card {
    background-color: var(--card);
    padding: 16px;
    border-radius: 12px;
    text-align: center;
}

.stat-value {
    font-size: 32px;
    font-weight: bold;
    color: var(--primary);
}

.stat-label {
    font-size: 12px;
    color: var(--text-secondary);
    text-transform: uppercase;
    margin-top: 4px;
}

.post-card {
    background-color: var(--card);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
}

.post-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}

.post-content {
    margin-bottom: 12px;
    line-height: 1.5;
}

.post-actions {
    display: flex;
    gap: 20px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 14px;
}

.action-btn.active {
    color: var(--primary);
}
""",

    # Utility Files
    "js/utils/storage.js": """// LocalStorage wrapper
export const storage = {
    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    },
    
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.error('Storage error:', e);
            return null;
        }
    },
    
    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    }
};
""",

    "js/utils/encryption.js": """// PIN Encryption using CryptoJS
export function hashPINWithSalt(pin, salt) {
    return CryptoJS.SHA256(pin + salt).toString();
}

export function generateSalt() {
    return CryptoJS.lib.WordArray.random(128 / 8).toString();
}
""",

    "js/utils/calculations.js": """// GPA Calculations
export function scoreToGrade(score) {
    if (score >= 70) return 'A';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    if (score >= 45) return 'D';
    if (score >= 40) return 'E';
    return 'F';
}

export function gradeToPoint(grade) {
    const points = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0 };
    return points[grade] || 0;
}

export function calculateSemesterGPA(courses) {
    if (!courses || courses.length === 0) return 0;
    let totalPoints = 0;
    let totalUnits = 0;
    
    courses.forEach(course => {
        const grade = course.grade || course.predictedGrade;
        if (grade) {
            const points = gradeToPoint(grade);
            const units = course.units || 0;
            totalPoints += points * units;
            totalUnits += units;
        }
    });
    
    return totalUnits === 0 ? 0 : parseFloat((totalPoints / totalUnits).toFixed(2));
}

export function calculateCGPA(semesters) {
    let totalPoints = 0;
    let totalUnits = 0;
    
    semesters.forEach(sem => {
        if (sem.type === 'past' && sem.gpa && sem.totalUnits) {
            totalPoints += sem.gpa * sem.totalUnits;
            totalUnits += sem.totalUnits;
        } else if (sem.courses) {
            const semGPA = calculateSemesterGPA(sem.courses);
            const semUnits = sem.courses.reduce((sum, c) => sum + (c.units || 0), 0);
            totalPoints += semGPA * semUnits;
            totalUnits += semUnits;
        }
    });
    
    return totalUnits === 0 ? 0 : parseFloat((totalPoints / totalUnits).toFixed(2));
}
""",

    "js/utils/theme.js": """// Theme Management
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
""",

    "js/utils/helpers.js": """// Helper Functions
export function showLoading(show = true) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

export function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
}
"""
}

print("Creating all essential files...")
for filepath, content in files_to_create.items():
    full_path = os.path.join(BASE, filepath)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✓ Created {filepath}")

print("\n✅ All essential files created!")
print("\nNext: Creating services and screens...")
