import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useApi } from '../hooks/useApi';
import { useAppShell } from '../context/AppShellContext';
import { useTheme } from '../context/ThemeContext';
import { countryFlag, formatTravelDate, splitAndGroupEvents } from '../utils/travelUtils';

const HERO_POINTS = [
  'Find a travel partner for the same flight or layover',
  'Ask someone who just landed for practical first-week tips',
  'Let others DM you if they need a hand before or after the journey',
];

function TravelRow({ event, onPress, colors, past = false }) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  const u = event.user || {};
  const initial = (u.name || '?').charAt(0).toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.row, past && styles.rowPast]}
      onPress={() => onPress(event)}
      activeOpacity={0.85}
    >
      {u.avatar_url ? (
        <Image source={{ uri: u.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
      )}
      <View style={styles.rowMeta}>
        <Text style={styles.rowName} numberOfLines={1}>
          {u.name || 'Traveler'}
        </Text>
        <Text style={styles.rowRoute} numberOfLines={1}>
          {countryFlag(event.from_country)} {event.from_airport} → {countryFlag(event.to_country)}{' '}
          {event.to_airport}
        </Text>
        {u.germany_city ? (
          <Text style={styles.rowCity} numberOfLines={1}>
            {u.germany_city}
          </Text>
        ) : null}
      </View>
      <Text style={styles.rowDate}>{formatTravelDate(event.travel_date)}</Text>
    </TouchableOpacity>
  );
}

