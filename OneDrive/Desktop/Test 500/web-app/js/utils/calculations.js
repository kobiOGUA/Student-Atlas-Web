// GPA Calculations
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
    // Only past semesters for real CGPA
    const pastSemesters = semesters.filter(s => s.type === 'past');
    let totalPoints = 0;
    let totalUnits = 0;

    pastSemesters.forEach(sem => {
        if (sem.gpa && sem.totalUnits) {
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

export function calculatePredictedCGPA(semesters) {
    // All semesters for predicted CGPA
    let totalPoints = 0;
    let totalUnits = 0;

    semesters.forEach(sem => {
        if (sem.gpa && sem.totalUnits) {
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
