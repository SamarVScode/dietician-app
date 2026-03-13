// Component: AppToast
// Feedback toast for mobile
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

const AppToast: React.FC<{ message: string; visible: boolean }> = ({ message, visible }) => {
    if (!visible) return null;
    return (
        <View style={styles.container}>
            <Text style={styles.text}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 50,
        left: 20,
        right: 20,
        backgroundColor: COLORS.primary,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    text: {
        color: '#FFF',
        fontWeight: '500',
    }
});

export default AppToast;
