// Add this function to index.html after openEditScheduleModal

window.deleteScheduleItem = async function (itemId, itemType, courseId) {
    if (!confirm('Delete this schedule item?')) return;

    const uid = localStorage.getItem('kobi_atlas_uid');
    showLoading(true);

    try {
        const semRef = collection(db, 'users', uid, 'semesters');
        const snapshot = await getDocs(semRef);
        let currentSemester = null;

        snapshot.forEach(doc => {
            const data = { id: doc.id, ...doc.data() };
            if (data.type === 'current') {
                currentSemester = data;
            }
        });

        if (!currentSemester) {
            showToast('No current semester found', 'error');
            showLoading(false);
            return;
        }

        if (itemType === 'course' && courseId) {
            // Delete from course schedules
            const courses = currentSemester.courses;
            const courseIndex = courses.findIndex(c => c.id === courseId);

            if (courseIndex !== -1) {
                let schedules = courses[courseIndex].schedules || [];
                schedules = schedules.filter(s => s.id !== itemId);
                courses[courseIndex].schedules = schedules;

                await updateDoc(doc(db, 'users', uid, 'semesters', currentSemester.id), {
                    courses: courses
                });
            }
        } else {
            // Delete from custom events
            let customEvents = currentSemester.customEvents || [];
            customEvents = customEvents.filter(e => e.id !== itemId);

            await updateDoc(doc(db, 'users', uid, 'semesters', currentSemester.id), {
                customEvents: customEvents
            });
        }

        showToast('Schedule deleted', 'success');
        if (window.loadSchedule) window.loadSchedule();

    } catch (error) {
        console.error('Delete schedule error:', error);
        showToast('Error deleting schedule', 'error');
    } finally {
        showLoading(false);
    }
};
