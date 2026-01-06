import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../firebase/firebaseConfig';
import { fetchSemesters, deleteSemester } from '../services/semesterService';
import { fetchTasks } from '../services/taskService';
import { Semester, Task } from '../types';
import { useTheme } from '../utils/ThemeContext';
import { calculateCGPA, calculatePredictedCGPA, calculateSemesterGPA } from '../utils/calculations';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function DashboardScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [nextEvent, setNextEvent] = useState<any>(null);
  const [nextTask, setNextTask] = useState<Task | null>(null);
  const [excludeCurrentGPA, setExcludeCurrentGPA] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('excludeCurrentGPA').then(val => {
      if (val !== null) setExcludeCurrentGPA(val === 'true');
    });
  }, []);

  // End Semester State
  const [endSemModalVisible, setEndSemModalVisible] = useState(false);
  const [semScores, setSemScores] = useState<{ [key: string]: string }>({});
  const [endingSem, setEndingSem] = useState(false);
  const [gradeInputMode, setGradeInputMode] = useState<'score' | 'grade'>('score');

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    if (!user?.uid) return;
    try {
      const semData = await fetchSemesters(user.uid);
      setSemesters(semData);

      // Calculate Widgets
      const currentSemester = semData.find(s => s.type === 'current');
      calculateNextEvent(currentSemester);

      const tasks = await fetchTasks(user.uid);
      calculateNextTask(tasks);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const calculateNextEvent = (semester: Semester | undefined) => {
    if (!semester) { setNextEvent(null); return; }

    const now = new Date();
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = DAYS[now.getDay()];
    const nowTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const todayDate = now.toISOString().split('T')[0];

    const candidates: any[] = [];

    // Courses
    (semester.courses || []).forEach(c => {
      const schedules = c.schedules || (c.schedule ? [c.schedule] : []);
      schedules.forEach(s => {
        if (s.day === today && s.startTime > nowTime) {
          candidates.push({ ...s, title: c.name, type: 'course' });
        }
      });
    });

    // Custom Events
    (semester.customEvents || []).forEach(e => {
      let isToday = false;
      if (e.isRecurring && e.day === today) isToday = true;
      if (!e.isRecurring && e.date === todayDate) isToday = true;

      if (isToday && e.startTime > nowTime) {
        candidates.push({ ...e, type: 'custom' });
      }
    });

    if (candidates.length > 0) {
      candidates.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setNextEvent(candidates[0]);
    } else {
      setNextEvent(null);
    }
  };

  const calculateNextTask = (tasks: Task[]) => {
    const todayDate = new Date().toISOString().split('T')[0];
    // Filter active tasks >= today
    const upcoming = tasks.filter(t => !t.isCompleted && new Date(t.dueDate).toISOString().split('T')[0] >= todayDate);
    upcoming.sort((a, b) => a.dueDate - b.dueDate);
    setNextTask(upcoming.length > 0 ? upcoming[0] : null);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const pastSemesters = semesters.filter(s => s.type === 'past');
  const pendingSemesters = semesters.filter(s => s.type === 'pending');
  const currentSemester = semesters.find(s => s.type === 'current');
  const cgpa = calculateCGPA(semesters);
  const predictedCGPA = calculatePredictedCGPA(
    excludeCurrentGPA ? semesters.filter(s => s.type !== 'current') : semesters
  );

  const handleDeleteSemester = (semesterId: string, semesterName: string) => {
    Alert.alert(
      'Delete Semester',
      `Are you sure you want to delete "${semesterName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user?.uid) return;
            try {
              await deleteSemester(user.uid, semesterId);
              await loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete semester');
            }
          },
        },
      ]
    );
  };

  const [selectedSemesterForEnd, setSelectedSemesterForEnd] = useState<Semester | null>(null);

  const handleEndSemester = async () => {
    if (!selectedSemesterForEnd || !user) return;

    // Validate inputs
    const courseIds = selectedSemesterForEnd.courses.map(c => c.id);
    for (const id of courseIds) {
      if (!semScores[id]) {
        Alert.alert('Missing Input', 'Please enter a score or grade for all courses.');
        return;
      }

      if (gradeInputMode === 'score') {
        const score = parseInt(semScores[id]);
        if (isNaN(score) || score < 0 || score > 100) {
          Alert.alert('Invalid Score', 'Scores must be between 0 and 100.');
          return;
        }
      } else {
        const validGrades = ['A', 'B', 'C', 'D', 'E', 'F'];
        if (!validGrades.includes(semScores[id].toUpperCase())) {
          Alert.alert('Invalid Grade', 'Grades must be A, B, C, D, E, or F.');
          return;
        }
      }
    }

    setEndingSem(true);
    try {
      let totalPoints = 0;
      let totalUnits = 0;

      const updatedCourses = selectedSemesterForEnd.courses.map(c => {
        let grade: any = 'F';
        let points = 0;
        let finalScore: number | undefined;

        if (gradeInputMode === 'score') {
          // Calculate grade from score
          const score = parseInt(semScores[c.id]);
          finalScore = score;

          if (score >= 70) { grade = 'A'; points = 5; }
          else if (score >= 60) { grade = 'B'; points = 4; }
          else if (score >= 50) { grade = 'C'; points = 3; }
          else if (score >= 45) { grade = 'D'; points = 2; }
          else if (score >= 40) { grade = 'E'; points = 1; }
        } else {
          // Use grade directly
          grade = semScores[c.id].toUpperCase();

          if (grade === 'A') points = 5;
          else if (grade === 'B') points = 4;
          else if (grade === 'C') points = 3;
          else if (grade === 'D') points = 2;
          else if (grade === 'E') points = 1;
          else points = 0;
        }

        totalPoints += (points * c.unitHours);
        totalUnits += c.unitHours;

        return { ...c, finalScore, grade };
      });

      const semGpa = totalUnits > 0 ? (totalPoints / totalUnits) : 0;

      const semRef = doc(db, 'users', user.uid, 'semesters', selectedSemesterForEnd.id);
      await updateDoc(semRef, {
        courses: updatedCourses,
        gpa: semGpa,
        type: 'past'
      });

      Alert.alert('Success', `Semester completed! GPA: ${semGpa.toFixed(2)}`);
      setEndSemModalVisible(false);
      onRefresh();

    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to end semester');
    } finally {
      setEndingSem(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={styles.headerTitle}>Kobi's Atlas</Text>
          </View>
          <View style={{ alignItems: 'flex-end', maxWidth: '50%' }}>
            {nextEvent && (
              <Text style={{ color: '#fff', fontSize: 12, marginBottom: 4 }}>
                Next: <Text style={{ fontWeight: 'bold' }}>{nextEvent.startTime} - {nextEvent.title}</Text>
              </Text>
            )}

            {nextTask && (
              <Text style={{ color: '#fff', fontSize: 12 }}>
                Task: <Text style={{ fontWeight: 'bold' }}>{nextTask.title}</Text>
              </Text>
            )}
          </View>
        </View>


        <View style={styles.gpaContainer}>
          <View style={styles.gpaItem}>
            <Text style={styles.gpaLabel}>Current CGPA</Text>
            <Text style={styles.gpaValue}>{cgpa.toFixed(2)}</Text>
          </View>
          {(currentSemester || pendingSemesters.length > 0) && (
            <View style={styles.gpaItem}>
              <Text style={styles.gpaLabel}>Predicted CGPA</Text>
              <Text style={styles.gpaValue}>{predictedCGPA.toFixed(2)}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

        {currentSemester && (
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Current Semester</Text>
            </View>
            <TouchableOpacity
              style={[styles.semesterCard, { backgroundColor: theme.card, borderColor: theme.primary }]}
              onPress={() => navigation.navigate('SemesterDetail', { semester: currentSemester })}
              onLongPress={() => handleDeleteSemester(currentSemester.id, currentSemester.name)}
            >
              <Text style={[styles.semesterName, { color: theme.text }]}>{currentSemester.name}</Text>
              <Text style={[styles.semesterInfo, { color: theme.textSecondary }]}>
                {currentSemester.courses.length} courses
              </Text>
              {currentSemester.predictedGPA !== undefined && (
                <Text style={[styles.gpa, { color: theme.primary }]}>
                  Predicted GPA: {currentSemester.predictedGPA.toFixed(2)}
                </Text>
              )}
            </TouchableOpacity>

            <View style={{ marginTop: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: theme.textSecondary, marginRight: 10, fontSize: 12 }}>Exclude from Predicted</Text>
              <Switch
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={excludeCurrentGPA ? '#fff' : '#f4f3f4'}
                onValueChange={(val) => {
                  setExcludeCurrentGPA(val);
                  AsyncStorage.setItem('excludeCurrentGPA', String(val));
                }}
                value={excludeCurrentGPA}
              />
            </View>
          </View>
        )}

        {pendingSemesters.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Pending Semesters</Text>
            {pendingSemesters.map(semester => (
              <View key={semester.id} style={{ marginBottom: 10 }}> {/* Wrap each card with View for positioning */}
                <TouchableOpacity
                  style={[styles.semesterCard, { backgroundColor: theme.card, borderColor: theme.secondary }]}
                  onPress={() => navigation.navigate('SemesterDetail', { semester })}
                  onLongPress={() => handleDeleteSemester(semester.id, semester.name)}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={[styles.semesterName, { color: theme.text }]}>{semester.name}</Text>
                      <Text style={[styles.semesterInfo, { color: theme.textSecondary }]}>
                        {semester.courses.length} courses
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedSemesterForEnd(semester);
                        setEndSemModalVisible(true);
                      }}
                      style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: theme.secondary, borderRadius: 12, alignSelf: 'flex-start' }}
                    >
                      <Text style={{ fontSize: 10, color: '#fff', fontWeight: 'bold' }}>Enter Grades</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.gpa, { color: theme.secondary }]}>
                    Predicted GPA: {calculateSemesterGPA(semester.courses).toFixed(2)}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Past Semesters</Text>
          {pastSemesters.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No past semesters yet
            </Text>
          ) : (
            pastSemesters.map(semester => (
              <TouchableOpacity
                key={semester.id}
                style={[styles.semesterCard, { backgroundColor: theme.card }]}
                onPress={() => navigation.navigate('SemesterDetail', { semester })}
                onLongPress={() => handleDeleteSemester(semester.id, semester.name)}
              >
                <Text style={[styles.semesterName, { color: theme.text }]}>{semester.name}</Text>
                <Text style={[styles.semesterInfo, { color: theme.textSecondary }]}>
                  {semester.courses.length} courses
                </Text>
                {semester.gpa !== undefined && (
                  <Text style={[styles.gpa, { color: theme.success }]}>
                    GPA: {semester.gpa.toFixed(2)}
                  </Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('AddSemester')}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* End Semester Modal */}
      <Modal
        visible={endSemModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEndSemModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Complete Semester</Text>

            {/* Input Mode Toggle */}
            <View style={{ flexDirection: 'row', marginBottom: 15, backgroundColor: theme.surface, borderRadius: 8, padding: 4, borderWidth: 1, borderColor: theme.border }}>
              <TouchableOpacity
                style={{ flex: 1, padding: 8, alignItems: 'center', backgroundColor: gradeInputMode === 'score' ? theme.primary : 'transparent', borderRadius: 6 }}
                onPress={() => setGradeInputMode('score')}
              >
                <Text style={{ color: gradeInputMode === 'score' ? '#FFFFFF' : theme.text, fontWeight: 'bold', fontSize: 12 }}>Enter Scores</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, padding: 8, alignItems: 'center', backgroundColor: gradeInputMode === 'grade' ? theme.primary : 'transparent', borderRadius: 6 }}
                onPress={() => setGradeInputMode('grade')}
              >
                <Text style={{ color: gradeInputMode === 'grade' ? '#FFFFFF' : theme.text, fontWeight: 'bold', fontSize: 12 }}>Enter Grades</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { marginBottom: 15 }]}>
              {gradeInputMode === 'score' ? 'Enter final scores (0-100)' : 'Select letter grades (A-F)'}
            </Text>

            <ScrollView style={{ maxHeight: 300 }}>
              {selectedSemesterForEnd?.courses.map(course => (
                <View key={course.id} style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>{course.code}</Text>
                  {gradeInputMode === 'score' ? (
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                      placeholder="0-100"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="numeric"
                      value={semScores[course.id] || ''}
                      onChangeText={(text) => setSemScores(prev => ({ ...prev, [course.id]: text }))}
                    />
                  ) : (
                    <View style={{ flexDirection: 'row', gap: 6, flex: 1 }}>
                      {['A', 'B', 'C', 'D', 'E', 'F'].map(grade => (
                        <TouchableOpacity
                          key={grade}
                          onPress={() => setSemScores(prev => ({ ...prev, [course.id]: grade }))}
                          style={[
                            styles.gradeButton,
                            {
                              backgroundColor: semScores[course.id] === grade ? theme.primary : theme.background,
                              borderColor: theme.border
                            }
                          ]}
                        >
                          <Text style={{ color: semScores[course.id] === grade ? '#fff' : theme.text, fontWeight: 'bold' }}>{grade}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.background }]}
                onPress={() => setEndSemModalVisible(false)}
              >
                <Text style={{ color: theme.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={handleEndSemester}
                disabled={endingSem}
              >
                {endingSem ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Complete</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  gpaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  gpaItem: {
    alignItems: 'center',
  },
  gpaLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  gpaValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  semesterCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  semesterName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  semesterInfo: {
    fontSize: 14,
    marginBottom: 5,
  },
  gpa: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 15,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  gradeButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
  },
});
