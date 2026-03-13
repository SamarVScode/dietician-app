// Component: Header
// Custom screen header for mobile
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

const Header: React.FC<{ title: string }> = ({ title }) => (
    <View style={styles.header}>
        <h1 style={styles.title}>{title}</h1>
    </View>
);

const styles = StyleSheet.create({
    header: {
        height: 60,
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
    }
});

export default Header;
