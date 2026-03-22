/**
 * LoginScreen — Luminous Vitality / Glassmorphism + Material Expressive
 *
 * ### 🐝 Extended Swarm Active: Rebuilding LoginScreen...
 * - 🗺️ Product Mapper: Two states — idle sheet / loading — auth via signIn, errors surfaced inline.
 * - 📐 Layout Architect: AppBackground → fixed top brand (flex 0) → KeyboardAvoidingView flex:1 → animated sheet flex:1.
 * - 🎨 Design Systems: Midnight #0b082d gradient; teal (#b3fff3) border on focus; white text on dark sheet overlay.
 * - 🧩 Component Engineer: FrostedField as self-contained inner component; GradientButton reused for CTA.
 * - ⚡ Perf-Tuner: All mount animations use useNativeDriver; single Animated.parallel call.
 * - ✨ Motion Designer: Brand spring-slides in (translateY -20→0), sheet spring-rises (40→0) after 150ms delay.
 * - 👁️‍🗨️ a11y Guru: 52px field touch targets; hitSlop on eye button; autoComplete set for credential managers.
 * #### 👑 Director's Verdict: Full-width teal gradient CTA button, luminous focus border, dark frosted sheet.
 */
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

/* ─── Frosted field ────────────────────────────────────────────────────────── */
function FrostedField({
  children,
  focused,
}: {
  children: React.ReactNode;
  focused: boolean;
}) {
  return (
    <View style={[fieldStyles.outer, focused && fieldStyles.outerFocused]}>
      <View style={[fieldStyles.clip, focused && fieldStyles.clipFocused]}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[fieldStyles.overlay, focused && fieldStyles.overlayFocused]} />
        <View style={fieldStyles.row}>{children}</View>
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  outer:        { marginBottom: 16 },
  outerFocused: {},
  clip: {
    borderRadius: radius.field,
    borderWidth: 1.5,
    borderColor: 'rgba(168,163,241,0.2)',
    overflow: 'hidden',
  },
  clipFocused: {
    borderColor: colors.primaryDim,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surfaceContainerHighest,
  },
  overlayFocused: {
    backgroundColor: 'rgba(32,26,97,0.95)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 54,
  },
});

/* ─── Main screen ──────────────────────────────────────────────────────────── */
export default function LoginScreen() {
  const [identifier, setIdentifier]     = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [focusedField, setFocusedField] = useState<'id' | 'pw' | null>(null);
  const insets = useSafeAreaInsets();

  /* Mount animations */
  const brandOpacity    = useRef(new Animated.Value(0)).current;
  const brandTranslateY = useRef(new Animated.Value(-20)).current;
  const sheetTranslateY = useRef(new Animated.Value(40)).current;
  const sheetOpacity    = useRef(new Animated.Value(0)).current;
  const iconScale       = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(brandOpacity,    { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(brandTranslateY, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
      Animated.spring(iconScale,       { toValue: 1, tension: 100, friction: 8,  useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.spring(sheetTranslateY, { toValue: 0, tension: 60, friction: 14, useNativeDriver: true }),
        Animated.timing(sheetOpacity,    { toValue: 1, duration: 350, useNativeDriver: true }),
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
      {/* Top brand section */}
      <Animated.View
        style={[
          styles.top,
          {
            paddingTop: insets.top + 24,
            opacity: brandOpacity,
            transform: [{ translateY: brandTranslateY }],
          },
        ]}
      >
        {/* App icon */}
        <Animated.View style={[styles.appIcon, { transform: [{ scale: iconScale }] }]}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.appIconOverlay} />
          <MaterialCommunityIcons name="food-apple" size={48} color="#fff" />
        </Animated.View>

        <Text style={styles.appName}>DietPlan</Text>
        <Text style={styles.appTagline}>Your personalized nutrition companion</Text>
      </Animated.View>

      {/* Sheet */}
      <KeyboardAvoidingView style={styles.kavWrapper} behavior="padding">
        <Animated.View
          style={[styles.sheet, { opacity: sheetOpacity, transform: [{ translateY: sheetTranslateY }] }]}
        >
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
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
                name="account-outline"
                size={18}
                color={focusedField === 'id' ? colors.primary : colors.onSurfaceVariant}
                style={styles.fieldIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. john@mail.com or USR001"
                placeholderTextColor={colors.onSurfaceVariant}
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
                name="lock-outline"
                size={18}
                color={focusedField === 'pw' ? colors.primary : colors.onSurfaceVariant}
                style={styles.fieldIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={colors.onSurfaceVariant}
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
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.onSurfaceVariant}
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
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <GradientButton label="Sign In" onPress={handleSignIn} align="full" />
              )}
            </View>

            {/* Footer */}
            <View style={styles.footerSpacer} />
            <View style={styles.footer}>
              <MaterialCommunityIcons name="shield-lock-outline" size={13} color={colors.onSurfaceVariant} />
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

  /* Top brand */
  top: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 32,
    overflow: 'hidden',
  },
  appIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(179,255,243,0.25)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 16,
  },
  appIconOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.accentIndigo },
  appName:    { fontSize: 34, fontWeight: '800', color: colors.onSurface, letterSpacing: -1, marginBottom: 8 },
  appTagline: { fontSize: 14, fontWeight: '400', color: colors.onSurfaceVariant },

  /* Sheet */
  sheet: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(179,255,243,0.15)',
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  sheetOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,8,45,0.82)' },
  sheetScroll:  { paddingHorizontal: 28, paddingTop: 12, flexGrow: 1 },

  /* Handle */
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(168,163,241,0.3)',
    alignSelf: 'center',
    marginBottom: 28,
  },

  /* Welcome text */
  welcomeTitle: { fontSize: 30, fontWeight: '800', color: colors.onSurface, letterSpacing: -0.8, marginBottom: 6 },
  welcomeSub:   { fontSize: 15, fontWeight: '400', color: colors.onSurfaceVariant, marginBottom: 28 },

  /* Fields */
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.onSurfaceVariant, marginBottom: 8 },
  fieldIcon:  { marginRight: 10 },
  input:      { flex: 1, fontSize: 15, fontWeight: '400', color: colors.onSurface, height: '100%' },
  eyeBtn:     { padding: 2 },

  /* Error */
  errorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 16, marginTop: -4,
    backgroundColor: 'rgba(253,111,133,0.12)',
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(253,111,133,0.25)',
  },
  errorText: { color: colors.error, fontSize: 13, flex: 1 },

  /* Sign in row */
  signinRow: { marginTop: 8 },

  /* Footer */
  footerSpacer: { flex: 1, minHeight: 16 },
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingTop: 16,
  },
  footerText: { fontSize: 12, fontWeight: '500', color: colors.onSurfaceVariant },
});
