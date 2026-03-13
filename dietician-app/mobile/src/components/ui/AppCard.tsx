// Component: AppCard
// Reusable card container for React Native
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

const AppCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <View style={styles.card}>{children}</View>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: 16,
    }
});

export default AppCard;
