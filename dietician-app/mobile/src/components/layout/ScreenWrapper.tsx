// Component: ScreenWrapper
// Secure area wrapper for all screens
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { COLORS } from '../../constants/colors';

const ScreenWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <SafeAreaView style={styles.safe}>
        <View style={styles.container}>{children}</View>
    </SafeAreaView>
);

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        flex: 1,
        padding: 20,
    }
});

export default ScreenWrapper;
