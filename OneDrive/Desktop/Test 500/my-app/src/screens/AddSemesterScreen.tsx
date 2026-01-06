import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createSemester, fetchSemesters } from '../services/semesterService';
import { useTheme } from '../utils/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SemesterType } from '../types';

export default function AddSemesterScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [method, setMethod] = useState<'manual' | 'quick'>('manual');
  const [name, setName] = useState('');
  const [type, setType] = useState<SemesterType>('current');
  const [totalUnits, setTotalUnits] = useState('');
  const [gpa, setGpa] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      showAlert('Error', 'Please enter semester name');
      return;
    }

    if (!user) {
      showAlert('Error', 'You must be logged in to create a semester');
      return;
    }

    if (method === 'quick') {
      const unitsNum = parseFloat(totalUnits);
      const gpaNum = parseFloat(gpa);

      if (isNaN(unitsNum) || unitsNum <= 0) {
        showAlert('Error', 'Please enter valid total units');
        return;
      }
      if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 5.0) {
        showAlert('Error', 'Please enter a valid GPA (0.0 - 5.0)');
        return;
      }

      await submitSemester(name, 'past', gpaNum, unitsNum);
    } else {
      // Manual Method
      await submitSemester(name, type);
    }
  };

  const submitSemester = async (semName: string, semType: SemesterType, semGpa?: number, semUnits?: number) => {
    try {
      if (semType === 'current') {
        const existingSemesters = await fetchSemesters(user!.uid);
        const hasCurrent = existingSemesters.some(s => s.type === 'current');
        if (hasCurrent) {
          showAlert('Error', 'A current semester already exists. Please complete or convert it first.');
          return;
        }
      }

      await createSemester(user!.uid, semName, semType, semGpa, semUnits);

      if (Platform.OS === 'web') {
        window.alert('Semester created successfully!');
      } else {
        Alert.alert('Success', 'Semester created successfully!');
      }
      navigation.goBack();
    } catch (error: any) {
      console.error('Create semester error:', error);
      showAlert('Error', error.message);
    }
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>

        <Text style={[styles.label, { color: theme.text }]}>Entry Method</Text>
        <View style={styles.methodContainer}>
          <TouchableOpacity
            style={[
              styles.methodButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
              method === 'manual' && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => setMethod('manual')}
          >
            <Text style={[styles.methodText, { color: method === 'manual' ? '#FFFFFF' : theme.text }]}>
              Manual Course Entry
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.methodButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
              method === 'quick' && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => setMethod('quick')}
          >
            <Text style={[styles.methodText, { color: method === 'quick' ? '#FFFFFF' : theme.text }]}>
              Quick Add (GPA)
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: theme.text }]}>Semester Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
          placeholder="e.g., 200 Level 1st Semester"
          placeholderTextColor={theme.textSecondary}
          value={name}
          onChangeText={setName}
        />

        {method === 'manual' ? (
          <>
            <Text style={[styles.label, { color: theme.text }]}>Semester Type</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  type === 'current' && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
                onPress={() => setType('current')}
              >
                <Text style={[styles.typeText, { color: type === 'current' ? '#FFFFFF' : theme.text }]}>
                  Current
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  type === 'past' && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
                onPress={() => setType('past')}
              >
                <Text style={[styles.typeText, { color: type === 'past' ? '#FFFFFF' : theme.text }]}>
                  Past
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              Quickly add a past semester by entering the total units and your achieving GPA. Detailed course entry is skipped.
            </Text>

            <Text style={[styles.label, { color: theme.text }]}>Total Units</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="e.g., 24"
              placeholderTextColor={theme.textSecondary}
              value={totalUnits}
              onChangeText={setTotalUnits}
              keyboardType="numeric"
            />

            <Text style={[styles.label, { color: theme.text }]}>GPA (0.00 - 5.00)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder="e.g., 4.5"
              placeholderTextColor={theme.textSecondary}
              value={gpa}
              onChangeText={setGpa}
              keyboardType="decimal-pad"
            />
          </>
        )}

        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.primary }]}
          onPress={handleCreate}
        >
          <Text style={styles.createButtonText}>Create Semester</Text>
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 15,
  },
  description: {
    fontSize: 14,
    marginBottom: 15,
    fontStyle: 'italic',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  methodContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  methodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    marginTop: 30,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
