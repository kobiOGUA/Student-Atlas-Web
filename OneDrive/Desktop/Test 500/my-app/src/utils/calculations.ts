import { Grade, CAScores, Course, Semester, TargetGrade } from '../types';
import { BABCOCK_GRADING, CA_WEIGHTS, TOTAL_CA_WEIGHT, EXAM_WEIGHT } from '../constants';

/**
 * Convert a score (0-100) to a Babcock University grade
 */
export function scoreToGrade(score: number): Grade {
  for (const gradeMapping of BABCOCK_GRADING) {
    if (score >= gradeMapping.minScore && score <= gradeMapping.maxScore) {
      return gradeMapping.grade;
    }
  }
  return 'F';
}

/**
 * Get GPA points for a given grade
 */
export function gradeToGPA(grade: Grade): number {
  const gradeMapping = BABCOCK_GRADING.find(g => g.grade === grade);
  return gradeMapping ? gradeMapping.gpaPoints : 0;
}

/**
 * Calculate total CA score (out of 40)
 */
export function calculateTotalCA(caScores: CAScores): number {
  const { midSemester, assignment, quiz, attendance } = caScores;
  const total = midSemester + assignment + quiz + attendance;
  return Math.min(total, 40); // CA is out of 40
}

/**
 * Calculate required exam score to achieve target grade
 */
export function calculateRequiredExamScore(
  caScores: CAScores,
  targetGrade: TargetGrade
): number {
  const totalCA = calculateTotalCA(caScores);
  const targetMapping = BABCOCK_GRADING.find(g => g.grade === targetGrade);

  if (!targetMapping) return 60; // Return max exam score (60)

  const targetScore = targetMapping.minScore; // Target overall score (0-100)
  // Required exam score out of 60: targetScore - CA
  // In 40-60 system: Total = CA (0-40) + Exam (0-60)
  const requiredExamScore = targetScore - totalCA;

  // Return exam score out of 60, clamped between 0 and 60
  return Math.max(0, Math.min(60, requiredExamScore));
}

/**
 * Predict grade based on CA scores and target grade
 */
export function predictGrade(course: Course): Grade {
  const totalCA = calculateTotalCA(course.caScores);

  // If final score exists, use it
  if (course.finalScore !== undefined) {
    return scoreToGrade(course.finalScore);
  }

  // If grade exists (past semesters), use it
  if (course.grade) {
    return course.grade;
  }

  // For current semesters with target grade, predict based on target
  if (course.targetGrade) {
    const requiredExam = calculateRequiredExamScore(course.caScores, course.targetGrade);
    // Predicted overall score: CA + exam score (in 40-60 system)
    const predictedScore = totalCA + requiredExam;
    return scoreToGrade(predictedScore);
  }

  // Default prediction if no data
  return 'C';
}

/**
 * Calculate semester GPA using the correct formula:
 * GPA = Σ(Credit Units × Grade Points) / Σ(Credit Units)
 */
export function calculateSemesterGPA(courses: Course[]): number {
  if (courses.length === 0) return 0;

  let totalPoints = 0;
  let totalUnits = 0;

  for (const course of courses) {
    // Get the grade (from finalScore if exists, otherwise use target grade for current semesters, otherwise predict)
    let grade: Grade;
    if (course.grade) {
      grade = course.grade;
    } else if (course.finalScore !== undefined) {
      grade = scoreToGrade(course.finalScore);
    } else if (course.targetGrade) {
      grade = course.targetGrade;
    } else {
      // For pending semesters or cases with no target, predict using CA + Exam calc
      // However, if it's pending, we might want to default to 'C' or something if no data,
      // but predictGrade handles this.
      grade = predictGrade(course);
    }

    const gradePoints = gradeToGPA(grade);
    const units = Number(course.unitHours) || 0;
    totalPoints += units * gradePoints;
    totalUnits += units;
  }

  return totalUnits > 0 ? totalPoints / totalUnits : 0;
}

/**
 * Calculate CGPA from all past semesters using the correct formula:
 * CGPA = Σ(Semester GPA × Total Units in Semester) / Σ(Total Units of All Semesters)
 */
export function calculateCGPA(semesters: Semester[]): number {
  // Past semesters are confirmed. Pending semesters are NOT confirmed yet, so they shouldn't be in Real CGPA.
  const pastSemesters = semesters.filter(s => s.type === 'past');

  if (pastSemesters.length === 0) return 0;

  let totalWeightedGPA = 0;
  let totalUnits = 0;

  for (const semester of pastSemesters) {
    let semesterGPA = 0;
    let semesterUnits = 0;

    if (semester.courses.length > 0) {
      semesterGPA = calculateSemesterGPA(semester.courses);
      semesterUnits = semester.courses.reduce((sum, c) => sum + (Number(c.unitHours) || 0), 0);
    } else if (semester.gpa !== undefined && semester.totalUnits !== undefined) {
      semesterGPA = semester.gpa;
      semesterUnits = semester.totalUnits;
    }

    totalWeightedGPA += semesterGPA * semesterUnits;
    totalUnits += semesterUnits;
  }

  return totalUnits > 0 ? totalWeightedGPA / totalUnits : 0;
}

/**
 * Calculate predicted CGPA including current semester
 * Formula: Σ(Semester GPA × Semester Units) / Σ(All Semester Units)
 */
export function calculatePredictedCGPA(semesters: Semester[]): number {
  if (semesters.length === 0) return 0;

  let totalWeightedGPA = 0;
  let totalUnits = 0;

  for (const semester of semesters) {
    let semesterGPA = 0;
    let semesterUnits = 0;

    if (semester.courses.length > 0) {
      semesterGPA = calculateSemesterGPA(semester.courses);
      semesterUnits = semester.courses.reduce((sum, c) => sum + (Number(c.unitHours) || 0), 0);
    } else if (semester.gpa !== undefined && semester.totalUnits !== undefined) {
      semesterGPA = semester.gpa;
      semesterUnits = semester.totalUnits;
    }

    totalWeightedGPA += semesterGPA * semesterUnits;
    totalUnits += semesterUnits;
  }

  return totalUnits > 0 ? totalWeightedGPA / totalUnits : 0;
}

/**
 * Get certainty level for grade prediction
 */
export function getCertaintyLevel(course: Course): 'High' | 'Medium' | 'Low' {
  if (course.finalScore !== undefined) return 'High';

  // If it's a past semester course with grade, certainty is high
  if (course.grade) return 'High';

  // If no target grade, can't predict certainty
  if (!course.targetGrade) return 'Low';

  const totalCA = calculateTotalCA(course.caScores);
  const requiredExam = calculateRequiredExamScore(course.caScores, course.targetGrade);

  // High certainty if exam requirement is reasonable and CA is good
  if (requiredExam <= 70 && totalCA >= 25) return 'High';

  // Low certainty if exam requirement is very high
  if (requiredExam >= 90 || totalCA < 15) return 'Low';

  return 'Medium';
}