function FlyersHero({ onAdd, colors, isDark }) {
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const walkAnim = useRef(new Animated.Value(0)).current;
  const planeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const walkLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(walkAnim, {
          toValue: 1,
          duration: 550,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(walkAnim, {
          toValue: 0,
          duration: 550,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    const planeLoop = Animated.loop(
      Animated.timing(planeAnim, {
        toValue: 1,
        duration: 7000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    walkLoop.start();
    planeLoop.start();
    return () => {
      walkLoop.stop();
      planeLoop.stop();
    };
  }, [walkAnim, planeAnim]);

  const bobY = walkAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  const luggageTilt = walkAnim.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '2deg'] });
  const passportTilt = walkAnim.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '8deg'] });
  const planeX = planeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 220] });
  const planeOpacity = planeAnim.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <View style={styles.heroCard}>
      <View style={styles.travelerScene}>
        <Text style={styles.emptyCloudLeft}>☁️</Text>
        <Text style={styles.emptyCloudRight}>☁️</Text>
        <Animated.Text
          style={[styles.travelerPlane, { opacity: planeOpacity, transform: [{ translateX: planeX }] }]}
        >
          ✈️
        </Animated.Text>
        <View style={styles.travelerGround} />
        <View style={styles.travelerFlags}>
          <Text style={styles.travelerFlag}>🇮🇳</Text>
          <Text style={styles.travelerFlag}>🇩🇪</Text>
        </View>
        <Animated.View style={[styles.travelerRow, { transform: [{ translateY: bobY }] }]}>
          <View style={styles.person}>
            <View style={styles.personHead} />
            <View style={styles.personBody} />
            <View style={styles.personArmLeft} />
            <Animated.View style={[styles.personArmRight, { transform: [{ rotate: passportTilt }] }]}>
              <View style={styles.passport}>
                <Text style={styles.passportMark}>IN</Text>
              </View>
            </Animated.View>
            <View style={styles.personLegLeft} />
            <View style={styles.personLegRight} />
          </View>
          <Animated.View style={[styles.luggage, { transform: [{ rotate: luggageTilt }] }]}>
            <View style={styles.bagHandle} />
            <View style={styles.bagBig}>
              <Text style={styles.bagTag}>DE</Text>
            </View>
            <View style={styles.bagSmall} />
          </Animated.View>
        </Animated.View>
      </View>

      <View style={styles.heroPoints}>
        {HERO_POINTS.map((point) => (
          <Text key={point} style={styles.heroPoint}>
            • {point}
          </Text>
        ))}
      </View>

      <TouchableOpacity style={styles.emptyCta} onPress={onAdd} activeOpacity={0.9}>
        <Text style={styles.emptyCtaText}>Add yours</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function TravelListPage({ navigation }) {
  const { apiRequest } = useApi();
  const { setHeader } = useAppShell();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      setHeader({ variant: 'title', title: 'Flyers' });
      return () => setHeader({ variant: 'app', title: '' });
    }, [setHeader])
  );

  const loadEvents = useCallback(async () => {
    setError(null);
    try {
      const data = await apiRequest('/api/travel');
      setEvents(data.events || []);
    } catch (e) {
      setError(e.message || 'Failed to load flyers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const { upcomingGroups, pastGroups } = splitAndGroupEvents(events);

  if (loading && events.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading flyers…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadEvents();
          }}
        />
      }
    >
      <View style={styles.pageIntro}>
        <Text style={styles.pageTitle}>Flyers</Text>
        <Text style={styles.pageSubtitle}>
          Find someone flying India → Germany on a similar date
        </Text>
      </View>

      <FlyersHero colors={colors} isDark={isDark} onAdd={() => navigation.navigate('CreateTravelPage')} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!error && events.length > 0 ? (
        <View style={styles.listPanel}>
          {upcomingGroups.map(({ label, items }) => (
            <View key={label} style={styles.section}>
              <Text style={styles.sectionTitle}>{label}</Text>
              <View style={styles.list}>
                {items.map((ev) => (
                  <TravelRow
                    key={ev.slug}
                    event={ev}
                    colors={colors}
                    onPress={(item) => navigation.navigate('TravelEventPage', { slug: item.slug })}
                  />
                ))}
              </View>
            </View>
          ))}

          {pastGroups.length > 0 ? (
            <View style={styles.pastSection}>
              <Text style={styles.pastHeading}>Past</Text>
              {pastGroups.map(({ label, items }) => (
                <View key={label} style={styles.section}>
                  <Text style={styles.sectionTitle}>{label}</Text>
                  <View style={styles.list}>
                    {items.map((ev) => (
                      <TravelRow
                        key={ev.slug}
                        event={ev}
                        colors={colors}
                        past
                        onPress={(item) =>
                          navigation.navigate('TravelEventPage', { slug: item.slug })
                        }
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

function createStyles(colors, isDark = false) {
  return StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.shellBg },
    loadingText: { color: colors.textSecondary, fontSize: 14 },
    container: { flex: 1, backgroundColor: colors.shellBg },
    content: { paddingBottom: 24 },
    pageIntro: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
    pageTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
    pageSubtitle: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
    error: {
      marginHorizontal: 16,
      marginTop: 8,
      color: '#dc2626',
      fontSize: 14,
      textAlign: 'center',
    },
    listPanel: { marginTop: 4 },
    section: { marginTop: 8, marginBottom: 18, paddingHorizontal: 12 },
    pastSection: {
      marginTop: 4,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    pastHeading: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textSecondary,
      paddingHorizontal: 12,
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    list: { gap: 8 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    rowPast: { opacity: 0.72 },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: colors.divider,
    },
    avatarFallback: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.searchBg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.divider,
    },
    avatarInitial: { fontWeight: '700', color: colors.primary, fontSize: 14 },
    rowMeta: { flex: 1, minWidth: 0, gap: 2 },
    rowName: { fontWeight: '700', fontSize: 14, color: colors.textPrimary },
    rowRoute: { fontSize: 12, color: colors.textSecondary },
    rowCity: { fontSize: 11, color: colors.textSecondary, opacity: 0.85 },
    rowDate: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      maxWidth: 88,
      textAlign: 'right',
      lineHeight: 14,
    },
    heroCard: {
      marginHorizontal: 12,
      marginTop: 4,
      marginBottom: 8,
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: 12,
      padding: 16,
      paddingBottom: 20,
      alignItems: 'center',
    },
    travelerScene: {
      width: '100%',
      maxWidth: 340,
      height: 168,
      borderRadius: 14,
      backgroundColor: isDark ? '#1e293b' : '#dbeafe',
      marginBottom: 16,
      overflow: 'hidden',
      alignSelf: 'center',
    },
    emptyCloudLeft: { position: 'absolute', top: 10, left: 14, fontSize: 20, opacity: 0.7 },
    emptyCloudRight: { position: 'absolute', top: 24, right: 18, fontSize: 16, opacity: 0.65 },
    travelerPlane: { position: 'absolute', top: 16, left: 20, fontSize: 18 },
    travelerGround: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 28,
      backgroundColor: isDark ? '#334155' : '#94a3b8',
    },
    travelerFlags: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 3,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
    },
    travelerFlag: { fontSize: 16 },
    travelerRow: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 30,
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: 18,
    },
    person: { width: 46, height: 88, position: 'relative' },
    personHead: {
      position: 'absolute',
      top: 0,
      left: 12,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: '#f5c7a1',
    },
    personBody: {
      position: 'absolute',
      top: 22,
      left: 10,
      width: 26,
      height: 34,
      borderRadius: 8,
      backgroundColor: '#1d4ed8',
    },
    personArmLeft: {
      position: 'absolute',
      top: 26,
      left: 4,
      width: 8,
      height: 28,
      borderRadius: 4,
      backgroundColor: '#f5c7a1',
    },
    personArmRight: {
      position: 'absolute',
      top: 26,
      right: 2,
      width: 8,
      height: 28,
      borderRadius: 4,
      backgroundColor: '#f5c7a1',
    },
    passport: {
      position: 'absolute',
      top: 18,
      left: -6,
      width: 18,
      height: 24,
      borderRadius: 2,
      backgroundColor: '#0f766e',
      alignItems: 'center',
      paddingTop: 3,
    },
    passportMark: { fontSize: 7, fontWeight: '800', color: '#ecfdf5' },
    personLegLeft: {
      position: 'absolute',
      bottom: 0,
      left: 12,
      width: 9,
      height: 28,
      borderRadius: 4,
      backgroundColor: '#1e293b',
    },
    personLegRight: {
      position: 'absolute',
      bottom: 0,
      right: 12,
      width: 9,
      height: 28,
      borderRadius: 4,
      backgroundColor: '#1e293b',
    },
    luggage: { width: 54, height: 58, position: 'relative' },
    bagHandle: {
      position: 'absolute',
      left: 22,
      top: 0,
      width: 3,
      height: 16,
      borderRadius: 2,
      backgroundColor: '#64748b',
    },
    bagBig: {
      position: 'absolute',
      left: 4,
      bottom: 4,
      width: 40,
      height: 36,
      borderRadius: 6,
      backgroundColor: '#c2410c',
      alignItems: 'center',
      justifyContent: 'center',
    },
    bagTag: {
      fontSize: 8,
      fontWeight: '800',
      color: '#fff7ed',
      backgroundColor: '#dd0000',
      overflow: 'hidden',
      borderRadius: 3,
      paddingHorizontal: 4,
      paddingVertical: 2,
    },
    bagSmall: {
      position: 'absolute',
      right: 0,
      bottom: 28,
      width: 22,
      height: 18,
      borderRadius: 5,
      backgroundColor: '#0ea5e9',
    },
    heroPoints: { alignSelf: 'stretch', gap: 8, marginTop: 4, marginBottom: 18 },
    heroPoint: { fontSize: 13, lineHeight: 18, color: colors.textSecondary, textAlign: 'left' },
    emptyCta: {
      backgroundColor: '#ff4500',
      paddingVertical: 12,
      paddingHorizontal: 28,
      borderRadius: 10,
      minWidth: 160,
      alignItems: 'center',
    },
    emptyCtaText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  });
}
