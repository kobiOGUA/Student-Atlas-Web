// Router - Client-side routing
import { renderLoginScreen, initLoginScreen } from './screens/login.js';
import { renderDashboardScreen, initDashboardScreen } from './screens/dashboard.js';
import { renderCommunityScreen, initCommunityScreen } from './screens/community.js';
import { renderGPAScreen, initGPAScreen } from './screens/gpa.js?v=2';
import { checkAuth } from './services/auth.js';

const routes = {
    '/': 'login',
    '/login': 'login',
    '/dashboard': 'dashboard',
    '/community': 'community',
    '/timetable': 'dashboard', // Placeholder
    '/gpa': 'gpa',
    '/messages': 'dashboard', // Placeholder
    '/settings': 'dashboard' // Placeholder
};

export function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}

async function handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const route = routes[hash] || 'login';

    // Check authentication
    const userId = checkAuth();
    if (!userId && route !== 'login') {
        window.location.hash = '#/login';
        return;
    }

    // Get containers
    const container = document.getElementById('screen-container');
    const bottomNav = document.getElementById('bottom-nav');

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.route === route) {
            item.classList.add('active');
        }
    });

    // Render screen
    try {
        switch (route) {
            case 'login':
                container.innerHTML = renderLoginScreen();
                initLoginScreen();
                bottomNav.style.display = 'none';
                break;

            case 'dashboard':
                container.innerHTML = renderDashboardScreen();
                await initDashboardScreen();
                bottomNav.style.display = 'flex';
                break;

            case 'community':
                container.innerHTML = renderCommunityScreen();
                await initCommunityScreen();
                bottomNav.style.display = 'flex';
                break;

            case 'gpa':
                container.innerHTML = renderGPAScreen();
                await initGPAScreen();
                bottomNav.style.display = 'flex';
                break;

            default:
                container.innerHTML = `
                    <div class="screen" style="display: flex; align-items: center; justify-content: center; min-height: 80vh;">
                        <div style="text-align: center;">
                            <h2>Coming Soon</h2>
                            <p class="text-secondary">This feature is under development</p>
                            <button class="btn-primary" onclick="window.location.hash='#/dashboard'" style="margin-top: 20px;">
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                `;
                bottomNav.style.display = 'flex';
        }

        // Scroll to top
        container.scrollTop = 0;
    } catch (error) {
        console.error('Route error:', error);
        container.innerHTML = `
            <div class="screen" style="padding: 40px; text-align: center;">
                <h2 style="color: var(--error);">Error Loading Page</h2>
                <p class="text-secondary">${error.message}</p>
                <button class="btn-primary" onclick="window.location.hash='#/dashboard'">
                    Back to Dashboard
                </button>
            </div>
        `;
    }
}
