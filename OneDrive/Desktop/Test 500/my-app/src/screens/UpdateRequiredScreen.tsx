import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '../utils/ThemeContext';

interface UpdateRequiredScreenProps {
    message?: string;
    currentVersion: string;
    requiredVersion: string;
}

export default function UpdateRequiredScreen({
    message,
    currentVersion,
    requiredVersion
}: UpdateRequiredScreenProps) {
    const { theme } = useTheme();

    const handleUpdate = () => {
        // Open Play Store or App Store
        const url = 'https://expo.dev/accounts/oguakobi/projects/kobis-student-atlas';
        Linking.openURL(url);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.content}>
                <Text style={[styles.icon, { color: theme.primary }]}>📱</Text>
                <Text style={[styles.title, { color: theme.text }]}>
                    Update Required
                </Text>
                <Text style={[styles.message, { color: theme.textSecondary }]}>
                    {message || 'A new version of the app is required to continue. Please update to the latest version.'}
                </Text>

                <View style={styles.versionInfo}>
                    <Text style={[styles.versionText, { color: theme.textSecondary }]}>
                        Current Version: {currentVersion}
                    </Text>
                    <Text style={[styles.versionText, { color: theme.textSecondary }]}>
                        Required Version: {requiredVersion}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    onPress={handleUpdate}
                >
                    <Text style={styles.buttonText}>Update Now</Text>
                </TouchableOpacity>
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
        marginBottom: 20,
    },
    versionInfo: {
        marginBottom: 30,
        alignItems: 'center',
    },
    versionText: {
        fontSize: 14,
        marginVertical: 5,
    },
    button: {
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 10,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
