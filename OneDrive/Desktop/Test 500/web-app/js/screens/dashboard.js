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
                <div class="stat-card">
                    <div class="stat-label">Predicted CGPA</div>
                    <div class="stat-value" id="predicted-cgpa-value">--</div>
                </div>
            </div>
            
            <h3>Current Semester</h3>
            <div id="current-semester-container"></div>
            
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

    const semesters = await fetchSemesters(userId);

    // Calculate GPAs
    const cgpa = calculateCGPA(semesters);
    const predictedCGPA = calculatePredictedCGPA(semesters);

    document.getElementById('cgpa-value').textContent = cgpa.toFixed(2);
    document.getElementById('predicted-cgpa-value').textContent = predictedCGPA.toFixed(2);

    // Display current semester
    const currentSem = semesters.find(s => s.type === 'current');
    const currentContainer = document.getElementById('current-semester-container');

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
    } else {
        currentContainer.innerHTML = `
            <div class="card" style="text-align: center; padding: 40px; border: 2px dashed var(--border); cursor: pointer;" onclick="alert('Add Semester feature coming soon!')">
                <p style="font-size: 48px; margin: 0;">+</p>
                <p class="text-secondary">Start a new semester</p>
            </div>
        `;
    }

    // Display semester history
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
