import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { addCourse } from '../services/semesterService';
import { useTheme } from '../utils/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Semester, TargetGrade, Course, Grade, Schedule } from '../types';
import { unlockAchievement } from '../services/achievementService';

export default function AddCourseScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const semester: Semester = route.params?.semester;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [unitHours, setUnitHours] = useState('');


  // For current semester only
  const [targetGrade, setTargetGrade] = useState<TargetGrade>('B');
  const [midSemester, setMidSemester] = useState('');
  const [assignment, setAssignment] = useState('');
  const [quiz, setQuiz] = useState('');
  const [attendance, setAttendance] = useState('');
  const [examScore, setExamScore] = useState('');

  // For past semester only
  // For past semester only
  const [finalGrade, setFinalGrade] = useState<Grade>('B');

  // Schedule & Exam (Optional, mainly for current)
  const [day, setDay] = useState<string>('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venue, setVenue] = useState('');
  const [examDate, setExamDate] = useState(''); // Simple text for now or ISO string placeholder

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const isPastSemester = semester.type === 'past';


  const handleAdd = async () => {
    if (!name || !code || !unitHours) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate unit hours is a valid number
    const parsedUnitHours = parseInt(unitHours);
    if (isNaN(parsedUnitHours) || parsedUnitHours <= 0) {
      Alert.alert('Error', 'Please enter a valid unit hours value');
      return;
    }

    if (isPastSemester && !finalGrade) {
      Alert.alert('Error', 'Please select the final grade for this course');
      return;
    }

    if (!user) return;

    // Parse CA scores
    const parsedMidSem = parseFloat(midSemester) || 0;
    const parsedAssignment = parseFloat(assignment) || 0;
    const parsedQuiz = parseFloat(quiz) || 0;
    const parsedAttendance = parseFloat(attendance) || 0;
    const parsedExamScore = parseFloat(examScore) || 0;

    // Check if all CA scores are zero for current semester
    if (!isPastSemester) {
      const allCAScoresZero = parsedMidSem === 0 && parsedAssignment === 0 && parsedQuiz === 0 && parsedAttendance === 0 && parsedExamScore === 0;

      if (allCAScoresZero) {
        Alert.alert(
          'CA Scores are Zero',
          'All CA scores are zero. Are you sure you want to add this course? You can put in predicted scores too.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Add Anyway',
              onPress: () => proceedWithAdd(parsedUnitHours, parsedMidSem, parsedAssignment, parsedQuiz, parsedAttendance, parsedExamScore)
            },
          ]
        );
        return;
      }
    }

    proceedWithAdd(parsedUnitHours, parsedMidSem, parsedAssignment, parsedQuiz, parsedAttendance, parsedExamScore);
  };

  const proceedWithAdd = async (
    parsedUnitHours: number,
    parsedMidSem: number,
    parsedAssignment: number,
    parsedQuiz: number,
    parsedAttendance: number,
    parsedExamScore: number
  ) => {
    if (!user) return;

    const newCourse: Course = {
      id: Date.now().toString(),
      name,
      code,
      unitHours: parsedUnitHours,
      // difficulty removed
      caScores: {
        midSemester: parsedMidSem,
        assignment: parsedAssignment,
        quiz: parsedQuiz,
        attendance: parsedAttendance,
        examScore: parsedExamScore,
      },
      ...(day && startTime && endTime && {
        schedule: {
          day: day as Schedule['day'],
          startTime,
          endTime,
          venue
        }
      }),
      ...(examDate && { examDate }),
    };

    try {
      await addCourse(user.uid, semester.id, newCourse);

      // Check Achievement
      const unlocked = await unlockAchievement(user.uid, 'scholar');
      if (unlocked) {
        Alert.alert('🏆 Achievement Unlocked!', 'You earned the "Scholar" badge.');
      }

      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.label, { color: theme.text }]}>Course Name *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
          placeholder="e.g., Data Structures"
          placeholderTextColor={theme.textSecondary}
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.label, { color: theme.text }]}>Course Code *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
          placeholder="e.g., CSC201"
          placeholderTextColor={theme.textSecondary}
          value={code}
          onChangeText={setCode}
        />

        <Text style={[styles.label, { color: theme.text }]}>Unit Hours *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
          placeholder="e.g., 3"
          placeholderTextColor={theme.textSecondary}
          value={unitHours}
          onChangeText={setUnitHours}
          keyboardType="numeric"
        />

        {isPastSemester ? (
          // PAST SEMESTER: Just select final grade
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Final Grade</Text>
            <View style={styles.gradeContainer}>
              {(['A', 'B', 'C', 'D', 'E', 'F'] as Grade[]).map((grade) => (
                <TouchableOpacity
                  key={grade}
                  style={[
                    styles.gradeButton,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    finalGrade === grade && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => setFinalGrade(grade)}
                >
                  <Text style={[styles.gradeText, { color: finalGrade === grade ? '#FFFFFF' : theme.text }]}>
                    {grade}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          // CURRENT SEMESTER: CA scores and target grade
          <>
            <Text style={[styles.label, { color: theme.text }]}>Target Grade</Text>
            <View style={styles.gradeContainer}>
              {(['A', 'B', 'C'] as TargetGrade[]).map((grade) => (
                <TouchableOpacity
                  key={grade}
                  style={[
                    styles.gradeButton,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    targetGrade === grade && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => setTargetGrade(grade)}
                >
                  <Text style={[styles.gradeText, { color: targetGrade === grade ? '#FFFFFF' : theme.text }]}>
                    {grade}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: theme.text }]}>CA Scores (Optional)</Text>

            <Text style={[styles.label, { color: theme.text }]}>Mid Semester (0-15)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              value={midSemester}
              onChangeText={setMidSemester}
              keyboardType="numeric"
            />

            <Text style={[styles.label, { color: theme.text }]}>Assignment (0-10)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              value={assignment}
              onChangeText={setAssignment}
              keyboardType="numeric"
            />

            <Text style={[styles.label, { color: theme.text }]}>Quiz (0-10)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              value={quiz}
              onChangeText={setQuiz}
              keyboardType="numeric"
            />

            <Text style={[styles.label, { color: theme.text }]}>Attendance (0-5)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              value={attendance}
              onChangeText={setAttendance}
              keyboardType="numeric"
            />

            <Text style={[styles.label, { color: theme.text }]}>Exam Score (0-60)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              value={examScore}
              onChangeText={setExamScore}
              keyboardType="numeric"
            />
          </>
        )}

        {/* Schedule Section - Only relevant for Current Semesters ideally, but allowing for all if needed. Usually Current. */}
        {!isPastSemester && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Schedule & Details (Optional)</Text>

            <Text style={[styles.label, { color: theme.text }]}>Day of Week</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
              {DAYS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.dayButton,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    day === d && { backgroundColor: theme.primary, borderColor: theme.primary }
                  ]}
                  onPress={() => setDay(d)}
                >
                  <Text style={[styles.dayText, { color: day === d ? '#FFFFFF' : theme.text }]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.timeRow}>
              <View style={styles.timeInputContainer}>
                <Text style={[styles.label, { color: theme.text }]}>Start Time (HH:mm)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                  placeholder="09:00"
                  placeholderTextColor={theme.textSecondary}
                  value={startTime}
                  onChangeText={setStartTime}
                />
              </View>
              <View style={styles.timeInputContainer}>
                <Text style={[styles.label, { color: theme.text }]}>End Time (HH:mm)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                  placeholder="10:30"
                  placeholderTextColor={theme.textSecondary}
                  value={endTime}
                  onChangeText={setEndTime}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: theme.text }]}>Venue</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="e.g. Hall A"
              placeholderTextColor={theme.textSecondary}
              value={venue}
              onChangeText={setVenue}
            />

            <Text style={[styles.label, { color: theme.text }]}>Exam Date (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="2024-05-20"
              placeholderTextColor={theme.textSecondary}
              value={examDate}
              onChangeText={setExamDate}
            />
          </>
        )}



        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={handleAdd}
        >
          <Text style={styles.addButtonText}>Add Course</Text>
        </TouchableOpacity>
      </View>
    </ScrollView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    height: 45,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  gradeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  gradeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  gradeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    marginTop: 30,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  daysScroll: {
    marginBottom: 10,
  },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 15,
  },
  timeInputContainer: {
    flex: 1,
  },
});
