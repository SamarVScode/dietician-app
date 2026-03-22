import { MD3LightTheme } from 'react-native-paper';
import type { ViewStyle, TextStyle } from 'react-native';

// ── Color Tokens ──────────────────────────────────────────
export const Colors = {
  // Primary — vibrant indigo
  primary:      '#5B4CF5',
  primaryDark:  '#3730A3',
  primaryLight: '#EDE9FE',
  primaryMid:   '#7C6EFA',

  // Semantic
  success:  '#10B981',
  warning:  '#F59E0B',
  error:    '#EF4444',
  info:     '#0EA5E9',

  // Surface
  background:     '#F1F5F9',
  surface:        '#FFFFFF',
  surfaceVariant: '#E2E8F0',
  surfaceBorder:  '#CBD5E1',

  // Text
  text:          '#0F172A',
  textSecondary: '#64748B',
  textMuted:     '#94A3B8',

  // Aliases for AppNavigator (keeps existing nav code working)
  white:          '#FFFFFF',
  black:          '#000000',

  // Macros
  caloriesColor: '#EF4444',
  proteinColor:  '#3B82F6',
  carbsColor:    '#F59E0B',
  fatsColor:     '#10B981',

  // Gradient arrays (as const so LinearGradient accepts them)
  headerGradient: ['#1E1B4B', '#312E81', '#4338CA'] as const,
  loginGradient:  ['#0F0A2E', '#1E1B4B', '#312E81'] as const,
};

// ── Typography Scale ──────────────────────────────────────
export const Typography = {
  displayLg:  { fontSize: 36, fontWeight: '900', letterSpacing: -1   } as TextStyle,
  displayMd:  { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 } as TextStyle,
  displaySm:  { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 } as TextStyle,
  headingLg:  { fontSize: 20, fontWeight: '700' } as TextStyle,
  headingMd:  { fontSize: 18, fontWeight: '700' } as TextStyle,
  headingSm:  { fontSize: 16, fontWeight: '700' } as TextStyle,
  bodyLg:     { fontSize: 16, fontWeight: '400', lineHeight: 24 } as TextStyle,
  bodyMd:     { fontSize: 14, fontWeight: '400', lineHeight: 21 } as TextStyle,
  bodySm:     { fontSize: 13, fontWeight: '400', lineHeight: 20 } as TextStyle,
  labelLg:    { fontSize: 14, fontWeight: '600' } as TextStyle,
  labelMd:    { fontSize: 12, fontWeight: '600', letterSpacing: 0.3 } as TextStyle,
  labelSm:    { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 } as TextStyle,
  caption:    { fontSize: 10, fontWeight: '500', letterSpacing: 0.2 } as TextStyle,
};

// ── Spacing ───────────────────────────────────────────────
export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

// ── Border Radius ─────────────────────────────────────────
export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  28,
  full: 999,
};

// ── Shadows ───────────────────────────────────────────────
export const Shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  } as ViewStyle,
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 12,
  } as ViewStyle,
  primary: {
    shadowColor: '#5B4CF5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 20,
    elevation: 12,
  } as ViewStyle,
};

// ── React Native Paper Theme ──────────────────────────────
export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary:              Colors.primary,
    onPrimary:            Colors.white,
    primaryContainer:     Colors.primaryLight,
    onPrimaryContainer:   Colors.primaryDark,
    secondary:            Colors.info,
    onSecondary:          Colors.white,
    secondaryContainer:   '#E0F2FE',
    onSecondaryContainer: '#0C4A6E',
    background:           Colors.background,
    onBackground:         Colors.text,
    surface:              Colors.surface,
    onSurface:            Colors.text,
    surfaceVariant:       Colors.surfaceVariant,
    onSurfaceVariant:     Colors.textSecondary,
    outline:              Colors.surfaceBorder,
    error:                Colors.error,
    onError:              Colors.white,
    errorContainer:       '#FEE2E2',
    onErrorContainer:     '#991B1B',
  },
};
