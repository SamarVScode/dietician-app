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
import { Colors, Radius, Shadows, Spacing, Typography } from '../theme/theme';

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
      colors={Colors.loginGradient}
      style={styles.bg}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
    >
      {/* Decorative blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <View style={styles.blob3} />

      {/* Brand section — outside KAV so it doesn't jump on keyboard */}
      <View style={[styles.brand, { paddingTop: insets.top + 36 }]}>
        <View style={styles.logoWrap}>
          <LinearGradient
            colors={['rgba(139,120,255,0.28)', 'rgba(91,76,245,0.12)']}
            style={styles.logoGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="food-apple" size={40} color="#fff" />
          </LinearGradient>
          {/* Glow ring */}
          <View style={styles.logoRing} />
        </View>
        <Text style={styles.appName}>DietPlan</Text>
        <Text style={styles.appTagline}>Your personalized nutrition companion</Text>
      </View>

      {/* Card + keyboard avoiding */}
      <KeyboardAvoidingView
        style={styles.kavWrapper}
        behavior="padding"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cardScroll}
        >
          <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, 20) + 24 }]}>

            {/* Handle bar */}
            <View style={styles.handle} />

            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>Sign in to access your plan</Text>

            {/* Email / User ID */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email or User ID</Text>
              <View style={[
                styles.inputWrap,
                focusedField === 'id' && styles.inputWrapFocused,
              ]}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={18}
                  color={focusedField === 'id' ? Colors.primary : Colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. john@mail.com or USR001"
                  placeholderTextColor={Colors.textMuted}
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

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={[
                styles.inputWrap,
                focusedField === 'pw' && styles.inputWrapFocused,
              ]}>
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={18}
                  color={focusedField === 'pw' ? Colors.primary : Colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.textMuted}
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
                    size={18}
                    color={focusedField === 'pw' ? Colors.primary : Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Error banner */}
            {!!error && (
              <View style={styles.errorRow}>
                <MaterialCommunityIcons name="alert-circle-outline" size={14} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Sign in button */}
            <TouchableOpacity
              style={[styles.fabBtn, loading && styles.fabBtnDisabled]}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.86}
            >
              <LinearGradient
                colors={loading ? ['#8B80FA', '#8B80FA'] : [Colors.primary, Colors.primaryDark]}
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
                      <MaterialCommunityIcons name="arrow-right" size={20} color={Colors.primary} />
                    </View>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <MaterialCommunityIcons name="shield-lock-outline" size={13} color={Colors.textMuted} />
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
  blob1: { position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(91,76,245,0.18)', top: -100, right: -80 },
  blob2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(55,48,163,0.22)', bottom: 240, left: -70 },
  blob3: { position: 'absolute', width: 150, height: 150, borderRadius: 75,  backgroundColor: 'rgba(124,110,250,0.14)', bottom: 90, right: 10 },

  /* Brand */
  brand:     { alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: 44 },
  logoWrap:  { marginBottom: Spacing.lg, position: 'relative' },
  logoGrad:  {
    width: 88, height: 88, borderRadius: Radius.xxl,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(139,120,255,0.3)',
  },
  logoRing:  {
    position: 'absolute', inset: -6,
    borderRadius: Radius.xxl + 6,
    borderWidth: 1, borderColor: 'rgba(139,120,255,0.12)',
  },
  appName:    { color: '#FFFFFF', ...Typography.displayMd },
  appTagline: { color: 'rgba(255,255,255,0.45)', ...Typography.bodyMd, marginTop: 6, textAlign: 'center' },

  /* Card */
  card: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl + 4,
    borderTopRightRadius: Radius.xxl + 4,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 24,
  },
  handle:    { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.surfaceVariant, alignSelf: 'center', marginBottom: 28 },
  cardTitle: { ...Typography.displaySm, color: Colors.text, marginBottom: 4 },
  cardSub:   { ...Typography.bodyMd, color: Colors.textSecondary, marginBottom: 28 },

  /* Fields */
  fieldGroup:       { marginBottom: Spacing.md },
  fieldLabel:       { ...Typography.labelMd, color: Colors.textSecondary, marginBottom: 8, marginLeft: 2 },
  inputWrap:        {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.surfaceVariant,
    paddingHorizontal: Spacing.md, height: 54,
  },
  inputWrapFocused: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight + '55' },
  inputIcon:        { marginRight: 10 },
  input:            { flex: 1, ...Typography.bodyLg, color: Colors.text, height: '100%' },
  eyeBtn:           { padding: 2 },

  /* Error */
  errorRow:  {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: Spacing.md, marginTop: -4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: Radius.md, borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { color: Colors.error, fontSize: 13, flex: 1 },

  /* FAB */
  fabBtn:         {
    marginTop: Spacing.sm, borderRadius: Radius.xxl, overflow: 'hidden',
    ...Shadows.primary,
  },
  fabBtnDisabled: { shadowOpacity: 0.12, elevation: 4 },
  fabGrad:        {
    height: 60, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: Spacing.lg, gap: 12,
  },
  fabText:    { color: '#FFFFFF', ...Typography.headingSm, letterSpacing: 0.2 },
  fabIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center', alignItems: 'center',
  },

  /* Footer */
  footer:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: Spacing.lg },
  footerText: { ...Typography.labelMd, color: Colors.textMuted },
});
