// Main Application Controller
import { initRouter } from './router.js';
import { getCurrentTheme } from './utils/theme.js';
import { logout } from './services/auth.js';

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Kobi\'s Student Atlas - Web Version');
    console.log('Initializing application...');

    // Apply saved theme
    const theme = getCurrentTheme();
    document.documentElement.setAttribute('data-theme', theme);

    // Initialize bottom navigation
    initBottomNav();

    // Initialize router
    initRouter();

    console.log('✅ Application initialized successfully');
});

function initBottomNav() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const route = item.dataset.route;

            // Handle settings specially for logout option
            if (route === 'settings') {
                showSettingsMenu();
            } else {
                window.location.hash = `#/${route}`;
            }
        });
    });
}

function showSettingsMenu() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.style.display = 'flex';
    overlay.onclick = () => overlay.remove();

    const menu = document.createElement('div');
    menu.style.cssText = `
        background: var(--card);
        border-radius: 12px;
        padding: 20px;
        max-width: 300px;
        width: 90%;
    `;
    menu.onclick = (e) => e.stopPropagation();

    menu.innerHTML = `
        <h3 style="margin-top: 0;">Settings</h3>
        <button class="btn-secondary mb-2" onclick="changeTheme()" style="width: 100%;">
            Change Theme
        </button>
        <button class="btn-secondary" onclick="handleLogout()" style="width: 100%; background: var(--error); color: white; border: none;">
            Logout
        </button>
    `;

    overlay.appendChild(menu);
    document.body.appendChild(overlay);
}

// Global functions
window.changeTheme = function () {
    const themes = ['default', 'dark', 'blue', 'lightPink', 'light'];
    const current = getCurrentTheme();
    const currentIndex = themes.indexOf(current);
    const nextTheme = themes[(currentIndex + 1) % themes.length];

    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('kobi_atlas_theme', nextTheme);

    // Close menu
    document.querySelector('.loading-overlay')?.remove();
};

window.handleLogout = function () {
    if (confirm('Are you sure you want to logout?')) {
        logout();
        window.location.hash = '#/login';
        document.querySelector('.loading-overlay')?.remove();
    }
};
