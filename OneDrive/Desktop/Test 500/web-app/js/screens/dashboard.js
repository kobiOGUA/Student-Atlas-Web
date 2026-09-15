// Dashboard Screen
import { fetchSemesters } from '../services/semester.js';
import { calculateCGPA, calculatePredictedCGPA } from '../utils/calculations.js';
import { storage } from '../utils/storage.js';

export function renderDashboardScreen() {
    return `
        <div class="screen">
            <div class="dashboard-header">
                <h2 style="margin: 0;">Student Atlas</h2>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Academic Overview</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Current CGPA</div>
                    <div class="stat-value" id="cgpa-value">--</div>
                </div>
                <div class="stat-card" id="predicted-stat-card">
                    <div class="stat-label">Predicted CGPA</div>
                    <div class="stat-value" id="predicted-cgpa-value">--</div>
                </div>
            </div>
            
            <h3>Current Semester</h3>
            <div id="current-semester-container"></div>
            <div id="exclude-toggle-container"></div>
            
            <h3>Semester History</h3>
            <div id="semester-history-container"></div>
        </div>
    `;
}

export async function initDashboardScreen() {
    const userId = storage.getItem('kobi_atlas_uid');
    if (!userId) {
        window.location.hash = '#/login';
        return;
    }

    let semesters = await fetchSemesters(userId);

    // Sort semesters by creation date (newest first)
    semesters.sort((a, b) => {
        const timeA = a.timestamp || a.createdAt || 0;
        const timeB = b.timestamp || b.createdAt || 0;
        return timeB - timeA;
    });

    // Get exclude setting
    const excludeCurrent = storage.getItem('excludeCurrentGPA') === 'true';

    // Calculate GPAs
    const cgpa = calculateCGPA(semesters);

    // Calculate predicted CGPA respecting exclude setting
    let semestersForPredicted = semesters;
    if (excludeCurrent) {
        semestersForPredicted = semesters.filter(s => s.type !== 'current');
    }
    const predictedCGPA = calculatePredictedCGPA(semestersForPredicted);

    document.getElementById('cgpa-value').textContent = cgpa.toFixed(2);
    document.getElementById('predicted-cgpa-value').textContent = predictedCGPA.toFixed(2);

    // Display current semester
    const currentSem = semesters.find(s => s.type === 'current');
    const currentContainer = document.getElementById('current-semester-container');
    const toggleContainer = document.getElementById('exclude-toggle-container');

    if (currentSem) {
        currentContainer.innerHTML = `
            <div class="card card-clickable">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3 style="margin: 0; color: var(--primary);">${currentSem.name}</h3>
                    <span style="background: var(--primary); color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px;">CURRENT</span>
                </div>
                <p class="text-secondary text-small">${currentSem.courses?.length || 0} Courses Enrolled</p>
                <p style="font-weight: bold; margin-top: 8px;">Target GPA: <span style="color: var(--success);">5.00</span></p>
            </div>
        `;

        // Show toggle only when current semester exists
        toggleContainer.innerHTML = `
            <div style="margin-top: 15px; display: flex; align-items: center; justify-content: center; gap: 10px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-color); font-size: 13px;">
                    <input type="checkbox" id="exclude-toggle" ${excludeCurrent ? 'checked' : ''} 
                           style="width: auto; margin: 0; cursor: pointer;"
                           onchange="window.toggleExcludeCurrent(this.checked)">
                    Exclude from Predicted
                </label>
            </div>
        `;
    } else {
        currentContainer.innerHTML = `
            <div class="card" style="text-align: center; padding: 40px; border: 2px dashed var(--border); cursor: pointer;" onclick="alert('Add Semester feature coming soon!')">
                <p style="font-size: 48px; margin: 0;">+</p>
                <p class="text-secondary">Start a new semester</p>
            </div>
        `;
        toggleContainer.innerHTML = ''; // No toggle when no current semester
    }

    // Display semester history (sorted by creation date)
    const historyContainer = document.getElementById('semester-history-container');
    const pastSemesters = semesters.filter(s => s.type !== 'current');

    if (pastSemesters.length > 0) {
        historyContainer.innerHTML = pastSemesters.map(sem => `
            <div class="card" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: bold;">${sem.name}</div>
                    <div class="text-secondary text-small">${sem.totalUnits || 0} Units</div>
                </div>
                <div style="background: #E8F5E9; color: #2E7D32; padding: 6px 12px; border-radius: 15px; font-weight: bold;">
                    ${(sem.gpa || 0).toFixed(2)}
                </div>
            </div>
        `).join('');
    } else {
        historyContainer.innerHTML = `
            <div class="card" style="text-align: center; padding: 30px;">
                <p class="text-secondary">No semester history yet</p>
            </div>
        `;
    }
}

// Global function for toggle
window.toggleExcludeCurrent = function (checked) {
    storage.setItem('excludeCurrentGPA', String(checked));
    initDashboardScreen(); // Reload to recalculate
};
