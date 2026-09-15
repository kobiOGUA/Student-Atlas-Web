// CRITICAL FIXES for complete.html
// Add this to the Firebase script section to fix data structure compatibility

// UPDATED: Course and Semester creation to match Android app exactly

window.addCourse = async function () {
    const title = document.getElementById('course-title').value.trim();
    const code = document.getElementById('course-code').value.trim();
    const units = parseInt(document.getElementById('course-units').value);
    const targetGrade = document.getElementById('course-target-grade').value;

    if (!title || !code || !units) {
        showToast('Please fill all fields', 'error');
        return;
    }

    const uid = localStorage.getItem('kobi_atlas_uid');
    showLoading(true);

    try {
        const newCourse = {
            id: `course_${Date.now()}`,
            name: title,  // FIXED: was 'title', now 'name'
            code,
            unitHours: units,  // FIXED: was 'units', now 'unitHours'
            targetGrade,
            difficulty: 3,  // ADDED: default difficulty
            caScores: {
                midSemester: 0,
                assignment: 0,
                quiz: 0,
                attendance: 0
            },
            predictedGrade: targetGrade,
            schedule: null,  // ADDED
            examDate: null   // ADDED
        };

        currentSemester.courses = currentSemester.courses || [];
        currentSemester.courses.push(newCourse);

        await updateDoc(doc(db, 'users', uid, 'semesters', currentSemester.id), {
            courses: currentSemester.courses
        });

        showToast('Course added!', 'success');
        closeModal('add-course-modal');
        viewSemester(currentSemester.id);
    } catch (error) {
        console.error('Add course error:', error);
        showToast('Error adding course', 'error');
    }

    showLoading(false);
};

// UPDATED: Create semester with validation
window.createSemester = async function () {
    const name = document.getElementById('semester-name').value.trim();
    if (!name) {
        showToast('Please enter semester name', 'error');
        return;
    }

    const uid = localStorage.getItem('kobi_atlas_uid');
    showLoading(true);

    try {
        // ADDED: Validation - only one current semester allowed
        if (selectedSemesterType === 'current') {
            const semRef = collection(db, 'users', uid, 'semesters');
            const snapshot = await getDocs(semRef);
            const hasCurrent = snapshot.docs.some(doc => doc.data().type === 'current');

            if (hasCurrent) {
                showToast('A current semester already exists!', 'error');
                showLoading(false);
                return;
            }
        }

        const semRef = doc(collection(db, 'users', uid, 'semesters'));
        await setDoc(semRef, {
            id: semRef.id,
            name,
            type: selectedSemesterType,
            courses: [],
            timestamp: Date.now()
        });

        showToast('Semester created!', 'success');
        closeModal('add-semester-modal');
        loadDashboard();
    } catch (error) {
        console.error('Create semester error:', error);
        showToast('Error creating semester', 'error');
    }

    showLoading(false);
};

// UPDATED: Display predicted CGPA only if current/pending exists
function displaySemesterSection(containerId, title, semesters, type) {
    const container = document.getElementById(containerId);

    if (semesters.length === 0) {
        container.innerHTML = '';
        return;
    }

    const html = `
        <div class="section-title">${title}</div>
        ${semesters.map(sem => {
        const gpa = sem.gpa || calculateSemesterGPA(sem.courses || []);
        const courseCount = sem.courses?.length || 0;
        return `
                <div class="semester-card ${type}" onclick="viewSemester('${sem.id}')">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: bold; font-size: 16px;">${sem.name}</div>
                            <div style="font-size: 14px; color: #999; margin-top: 4px;">${courseCount} courses</div>
                        </div>
                        <div>
                            <span class="badge ${type}">${type.toUpperCase()}</span>
                            <div style="font-size: 20px; font-weight: bold; color: #667eea; margin-top: 8px;">
                                ${type === 'pending' || type === 'current' ? 'Predicted' : 'GPA'}: ${parseFloat(gpa).toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
    }).join('')}
    `;

    container.innerHTML = html;
}

// UPDATED: Course display to use correct field names
window.viewSemester = async function (semesterId) {
    const uid = localStorage.getItem('kobi_atlas_uid');
    showLoading(true);

    try {
        const semDoc = await getDoc(doc(db, 'users', uid, 'semesters', semesterId));
        if (!semDoc.exists()) {
            showToast('Semester not found', 'error');
            return;
        }

        currentSemester = { id: semDoc.id, ...semDoc.data() };

        document.getElementById('semester-detail-title').textContent = currentSemester.name;
        const gpa = currentSemester.gpa || calculateSemesterGPA(currentSemester.courses || []);
        document.getElementById('semester-detail-gpa').textContent = `GPA: ${parseFloat(gpa).toFixed(2)}`;

        const courses = currentSemester.courses || [];
        const coursesHTML = courses.length > 0 ? courses.map((course, index) => {
            const grade = course.predictedGrade || course.targetGrade || '--';
            return `
                <div class="course-card" onclick="viewCourse(${index})">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: bold;">${course.name}</div>
                            <div style="font-size: 12px; color: #999;">${course.code}</div>
                            <div style="font-size: 12px; color: #999; margin-top: 4px;">${course.unitHours} units • Target: ${course.targetGrade} • Grade: ${grade}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('') : '<p style="text-align: center; color: #999; padding: 40px;">No courses yet</p>';

        document.getElementById('courses-list').innerHTML = coursesHTML;

        showScreen('semester-detail');
    } catch (error) {
        console.error('View semester error:', error);
        showToast('Error loading semester', 'error');
    }

    showLoading(false);
};
