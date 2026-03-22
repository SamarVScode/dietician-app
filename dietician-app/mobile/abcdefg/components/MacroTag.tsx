import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { radius } from '../theme/spacing';

type MacroType = 'p' | 'c' | 'f';

const MACRO_CONFIG: Record<MacroType, { bg: string; text: string; border: string; prefix: string }> = {
  p: { bg: colors.proteinBg, text: colors.proteinText, border: colors.proteinBorder, prefix: 'P' },
  c: { bg: colors.carbBg, text: colors.carbText, border: colors.carbBorder, prefix: 'C' },
  f: { bg: colors.fatBg, text: colors.fatText, border: colors.fatBorder, prefix: 'F' },
};

export function MacroTag({ type, value }: { type: MacroType; value: number }) {
  const cfg = MACRO_CONFIG[type];
  return (
    <View style={[styles.tag, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Text style={[styles.text, { color: cfg.text }]}>
        {cfg.prefix} {'\u00B7'} {Math.round(value)}g
      </Text>
    </View>
  );
}

export function MacroTagColumn({ protein, carbs, fats }: { protein: number; carbs: number; fats: number }) {
  return (
    <View style={styles.column}>
      <MacroTag type="p" value={protein} />
      <MacroTag type="c" value={carbs} />
      <MacroTag type="f" value={fats} />
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderRadius: radius.macroTag,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
  column: {
    gap: 4,
  },
});
