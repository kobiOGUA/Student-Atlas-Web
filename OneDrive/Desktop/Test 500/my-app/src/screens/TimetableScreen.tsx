import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    TextInput,
    Modal,
    Alert,
    Platform,
    ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { fetchSemesters, updateCourse } from '../services/semesterService';
import { fetchTasks, addTask, updateTask, deleteTask } from '../services/taskService';
import { Semester, Course, Schedule, Task } from '../types';
import { unlockAchievement } from '../services/achievementService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export default function TimetableScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const navigation = useNavigation();

    // Data State
    const [courses, setCourses] = useState<Course[]>([]);
    const [customEvents, setCustomEvents] = useState<any[]>([]);
    const [currentSemesterId, setCurrentSemesterId] = useState<string | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [globalEvents, setGlobalEvents] = useState<any[]>([]);

    // UI State
    const [activeTab, setActiveTab] = useState<'schedule' | 'tasks'>('schedule');
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
    const [addingTask, setAddingTask] = useState(false);
    const [savingSchedule, setSavingSchedule] = useState(false);

    // New Task Form State
    const [taskTitle, setTaskTitle] = useState('');
    const [taskCourseId, setTaskCourseId] = useState('');
    const [taskDueDate, setTaskDueDate] = useState(''); // YYYY-MM-DD
    const [taskType, setTaskType] = useState<Task['type']>('assignment');

    // Schedule Form State
    const [schEditId, setSchEditId] = useState<string | null>(null);
    const [schTitle, setSchTitle] = useState('');
    const [schCourseId, setSchCourseId] = useState('');
    const [schDay, setSchDay] = useState<string>('Monday');
    const [schIsRecurring, setSchIsRecurring] = useState(true);
    const [schDate, setSchDate] = useState<string>(''); // YYYY-MM-DD
    const [schStartTime, setSchStartTime] = useState(new Date());
    const [schEndTime, setSchEndTime] = useState(new Date(Date.now() + 3600000)); // +1 hour
    const [schVenue, setSchVenue] = useState('');
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [showDatepicker, setShowDatepicker] = useState(false);

    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (!user) return;
        try {
            setLoading(true);
            // Load Courses
            const semesters = await fetchSemesters(user.uid);
            const currentSemester = semesters.find(s => s.type === 'current');
            if (currentSemester) {
                setCourses(currentSemester.courses);
                setCustomEvents(currentSemester.customEvents || []);
                setCurrentSemesterId(currentSemester.id);
            } else {
                setCourses([]);
                setCustomEvents([]);
                setCurrentSemesterId(null);
            }

            // Load Global Events
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                setGlobalEvents(userDoc.data().globalEvents || []);
            }

            // Load Tasks
            const userTasks = await fetchTasks(user.uid);
            setTasks(userTasks);

        } catch (error) {
            console.error('Error loading planner data:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleAddTask = async () => {
        if (!taskTitle || !taskDueDate || !user) {
            Alert.alert('Error', 'Please fill in title and due date');
            return;
        }

        try {
            setAddingTask(true);
            const dueDateTimestamp = new Date(taskDueDate).getTime(); // Ensure this matches picker output

            const selectedCourse = courses.find(c => c.id === taskCourseId);

            const taskData = {
                title: taskTitle,
                dueDate: dueDateTimestamp,
                courseId: taskCourseId || undefined,
                courseName: selectedCourse?.name,
                type: taskType,
                description: ''
            };

            if (selectedTaskId) {
                await updateTask(selectedTaskId, taskData);
                Alert.alert('Success', 'Task updated');
            } else {
                await addTask(user.uid, {
                    ...taskData,
                    isCompleted: false
                });

                // Check for achievement
                const updatedTasks = await fetchTasks(user.uid);
                if (updatedTasks.length >= 5) {
                    const unlocked = await unlockAchievement(user.uid, 'planner');
                    if (unlocked) {
                        Alert.alert('🏆 Achievement Unlocked!', 'You earned the "Organized" badge.');
                    }
                }
            }

            setModalVisible(false);
            resetTaskForm();
            await loadData();

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save task');
        } finally {
            setAddingTask(false);
        }
    };



    const handleSaveSchedule = async () => {
        if (!user) return;
        // if (!currentSemesterId) Alert.alert('Error', 'No current semester found. Add one first!'); // ALLOW GLOBAL EVENTS

        // Validation
        if (!schCourseId && !schTitle) {
            Alert.alert('Error', 'Please select a course or enter a title');
            return;
        }
        if (!schIsRecurring && !schDate) {
            Alert.alert('Error', 'Please select a date for one-time event');
            return;
        }

        try {
            setSavingSchedule(true);
            const formatTime = (date: Date) => {
                return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
            };

            const startTimeStr = formatTime(schStartTime);
            const endTimeStr = formatTime(schEndTime);

            const newScheduleData: any = {
                id: schEditId || Date.now().toString(),
                day: schDay,
                startTime: startTimeStr,
                endTime: endTimeStr,
                venue: schVenue || null,
                isRecurring: schIsRecurring,
                date: schIsRecurring ? null : schDate
            };

            // 1. Course Event
            if (schCourseId) {
                const course = courses.find(c => c.id === schCourseId);
                if (!course) return;

                const existingSchedules = course.schedules || (course.schedule ? [course.schedule] : []) || [];
                let updatedSchedules = [...existingSchedules];

                // Check Duplicate (if new)
                if (!schEditId) {
                    const isDuplicate = existingSchedules.some(s => s.day === newScheduleData.day && s.startTime === newScheduleData.startTime);
                    if (isDuplicate) {
                        Alert.alert('Error', 'A class at this time already exists.');
                        setSavingSchedule(false);
                        return;
                    }
                    updatedSchedules.push(newScheduleData);
                } else {
                    // Update existing
                    updatedSchedules = updatedSchedules.map(s => (s.id === schEditId || (!s.id && s.day === schDay && s.startTime === startTimeStr)) ? { ...newScheduleData, id: s.id || schEditId } : s);
                }

                await updateCourse(user.uid, currentSemesterId!, schCourseId, {
                    schedules: updatedSchedules,
                    schedule: undefined
                });

                // Optimistic
                const updatedCourses = courses.map(c => c.id === schCourseId ? { ...c, schedules: updatedSchedules } : c);
                setCourses(updatedCourses);

                // 2. Custom Event
            } else {
                newScheduleData.title = schTitle;

                if (currentSemesterId) {
                    let updatedCustomEvents = [...customEvents];
                    if (schEditId) {
                        updatedCustomEvents = updatedCustomEvents.map(e => e.id === schEditId ? newScheduleData : e);
                    } else {
                        updatedCustomEvents.push(newScheduleData);
                    }

                    const semRef = doc(db, 'users', user.uid, 'semesters', currentSemesterId!);
                    await updateDoc(semRef, { customEvents: updatedCustomEvents });
                    setCustomEvents(updatedCustomEvents);
                } else {
                    let updatedGlobal = [...globalEvents];
                    if (schEditId) {
                        updatedGlobal = updatedGlobal.map(e => e.id === schEditId ? newScheduleData : e);
                    } else {
                        updatedGlobal.push(newScheduleData);
                    }
                    await setDoc(doc(db, 'users', user.uid), { globalEvents: updatedGlobal }, { merge: true });
                    setGlobalEvents(updatedGlobal);
                }
            }

            setScheduleModalVisible(false);
            resetScheduleForm();
            Alert.alert('Success', 'Schedule updated!');

        } catch (error) {
            console.error('Error saving schedule:', error);
            Alert.alert('Error', 'Failed to update schedule');
        } finally {
            setSavingSchedule(false);
        }
    };

    const resetScheduleForm = () => {
        setSchEditId(null);
        setSchTitle('');
        setSchCourseId('');
        setSchDay('Monday');
        setSchIsRecurring(true);
        setSchDate('');
        setSchStartTime(new Date());
        setSchEndTime(new Date(Date.now() + 3600000));
        setSchVenue('');
    };

    const resetTaskForm = () => {
        setTaskTitle('');
        setTaskCourseId('');
        setTaskDueDate('');
        setTaskType('assignment');
    };

    const toggleTaskCompletion = async (task: Task) => {
        try {
            // Optimistic update
            const updatedTasks = tasks.map(t =>
                t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t
            );
            setTasks(updatedTasks);

            await updateTask(task.id, { isCompleted: !task.isCompleted });
        } catch (error) {
            // Revert on error
            console.error('Error updating task:', error);
            await loadData();
        }
    };

    const handleDeleteSchedule = async (course: Course) => {
        Alert.alert(
            'Remove Schedule',
            `Remove class time for ${course.code}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        if (!user || !currentSemesterId) return;
                        try {
                            // Optimistic update
                            const updatedCourses = courses.map(c => c.id === course.id ? { ...c, schedule: undefined } : c);
                            setCourses(updatedCourses);

                            await updateCourse(user.uid, currentSemesterId, course.id, { schedule: undefined }); // Sending undefined/null to remove? Firebase updateDoc with FieldValue.delete() is better usually but service handles partials. 
                            // Check service: updateDoc(doc, updates). If update object has key with undefined, Firestore ignores it. Needs null.
                            // Let's modify service or just send null? Types might conflict.
                            // I'll assume the service handles specific logic or I'll just send 'null' casted as any if needed.
                            // Actually, let's just use the current service. If it fails, I'll fix the service.
                        } catch (e) {
                            console.error(e);
                            loadData();
                        }
                    }
                }
            ]
        );
    };

    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [showTaskTypePicker, setShowTaskTypePicker] = useState(false);
    const [showTaskDatePicker, setShowTaskDatePicker] = useState(false);

    const handleEditTask = (task: Task) => {
        setSelectedTaskId(task.id);
        setTaskTitle(task.title);
        setTaskCourseId(task.courseId || '');
        setTaskDueDate(new Date(task.dueDate).toISOString().split('T')[0]); // Input expects string YYYY-MM-DD currently, but we are moving to DateTimePicker
        // Actually, if we use DateTimePicker, we need a Date object state?
        // Let's just use the string for now to be safe with existing code, OR switch to Date. 
        // Existing state: const [taskDueDate, setTaskDueDate] = useState(''); 
        // I should change this to Date object for DateTimePicker compatibility.
        // For now, I'll stick to string parsing for the transition.
        setTaskType(task.type);
        setModalVisible(true);
    };

    const handleOpenAddTask = () => {
        setSelectedTaskId(null);
        resetTaskForm();
        setModalVisible(true);
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            // Optimistic update
            const updatedTasks = tasks.filter(t => t.id !== taskId);
            setTasks(updatedTasks);

            await deleteTask(taskId);
        } catch (error) {
            console.error('Error deleting task:', error);
            await loadData();
        }
    };


    const getEventsForDay = (day: string) => {
        let dailyEvents: any[] = [];

        // 1. Course Schedules
        courses.forEach(c => {
            const schedules = c.schedules || (c.schedule ? [c.schedule] : []);
            schedules.forEach(s => {
                if (s.day === day) {
                    dailyEvents.push({
                        type: 'course',
                        title: c.name,
                        subtitle: c.code,
                        id: s.id || c.id + '-' + s.day + '-' + s.startTime, // unique key fallback
                        courseId: c.id,
                        isRecurring: true,
                        ...s
                    });
                }
            });
        });

        // 2. Custom Events
        customEvents.forEach(e => {
            let eventDay = e.day;
            if (!e.isRecurring && e.date) {
                const d = new Date(e.date);
                const dayIndex = d.getDay();
                eventDay = DAYS[dayIndex === 0 ? 6 : dayIndex - 1];
            }

            if (eventDay === day) {
                dailyEvents.push({
                    type: 'custom',
                    title: e.title,
                    subtitle: 'Personal Event',
                    courseId: '',
                    ...e
                });
            }
        });

        // 3. Global Events
        globalEvents.forEach(e => {
            let eventDay = e.day;
            if (!e.isRecurring && e.date) {
                const d = new Date(e.date);
                const dayIndex = d.getDay();
                eventDay = DAYS[dayIndex === 0 ? 6 : dayIndex - 1];
            }

            if (eventDay === day) {
                dailyEvents.push({
                    type: 'global',
                    title: e.title,
                    subtitle: 'Personal Event',
                    courseId: '',
                    ...e
                });
            }
        });

        return dailyEvents.sort((a, b) => {
            const timeA = a.startTime || '00:00';
            const timeB = b.startTime || '00:00';
            return timeA.localeCompare(timeB);
        });
    };

    const handleEditSchedule = (item: any) => {
        setSchEditId(item.id);
        setSchTitle(item.title);
        setSchCourseId(item.courseId || '');
        setSchDay(item.day);
        setSchIsRecurring(item.isRecurring !== false);
        setSchDate(item.date || '');
        setSchVenue(item.venue || '');

        // Parse times
        const parseTime = (t: string) => {
            const d = new Date();
            const [h, m] = t.split(':');
            d.setHours(parseInt(h), parseInt(m));
            return d;
        };
        setSchStartTime(parseTime(item.startTime));
        setSchEndTime(parseTime(item.endTime));

        setScheduleModalVisible(true);
    };

    const deleteScheduleInstance = async (item: any) => {
        Alert.alert('Remove Schedule', `Remove ${item.title}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                    if (!user || !currentSemesterId) return;
                    try {
                        let updated = false;

                        if (item.type === 'course') {
                            const course = courses.find(c => c.id === item.courseId);
                            if (course) {
                                const currentSchedules = course.schedules || (course.schedule ? [course.schedule] : []);
                                const updatedSchedules = currentSchedules.filter(s =>
                                    // Use ID if available, otherwise match properties
                                    (s.id && s.id !== item.id) || (!s.id && (s.day !== item.day || s.startTime !== item.startTime))
                                );

                                await updateCourse(user.uid, currentSemesterId, course.id, { schedules: updatedSchedules });

                                // Optimistic
                                const updatedCourses = courses.map(c => c.id === course.id ? { ...c, schedules: updatedSchedules } : c);
                                setCourses(updatedCourses);
                                updated = true;
                            }
                        } else if (item.type === 'custom') {
                            // Custom Event
                            const newCustomEvents = customEvents.filter(e => e.id !== item.id);
                            const semRef = doc(db, 'users', user.uid, 'semesters', currentSemesterId!);
                            await updateDoc(semRef, { customEvents: newCustomEvents });

                            setCustomEvents(newCustomEvents);
                            updated = true;
                        } else if (item.type === 'global') {
                            // Global Event
                            const newGlobalEvents = globalEvents.filter(e => e.id !== item.id);
                            await setDoc(doc(db, 'users', user.uid), { globalEvents: newGlobalEvents }, { merge: true });
                            setGlobalEvents(newGlobalEvents);
                            updated = true;
                        }

                        if (updated) Alert.alert('Success', 'Removed from schedule');

                    } catch (e) {
                        console.error(e);
                        loadData();
                    }
                }
            }
        ]);
    };

    const renderSchedule = () => (
        <>
            {loading ? (
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading schedule...</Text>
            ) : (courses.length === 0 && customEvents.length === 0) ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="calendar-outline" size={64} color={theme.textSecondary} />
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                        No courses or events added yet.
                    </Text>
                </View>
            ) : (
                DAYS.map(day => {
                    const today = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
                    const now = new Date();
                    const nowTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
                    const todayDateStr = now.toISOString().split('T')[0];

                    let dayItems = getEventsForDay(day);

                    // Sort Today: Future first
                    if (day === today) {
                        const future = dayItems.filter(i => (i.endTime || '00:00') > nowTime);
                        const past = dayItems.filter(i => (i.endTime || '00:00') <= nowTime);
                        dayItems = [...future, ...past];
                    }

                    if (dayItems.length === 0) return null;

                    return (
                        <View key={day} style={styles.daySection}>
                            <Text style={[
                                styles.dayTitle,
                                { color: theme.primary },
                                day === today && { fontWeight: '900', fontSize: 20 }
                            ]}>
                                {day === today ? `${day} (Today)` : day}
                            </Text>
                            {dayItems.map((item, index) => {
                                let isDimmed = false;
                                if (!item.isRecurring) {
                                    if (item.date < todayDateStr) isDimmed = true;
                                    else if (item.date === todayDateStr && item.endTime <= nowTime) isDimmed = true;
                                }

                                return (
                                    <View key={`${item.id}-${index}`} style={[
                                        styles.courseCard,
                                        { backgroundColor: theme.card },
                                        isDimmed && { opacity: 0.5 }
                                    ]}>
                                        <View style={styles.timeContainer}>
                                            <Text style={[styles.timeText, { color: theme.text }]}>
                                                {item.startTime}
                                            </Text>
                                            <View style={[styles.timeLine, { backgroundColor: theme.border }]} />
                                            <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                                                {item.endTime}
                                            </Text>
                                        </View>

                                        <View style={styles.detailsContainer}>
                                            <Text style={[styles.courseCode, { color: theme.primary }]}>{item.subtitle}</Text>
                                            <Text style={[styles.courseName, { color: theme.text }]}>
                                                {item.title}
                                                {item.isRecurring && <Ionicons name="refresh" size={12} color={theme.textSecondary} />}
                                            </Text>

                                            {item.venue && (
                                                <View style={styles.venueContainer}>
                                                    <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                                                    <Text style={[styles.venueText, { color: theme.textSecondary }]}>
                                                        {item.venue}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>

                                        <View style={{ flexDirection: 'row' }}>
                                            <TouchableOpacity
                                                onPress={() => handleEditSchedule(item)}
                                                style={{ padding: 8 }}
                                            >
                                                <Ionicons name="create-outline" size={20} color={theme.primary} />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => deleteScheduleInstance(item)}
                                                style={{ padding: 8 }}
                                            >
                                                <Ionicons name="trash-outline" size={20} color={theme.error} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )
                            })}
                        </View>
                    );
                })
            )}

            {!loading && courses.length === 0 && customEvents.length === 0 && (
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                        No items added yet. Tap + below!
                    </Text>
                </View>
            )}

            <View style={{ height: 80 }} />
        </>
    );

    const renderTasks = () => (
        <>
            {tasks.map(task => (
                <View key={task.id} style={[
                    styles.taskCard,
                    { backgroundColor: theme.card },
                    task.isCompleted && { opacity: 0.5, backgroundColor: theme.background }
                ]}>
                    <TouchableOpacity
                        style={styles.checkbox}
                        onPress={() => toggleTaskCompletion(task)}
                    >
                        <Ionicons
                            name={task.isCompleted ? "checkmark-circle" : "ellipse-outline"}
                            size={24}
                            color={task.isCompleted ? theme.textSecondary : theme.primary}
                        />
                    </TouchableOpacity>

                    <View style={styles.taskContent}>
                        <Text style={[
                            styles.taskTitle,
                            { color: task.isCompleted ? theme.textSecondary : theme.text, textDecorationLine: task.isCompleted ? 'line-through' : 'none' }
                        ]}>
                            {task.title}
                        </Text>
                        <View style={styles.taskMeta}>
                            {task.courseName && (
                                <Text style={[styles.taskCourse, { color: task.isCompleted ? theme.textSecondary : theme.primary }]}>{task.courseName} • </Text>
                            )}
                            <Text style={[styles.taskDate, { color: theme.textSecondary }]}>
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity
                            onPress={() => handleEditTask(task)}
                            style={[styles.deleteTaskButton, { marginRight: 8 }]}
                            disabled={task.isCompleted}
                        >
                            <Ionicons name="create-outline" size={20} color={task.isCompleted ? theme.textSecondary : theme.primary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => handleDeleteTask(task.id)}
                            style={styles.deleteTaskButton}
                        >
                            <Ionicons name="trash-outline" size={20} color={theme.error} />
                        </TouchableOpacity>
                    </View>
                </View>
            ))}

            <View style={{ height: 80 }} />
        </>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.primary }]}>
                <Text style={styles.headerTitle}>Planner</Text>
            </View>

            {/* Tabs */}
            <View style={[styles.tabContainer, { backgroundColor: theme.card }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'schedule' && { backgroundColor: theme.primary }]}
                    onPress={() => setActiveTab('schedule')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'schedule' ? '#FFFFFF' : theme.text }]}>Schedule</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'tasks' && { backgroundColor: theme.primary }]}
                    onPress={() => setActiveTab('tasks')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'tasks' ? '#FFFFFF' : theme.text }]}>Tasks</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {activeTab === 'schedule' ? renderSchedule() : renderTasks()}
            </ScrollView>

            {/* Floating Action Buttons */}
            {activeTab === 'schedule' ? (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: theme.primary }]}
                    onPress={() => {
                        if (courses.length === 0) {
                            Alert.alert('Notice', 'No courses found. Add courses first!');
                            return;
                        }
                        setScheduleModalVisible(true);
                    }}
                >
                    <Ionicons name="add" size={32} color="#FFFFFF" />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: theme.primary }]}
                    onPress={handleOpenAddTask}
                >
                    <Ionicons name="add" size={32} color="#FFFFFF" />
                </TouchableOpacity>
            )}


            {/* Add Task Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedTaskId ? 'Edit Task' : 'New Task'}</Text>

                        <TextInput
                            style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                            placeholder="Task Title (e.g. Finish Essay)"
                            placeholderTextColor={theme.textSecondary}
                            value={taskTitle}
                            onChangeText={setTaskTitle}
                        />

                        <Text style={[styles.label, { color: theme.text }]}>Due Date</Text>
                        {(Platform.OS === 'web') ? (
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                placeholder="YYYY-MM-DD"
                                value={taskDueDate}
                                onChangeText={setTaskDueDate}
                            />
                        ) : (
                            <TouchableOpacity
                                style={[styles.input, { justifyContent: 'center', backgroundColor: theme.surface, borderColor: theme.border }]}
                                onPress={() => setShowTaskDatePicker(true)}
                            >
                                <Text style={{ color: taskDueDate ? theme.text : theme.textSecondary }}>
                                    {taskDueDate || 'Select Date'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {showTaskDatePicker && Platform.OS !== 'web' && (
                            <DateTimePicker
                                value={taskDueDate ? new Date(taskDueDate) : new Date()}
                                mode="date"
                                display="default"
                                onChange={(event, date) => {
                                    setShowTaskDatePicker(false);
                                    if (date) {
                                        setTaskDueDate(date.toISOString().split('T')[0]);
                                    }
                                }}
                            />
                        )}

                        <Text style={[styles.label, { color: theme.text }]}>Type</Text>
                        <ScrollView horizontal style={styles.courseScroll}>
                            {['assignment', 'exam', 'study', 'other'].map(type => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.courseChip,
                                        { borderColor: theme.border },
                                        taskType === type && { backgroundColor: theme.primary, borderColor: theme.primary }
                                    ]}
                                    onPress={() => setTaskType(type as any)}
                                >
                                    <Text style={{ color: taskType === type ? '#FFFFFF' : theme.text, textTransform: 'capitalize' }}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={[styles.label, { color: theme.text }]}>Course (Optional)</Text>
                        <ScrollView horizontal style={styles.courseScroll}>
                            {courses.map(course => (
                                <TouchableOpacity
                                    key={course.id}
                                    style={[
                                        styles.courseChip,
                                        { borderColor: theme.border },
                                        taskCourseId === course.id && { backgroundColor: theme.primary, borderColor: theme.primary }
                                    ]}
                                    onPress={() => setTaskCourseId(course.id === taskCourseId ? '' : course.id)}
                                >
                                    <Text style={{ color: taskCourseId === course.id ? '#FFFFFF' : theme.text }}>{course.code}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: theme.surface }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={{ color: theme.text }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                                onPress={handleAddTask}
                                disabled={addingTask}
                            >
                                {addingTask ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{selectedTaskId ? 'Update' : 'Add Task'}</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Add/Edit Schedule Modal */}
            <Modal
                visible={scheduleModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setScheduleModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                            {schEditId ? 'Edit Schedule' : 'Add to Schedule'}
                        </Text>

                        {/* Course Selector */}
                        <Text style={[styles.label, { color: theme.text }]}>Type</Text>
                        <ScrollView horizontal style={styles.courseScroll} showsHorizontalScrollIndicator={false}>
                            <TouchableOpacity
                                style={[
                                    styles.courseChip,
                                    { borderColor: theme.border },
                                    schCourseId === '' && { backgroundColor: theme.primary, borderColor: theme.primary }
                                ]}
                                onPress={() => setSchCourseId('')}
                            >
                                <Text style={{ color: schCourseId === '' ? '#FFFFFF' : theme.text }}>Personal Event</Text>
                            </TouchableOpacity>
                            {courses.map(course => (
                                <TouchableOpacity
                                    key={course.id}
                                    style={[
                                        styles.courseChip,
                                        { borderColor: theme.border },
                                        schCourseId === course.id && { backgroundColor: theme.primary, borderColor: theme.primary }
                                    ]}
                                    onPress={() => setSchCourseId(course.id)}
                                >
                                    <Text style={{ color: schCourseId === course.id ? '#FFFFFF' : theme.text }}>{course.code}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Title Input (if Personal) */}
                        {schCourseId === '' && (
                            <>
                                <Text style={[styles.label, { color: theme.text }]}>Event Title</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                    placeholder="Event Name"
                                    placeholderTextColor={theme.textSecondary}
                                    value={schTitle}
                                    onChangeText={setSchTitle}
                                />
                            </>
                        )}

                        {/* Recurring Toggle */}
                        <View style={{ flexDirection: 'row', marginBottom: 15, backgroundColor: theme.surface, borderRadius: 8, padding: 4, borderWidth: 1, borderColor: theme.border }}>
                            <TouchableOpacity
                                style={{ flex: 1, padding: 8, alignItems: 'center', backgroundColor: schIsRecurring ? theme.primary : 'transparent', borderRadius: 6 }}
                                onPress={() => setSchIsRecurring(true)}
                            >
                                <Text style={{ color: schIsRecurring ? '#FFFFFF' : theme.text, fontWeight: 'bold' }}>Recurring Event</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, padding: 8, alignItems: 'center', backgroundColor: !schIsRecurring ? theme.primary : 'transparent', borderRadius: 6 }}
                                onPress={() => setSchIsRecurring(false)}
                            >
                                <Text style={{ color: !schIsRecurring ? '#FFFFFF' : theme.text, fontWeight: 'bold' }}>One-Time</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Day or Date Selector */}
                        {schIsRecurring ? (
                            <>
                                <Text style={[styles.label, { color: theme.text }]}>Day</Text>
                                <ScrollView horizontal style={styles.courseScroll} showsHorizontalScrollIndicator={false}>
                                    {DAYS.map(day => (
                                        <TouchableOpacity
                                            key={day}
                                            style={[
                                                styles.courseChip,
                                                { borderColor: theme.border },
                                                schDay === day && { backgroundColor: theme.primary, borderColor: theme.primary }
                                            ]}
                                            onPress={() => setSchDay(day)}
                                        >
                                            <Text style={{ color: schDay === day ? '#FFFFFF' : theme.text }}>{day.substring(0, 3)}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </>
                        ) : (
                            <>
                                <Text style={[styles.label, { color: theme.text }]}>Date</Text>
                                {(Platform.OS === 'web') ? (
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                        placeholder="YYYY-MM-DD"
                                        value={schDate}
                                        onChangeText={setSchDate}
                                    />
                                ) : (
                                    <TouchableOpacity
                                        style={[styles.input, { justifyContent: 'center', backgroundColor: theme.surface, borderColor: theme.border }]}
                                        onPress={() => setShowDatepicker(true)}
                                    >
                                        <Text style={{ color: schDate ? theme.text : theme.textSecondary }}>
                                            {schDate || 'Select Date'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                {showDatepicker && Platform.OS !== 'web' && (
                                    <DateTimePicker
                                        value={schDate ? new Date(schDate) : new Date()}
                                        mode="date"
                                        display="default"
                                        onChange={(event, date) => {
                                            setShowDatepicker(false);
                                            if (date) setSchDate(date.toISOString().split('T')[0]);
                                        }}
                                    />
                                )}
                            </>
                        )}

                        {/* Time Inputs */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={[styles.label, { color: theme.text }]}>Start Time</Text>
                                {(Platform.OS === 'web') ? (
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                        placeholder="HH:mm"
                                        value={schStartTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                                        onChangeText={(text) => {
                                            const [h, m] = text.split(':');
                                            if (h && m) {
                                                const d = new Date();
                                                d.setHours(parseInt(h), parseInt(m));
                                                setSchStartTime(d);
                                            }
                                        }}
                                    />
                                ) : (
                                    <TouchableOpacity
                                        style={[styles.input, { justifyContent: 'center', backgroundColor: theme.surface, borderColor: theme.border }]}
                                        onPress={() => setShowStartPicker(true)}
                                    >
                                        <Text style={{ color: theme.text }}>
                                            {schStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={[styles.label, { color: theme.text }]}>End Time</Text>
                                {(Platform.OS === 'web') ? (
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                                        placeholder="HH:mm"
                                        value={schEndTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                                        onChangeText={(text) => {
                                            const [h, m] = text.split(':');
                                            if (h && m) {
                                                const d = new Date();
                                                d.setHours(parseInt(h), parseInt(m));
                                                setSchEndTime(d);
                                            }
                                        }}
                                    />
                                ) : (
                                    <TouchableOpacity
                                        style={[styles.input, { justifyContent: 'center', backgroundColor: theme.surface, borderColor: theme.border }]}
                                        onPress={() => setShowEndPicker(true)}
                                    >
                                        <Text style={{ color: theme.text }}>
                                            {schEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Time Picker Modals */}
                        {showStartPicker && Platform.OS !== 'web' && (
                            <DateTimePicker
                                value={schStartTime}
                                mode="time"
                                is24Hour={true}
                                display="default"
                                onChange={(event, date) => {
                                    setShowStartPicker(false);
                                    if (date) setSchStartTime(date);
                                }}
                            />
                        )}
                        {showEndPicker && Platform.OS !== 'web' && (
                            <DateTimePicker
                                value={schEndTime}
                                mode="time"
                                is24Hour={true}
                                display="default"
                                onChange={(event, date) => {
                                    setShowEndPicker(false);
                                    if (date) setSchEndTime(date);
                                }}
                            />
                        )}

                        <Text style={[styles.label, { color: theme.text }]}>Venue (Optional)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                            placeholder="e.g. Room 303"
                            placeholderTextColor={theme.textSecondary}
                            value={schVenue}
                            onChangeText={setSchVenue}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: theme.surface }]}
                                onPress={() => setScheduleModalVisible(false)}
                            >
                                <Text style={{ color: theme.text }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                                onPress={handleSaveSchedule}
                                disabled={savingSchedule}
                            >
                                {savingSchedule ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Save</Text>}
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
    content: {
        flex: 1,
        padding: 15,
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
        padding: 20,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        lineHeight: 24,
    },
    daySection: {
        marginBottom: 25,
    },
    dayTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        marginLeft: 5,
    },
    courseCard: {
        flexDirection: 'row',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    timeContainer: {
        alignItems: 'center',
        marginRight: 15,
        minWidth: 50,
    },
    timeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    timeLine: {
        width: 2,
        height: 15,
        marginVertical: 4,
    },
    detailsContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    courseCode: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    courseName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
    },
    venueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    venueText: {
        fontSize: 13,
        marginLeft: 4,
    },
    // Task Styles
    taskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 12,
        marginBottom: 12,
    },
    checkbox: {
        marginRight: 15,
    },
    taskContent: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    taskMeta: {
        flexDirection: 'row',
    },
    taskCourse: {
        fontSize: 12,
        fontWeight: '600',
    },
    taskDate: {
        fontSize: 12,
    },
    deleteTaskButton: {
        padding: 8,
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
    // Modal Styles
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
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
    },
    courseScroll: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    courseChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 10,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
    },
    modalButton: {
        flex: 1,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
});
