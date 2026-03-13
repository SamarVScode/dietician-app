// Screen: LoginScreen
// Mobile login screen for users
import React, { useState } from 'react';
import ScreenWrapper from '../components/layout/ScreenWrapper';
import AppInput from '../components/ui/AppInput';
import AppButton from '../components/ui/AppButton';
import { View, Text, StyleSheet } from 'react-native';

const LoginScreen: React.FC = () => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Login to your diet portal</Text>
                <AppInput label="User ID" value={userId} onChangeText={setUserId} />
                <AppInput label="Password" value={password} onChangeText={setPassword} secureTextEntry />
                <AppButton title="Sign In" onPress={() => { }} />
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center' },
    title: { fontSize: 32, fontWeight: 'bold' },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 32 }
});

export default LoginScreen;
