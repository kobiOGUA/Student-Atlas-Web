import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';

const GradingSystemScreen = () => {
    const { theme } = useTheme();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const isFirstTime = route.params?.firstTime;

    const [currentSystem, setCurrentSystem] = useState('babcock');
    const [customConfig, setCustomConfig] = useState<any>({
        A: { min: '70', point: '5' },
        B: { min: '60', point: '4' },
        C: { min: '50', point: '3' },
        D: { min: '45', point: '2' },
        E: { min: '40', point: '1' },
        F: { min: '0', point: '0' },
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const saved = await AsyncStorage.getItem('gradingSystem');
            if (saved) {
                const parsed = JSON.parse(saved);
                setCurrentSystem(parsed.type);
                if (parsed.type === 'custom' && parsed.config) {
                    // Map numbers back to strings for inputs
                    const newConfig = { ...customConfig };
                    Object.keys(parsed.config).forEach(key => {
                        newConfig[key] = {
                            min: String(parsed.config[key].min),
                            point: String(parsed.config[key].point)
                        };
                    });
                    setCustomConfig(newConfig);
                }
            } else if (!isFirstTime) {
                // Default
                setCurrentSystem('babcock');
            }
        } catch (e) {
            console.error('Failed to load grading settings', e);
        }
    };

    const handleSave = async () => {
        let config = null;

        if (currentSystem === 'custom') {
            const parseVal = (val: string) => parseInt(val) || 0;
            config = {
                A: { min: parseVal(customConfig.A.min), point: parseVal(customConfig.A.point) },
                B: { min: parseVal(customConfig.B.min), point: parseVal(customConfig.B.point) },
                C: { min: parseVal(customConfig.C.min), point: parseVal(customConfig.C.point) },
                D: { min: parseVal(customConfig.D.min), point: parseVal(customConfig.D.point) },
                E: { min: parseVal(customConfig.E.min), point: parseVal(customConfig.E.point) },
                F: { min: parseVal(customConfig.F.min), point: parseVal(customConfig.F.point) },
            };
        }

        const settings = {
            type: currentSystem,
            config: config
        };

        try {
            await AsyncStorage.setItem('gradingSystem', JSON.stringify(settings));
            if (isFirstTime) {
                navigation.replace('Main');
            } else {
                Alert.alert('Success', 'Grading system updated!');
                navigation.goBack();
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to save settings');
        }
    };

    const OptionCard = ({ id, title, description }: { id: string, title: string, description: string }) => (
        <TouchableOpacity
            style={[
                styles.optionCard,
                { backgroundColor: theme.card, borderColor: currentSystem === id ? theme.primary : 'transparent' }
            ]}
            onPress={() => setCurrentSystem(id)}
        >
            <View style={styles.optionHeader}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>{title}</Text>
                {currentSystem === id && <Ionicons name="checkmark-circle" size={24} color={theme.primary} />}
            </View>
            <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>{description}</Text>
        </TouchableOpacity>
    );

    const CustomInputRow = ({ label, gradeKey }: { label: string, gradeKey: string }) => (
        <View style={styles.inputRow}>
            <Text style={[styles.gradeLabel, { color: theme.text }]}>{label}</Text>
            <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                placeholder="Min"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={customConfig[gradeKey].min}
                onChangeText={(text) => setCustomConfig({
                    ...customConfig,
                    [gradeKey]: { ...customConfig[gradeKey], min: text }
                })}
            />
            <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                placeholder="Pts"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={customConfig[gradeKey].point}
                onChangeText={(text) => setCustomConfig({
                    ...customConfig,
                    [gradeKey]: { ...customConfig[gradeKey], point: text }
                })}
            />
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    Select your university's grading system for accurate GPA calculations.
                </Text>

                <OptionCard
                    id="babcock"
                    title="Babcock University"
                    description="5.0 Scale | A = 80-100 (5pt) | B = 60-79 (4pt)"
                />

                <OptionCard
                    id="nigerian"
                    title="General Nigerian"
                    description="5.0 Scale | A = 70-100 (5pt) | B = 60-69 (4pt)"
                />

                <OptionCard
                    id="4point"
                    title="4.0 System"
                    description="American Scale | A/A+ (93-100) = 4.0 | A- = 3.7..."
                />

                <OptionCard
                    id="custom"
                    title="Custom System"
                    description="Define your own grade ranges"
                />

                {currentSystem === 'custom' && (
                    <View style={[styles.customForm, { backgroundColor: theme.card }]}>
                        <Text style={[styles.sectionHeader, { color: theme.text }]}>Configure Grades</Text>
                        <CustomInputRow label="A" gradeKey="A" />
                        <CustomInputRow label="B" gradeKey="B" />
                        <CustomInputRow label="C" gradeKey="C" />
                        <CustomInputRow label="D" gradeKey="D" />
                        <CustomInputRow label="E" gradeKey="E" />
                        <CustomInputRow label="F" gradeKey="F" />
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: theme.primary }]}
                    onPress={handleSave}
                >
                    <Text style={styles.saveButtonText}>{isFirstTime ? 'Save & Continue' : 'Save Changes'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 20,
    },
    optionCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
    },
    optionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    optionDesc: {
        fontSize: 12,
    },
    customForm: {
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
        marginBottom: 20,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 10,
    },
    gradeLabel: {
        width: 30,
        fontWeight: 'bold',
        fontSize: 16,
    },
    input: {
        flex: 1,
        height: 40,
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 10,
    },
    saveButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default GradingSystemScreen;
