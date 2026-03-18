import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signIn } from '../services/authService';
import { Colors } from '../theme/theme';

export default function LoginScreen() {
  const [identifier, setIdentifier]     = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [focusedField, setFocusedField] = useState<'id' | 'pw' | null>(null);
  const insets = useSafeAreaInsets();

  const handleSignIn = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your email or User ID and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signIn(identifier.trim().toLowerCase(), password);
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? '';
      const isCredential =
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password'     ||
        code === 'auth/user-not-found'     ||
        code === 'auth/invalid-email';
      setError(
        isCredential
          ? 'Invalid email/User ID or password.'
          : 'Sign in failed. Check your connection.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#000D1A', '#001D36', '#003870']}
      style={styles.bg}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
    >
      {/* Decorative blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <View style={styles.blob3} />

      {/* Brand section */}
      <View style={[styles.brand, { paddingTop: insets.top + 40 }]}>
        <View style={styles.logoWrap}>
          <LinearGradient
            colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.06)']}
            style={styles.logoGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="food-apple" size={38} color="#fff" />
          </LinearGradient>
        </View>
        <Text style={styles.appName}>DietPlan</Text>
        <Text style={styles.appTagline}>Your personalized nutrition companion</Text>
      </View>

      {/* Card + keyboard avoiding */}
      <KeyboardAvoidingView
        style={styles.kavWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cardScroll}
        >
          <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, 20) + 24 }]}>

            {/* Handle */}
            <View style={styles.handle} />

            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>Sign in to access your plan</Text>

            {/* Identifier input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email or User ID</Text>
              <View style={[styles.inputWrap, focusedField === 'id' && styles.inputWrapFocused]}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={19}
                  color={focusedField === 'id' ? Colors.primary : '#B0B8C8'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. john@mail.com or USR001"
                  placeholderTextColor="#B0B8C8"
                  value={identifier}
                  onChangeText={t => { setIdentifier(t); setError(''); }}
                  autoCapitalize="none"
                  autoComplete="username"
                  keyboardType="email-address"
                  onFocus={() => setFocusedField('id')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Password input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={[styles.inputWrap, focusedField === 'pw' && styles.inputWrapFocused]}>
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={19}
                  color={focusedField === 'pw' ? Colors.primary : '#B0B8C8'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#B0B8C8"
                  value={password}
                  onChangeText={t => { setPassword(t); setError(''); }}
                  secureTextEntry={!showPassword}
                  onFocus={() => setFocusedField('pw')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(v => !v)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={19}
                    color={focusedField === 'pw' ? Colors.primary : '#B0B8C8'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Error */}
            {!!error && (
              <View style={styles.errorRow}>
                <MaterialCommunityIcons name="alert-circle-outline" size={14} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Sign in FAB button */}
            <TouchableOpacity
              style={[styles.fabBtn, loading && styles.fabBtnDisabled]}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={loading ? ['#5A8EC9', '#5A8EC9'] : ['#1565C0', '#0D47A1']}
                style={styles.fabGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.fabText}>Sign In</Text>
                    <View style={styles.fabIconWrap}>
                      <MaterialCommunityIcons name="arrow-right" size={20} color="#1565C0" />
                    </View>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <MaterialCommunityIcons name="shield-lock-outline" size={13} color="#B0B8C8" />
              <Text style={styles.footerText}>Secured with Firebase Authentication</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg:         { flex: 1 },
  kavWrapper: { flex: 1 },
  cardScroll: { flexGrow: 1, justifyContent: 'flex-end' },

  /* Blobs */
  blob1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(21,101,192,0.22)', top: -80, right: -60 },
  blob2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(0,56,112,0.28)', bottom: 220, left: -80 },
  blob3: { position: 'absolute', width: 140, height: 140, borderRadius: 70,  backgroundColor: 'rgba(13,71,161,0.18)', bottom: 80, right: 20 },

  /* Brand */
  brand:     { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 44 },
  logoWrap:  { marginBottom: 20 },
  logoGrad:  { width: 84, height: 84, borderRadius: 26, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  appName:    { color: '#FFFFFF', fontSize: 34, fontWeight: '900', letterSpacing: -0.5 },
  appTagline: { color: 'rgba(255,255,255,0.48)', fontSize: 14, marginTop: 6, textAlign: 'center' },

  /* Card */
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  handle:    { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E0E4ED', alignSelf: 'center', marginBottom: 28 },
  cardTitle: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  cardSub:   { fontSize: 14, color: Colors.textSecondary, marginBottom: 28 },

  /* Fields */
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.4, marginBottom: 8, marginLeft: 2 },
  inputWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F8FC', borderRadius: 14, borderWidth: 1.5, borderColor: '#E8EAF2', paddingHorizontal: 14, height: 54 },
  inputWrapFocused: { borderColor: Colors.primary, backgroundColor: '#F0F4FF' },
  inputIcon:  { marginRight: 10 },
  input:      { flex: 1, fontSize: 15, color: Colors.text, height: '100%' },
  eyeBtn:     { padding: 2 },

  /* Error */
  errorRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16, marginTop: -4, backgroundColor: '#FFF0F0', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#FFD6D6' },
  errorText: { color: Colors.error, fontSize: 13, flex: 1 },

  /* FAB button */
  fabBtn:    { marginTop: 8, borderRadius: 28, overflow: 'hidden', shadowColor: '#1565C0', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 18, elevation: 12 },
  fabBtnDisabled: { shadowOpacity: 0.15, elevation: 4 },
  fabGrad:   { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  fabText:   { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  fabIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.92)', justifyContent: 'center', alignItems: 'center' },

  /* Footer */
  footer:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 },
  footerText: { color: '#B0B8C8', fontSize: 12 },
});
