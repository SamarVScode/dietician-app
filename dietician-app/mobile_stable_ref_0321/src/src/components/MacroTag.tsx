import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export function MacroTagRow({
  protein,
  carbs,
  fats,
}: {
  protein: number;
  carbs: number;
  fats: number;
}) {
  return (
    <View style={styles.row}>
      <MacroPill label="P" value={`${Math.round(protein)}g`} bg={colors.proteinBg} text={colors.proteinText} border={colors.proteinBorder} />
      <MacroPill label="C" value={`${Math.round(carbs)}g`}  bg={colors.carbBg}    text={colors.carbText}    border={colors.carbBorder} />
      <MacroPill label="F" value={`${Math.round(fats)}g`}   bg={colors.fatBg}     text={colors.fatText}     border={colors.fatBorder} />
    </View>
  );
}

function MacroPill({
  label,
  value,
  bg,
  text,
  border,
}: {
  label: string;
  value: string;
  bg: string;
  text: string;
  border: string;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.pillLabel, { color: text }]}>{label}</Text>
      <Text style={[styles.pillValue, { color: text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 46,
  },
  pillLabel: {
    width: 12,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  pillValue: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'left',
  },
});
