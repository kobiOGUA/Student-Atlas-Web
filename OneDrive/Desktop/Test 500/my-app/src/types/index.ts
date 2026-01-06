export type Grade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type TargetGrade = 'A' | 'B' | 'C';
export type SemesterType = 'past' | 'current' | 'pending';
export type ThemeType = 'default' | 'dark' | 'blue' | 'lightPink' | 'light';

export interface CAScores {
  midSemester: number;  // 0-15
  assignment: number;   // 0-10
  quiz: number;         // 0-10
  attendance: number;   // 0-5
  examScore?: number;   // 0-60
}

export interface Schedule {
  id?: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // "HH:mm" 24h format
  endTime: string;   // "HH:mm" 24h format
  venue?: string;
  isRecurring?: boolean;
  date?: string; // ISO string for one-time
  title?: string;
}

export interface CustomEvent extends Schedule {
  id: string; // Required
  title: string; // Required
}

export interface Course {
  id: string;
  name: string;
  code: string;
  unitHours: number;
  caScores: CAScores;
  targetGrade?: TargetGrade;

  finalScore?: number;
  grade?: Grade;
  schedules?: Schedule[];
  schedule?: Schedule;
  examDate?: string;
}

export interface Semester {
  id: string;
  name: string;
  type: SemesterType;
  timestamp: number;
  gpa?: number;
  predictedGPA?: number;
  totalUnits?: number;
  courses: Course[];
  customEvents?: CustomEvent[];
}

export interface User {
  uid: string;
  email: string;
  username?: string;
  displayName?: string;
  profilePicture?: string; // Base64
  bio?: string;
  aboutMe?: string;
  friends?: string[]; // Array of userIds
  friendRequests?: string[]; // Array of friend request IDs
  achievements?: string[];
  streak?: number;
  lastActive?: number;
  createdAt?: number;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  timestamp: number;
}

export interface Post {
  id: string;
  authorId: string;
  username: string;
  profilePicture?: string; // Base64
  contentText?: string;
  contentLink?: string;
  contentImage?: string; // Base64
  timestamp: number;
  likes: string[]; // Array of userIds
  replies: string[]; // Array of replyIds
}

export interface Reply {
  id: string;
  postId: string;
  authorId: string;
  username: string;
  profilePicture?: string; // Base64
  contentText: string;
  contentImage?: string; // Base64
  timestamp: number;
  likes: string[]; // Array of userIds
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export interface Exam {
  id: string;
  courseId: string;
  courseName: string;
  date: string; // ISO date string
  time: string;
  notes?: string;
}

export interface StudySession {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number; // 0-6
  notes?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number;
}

export interface GradeMapping {
  grade: Grade;
  minScore: number;
  maxScore: number;
  gpaPoints: number;
}

export interface Task {
  id: string;
  userId: string;
  courseId?: string;
  courseName?: string;
  title: string;
  description?: string;
  dueDate: number; // Timestamp
  isCompleted: boolean;
  type: 'assignment' | 'exam' | 'study' | 'other';
  createdAt: number;
}

export interface Resource {
  id: string;
  courseCode: string;
  title: string;
  link?: string; // URL (optional now)
  description?: string;
  uploadedBy: string; // userId
  uploadedByName: string;
  uploadedByProfilePicture?: string; // Base64
  votes: number;
  timestamp: number;
  type?: 'link' | 'image' | 'file'; // Resource type
  imageData?: string; // Base64 image data
  fileData?: string; // Base64 file data
  fileName?: string; // Original file name
  fileSize?: number; // File size in bytes
}

