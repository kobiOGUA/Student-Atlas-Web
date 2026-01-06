import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { updateCourse } from '../services/semesterService';
import { useTheme } from '../utils/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Course, TargetGrade, Grade } from '../types';
import { CA_MAX_SCORES } from '../constants';
import { scoreToGrade } from '../utils/calculations';

export default function EditCourseScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const { semesterId, course }: { semesterId: string; course: Course } = route.params;

  // State for all course fields
  const [name, setName] = useState(course.name);
  const [code, setCode] = useState(course.code);
  const [unitHours, setUnitHours] = useState(course.unitHours.toString());

  const [useCA, setUseCA] = useState((course as any).useCA !== false);
  const [manualGrade, setManualGrade] = useState((course as any).grade || 'A');
  const [midSemester, setMidSemester] = useState(course.caScores.midSemester.toString());
  const [assignment, setAssignment] = useState(course.caScores.assignment.toString());
  const [quiz, setQuiz] = useState(course.caScores.quiz.toString());
  const [attendance, setAttendance] = useState(course.caScores.attendance.toString());

  const handleSave = async () => {
    if (!name || !code || !unitHours) {
      if (Platform.OS === 'web') {
        window.alert('Please fill in all required fields');
      } else {
        Alert.alert('Error', 'Please fill in all required fields');
      }
      return;
    }

    // Validate unit hours is a valid number
    const parsedUnitHours = parseInt(unitHours);
    if (isNaN(parsedUnitHours) || parsedUnitHours <= 0) {
      if (Platform.OS === 'web') {
        window.alert('Please enter a valid unit hours value');
      } else {
        Alert.alert('Error', 'Please enter a valid unit hours value');
      }
      return;
    }

    // Parse CA scores
    const parsedMidSem = parseFloat(midSemester) || 0;
    const parsedAssignment = parseFloat(assignment) || 0;
    const parsedQuiz = parseFloat(quiz) || 0;
    const parsedAttendance = parseFloat(attendance) || 0;

    // Check if all CA scores are zero
    const allCAScoresZero = parsedMidSem === 0 && parsedAssignment === 0 && parsedQuiz === 0 && parsedAttendance === 0;

    if (allCAScoresZero) {
      const confirmSave = () => {
        proceedWithSave(parsedUnitHours, parsedMidSem, parsedAssignment, parsedQuiz, parsedAttendance);
      };

      if (Platform.OS === 'web') {
        if (window.confirm('All CA scores are zero. Are you sure you want to save changes? You can put in predicted scores too.')) {
          confirmSave();
        }
      } else {
        Alert.alert(
          'CA Scores are Zero',
          'All CA scores are zero. Are you sure you want to save changes? You can put in predicted scores too.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Save Anyway', onPress: confirmSave },
          ]
        );
      }
      return;
    }

    proceedWithSave(parsedUnitHours, parsedMidSem, parsedAssignment, parsedQuiz, parsedAttendance);
  };

  const proceedWithSave = async (
    parsedUnitHours: number,
    parsedMidSem: number,
    parsedAssignment: number,
    parsedQuiz: number,
    parsedAttendance: number
  ) => {
    if (!user) return;

    try {
      // Create updates object with only the fields we want to update
      const updates: any = {
        name,
        code,
        unitHours: parsedUnitHours,
        // difficulty removed
        caScores: {
          midSemester: parsedMidSem,
          assignment: parsedAssignment,
          quiz: parsedQuiz,
          attendance: parsedAttendance,
          examScore: course.caScores.examScore || 0,
        },
      };

      // Logic for Grade
      const currentTotalCA = parsedMidSem + parsedAssignment + parsedQuiz + parsedAttendance;
      let finalGrade = manualGrade;

      if (useCA) {
        finalGrade = scoreToGrade(currentTotalCA + 60) || 'A';
      }

      updates.useCA = useCA;
      updates.grade = finalGrade;
      updates.predictedGrade = finalGrade;
      updates.targetGrade = null;

      // Remove any undefined values to satisfy Firestore
      const sanitizedUpdates = JSON.parse(JSON.stringify(updates));

      await updateCourse(user.uid, semesterId, course.id, sanitizedUpdates);

      if (Platform.OS === 'web') {
        window.alert('Course updated successfully!');
      } else {
        Alert.alert('Success', 'Course updated successfully!');
      }

      // Navigate back and refresh the parent screen
      navigation.goBack();
    } catch (error: any) {
      console.error('Error updating course:', error);
      if (Platform.OS === 'web') {
        window.alert(error.message || 'Failed to update course');
      } else {
        Alert.alert('Error', error.message || 'Failed to update course');
      }
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Edit Course</Text>

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

        <Text style={[styles.label, { color: theme.text }]}>Calculation Mode</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, padding: 12, backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
          <Text style={{ color: theme.text, fontSize: 16 }}>Use CA (Projected)</Text>
          <Switch value={useCA} onValueChange={setUseCA} trackColor={{ false: '#767577', true: theme.primary }} thumbColor={'#f4f3f4'} />
        </View>

        {!useCA && (
          <>
            <Text style={[styles.label, { color: theme.text }]}>Manual Grade</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="A, B, C..."
              placeholderTextColor={theme.textSecondary}
              value={manualGrade}
              onChangeText={setManualGrade}
            />
          </>
        )}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>CA Scores</Text>
        <Text style={[styles.helperText, { color: theme.textSecondary }]}>Enter actual or predicted scores</Text>

        <Text style={[styles.label, { color: theme.text }]}>Mid Semester (0-{CA_MAX_SCORES.midSemester})</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
          placeholder="0"
          placeholderTextColor={theme.textSecondary}
          value={midSemester}
          onChangeText={setMidSemester}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: theme.text }]}>Assignment (0-{CA_MAX_SCORES.assignment})</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
          placeholder="0"
          placeholderTextColor={theme.textSecondary}
          value={assignment}
          onChangeText={setAssignment}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: theme.text }]}>Quiz (0-{CA_MAX_SCORES.quiz})</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
          placeholder="0"
          placeholderTextColor={theme.textSecondary}
          value={quiz}
          onChangeText={setQuiz}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: theme.text }]}>Attendance (0-{CA_MAX_SCORES.attendance})</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
          placeholder="0"
          placeholderTextColor={theme.textSecondary}
          value={attendance}
          onChangeText={setAttendance}
          keyboardType="numeric"
        />



        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  helperText: {
    fontSize: 14,
    marginBottom: 15,
    fontStyle: 'italic',
  },
  gradeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  gradeButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 5,
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
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  difficultyButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
