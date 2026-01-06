import React from 'react';
import { View, StyleSheet } from 'react-native';

interface PINDisplayProps {
    pin: string;
    length?: number;
    theme: any;
}

export default function PINDisplay({ pin, length = 4, theme }: PINDisplayProps) {
    return (
        <View style={styles.container}>
            {Array.from({ length }).map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.dot,
                        {
                            backgroundColor: index < pin.length ? theme.primary : theme.surface,
                            borderColor: theme.border,
                        },
                    ]}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
        marginVertical: 30,
    },
    dot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
    },
});
