// GPA Analysis Screen
import { fetchSemesters } from '../services/semester.js';
import { calculateCGPA, calculatePredictedCGPA, calculateSemesterGPA } from '../utils/calculations.js';
import { storage } from '../utils/storage.js';

let currentTab = 'current';
let globalExcludeCurrent = false;

export function renderGPAScreen() {
    return `
        <div class="screen">
            <div style="background: var(--primary); color: white; padding: 20px; margin: -16px -16px 20px -16px; border-radius: 0 0 20px 20px;">
                <h2 style="margin: 0;">GPA Overview</h2>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Academic Performance Analysis</p>
            </div>
            
            <!-- Tabs -->
            <div style="display: flex; gap: 10px; margin-bottom: 20px; background: var(--card-bg); padding: 4px; border-radius: 12px;">
                <button id="tab-current" class="tab-button active" onclick="window.switchGPATab('current')">
                    Current (Real)
                </button>
                <button id="tab-predicted" class="tab-button" onclick="window.switchGPATab('predicted')">
                    Predicted
                </button>
            </div>

            <!-- Degree Classification -->
            <div id="classification-card" class="card" style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                <ion-icon id="classification-icon" name="star" style="font-size: 36px; color: #FFD700;"></ion-icon>
                <div>
                    <div class="text-secondary text-small">Current Standing</div>
                    <div id="classification-text" style="font-size: 18px; font-weight: bold; color: #FFD700;">First Class</div>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                <div class="card" style="text-align: center;">
                    <ion-icon name="school" style="font-size: 32px; color: var(--primary);"></ion-icon>
                    <div id="main-gpa" style="font-size: 32px; font-weight: bold; margin-top: 8px;">0.00</div>
                    <div id="main-gpa-label" class="text-secondary text-small">Cumulative GPA</div>
                </div>
                <div class="card" style="text-align: center;">
                    <ion-icon name="book" style="font-size: 32px; color: var(--primary);"></ion-icon>
                    <div id="total-credits" style="font-size: 32px; font-weight: bold; margin-top: 8px;">0</div>
                    <div class="text-secondary text-small">Total Credits</div>
                </div>
                <div class="card" style="text-align: center;">
                    <ion-icon name="calendar" style="font-size: 32px; color: var(--primary);"></ion-icon>
                    <div id="semester-count" style="font-size: 32px; font-weight: bold; margin-top: 8px;">0</div>
                    <div class="text-secondary text-small">Semesters</div>
                </div>
                <div class="card" style="text-align: center;">
                    <ion-icon id="trend-icon" name="remove" style="font-size: 32px; color: var(--text-secondary);"></ion-icon>
                    <div id="trend-text" style="font-size: 32px; font-weight: bold; margin-top: 8px;">→</div>
                    <div class="text-secondary text-small">Trend</div>
                </div>
            </div>

            <!-- GPA Chart -->
            <div id="gpa-chart-container" class="card" style="margin-bottom: 20px;">
                <h3 style="margin-bottom: 15px;">GPA Trend</h3>
                <div id="gpa-chart" style="display: flex; align-items: flex-end; justify-content: space-around; height: 180px; padding-bottom: 25px; gap: 8px;">
                </div>
            </div>

            <!-- Insights -->
            <div class="card" style="margin-bottom: 20px;">
                <h3 style="margin-bottom: 15px;">Insights</h3>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                    <ion-icon name="trophy" style="font-size: 20px; color: #FFD700;"></ion-icon>
                    <span id="highest-semester">Best Semester: N/A</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <ion-icon name="alert-circle" style="font-size: 20px; color: #FF9800;"></ion-icon>
                    <span id="lowest-semester">Lowest Semester: N/A</span>
                </div>
            </div>

            <!-- Semester Breakdown -->
            <div class="card">
                <h3 style="margin-bottom: 15px;">Semester Breakdown</h3>
                <div id="semester-list"></div>
            </div>
        </div>
    `;
}

export async function initGPAScreen() {
    const userId = storage.getItem('kobi_atlas_uid');
    if (!userId) {
        window.location.hash = '#/login';
        return;
    }

    // Load exclude setting and store globally
    globalExcludeCurrent = storage.getItem('excludeCurrentGPA') === 'true';

    let semesters = await fetchSemesters(userId);

    // Sort by timestamp
    semesters.sort((a, b) => {
        const timeA = a.timestamp || a.createdAt || 0;
        const timeB = b.timestamp || b.createdAt || 0;
        return timeA - timeB;
    });

    renderGPAData(semesters, globalExcludeCurrent);
}

