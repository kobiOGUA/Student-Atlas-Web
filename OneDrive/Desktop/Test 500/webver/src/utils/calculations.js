// GPA Calculations - Exactly as in Android app

export function scoreToGrade(score) {
    if (score >= 70) return 'A';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    if (score >= 45) return 'D';
    if (score >= 40) return 'E';
    return 'F';
}

export function gradeToPoint(grade) {
    const points = {
        'A': 5,
        'B': 4,
        'C': 3,
        'D': 2,
        'E': 1,
        'F': 0
    };
    return points[grade] || 0;
}

export function calculateTotalCA(caScores) {
    const { midSemester = 0, assignment = 0, quiz = 0, attendance = 0 } = caScores;
    return midSemester + assignment + quiz + attendance;
}

export function calculateRequiredExamScore(caScores, targetGrade) {
    const targetPoints = {
        'A': 70,
        'B': 60,
        'C': 50
    };

    const totalCA = calculateTotalCA(caScores);
    const requiredTotal = targetPoints[targetGrade] || 70;
    const requiredExam = requiredTotal - totalCA;

    return Math.max(0, Math.min(60, requiredExam));
}

export function getCertaintyLevel(course) {
    const totalCA = calculateTotalCA(course.caScores);
    const required = calculateRequiredExamScore(course.caScores, course.targetGrade);

    if (required <= 30) return 'High';
    if (required <= 45) return 'Medium';
    return 'Low';
}

export function calculateSemesterGPA(courses) {
    if (!courses || courses.length === 0) return 0;

    let totalPoints = 0;
    let totalUnits = 0;

    courses.forEach(course => {
        const grade = course.grade || course.predictedGrade;
        if (grade) {
            const points = gradeToPoint(grade);
            const units = course.unitHours || course.units || 0;
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
            const semUnits = sem.courses.reduce((sum, c) => sum + (c.unitHours || c.units || 0), 0);
            totalPoints += semGPA * semUnits;
            totalUnits += semUnits;
        }
    });

    return totalUnits === 0 ? 0 : parseFloat((totalPoints / totalUnits).toFixed(2));
}

export function calculatePredictedCGPA(semesters) {
    let totalPoints = 0;
    let totalUnits = 0;

    semesters.forEach(sem => {
        let semGPA = 0;
        let semUnits = 0;

        if (sem.courses && sem.courses.length > 0) {
            sem.courses.forEach(c => {
                const units = c.unitHours || c.units || 0;
                const grade = c.grade || c.predictedGrade || c.targetGrade;
                if (grade) {
                    const points = gradeToPoint(grade);
                    totalPoints += points * units;
                    totalUnits += units;
                }
            });
        } else if (sem.type === 'past') {
            totalPoints += (sem.gpa || 0) * (sem.totalUnits || 0);
            totalUnits += sem.totalUnits || 0;
        }
    });

    return totalUnits === 0 ? 0 : parseFloat((totalPoints / totalUnits).toFixed(2));
}

export function getClassification(cgpa) {
    if (cgpa >= 4.5) return 'First Class';
    if (cgpa >= 3.5) return 'Second Class Upper';
    if (cgpa >= 2.5) return 'Second Class Lower';
    if (cgpa >= 1.5) return 'Third Class';
    if (cgpa >= 1.0) return 'Pass';
    return 'Fail';
}
