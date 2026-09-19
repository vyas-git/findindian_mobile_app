import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function FlyersCelebrateSheet({ open, onClose, travelerName }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const slide = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);

  const dismiss = useCallback(() => {
    setVisible(false);
    Animated.timing(slide, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onClose();
    });
  }, [onClose, slide]);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return undefined;
    }
    const showTimer = requestAnimationFrame(() => setVisible(true));
    Animated.timing(slide, {
      toValue: 1,
      duration: 340,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    const hideTimer = setTimeout(() => {
      dismiss();
    }, 4200);
    return () => {
      cancelAnimationFrame(showTimer);
      clearTimeout(hideTimer);
    };
  }, [open, slide, dismiss]);

  if (!open && !visible) return null;

  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [240, 0],
  });

  return (
    <Modal transparent visible animationType="none" onRequestClose={dismiss}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={dismiss} accessibilityLabel="Dismiss" />
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.burst} accessibilityElementsHidden>
            <Text style={styles.burstEmoji}>✈️</Text>
            <Text style={styles.burstEmoji}>🎉</Text>
            <Text style={styles.burstEmoji}>🇮🇳</Text>
            <Text style={styles.burstEmoji}>🇩🇪</Text>
            <Text style={styles.burstEmoji}>✨</Text>
          </View>
          <Text style={styles.kicker}>You&apos;re live</Text>
          <Text style={styles.title}>Congratulations!</Text>
          <Text style={styles.lead}>
            {travelerName ? `${travelerName}, your` : 'Your'} flyer is posted. Share it so others
            flying around the same date can find you.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={dismiss} activeOpacity={0.9}>
            <Text style={styles.btnText}>Nice!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet: {
      marginHorizontal: 12,
      marginBottom: 18,
      borderRadius: 20,
      padding: 20,
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.divider,
      alignItems: 'center',
    },
    burst: { flexDirection: 'row', gap: 6, marginBottom: 8 },
    burstEmoji: { fontSize: 22 },
    kicker: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
      color: '#ff4500',
      textTransform: 'uppercase',
    },
    title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
    lead: {
      marginTop: 8,
      marginBottom: 16,
      textAlign: 'center',
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    btn: {
      minWidth: 140,
      backgroundColor: '#ffce00',
      borderWidth: 1,
      borderColor: '#000',
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    btnText: { fontWeight: '800', color: '#111827', fontSize: 15 },
  });
}
