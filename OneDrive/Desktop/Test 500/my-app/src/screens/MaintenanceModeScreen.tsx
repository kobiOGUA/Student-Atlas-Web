import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../utils/ThemeContext';

interface MaintenanceModeScreenProps {
    message?: string;
}

export default function MaintenanceModeScreen({ message }: MaintenanceModeScreenProps) {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.content}>
                <Text style={[styles.icon, { color: theme.primary }]}>🔧</Text>
                <Text style={[styles.title, { color: theme.text }]}>
                    Under Maintenance
                </Text>
                <Text style={[styles.message, { color: theme.textSecondary }]}>
                    {message || 'We\'re currently performing maintenance to improve your experience. Please check back soon!'}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
        maxWidth: 400,
    },
    icon: {
        fontSize: 80,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
});
