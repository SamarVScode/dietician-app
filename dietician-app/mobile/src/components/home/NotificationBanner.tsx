// Component: NotificationBanner
// Alert for new notifications on home screen
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

const NotificationBanner: React.FC<{ message: string }> = ({ message }) => (
    <View style={styles.banner}>
        <Text style={styles.text}>{message}</Text>
    </View>
);

const styles = StyleSheet.create({
    banner: {
        backgroundColor: COLORS.accent,
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderColor: COLORS.primary,
        marginBottom: 16,
    },
    text: {
        fontSize: 14,
        color: COLORS.primary,
    }
});

export default NotificationBanner;
