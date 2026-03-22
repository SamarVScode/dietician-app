import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export function GradientButton({
  label,
  onPress,
  align = 'right',
  style,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  align?: 'right' | 'center' | 'left';
  style?: ViewStyle;
  loading?: boolean;
}) {
  const alignSelf = align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start';
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.95, tension: 200, friction: 8, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={loading}
      activeOpacity={1}
      style={[{ alignSelf }, style]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={[colors.btnGradStart, colors.btnGradEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <Text style={styles.label}>{loading ? 'Please wait...' : label}</Text>
          <View style={styles.arrowCircle}>
            <MaterialCommunityIcons name="arrow-right" size={16} color={colors.white} />
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 50,
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
