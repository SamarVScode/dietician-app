import type { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography: Record<string, TextStyle> = {
  mainHeading:     { fontSize: 30, fontWeight: '700', color: colors.textPrimary },
  sectionTitle:    { fontSize: 13, fontWeight: '600', letterSpacing: 1, color: colors.textSecondary, textTransform: 'uppercase' },
  primaryNumber:   { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  label:           { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  
  // Legacy aliases (mapped to new styles to avoid breaking existing screens before refactor)
  greetingEyebrow: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  userName:        { fontSize: 30, fontWeight: '700', color: colors.textPrimary },
  goalTitle:       { fontSize: 30, fontWeight: '700', color: colors.textPrimary },
  cardHeading:     { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  cardHeadingSm:   { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  subLabel:        { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  subLabelSm:      { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  foodName:        { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  kcalBadge:       { fontSize: 13, fontWeight: '700', color: colors.accentGreen },
  infoLabel:       { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  infoValue:       { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  navLabel:        { fontSize: 11, fontWeight: '500' },
};

