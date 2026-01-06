import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { fetchSemesters } from '../services/semesterService';
import { Semester } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { calculateCGPA, calculatePredictedCGPA, calculateSemesterGPA, scoreToGrade } from '../utils/calculations';
import { generateTranscript } from '../services/pdfService';
import { unlockAchievement } from '../services/achievementService';
import { Alert, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function GPAViewScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { user, userEmail } = useAuth();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'current' | 'predicted'>('current');
  const [exporting, setExporting] = useState(false);
  const [excludeCurrent, setExcludeCurrent] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        // Load exclude setting FIRST
        const val = await AsyncStorage.getItem('excludeCurrentGPA');
        setExcludeCurrent(val === 'true');
        // Then load semesters
        await loadSemesters();
      };
      loadData();
    }, [user?.uid])
  );

  const loadSemesters = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const data = await fetchSemesters(user.uid);
      // Sort by timestamp (newest first)
      const sortedSemesters = data.sort((a, b) => a.timestamp - b.timestamp);
      setSemesters(sortedSemesters);

      // Check for 'first_class' achievement
      const cgpa = calculateCGPA(sortedSemesters);
      if (cgpa >= 4.5 && user) {
        const unlocked = await unlockAchievement(user.uid, 'first_class');
        if (unlocked) {
          Alert.alert('🏆 Achievement Unlocked!', 'You earned the "First Class" badge for maintaining a high CGPA!');
        }
      }
    } catch (error) {
      console.error('Error loading semesters:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get semesters relevant to the current tab
  const getRelevantSemesters = () => {
    if (activeTab === 'current') {
      return semesters.filter(s => s.type === 'past');
    }
    // Predicted tab - respect exclude toggle
    if (excludeCurrent) {
      return semesters.filter(s => s.type !== 'current');
    }
    return semesters;
  };

  const getSemesterStats = (semester: Semester) => {
    // If it's a Quick Add semester (no courses), use the stored values
    if (semester.courses.length === 0 && semester.totalUnits !== undefined && semester.gpa !== undefined) {
      return { gpa: semester.gpa, totalCredits: semester.totalUnits, courseCount: 0 };
    }

    const gpa = calculateSemesterGPA(semester.courses);
    const totalCredits = semester.courses.reduce((sum, c) => sum + (Number(c.unitHours) || 0), 0);
    return { gpa, totalCredits, courseCount: semester.courses.length };
  };

  const calculateAggregateStats = () => {
    if (activeTab === 'current') {
      const gpa = calculateCGPA(semesters);
      const relevantSemesters = getRelevantSemesters();
      const credits = relevantSemesters.reduce((sum, s) => sum + getSemesterStats(s).totalCredits, 0);
      return {
        gpa: gpa.toFixed(2),
        credits,
        semesterCount: relevantSemesters.length
      };
    } else {
      const relevantSemesters = excludeCurrent ? semesters.filter(s => s.type !== 'current') : semesters;
      const gpa = calculatePredictedCGPA(relevantSemesters);
      const credits = relevantSemesters.reduce((sum, s) => sum + getSemesterStats(s).totalCredits, 0);
      return {
        gpa: gpa.toFixed(2),
        credits,
        semesterCount: semesters.length
      };
    }
  };

  const getGPATrend = () => {
    if (activeTab === 'predicted' && semesters.length > 0) {
      // On Predicted tab: Compare Predicted CGPA vs Current CGPA
      const currentCGPA = calculateCGPA(semesters);
      const relevantSemesters = excludeCurrent ? semesters.filter(s => s.type !== 'current') : semesters;
      const predictedCGPA = calculatePredictedCGPA(relevantSemesters);
      const diff = predictedCGPA - currentCGPA;

      if (diff > 0.01) return 'up';
      if (diff < -0.01) return 'down';
      return 'neutral';
    }

    // On Current tab: Compare last two semesters
    const relevantSemesters = getRelevantSemesters();
    if (relevantSemesters.length < 2) return 'neutral';

    const lastSem = relevantSemesters[relevantSemesters.length - 1];
    const prevSem = relevantSemesters[relevantSemesters.length - 2];

    // Handle Quick Add semesters (which have gpa but no courses)
    const lastGPA = lastSem.gpa !== undefined && lastSem.courses.length === 0
      ? lastSem.gpa
      : calculateSemesterGPA(lastSem.courses);

    const prevGPA = prevSem.gpa !== undefined && prevSem.courses.length === 0
      ? prevSem.gpa
      : calculateSemesterGPA(prevSem.courses);

    const diff = lastGPA - prevGPA;
    if (diff > 0.01) return 'up';
    if (diff < -0.01) return 'down';
    return 'neutral';
  };

  const getSemesterGPA = (sem: Semester) => {
    if (sem.totalUnits && sem.gpa !== undefined && sem.courses.length === 0) {
      return sem.gpa;
    }
    return calculateSemesterGPA(sem.courses);
  };

  const getHighestGPA = () => {
    const relevantSemesters = getRelevantSemesters();
    if (relevantSemesters.length === 0) return { gpa: '0.00', name: 'N/A' };

    const highest = relevantSemesters.reduce((max, sem) => {
      const maxGPA = getSemesterGPA(max);
      const semGPA = getSemesterGPA(sem);
      return semGPA > maxGPA ? sem : max;
    });

    return {
      gpa: getSemesterGPA(highest).toFixed(2),
      name: highest.name
    };
  };

  const getLowestGPA = () => {
    const relevantSemesters = getRelevantSemesters();
    if (relevantSemesters.length === 0) return { gpa: '0.00', name: 'N/A' };

    const lowest = relevantSemesters.reduce((min, sem) => {
      const minGPA = getSemesterGPA(min);
      const semGPA = getSemesterGPA(sem);
      return semGPA < minGPA ? sem : min;
    });

    return {
      gpa: getSemesterGPA(lowest).toFixed(2),
      name: lowest.name
    };
  };

  const getGradeDistribution = () => {
    const distribution: { [key: string]: number } = {};
    const relevantSemesters = getRelevantSemesters();

    relevantSemesters.forEach(sem => {
      // For grade distribution, we only want actual finalized grades (past semesters)
      // or if we really want to show predicted grades, we'd iterate everything.
      // But typically "Grade Distribution" implies real grades.
      if (sem.type === 'past') {
        sem.courses.forEach(course => {
          let grade = course.grade;
          if (course.finalScore !== undefined) {
            grade = scoreToGrade(course.finalScore);
          }
          if (grade) {
            distribution[grade] = (distribution[grade] || 0) + 1;
          }
        });
      }
    });
    return distribution;
  };

  const getDegreeClassification = (gpa: number) => {
    if (gpa >= 4.50) return { label: 'First Class', color: '#FFD700', icon: 'star' };
    if (gpa >= 3.50) return { label: 'Second Class (Upper Division)', color: '#4CAF50', icon: 'checkmark-circle' };
    if (gpa >= 2.40) return { label: 'Second Class (Lower Division)', color: '#FF9800', icon: 'remove-circle' };
    if (gpa >= 1.50) return { label: 'Third Class', color: '#9E9E9E', icon: 'ellipse' };
    return { label: 'Fail', color: '#F44336', icon: 'alert-circle' };
  };

  const renderGPAChart = () => {
    const relevantSemesters = getRelevantSemesters();
    if (relevantSemesters.length === 0) return null;

    const chartHeight = 150;
    // Use Flexbox for responsive layout instead of fixed Dimensions

    return (
      <View style={styles.chartContainer}>
        <Text style={[styles.chartTitle, { color: theme.text }]}>GPA Trend ({activeTab === 'current' ? 'Real' : 'Predicted'})</Text>
        <View style={styles.chart}>
          {relevantSemesters.map((sem) => {
            let gpa: number;

            if (sem.totalUnits && sem.gpa !== undefined && sem.courses.length === 0) {
              gpa = Number(sem.gpa);
            } else {
              gpa = Number(calculateSemesterGPA(sem.courses));
            }

            const displayGPA = Math.min(gpa, 5.0);
            const height = (displayGPA / 5.0) * chartHeight;
            const barColor = sem.type === 'past' ? theme.primary : theme.secondary;

            return (
              <View key={sem.id} style={[styles.barContainer, { flex: 1, maxWidth: 60 }]}>
                <View style={[styles.bar, { height, backgroundColor: barColor, width: '60%', minWidth: 20 }]}>
                  <Text style={styles.barLabel}>{gpa.toFixed(2)}</Text>
                </View>
                <Text style={[styles.barName, { color: theme.textSecondary }]} numberOfLines={1}>
                  {sem.name.split(' ')[0]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderGradeDistribution = () => {
    const distribution = getGradeDistribution();
    const grades = ['A', 'B', 'C', 'D', 'E', 'F'];
    const total = Object.values(distribution).reduce((a, b) => a + b, 0);

    if (total === 0) return null;

    return (
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Grade Distribution (Graded Courses)</Text>
        <View style={styles.distributionContainer}>
          {grades.map(grade => {
            const count = distribution[grade] || 0;
            const percentage = total > 0 ? (count / total) * 100 : 0;
            if (count === 0) return null;

            return (
              <View key={grade} style={styles.distributionRow}>
                <Text style={[styles.gradeLabel, { color: theme.text }]}>{grade}</Text>
                <View style={styles.distributionBarContainer}>
                  <View
                    style={[
                      styles.distributionBar,
                      { width: `${percentage}%`, backgroundColor: theme.primary }
                    ]}
                  />
                </View>
                <Text style={[styles.countLabel, { color: theme.textSecondary }]}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );

  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const transcriptUser = user ? {
        uid: user.uid,
        email: userEmail || '',
        displayName: 'Student',
      } as any : null;
      await generateTranscript(transcriptUser, semesters);
      if (Platform.OS !== 'web') {
        // Only show success alert on native, as web sharing is different
        // But shareAsync usually handles the UI.
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Failed to generate transcript');
      } else {
        Alert.alert('Error', 'Failed to generate transcript');
      }
    } finally {
      setExporting(false);
    }
  };

  const aggregateStats = calculateAggregateStats();
  const trend = getGPATrend();
  const highest = getHighestGPA();
  const lowest = getLowestGPA();
  const relevantSemesters = getRelevantSemesters();
  const classification = getDegreeClassification(parseFloat(aggregateStats.gpa));

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={styles.headerTitle}>GPA Overview</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'current' && { backgroundColor: theme.primary }
          ]}
          onPress={() => setActiveTab('current')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'current' ? '#FFFFFF' : theme.text }
          ]}>Current (Real)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'predicted' && { backgroundColor: theme.primary }
          ]}
          onPress={() => setActiveTab('predicted')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'predicted' ? '#FFFFFF' : theme.text }
          ]}>Predicted</Text>
        </TouchableOpacity>
      </View>

      {/* Degree Classification Banner */}
      <View style={[styles.classificationCard, { backgroundColor: theme.card }]}>
        <Ionicons name={classification.icon as any} size={36} color={classification.color} />
        <View style={styles.classificationInfo}>
          <Text style={[styles.classificationLabel, { color: theme.textSecondary }]}>Current Standing</Text>
          <Text style={[styles.classificationValue, { color: classification.color }]}>
            {classification.label}
          </Text>
        </View>
      </View>

      {/* Main Stats */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Ionicons name="school" size={32} color={theme.primary} />
          <Text style={[styles.statValue, { color: theme.text }]}>{aggregateStats.gpa}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            {activeTab === 'current' ? 'Cumulative GPA' : 'Predicted GPA'}
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Ionicons name="book" size={32} color={theme.primary} />
          <Text style={[styles.statValue, { color: theme.text }]}>{aggregateStats.credits}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Credits</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Ionicons name="calendar" size={32} color={theme.primary} />
          <Text style={[styles.statValue, { color: theme.text }]}>{aggregateStats.semesterCount}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Semesters</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Ionicons
            name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove'}
            size={32}
            color={trend === 'up' ? '#4CAF50' : trend === 'down' ? '#F44336' : theme.textSecondary}
          />
          <Text style={[styles.statValue, { color: theme.text }]}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Trend</Text>
        </View>
      </View>

      {/* GPA Chart */}
      {relevantSemesters.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          {renderGPAChart()}
        </View>
      )}

      {/* Insights */}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Insights</Text>

        <View style={styles.insightRow}>
          <Ionicons name="trophy" size={20} color="#FFD700" />
          <Text style={[styles.insightText, { color: theme.text }]}>
            Best Semester: <Text style={{ fontWeight: 'bold' }}>{highest.name}</Text> ({highest.gpa})
          </Text>
        </View>

        <View style={styles.insightRow}>
          <Ionicons name="alert-circle" size={20} color="#FF9800" />
          <Text style={[styles.insightText, { color: theme.text }]}>
            Lowest Semester: <Text style={{ fontWeight: 'bold' }}>{lowest.name}</Text> ({lowest.gpa})
          </Text>
        </View>


      </View>

      {/* Grade Distribution */}
      {renderGradeDistribution()}

      {/* Semester List */}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Semester Breakdown</Text>
        {relevantSemesters.map((semester) => {
          const stats = getSemesterStats(semester);
          return (
            <TouchableOpacity
              key={semester.id}
              style={[styles.semesterRow, { borderBottomColor: theme.border }]}
              onPress={() => navigation.navigate('SemesterDetail', { semester })}
            >
              <View style={styles.semesterInfo}>
                <Text style={[styles.semesterName, { color: theme.text }]}>{semester.name}</Text>
                <Text style={[styles.semesterCourses, { color: theme.textSecondary }]}>
                  {stats.courseCount} courses • {stats.totalCredits} credits
                </Text>
              </View>
              <View style={styles.semesterGPA}>
                <Text style={[styles.gpaValue, { color: theme.primary }]}>
                  {stats.gpa.toFixed(2)}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Export Button */}
      {semesters.length > 0 && (
        <TouchableOpacity
          style={[styles.exportButton, { backgroundColor: theme.primary }]}
          onPress={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="document-text-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.exportButtonText}>Export Unofficial Transcript (PDF)</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {semesters.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="school-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No semesters yet
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
            Add your first semester to start tracking your GPA
          </Text>
        </View>
      )}
    </ScrollView>
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
  },
  tabContainer: {
    flexDirection: 'row',
    margin: 15,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabText: {
    fontWeight: '600',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  statCard: {
    width: '47%', // 2 columns roughly
    margin: '1.5%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  chartContainer: {
    marginTop: 10,
    paddingTop: 10,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 200,
    paddingBottom: 30,
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
  },
  barLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  barName: {
    fontSize: 10,
    marginTop: 4,
    width: 50,
    textAlign: 'center',
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  distributionContainer: {
    marginTop: 8,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  gradeLabel: {
    width: 30,
    fontSize: 14,
    fontWeight: '600',
  },
  distributionBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  distributionBar: {
    height: '100%',
    borderRadius: 4,
  },
  countLabel: {
    width: 30,
    fontSize: 12,
    textAlign: 'right',
  },
  semesterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  semesterInfo: {
    flex: 1,
  },
  semesterName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  semesterCourses: {
    fontSize: 12,
  },
  semesterGPA: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpaValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  classificationCard: {
    margin: 15,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  classificationInfo: {
    marginLeft: 15,
    flex: 1,
  },
  classificationLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  classificationValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  exportButton: {
    margin: 15,
    marginTop: 5,
    marginBottom: 40,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
