// Login Screen
import { loginWithPIN, registerWithPIN } from '../services/auth.js';
import { showLoading, showToast } from '../utils/helpers.js';

let currentPIN = '';
let isRegisterMode = false;

export function renderLoginScreen() {
    return `
        <div class="login-screen">
            <h1 class="logo-text">Student Atlas</h1>
            <p class="subtitle" id="login-subtitle">Enter your credentials</p>
            
            <input type="email" id="login-email" placeholder="Email Address" class="mb-2" style="max-width: 400px;">
            <input type="text" id="login-username" placeholder="Username (for new accounts)" class="mb-2 hidden" style="max-width: 400px;">
            
            <div class="pin-display" id="pin-display">
                <div class="pin-dot"></div>
                <div class="pin-dot"></div>
                <div class="pin-dot"></div>
                <div class="pin-dot"></div>
            </div>
            
            <div class="numpad-grid" id="numpad"></div>
            
            <button class="btn-secondary" id="toggle-mode" style="margin-top: 20px; max-width: 300px;">
                Create New Account
            </button>
        </div>
    `;
}

export function initLoginScreen() {
    currentPIN = '';
    isRegisterMode = false;

    // Check if returning user
    const savedEmail = localStorage.getItem('kobi_atlas_email');
    if (savedEmail) {
        document.getElementById('login-email').value = savedEmail;
        document.getElementById('login-subtitle').textContent = `Welcome back!`;
    }

    // Render numpad
    const numpad = document.getElementById('numpad');
    const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CE', '0', '⌫'];

    numbers.forEach(num => {
        const btn = document.createElement('button');
        btn.className = 'numpad-btn';
        if (num === 'CE') {
            btn.style.backgroundColor = 'transparent';
            btn.style.color = 'var(--error)';
            btn.style.fontSize = '20px';
        } else if (num === '⌫') {
            btn.style.backgroundColor = 'transparent';
            btn.style.fontSize = '24px';
        }
        btn.textContent = num;
        btn.onclick = () => handleNumpadClick(num);
        numpad.appendChild(btn);
    });

    // Toggle mode button
    document.getElementById('toggle-mode').onclick = toggleMode;
}

function toggleMode() {
    isRegisterMode = !isRegisterMode;
    const usernameInput = document.getElementById('login-username');
    const toggleBtn = document.getElementById('toggle-mode');
    const subtitle = document.getElementById('login-subtitle');

    if (isRegisterMode) {
        usernameInput.classList.remove('hidden');
        toggleBtn.textContent = 'Already have an account? Login';
        subtitle.textContent = 'Create your account';
    } else {
        usernameInput.classList.add('hidden');
        toggleBtn.textContent = 'Create New Account';
        subtitle.textContent = 'Enter your credentials';
    }

    currentPIN = '';
    updatePINDisplay();
}

function handleNumpadClick(value) {
    if (value === 'CE') {
        currentPIN = '';
    } else if (value === '⌫') {
        currentPIN = currentPIN.slice(0, -1);
    } else if (currentPIN.length < 4) {
        currentPIN += value;
    }

    updatePINDisplay();

    if (currentPIN.length === 4) {
        setTimeout(() => attemptAuth(), 300);
    }
}

function updatePINDisplay() {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('filled', i < currentPIN.length);
    });
}

async function attemptAuth() {
    const email = document.getElementById('login-email').value.trim();

    if (!email) {
        showToast('Please enter email', 'error');
        currentPIN = '';
        updatePINDisplay();
        return;
    }

    showLoading(true);

    let result;
    if (isRegisterMode) {
        const username = document.getElementById('login-username').value.trim();
        if (!username) {
            showToast('Please enter username', 'error');
            showLoading(false);
            currentPIN = '';
            updatePINDisplay();
            return;
        }
        result = await registerWithPIN(email, currentPIN, username);
    } else {
        result = await loginWithPIN(email, currentPIN);
    }

    showLoading(false);

    if (result.success) {
        showToast(isRegisterMode ? 'Account created!' : 'Welcome back!', 'success');
        setTimeout(() => {
            window.location.hash = '#/dashboard';
        }, 500);
    } else {
        showToast(result.error, 'error');
        currentPIN = '';
        updatePINDisplay();
    }
}
