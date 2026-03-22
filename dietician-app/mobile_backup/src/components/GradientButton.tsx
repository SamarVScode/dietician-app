import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  align?: 'left' | 'right' | 'full';
  loading?: boolean;
  style?: ViewStyle;
  destructive?: boolean;
}

export function GradientButton({
  label,
  onPress,
  align = 'full',
  loading = false,
  style,
  destructive = false,
}: GradientButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      tension: 200,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 200,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const gradStart = destructive ? '#d94a4a' : colors.primary;
  const gradEnd   = destructive ? '#ff7070' : colors.accent;


  const alignStyle: ViewStyle =
    align === 'right'
      ? { alignSelf: 'flex-end' }
      : align === 'left'
      ? { alignSelf: 'flex-start' }
      : { alignSelf: 'stretch' };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, alignStyle, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
        disabled={loading}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <LinearGradient
          colors={[gradStart, gradEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.label}>{label}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    height: 52,
    borderRadius: 999,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
    // bioluminescent glow
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    minWidth: 140,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.4,
  },
});
