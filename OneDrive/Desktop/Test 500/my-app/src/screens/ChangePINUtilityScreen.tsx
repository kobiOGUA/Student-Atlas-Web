import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import { adminChangePIN } from '../utils/changePinUtil';

export default function ChangePINUtilityScreen() {
    const { theme } = useTheme();
    const [email, setEmail] = useState('kobioguadinma@gmail.com');
    const [newPIN, setNewPIN] = useState('9568');
    const [loading, setLoading] = useState(false);

    const handleChangePIN = async () => {
        setLoading(true);
        try {
            const result = await adminChangePIN(email, newPIN);
            if (result.success) {
                Alert.alert('Success', `PIN changed to ${newPIN} for ${email}`);
            } else {
                Alert.alert('Error', result.error || 'Failed to change PIN');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to change PIN');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.title, { color: theme.text }]}>Change PIN</Text>

                <Text style={[styles.label, { color: theme.text }]}>Email:</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter email"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <Text style={[styles.label, { color: theme.text }]}>New PIN (4 digits):</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                    value={newPIN}
                    onChangeText={setNewPIN}
                    placeholder="Enter new PIN"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    maxLength={4}
                />

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    onPress={handleChangePIN}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? 'Changing...' : 'Change PIN'}
                    </Text>
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
    card: {
        width: '100%',
        maxWidth: 400,
        padding: 20,
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    button: {
        marginTop: 24,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },

});
