import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function FlyersBackButton({ onPress, variant = 'inline' }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(variant), [variant]);

  return (
    <TouchableOpacity style={styles.btn} onPress={onPress} activeOpacity={0.85} hitSlop={8}>
      <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
    </TouchableOpacity>
  );
}

function createStyles(variant) {
  return StyleSheet.create({
    btn: {
      padding: 4,
      ...(variant === 'inline' ? { marginBottom: 12, marginLeft: 4 } : { marginLeft: 4 }),
    },
  });
}
