import { Alert, Platform } from 'react-native';

/**
 * Cross-platform alert that works on both web and mobile
 */
export const showAlert = (title: string, message?: string) => {
    if (Platform.OS === 'web') {
        alert(`${title}${message ? '\n' + message : ''}`);
    } else {
        Alert.alert(title, message);
    }
};

/**
 * Cross-platform confirmation dialog that works on both web and mobile
 */
export const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
): void => {
    if (Platform.OS === 'web') {
        const confirmed = window.confirm(`${title}\n${message}`);
        if (confirmed) {
            onConfirm();
        } else if (onCancel) {
            onCancel();
        }
    } else {
        Alert.alert(
            title,
            message,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: onCancel,
                },
                {
                    text: 'OK',
                    style: 'default',
                    onPress: onConfirm,
                },
            ]
        );
    }
};
