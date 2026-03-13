// Component: AppButton
// Reusable button component for React Native
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

interface AppButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
}

const AppButton: React.FC<AppButtonProps> = ({ title, onPress, variant = 'primary' }) => {
    return (
        <TouchableOpacity
            style={[styles.button, styles[variant]]}
            onPress={onPress}
        >
            <Text style={[styles.text, variant === 'outline' ? styles.outlineText : styles.primaryText]}>
                {title}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primary: {
        backgroundColor: COLORS.primary,
    },
    secondary: {
        backgroundColor: COLORS.secondary,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
    primaryText: {
        color: COLORS.primaryForeground,
    },
    outlineText: {
        color: COLORS.primary,
    }
});

export default AppButton;
