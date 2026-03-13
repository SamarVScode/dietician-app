// Component: StatCard
// Display daily stats on home screen
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import AppCard from '../ui/AppCard';
import { COLORS } from '../../constants/colors';

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <AppCard>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
    </AppCard>
);

const styles = StyleSheet.create({
    label: {
        fontSize: 14,
        color: COLORS.mutedForeground,
    },
    value: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginTop: 4,
    }
});

export default StatCard;
