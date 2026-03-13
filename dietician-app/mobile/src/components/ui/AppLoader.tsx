// Component: AppLoader
// Loading indicator for mobile screens
import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

const AppLoader: React.FC = () => (
    <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default AppLoader;
