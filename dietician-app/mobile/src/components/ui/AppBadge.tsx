// Component: AppBadge
// Status badge for mobile
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

const AppBadge: React.FC<{ label: string }> = ({ label }) => (
    <View style={styles.badge}>
        <Text style={styles.text}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    badge: {
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    text: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
    }
});

export default AppBadge;
