import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.title}>{title}</Text>;
}

const styles = StyleSheet.create({
  title: {
    ...typography.sectionTitle,
    color: colors.white,
    marginBottom: 12,
  },
});
