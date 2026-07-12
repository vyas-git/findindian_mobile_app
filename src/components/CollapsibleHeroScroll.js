import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DEFAULT_HERO_HEIGHT = SCREEN_HEIGHT * 0.48;

export default function CollapsibleHeroScroll({
  hero,
  children,
  heroHeight = DEFAULT_HERO_HEIGHT,
  stickyHeader,
  refreshControl,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const heroAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, heroHeight],
      [0, -heroHeight * 0.85],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(scrollY.value, [0, heroHeight * 0.7, heroHeight], [1, 0.4, 0], Extrapolation.CLAMP);
    const scale = interpolate(scrollY.value, [0, heroHeight], [1, 0.92], Extrapolation.CLAMP);
    return {
      transform: [{ translateY }, { scale }],
      opacity,
      height: heroHeight,
    };
  });

  const stickyStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [heroHeight * 0.5, heroHeight], [0, 1], Extrapolation.CLAMP);
    return { opacity };
  });

  const renderHero = useCallback(() => hero, [hero]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.heroContainer, heroAnimatedStyle]}>{renderHero()}</Animated.View>

      {stickyHeader ? (
        <Animated.View style={[styles.stickyHeader, stickyStyle]} pointerEvents="box-none">
          {stickyHeader}
        </Animated.View>
      ) : null}

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: heroHeight, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        <View style={styles.contentCard}>{children}</View>
      </Animated.ScrollView>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.shellBg },
    heroContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 2,
      overflow: 'hidden',
    },
    stickyHeader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 3,
    },
    contentCard: {
      backgroundColor: colors.cardBg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      minHeight: SCREEN_HEIGHT * 0.6,
      paddingTop: 8,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: -2 },
      elevation: 4,
    },
  });
}