function renderGPAData(semesters, excludeCurrent) {
    const relevantSemesters = getRelevantSemesters(semesters, currentTab, excludeCurrent);

    // Calculate stats
    let gpa, credits, semesterCount;

    if (currentTab === 'current') {
        gpa = calculateCGPA(semesters);
        const pastSemesters = semesters.filter(s => s.type === 'past');
        credits = pastSemesters.reduce((sum, s) => sum + (s.totalUnits || 0), 0);
        semesterCount = pastSemesters.length;
    } else {
        const semestersForCalc = excludeCurrent ? semesters.filter(s => s.type !== 'current') : semesters;
        gpa = calculatePredictedCGPA(semestersForCalc);
        credits = relevantSemesters.reduce((sum, s) => sum + (s.totalUnits || 0), 0);
        semesterCount = semesters.length;
    }

    // Update stats
    document.getElementById('main-gpa').textContent = gpa.toFixed(2);
    document.getElementById('main-gpa-label').textContent = currentTab === 'current' ? 'Cumulative GPA' : 'Predicted GPA';
    document.getElementById('total-credits').textContent = credits;
    document.getElementById('semester-count').textContent = semesterCount;

    // Update classification
    updateClassification(gpa);

    // Update trend
    updateTrend(semesters, excludeCurrent);

    // Render chart
    renderChart(relevantSemesters);

    // Render insights
    renderInsights(relevantSemesters);

    // Render semester list
    renderSemesterList(relevantSemesters);
}

function getRelevantSemesters(semesters, tab, excludeCurrent) {
    if (tab === 'current') {
        return semesters.filter(s => s.type === 'past');
    }
    if (excludeCurrent) {
        return semesters.filter(s => s.type !== 'current');
    }
    return semesters;
}

function updateClassification(gpa) {
    const classifications = [
        { min: 4.50, label: 'First Class', color: '#FFD700', icon: 'star' },
        { min: 3.50, label: 'Second Class (Upper)', color: '#4CAF50', icon: 'checkmark-circle' },
        { min: 2.40, label: 'Second Class (Lower)', color: '#FF9800', icon: 'remove-circle' },
        { min: 1.50, label: 'Third Class', color: '#9E9E9E', icon: 'ellipse' },
        { min: 0, label: 'Fail', color: '#F44336', icon: 'alert-circle' }
    ];

    const classification = classifications.find(c => gpa >= c.min);
    document.getElementById('classification-icon').setAttribute('name', classification.icon);
    document.getElementById('classification-icon').style.color = classification.color;
    document.getElementById('classification-text').textContent = classification.label;
    document.getElementById('classification-text').style.color = classification.color;
}

function updateTrend(semesters, excludeCurrent) {
    if (currentTab === 'predicted' && semesters.length > 0) {
        const currentCGPA = calculateCGPA(semesters);
        const semestersForPredicted = excludeCurrent ? semesters.filter(s => s.type !== 'current') : semesters;
        const predictedCGPA = calculatePredictedCGPA(semestersForPredicted);
        const diff = predictedCGPA - currentCGPA;

        const trendIcon = document.getElementById('trend-icon');
        const trendText = document.getElementById('trend-text');

        if (diff > 0.01) {
            trendIcon.setAttribute('name', 'trending-up');
            trendIcon.style.color = '#4CAF50';
            trendText.textContent = '↑';
            trendText.style.color = '#4CAF50';
        } else if (diff < -0.01) {
            trendIcon.setAttribute('name', 'trending-down');
            trendIcon.style.color = '#F44336';
            trendText.textContent = '↓';
            trendText.style.color = '#F44336';
        } else {
            trendIcon.setAttribute('name', 'remove');
            trendIcon.style.color = 'var(--text-secondary)';
            trendText.textContent = '→';
            trendText.style.color = 'var(--text-secondary)';
        }
    } else {
        // For current tab, compare last two semesters
        const relevantSemesters = semesters.filter(s => s.type === 'past');
        if (relevantSemesters.length < 2) {
            document.getElementById('trend-icon').setAttribute('name', 'remove');
            document.getElementById('trend-text').textContent = '→';
            return;
        }

        const lastSem = relevantSemesters[relevantSemesters.length - 1];
        const prevSem = relevantSemesters[relevantSemesters.length - 2];

        const lastGPA = lastSem.gpa || calculateSemesterGPA(lastSem.courses);
        const prevGPA = prevSem.gpa || calculateSemesterGPA(prevSem.courses);

        const diff = lastGPA - prevGPA;
        const trendIcon = document.getElementById('trend-icon');
        const trendText = document.getElementById('trend-text');

        if (diff > 0.01) {
            trendIcon.setAttribute('name', 'trending-up');
            trendIcon.style.color = '#4CAF50';
            trendText.textContent = '↑';
            trendText.style.color = '#4CAF50';
        } else if (diff < -0.01) {
            trendIcon.setAttribute('name', 'trending-down');
            trendIcon.style.color = '#F44336';
            trendText.textContent = '↓';
            trendText.style.color = '#F44336';
        } else {
            trendIcon.setAttribute('name', 'remove');
            trendIcon.style.color = 'var(--text-secondary)';
            trendText.textContent = '→';
            trendText.style.color = 'var(--text-secondary)';
        }
    }
}

