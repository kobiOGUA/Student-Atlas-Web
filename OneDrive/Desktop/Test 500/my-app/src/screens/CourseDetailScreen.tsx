import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../utils/ThemeContext';
import { Course, Semester, Resource } from '../types';
import { calculateTotalCA, calculateRequiredExamScore, getCertaintyLevel } from '../utils/calculations';
import { deleteCourse } from '../services/semesterService';

import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

import { CA_MAX_SCORES } from '../constants';
import { scoreToGrade } from '../utils/calculations';

const getGradeColor = (grade?: string) => {
  if (!grade || grade === '--') return '#667eea';
  const g = grade.charAt(0).toUpperCase();
  if (g === 'A') return '#10B981'; // Green
  if (g === 'B') return '#F59E0B'; // Yellow/Amber
  if (g === 'C') return '#4B5563'; // Dark Gray
  return '#EF4444'; // Red
};

export default function CourseDetailScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const course: Course = route.params?.course;
  const semester: Semester = route.params?.semester;



  const totalCA = calculateTotalCA(course.caScores);






  const handleDelete = () => {
    const deleteAction = async () => {
      if (!user) return;
      try {
        await deleteCourse(user.uid, semester.id, course.id);
        if (Platform.OS === 'web') {
          window.alert('Course deleted successfully!');
        } else {
          Alert.alert('Success', 'Course deleted successfully!');
        }
        navigation.goBack();
      } catch (error) {
        if (Platform.OS === 'web') {
          window.alert('Failed to delete course');
        } else {
          Alert.alert('Error', 'Failed to delete course');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete "${course.name}"?`)) {
        deleteAction();
      }
    } else {
      Alert.alert(
        'Delete Course',
        `Are you sure you want to delete "${course.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: deleteAction },
        ]
      );
    }
  };

  const renderInfoTab = () => (
    <View style={styles.content}>
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>CA Scores</Text>
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Mid Semester:</Text>
          <Text style={[styles.value, { color: theme.text }]}>{course.caScores.midSemester}/15</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Assignment:</Text>
          <Text style={[styles.value, { color: theme.text }]}>{course.caScores.assignment}/10</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Quiz:</Text>
          <Text style={[styles.value, { color: theme.text }]}>{course.caScores.quiz}/10</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Attendance:</Text>
          <Text style={[styles.value, { color: theme.text }]}>{course.caScores.attendance}/5</Text>
        </View>
        {course.caScores.examScore !== undefined && course.caScores.examScore > 0 && (
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Exam Score:</Text>
            <Text style={[styles.value, { color: theme.text }]}>{course.caScores.examScore}/60</Text>
          </View>
        )}
        <View style={[styles.row, styles.totalRow]}>
          <Text style={[styles.label, { color: theme.text }]}>Total CA:</Text>
          <Text style={[styles.value, styles.totalValue, { color: theme.primary }]}>
            {totalCA.toFixed(2)}/40
          </Text>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Grade Calculation</Text>
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Mode:</Text>
          <Text style={[styles.value, { color: theme.text }]}>{(course as any).useCA !== false ? 'Use CA (Projected)' : 'Manual Grade'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Grade:</Text>
          <Text style={[styles.value, { color: getGradeColor((course as any).grade), fontSize: 20, fontWeight: 'bold' }]}>{(course as any).grade || '--'}</Text>
        </View>
        {(course as any).useCA !== false && (
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Max Possible:</Text>
            <Text style={[styles.value, { color: theme.text }]}>{(totalCA + 60).toFixed(0)}/100</Text>
          </View>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Course Info</Text>
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Unit Hours:</Text>
          <Text style={[styles.value, { color: theme.text }]}>{course.unitHours}</Text>
        </View>
      </View>


      <TouchableOpacity
        style={[styles.editButton, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('EditCourse', { semesterId: semester.id, course })}
      >
        <Text style={styles.editButtonText}>Edit Course</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: theme.error }]}
        onPress={handleDelete}
      >
        <Text style={styles.deleteButtonText}>Delete Course</Text>
      </TouchableOpacity>
    </View>
  );



  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <Text style={[styles.courseName, { color: theme.text }]}>{course.name}</Text>
        <Text style={[styles.courseCode, { color: theme.textSecondary }]}>{course.code}</Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {renderInfoTab()}
      </ScrollView>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    elevation: 2,
  },
  courseName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  courseCode: {
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginHorizontal: 15,
    borderRadius: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    padding: 15,
    paddingBottom: 80,
  },
  section: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  label: {
    fontSize: 16,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
  },
  deleteButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Resource Styles
  helperText: {
    marginBottom: 15,
    fontSize: 14,
    fontStyle: 'italic',
  },
  resourceCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resourceDesc: {
    fontSize: 14,
    marginBottom: 6,
  },
  resourceUploader: {
    fontSize: 12,
  },
  voteContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  voteCount: {
    fontWeight: 'bold',
    fontSize: 14,
    marginVertical: 4,
  },
  openLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    justifyContent: 'flex-end',
  },
  openLinkText: {
    marginRight: 5,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    padding: 20,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 5,
    fontSize: 14,
    textAlign: 'center',
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
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 15,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
});
