// Screen: ProfileScreen
// User profile and settings screen
import React from 'react';
import { View, Text } from 'react-native';
import ScreenWrapper from '../components/layout/ScreenWrapper';
import Header from '../components/layout/Header';
import AppButton from '../components/ui/AppButton';

const ProfileScreen: React.FC = () => (
    <ScreenWrapper>
        <Header title="My Profile" />
        <View style={{ flex: 1 }}>
            <Text style={{ marginBottom: 20 }}>Account details and health profile info...</Text>
            <AppButton title="Logout" variant="outline" onPress={() => { }} />
        </View>
    </ScreenWrapper>
);

export default ProfileScreen;