function renderChart(semesters) {
    const chartContainer = document.getElementById('gpa-chart');
    if (semesters.length === 0) {
        chartContainer.innerHTML = '<p class="text-secondary" style="text-align: center; width: 100%;">No data available</p>';
        return;
    }

    const maxGPA = 5.0;
    const chartHeight = 155; // Match container height

    chartContainer.innerHTML = semesters.map(sem => {
        const gpa = sem.gpa || calculateSemesterGPA(sem.courses || []);
        const displayGPA = Math.min(gpa, maxGPA);
        const height = (displayGPA / maxGPA) * chartHeight;
        const barColor = sem.type === 'past' ? 'var(--primary)' : 'var(--secondary, #999)';

        return `
            <div style="flex: 1; max-width: 70px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;">
                <div style="width: 70%; min-width: 25px; height: ${height}px; background: ${barColor}; border-radius: 8px 8px 0 0; display: flex; align-items: flex-start; justify-content: center; padding-top: 6px; position: relative;">
                    <span style="color: white; font-size: 11px; font-weight: bold;">${gpa.toFixed(2)}</span>
                </div>
                <span style="font-size: 11px; margin-top: 6px; color: var(--text-secondary); text-align: center; width: 60px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${sem.name.split(' ')[0]}</span>
            </div>
        `;
    }).join('');
}

function renderInsights(semesters) {
    if (semesters.length === 0) {
        document.getElementById('highest-semester').textContent = 'Best Semester: N/A';
        document.getElementById('lowest-semester').textContent = 'Lowest Semester: N/A';
        return;
    }

    const semestersWithGPA = semesters.map(s => ({
        ...s,
        calculatedGPA: s.gpa || calculateSemesterGPA(s.courses || [])
    }));

    const highest = semestersWithGPA.reduce((max, s) => s.calculatedGPA > max.calculatedGPA ? s : max);
    const lowest = semestersWithGPA.reduce((min, s) => s.calculatedGPA < min.calculatedGPA ? s : min);

    document.getElementById('highest-semester').innerHTML = `Best Semester: <strong>${highest.name}</strong> (${highest.calculatedGPA.toFixed(2)})`;
    document.getElementById('lowest-semester').innerHTML = `Lowest Semester: <strong>${lowest.name}</strong> (${lowest.calculatedGPA.toFixed(2)})`;
}

function renderSemesterList(semesters) {
    const listContainer = document.getElementById('semester-list');

    if (semesters.length === 0) {
        listContainer.innerHTML = '<p class="text-secondary" style="text-align: center;">No semesters yet</p>';
        return;
    }

    listContainer.innerHTML = semesters.map(sem => {
        const gpa = sem.gpa || calculateSemesterGPA(sem.courses || []);
        const credits = sem.totalUnits || (sem.courses || []).reduce((sum, c) => sum + (c.unitHours || 0), 0);
        const courseCount = (sem.courses || []).length;

        return `
            <div class="card" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 15px;">
                <div>
                    <div style="font-weight: bold;">${sem.name}</div>
                    <div class="text-secondary text-small">${courseCount} courses • ${credits} credits</div>
                </div>
                <div style="background: #E8F5E9; color: #2E7D32; padding: 6px 12px; border-radius: 15px; font-weight: bold;">
                    ${gpa.toFixed(2)}
                </div>
            </div>
        `;
    }).join('');
}

// Global function for tab switching
window.switchGPATab = async function (tab) {
    currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');

    // Reload data
    await initGPAScreen();
};
