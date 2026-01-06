import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NumpadProps {
    onNumberPress: (number: string) => void;
    onBackspace: () => void;
    onClear: () => void;
    theme: any;
}

export default function Numpad({ onNumberPress, onBackspace, onClear, theme }: NumpadProps) {
    const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CE', '0', 'backspace'];

    const renderButton = (value: string) => {
        if (value === 'CE') {
            return (
                <TouchableOpacity
                    key={value}
                    style={[styles.button, { backgroundColor: theme.surface }]}
                    onPress={onClear}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.buttonText, { color: theme.error || '#FF0000', fontSize: 20 }]}>CE</Text>
                </TouchableOpacity>
            );
        }

        if (value === 'backspace') {
            return (
                <TouchableOpacity
                    key={value}
                    style={[styles.button, { backgroundColor: theme.surface }]}
                    onPress={onBackspace}
                    activeOpacity={0.7}
                >
                    <Ionicons name="backspace-outline" size={28} color={theme.text} />
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity
                key={value}
                style={[styles.button, { backgroundColor: theme.surface }]}
                onPress={() => onNumberPress(value)}
                activeOpacity={0.7}
            >
                <Text style={[styles.buttonText, { color: theme.text }]}>{value}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.grid}>
                {numbers.map((num) => renderButton(num))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: 20,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 15,
    },
    button: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    buttonText: {
        fontSize: 28,
        fontWeight: '600',
    },
});
