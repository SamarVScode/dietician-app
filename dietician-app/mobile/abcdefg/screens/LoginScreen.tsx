import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Text,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signIn } from '../services/authService';
import { AppBackground } from '../components/AppBackground';
import { GradientButton } from '../components/GradientButton';
import { colors } from '../theme/colors';
import { radius } from '../theme/spacing';

/* Small frosted input wrapper — BlurView inside each field */
function FrostedField({ children, focused }: { children: React.ReactNode; focused: boolean }) {
  return (
    <View style={[fieldStyles.outer, focused && fieldStyles.outerFocused]}>
      <View style={[fieldStyles.clip, focused && fieldStyles.clipFocused]}>
        <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[fieldStyles.overlay, focused && fieldStyles.overlayFocused]} />
        <View style={fieldStyles.row}>{children}</View>
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  outer: { marginBottom: 16 },
  outerFocused: {},
  clip: {
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  clipFocused: {
    borderColor: 'rgba(74,61,216,0.5)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  overlayFocused: {
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
  },
});

export default function LoginScreen() {
  const [identifier, setIdentifier]     = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [focusedField, setFocusedField] = useState<'id' | 'pw' | null>(null);
  const insets = useSafeAreaInsets();

  /* Mount animations */
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandTranslateY = useRef(new Animated.Value(-20)).current;
  const sheetTranslateY = useRef(new Animated.Value(40)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    // Brand fades in and slides down
    Animated.parallel([
      Animated.timing(brandOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(brandTranslateY, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
      Animated.spring(iconScale, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
    ]).start();

    // Sheet slides up with delay
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(sheetTranslateY, { toValue: 0, tension: 60, friction: 14, useNativeDriver: true }),
        Animated.timing(sheetOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();
    }, 150);
  }, []);

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
    <AppBackground>
      {/* Top brand section — fixed height */}
      <Animated.View style={[styles.top, { paddingTop: insets.top + 20, opacity: brandOpacity, transform: [{ translateY: brandTranslateY }] }]}>
        <View style={styles.orb1} />
        <View style={styles.orb2} />

        <Animated.View style={[styles.appIcon, { transform: [{ scale: iconScale }] }]}>
          <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.appIconOverlay} />
          <MaterialCommunityIcons name="food-apple" size={48} color="#fff" />
        </Animated.View>

        <Text style={styles.appName}>DietPlan</Text>
        <Text style={styles.appTagline}>Your personalized nutrition companion</Text>
      </Animated.View>

      {/* Sheet — flex:1 stretches to bottom of screen */}
      <KeyboardAvoidingView style={styles.kavWrapper} behavior="padding">
        <Animated.View style={[styles.sheet, { opacity: sheetOpacity, transform: [{ translateY: sheetTranslateY }] }]}>
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.sheetOverlay} />

          <ScrollView
            keyboardShouldPersistTaps="handled"
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.sheetScroll,
              { paddingBottom: Math.max(insets.bottom, 20) + 24 },
            ]}
          >
            {/* Handle bar */}
            <View style={styles.handle} />

            <Text style={styles.welcomeTitle}>Welcome back</Text>
            <Text style={styles.welcomeSub}>Sign in to access your plan</Text>

            {/* Email / User ID */}
            <Text style={styles.fieldLabel}>Email or User ID</Text>
            <FrostedField focused={focusedField === 'id'}>
              <MaterialCommunityIcons
                name="account-outline" size={18}
                color="rgba(0,0,0,0.35)" style={styles.fieldIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. john@mail.com or USR001"
                placeholderTextColor="rgba(0,0,0,0.3)"
                value={identifier}
                onChangeText={t => { setIdentifier(t); setError(''); }}
                autoCapitalize="none"
                autoComplete="username"
                keyboardType="email-address"
                onFocus={() => setFocusedField('id')}
                onBlur={() => setFocusedField(null)}
              />
            </FrostedField>

            {/* Password */}
            <Text style={styles.fieldLabel}>Password</Text>
            <FrostedField focused={focusedField === 'pw'}>
              <MaterialCommunityIcons
                name="lock-outline" size={18}
                color="rgba(0,0,0,0.35)" style={styles.fieldIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="rgba(0,0,0,0.3)"
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
                  size={18} color="rgba(0,0,0,0.35)"
                />
              </TouchableOpacity>
            </FrostedField>

            {/* Error banner */}
            {!!error && (
              <View style={styles.errorRow}>
                <MaterialCommunityIcons name="alert-circle-outline" size={14} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Sign in button */}
            <View style={styles.signinRow}>
              {loading ? (
                <ActivityIndicator color={colors.btnGradStart} size="small" />
              ) : (
                <GradientButton label="Sign In" onPress={handleSignIn} align="right" />
              )}
            </View>

            {/* Footer — pushed to bottom */}
            <View style={styles.footerSpacer} />
            <View style={styles.footer}>
              <MaterialCommunityIcons name="shield-lock-outline" size={13} color="rgba(0,0,0,0.4)" />
              <Text style={styles.footerText}>Secured with Firebase Authentication</Text>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  kavWrapper: { flex: 1 },

  /* Top brand section */
  top: {
    alignItems: 'center', justifyContent: 'center',
    paddingBottom: 32, overflow: 'hidden',
  },
  orb1: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(255,255,255,0.08)', top: '30%', left: '35%',
  },
  orb2: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)', top: '8%', left: '5%',
  },
  appIcon: {
    width: 88, height: 88, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 32, elevation: 12,
  },
  appIconOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(90,75,195,0.7)' },
  appName:    { fontSize: 32, fontWeight: '700', color: '#fff', letterSpacing: -0.5, marginBottom: 8 },
  appTagline: { fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.5)' },

  /* Sheet — flex:1 so it extends all the way to the bottom */
  sheet: {
    flex: 1,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', borderBottomWidth: 0,
    overflow: 'hidden',
  },
  sheetOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.55)' },
  sheetScroll: { paddingHorizontal: 28, paddingTop: 12, flexGrow: 1 },

  /* Handle */
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'center', marginBottom: 24,
  },

  /* Welcome text */
  welcomeTitle: { fontSize: 28, fontWeight: '700', color: '#111', letterSpacing: -0.5, marginBottom: 5 },
  welcomeSub:   { fontSize: 15, fontWeight: '400', color: 'rgba(0,0,0,0.5)', marginBottom: 26 },

  /* Field label */
  fieldLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(0,0,0,0.7)', marginBottom: 8 },
  fieldIcon:  { marginRight: 10 },
  input:      { flex: 1, fontSize: 15, fontWeight: '400', color: '#111', height: '100%' },
  eyeBtn:     { padding: 2 },

  /* Error */
  errorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 16, marginTop: -4,
    backgroundColor: 'rgba(239,68,68,0.12)',
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  errorText: { color: colors.error, fontSize: 13, flex: 1 },

  /* Sign in row */
  signinRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 },

  /* Footer */
  footerSpacer: { flex: 1, minHeight: 16 },
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingTop: 16,
  },
  footerText: { fontSize: 12, fontWeight: '500', color: 'rgba(0,0,0,0.45)' },
});
