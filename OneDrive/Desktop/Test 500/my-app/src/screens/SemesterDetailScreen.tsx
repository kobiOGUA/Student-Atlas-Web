import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { Semester } from '../types';
import { calculateSemesterGPA, predictGrade } from '../utils/calculations';
import { fetchSemesters, deleteSemester, updateSemester } from '../services/semesterService';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';


const getGradeColor = (grade?: string) => {
  if (!grade || grade === '--') return '#667eea';
  const g = grade.charAt(0).toUpperCase();
  if (g === 'A') return '#10B981'; // Green
  if (g === 'B') return '#F59E0B'; // Yellow/Amber
  if (g === 'C') return '#4B5563'; // Dark Gray (Gray-600)
  return '#EF4444'; // Red
};

export default function SemesterDetailScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const semesterId = route.params?.semester?.id;
  const [semester, setSemester] = useState<Semester>(route.params?.semester);

  // Reload semester data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadSemesterData();
    }, [semesterId])
  );

  const loadSemesterData = async () => {
    if (!user || !semesterId) return;
    try {
      const semesters = await fetchSemesters(user.uid);
      const updatedSemester = semesters.find(s => s.id === semesterId);
      if (updatedSemester) {
        setSemester(updatedSemester);
      }
    } catch (error) {
      console.error('Error loading semester:', error);
    }
  };

  const handleConvertToPast = () => {
    const convertAction = async () => {
      if (!user) return;
      try {
        // Convert all courses to have final grades based on predicted grades
        const updatedCourses = semester.courses.map(course => {
          const { targetGrade, ...courseWithoutTarget } = course;
          return {
            ...courseWithoutTarget,
            grade: course.grade || predictGrade(course),
          };
        });

        // Sanitize to remove any undefined values
        const sanitizedCourses = JSON.parse(JSON.stringify(updatedCourses));

        // Update semester to past type with updated courses
        await updateSemester(user.uid, semester.id, {
          type: 'past',
          courses: sanitizedCourses,
        });

        if (Platform.OS === 'web') {
          window.alert('Semester converted to past successfully!');
        } else {
          Alert.alert('Success', 'Semester converted to past successfully!');
        }

        // Reload data
        await loadSemesterData();
      } catch (error) {
        console.error('Error converting semester:', error);
        if (Platform.OS === 'web') {
          window.alert('Failed to convert semester');
        } else {
          Alert.alert('Error', 'Failed to convert semester');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Convert "${semester.name}" to a past semester? All courses will be finalized with their current predicted grades.`)) {
        convertAction();
      }
    } else {
      Alert.alert(
        'Convert to Past Semester',
        `Convert "${semester.name}" to a past semester? All courses will be finalized with their current predicted grades.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Convert',
            onPress: convertAction,
          },
        ]
      );
    }
  };

  const handleConvertToPending = () => {
    const convertAction = async () => {
      if (!user) return;
      try {
        await updateSemester(user.uid, semester.id, {
          type: 'pending',
        });

        if (Platform.OS === 'web') {
          window.alert('Semester marked as pending results!');
        } else {
          Alert.alert('Success', 'Semester marked as pending results!');
        }
        await loadSemesterData();
      } catch (error) {
        console.error('Error converting semester:', error);
        Alert.alert('Error', 'Failed to update semester status');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Mark "${semester.name}" as details pending? Use this when you've finished exams but are waiting for results.`)) {
        convertAction();
      }
    } else {
      Alert.alert(
        'Mark as Pending',
        `Mark "${semester.name}" as details pending? Use this when you've finished exams but are waiting for results.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', onPress: convertAction },
        ]
      );
    }
  };

  const gpa = calculateSemesterGPA(semester.courses);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={styles.semesterName}>{semester.name}</Text>
        <Text style={styles.gpaText}>GPA: {gpa.toFixed(2)}</Text>
      </View>

      <ScrollView style={styles.content}>
        {semester.courses.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No courses added yet
          </Text>
        ) : (
          semester.courses.map((course) => {
            const gradeDisplay = course.grade || predictGrade(course) || '--';
            const gradeColor = getGradeColor(gradeDisplay);

            return (
              <TouchableOpacity
                key={course.id}
                style={[
                  styles.courseCard,
                  {
                    backgroundColor: theme.card,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }
                ]}
                onPress={() => navigation.navigate('CourseDetail', { course, semester })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.courseName, { color: theme.text }]}>{course.name}</Text>
                  <Text style={[styles.courseCode, { color: theme.textSecondary }]}>{course.code}</Text>
                  <Text style={[styles.courseInfo, { color: theme.textSecondary }]}>
                    {course.unitHours} units
                  </Text>
                </View>

                <View style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: gradeColor + '33',
                  backgroundColor: gradeColor + '1A',
                  marginLeft: 12,
                  minWidth: 50,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: gradeColor }}>
                    {gradeDisplay}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Convert to Pending Results - only for current semesters */}
        {semester.type === 'current' && (
          <TouchableOpacity
            style={[styles.convertButton, { backgroundColor: theme.secondary }]}
            onPress={handleConvertToPending}
          >
            <Text style={styles.convertButtonText}>Mark as Pending Results</Text>
          </TouchableOpacity>
        )}

        {/* Convert to Past Semester - for current or pending semesters */}
        {(semester.type === 'current' || semester.type === 'pending') && (
          <TouchableOpacity
            style={[styles.convertButton, { backgroundColor: theme.primary }]}
            onPress={handleConvertToPast}
          >
            <Text style={styles.convertButtonText}>Convert to Past Semester</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.error }]}
          onPress={() => {
            const deleteAction = async () => {
              if (!user) return;
              try {
                await deleteSemester(user.uid, semester.id);
                navigation.goBack();
              } catch (error) {
                if (Platform.OS === 'web') {
                  window.alert('Failed to delete semester');
                } else {
                  Alert.alert('Error', 'Failed to delete semester');
                }
              }
            };

            if (Platform.OS === 'web') {
              if (window.confirm(`Are you sure you want to delete "${semester.name}"?`)) {
                deleteAction();
              }
            } else {
              Alert.alert(
                'Delete Semester',
                `Are you sure you want to delete "${semester.name}"?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: deleteAction,
                  },
                ]
              );
            }
          }}
        >
          <Text style={styles.deleteButtonText}>Delete Semester</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('AddCourse', { semester })}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  semesterName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  gpaText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  courseCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  courseCode: {
    fontSize: 14,
    marginBottom: 5,
  },
  courseInfo: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  convertButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  convertButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 80, // Add space for FAB
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
