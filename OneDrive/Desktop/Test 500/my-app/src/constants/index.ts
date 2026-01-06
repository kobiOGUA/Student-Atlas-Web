import { GradeMapping } from '../types';

// Babcock University Grading System (5-point scale)
export const BABCOCK_GRADING: GradeMapping[] = [
  { grade: 'A', minScore: 80, maxScore: 100, gpaPoints: 5.0 },
  { grade: 'B', minScore: 60, maxScore: 79, gpaPoints: 4.0 },
  { grade: 'C', minScore: 50, maxScore: 59, gpaPoints: 3.0 },
  { grade: 'D', minScore: 40, maxScore: 49, gpaPoints: 2.0 },
  { grade: 'E', minScore: 30, maxScore: 39, gpaPoints: 1.0 },
  { grade: 'F', minScore: 0, maxScore: 29, gpaPoints: 0.0 },
];

// CA Component Weights and Max Scores
export const CA_WEIGHTS = {
  midSemester: 0.15,  // 15% (0-15 points)
  assignment: 0.10,   // 10% (0-10 points)
  quiz: 0.10,         // 10% (0-10 points)
  attendance: 0.05,   // 5% (0-5 points)
  exam: 0.60,         // 60% (0-60 points)
};

export const CA_MAX_SCORES = {
  midSemester: 15,
  assignment: 10,
  quiz: 10,
  attendance: 5,
};

export const TOTAL_CA_WEIGHT = 0.40; // 40% for all CAs
export const EXAM_WEIGHT = 0.60; // 60% for exam

// Theme names
export const THEME_NAMES = {
  default: 'Default',
  dark: 'Dark',
  blue: 'Blue',
  lightPink: 'Light Pink',
  light: 'Light',
};

export const APP_INFO = {
  name: "Kobi's Atlas",
  version: "1.0.0",
  author: "Kobi Oguadinma",
  school: "Babcock University",
  description: "An academic companion for tracking courses, calculating GPA, and predicting grades.",
  story: 'Kobi\'s Atlas was an individual project by Kobi Oguadinma, a second-year Software Engineering student at Babcock University. He frequently calculated his predicted grades manually and wanted a mobile app to automate this process.',
  note: 'Currently supports Babcock University grading system. Other systems will be available in future updates.',
};
