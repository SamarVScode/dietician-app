// Component: AppInput
// Reusable input component for React Native
import React from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';
import { COLORS } from '../../constants/colors';

interface AppInputProps {
    label?: string;
    placeholder?: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
}

const AppInput: React.FC<AppInputProps> = ({ label, placeholder, value, onChangeText, secureTextEntry }) => {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        color: COLORS.mutedForeground,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 12,
        borderRadius: 8,
        backgroundColor: COLORS.background,
    }
});

export default AppInput;
