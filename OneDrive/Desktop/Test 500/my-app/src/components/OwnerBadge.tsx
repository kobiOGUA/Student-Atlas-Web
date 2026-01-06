import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/ThemeContext';

interface OwnerBadgeProps {
    size?: number;
    showText?: boolean;
}

export const OWNER_IDS = [
    'QoIH9fogPFeVn29pv9K660SCDYh2'
];

export const isOwner = (userId: string) => OWNER_IDS.includes(userId);

export default function OwnerBadge({ size = 16, showText = false }: OwnerBadgeProps) {
    const { theme } = useTheme();

    return (
        <View style={styles.container}>
            <Ionicons name="shield-checkmark" size={size} color="#FFD700" />
            {showText && (
                <Text style={[styles.text, { color: theme.textSecondary, fontSize: size }]}>
                    Owner
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 4,
    },
    text: {
        marginLeft: 4,
        fontWeight: 'bold',
    },
});
