import React, { useCallback, useImperativeHandle, forwardRef, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Share, Image } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../context/ThemeContext';
import { countryFlag, formatTravelDate } from '../utils/travelUtils';

const CARD_W = 360;
const CARD_H = 640;

function iataCode(airportLabel) {
  if (!airportLabel) return '—';
  const m = String(airportLabel).match(/^([A-Z]{3})\b/);
  return m ? m[1] : String(airportLabel).slice(0, 3).toUpperCase();
}

function airportCity(airportLabel) {
  if (!airportLabel) return '';
  const parts = String(airportLabel).split(' - ');
  return parts.length > 1 ? parts.slice(1).join(' - ') : airportLabel;
}

function GermanyStripe() {
  return (
    <View style={{ flexDirection: 'row', height: 8 }}>
      <View style={{ flex: 1, backgroundColor: '#000' }} />
      <View style={{ flex: 1, backgroundColor: '#DD0000' }} />
      <View style={{ flex: 1, backgroundColor: '#FFCE00' }} />
    </View>
  );
}

function FakeBarcode({ color }) {
  const bars = [3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 3, 1, 2, 3, 1, 2, 4, 1, 3];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 44, gap: 1.5 }}>
      {bars.map((w, i) => (
        <View
          key={`${w}-${i}`}
          style={{
            width: w,
            height: i % 5 === 0 ? 44 : 36,
            backgroundColor: color,
            opacity: i % 3 === 0 ? 0.35 : 1,
          }}
        />
      ))}
    </View>
  );
}

/** Boarding-pass style flyer for social status. */
const TravelShareCard = forwardRef(function TravelShareCard({ event, pageUrl }, ref) {
  const cardRef = useRef(null);
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const user = event?.user || {};
  const name = user.name || 'Traveler';
  const initial = name.charAt(0).toUpperCase();
  const fromCode = iataCode(event?.from_airport);
  const toCode = iataCode(event?.to_airport);
  const fromCity = airportCity(event?.from_airport);
  const toCity = airportCity(event?.to_airport);

  const download = useCallback(async () => {
    if (!event || !cardRef.current) return;
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Flyers status',
        });
      } else {
        await Share.share({ url: uri, message: pageUrl });
      }
    } catch (e) {
      Alert.alert('Share failed', e.message || 'Could not create status image.');
    }
  }, [event, pageUrl]);

  useImperativeHandle(ref, () => ({ download }), [download]);

  if (!event) return null;

  return (
    <View style={styles.offscreen} pointerEvents="none">
      <View ref={cardRef} collapsable={false} style={styles.captureCard}>
        <View style={styles.pass}>
          <GermanyStripe />
          <View style={styles.headerBar}>
            <Text style={styles.headerLeft}>BOARDING PASS</Text>
            <Text style={styles.headerRight}>FLYERS</Text>
          </View>

          <View style={styles.profile}>
            {user.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            )}
            <Text style={styles.passengerName} numberOfLines={1}>
              {name}
            </Text>
            {user.germany_city ? (
              <Text style={styles.passengerCity} numberOfLines={1}>
                {user.germany_city}, Germany
              </Text>
            ) : null}
          </View>

          <View style={styles.dash} />

          <View style={styles.routeRow}>
            <View style={styles.routeEnd}>
              <Text style={styles.code}>{fromCode}</Text>
              <Text style={styles.city} numberOfLines={1}>
                {countryFlag(event.from_country)} {(fromCity || 'India').toUpperCase()}
              </Text>
              <Text style={styles.fromTo}>FROM</Text>
            </View>
            <Text style={styles.plane}>✈️</Text>
            <View style={styles.routeEnd}>
              <Text style={styles.code}>{toCode}</Text>
              <Text style={styles.city} numberOfLines={1}>
                {countryFlag(event.to_country)} {(toCity || 'Germany').toUpperCase()}
              </Text>
              <Text style={styles.fromTo}>TO</Text>
            </View>
          </View>

          <View style={styles.chips}>
            <View style={styles.chip}>
              <Text style={styles.chipLabel}>DATE</Text>
              <Text style={styles.chipValue} numberOfLines={2}>
                {formatTravelDate(event.travel_date)}
              </Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipLabel}>ROUTE</Text>
              <Text style={styles.chipValue}>IN → DE</Text>
            </View>
          </View>

          {event.status_note ? (
            <Text style={styles.note} numberOfLines={2}>
              &ldquo;{event.status_note}&rdquo;
            </Text>
          ) : null}

          <View style={styles.dash} />

          <View style={styles.metaRow}>
            <View>
              <Text style={styles.chipLabel}>GATE</Text>
              <Text style={styles.metaValue}>—</Text>
            </View>
            <View>
              <Text style={styles.chipLabel}>SEAT</Text>
              <Text style={styles.metaValue}>—</Text>
            </View>
            <View>
              <Text style={styles.chipLabel}>CLASS</Text>
              <Text style={styles.metaValue}>ECO</Text>
            </View>
          </View>

          <View style={styles.barcodeWrap}>
            <FakeBarcode color={colors.textPrimary} />
          </View>

          <View style={styles.sideStub}>
            <Text style={styles.sideStubText}>BOARDING PASS · FLYERS</Text>
          </View>
        </View>

        <Text style={styles.captureBrand}>
          <Text style={styles.brandFind}>find</Text><Text style={styles.brandInd}>ind</Text><Text style={styles.brandIan}>ian</Text><Text style={styles.brandDe}>.de</Text>
        </Text>
        <Text style={styles.captureTagline}>Connect · Meet · Grow Together</Text>
      </View>
    </View>
  );
});

export default TravelShareCard;

function createStyles(colors, isDark) {
  const accentSoft = isDark ? '#1e293b' : '#eff6ff';
  const accent = isDark ? '#60a5fa' : '#1d4ed8';
  const shell = isDark ? '#020617' : '#0b1f3a';

  return StyleSheet.create({
    offscreen: { position: 'absolute', left: -9999, top: 0, opacity: 0 },
    captureCard: {
      width: CARD_W,
      height: CARD_H,
      backgroundColor: shell,
      paddingTop: 28,
      paddingBottom: 18,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    pass: {
      width: '100%',
      backgroundColor: colors.cardBg,
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.divider,
      paddingBottom: 14,
      position: 'relative',
    },
    headerBar: {
      backgroundColor: accentSoft,
      paddingHorizontal: 14,
      paddingVertical: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerLeft: { fontSize: 12, fontWeight: '800', color: accent, letterSpacing: 0.4 },
    headerRight: { fontSize: 11, fontWeight: '800', color: colors.textSecondary, letterSpacing: 0.6 },
    profile: {
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingTop: 16,
      paddingRight: 28,
    },
    avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: colors.divider },
    avatarFallback: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.divider,
    },
    avatarInitial: { fontSize: 28, fontWeight: '700', color: accent },
    passengerName: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 10,
      textAlign: 'center',
    },
    passengerCity: { fontSize: 12, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
    dash: {
      marginVertical: 12,
      marginHorizontal: 14,
      borderTopWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.divider,
    },
    routeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingRight: 28,
    },
    routeEnd: { flex: 1, alignItems: 'center' },
    code: { fontSize: 34, fontWeight: '900', color: colors.textPrimary, letterSpacing: 1 },
    city: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
    fromTo: { fontSize: 10, fontWeight: '800', color: accent, marginTop: 4, letterSpacing: 0.6 },
    plane: { fontSize: 20, marginHorizontal: 4 },
    chips: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 14,
      paddingRight: 28,
      marginTop: 14,
    },
    chip: {
      flex: 1,
      backgroundColor: accentSoft,
      borderRadius: 10,
      padding: 10,
    },
    chipLabel: { fontSize: 9, fontWeight: '800', color: colors.textSecondary, letterSpacing: 0.5 },
    chipValue: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
    note: {
      marginTop: 10,
      marginHorizontal: 14,
      marginRight: 28,
      fontSize: 12,
      fontStyle: 'italic',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingRight: 36,
      marginBottom: 10,
    },
    metaValue: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginTop: 2 },
    barcodeWrap: { paddingHorizontal: 14, paddingRight: 36 },
    sideStub: {
      position: 'absolute',
      right: 0,
      top: 40,
      bottom: 0,
      width: 22,
      backgroundColor: isDark ? '#1e293b' : '#1e3a8a',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sideStubText: {
      color: '#fff',
      fontSize: 8,
      fontWeight: '800',
      letterSpacing: 1,
      transform: [{ rotate: '-90deg' }],
      width: 160,
      textAlign: 'center',
    },
    captureBrand: {
      fontSize: 15,
      fontWeight: '700',
      textAlign: 'center',
      marginTop: 10,
      letterSpacing: 0,
    },
    brandFind: { color: isDark ? '#e8eaed' : '#f8fafc', fontWeight: '700', letterSpacing: 0 },
    brandInd: { color: '#FF9500', fontWeight: '700', letterSpacing: 0 },
    brandIan: { color: '#34C759', fontWeight: '700', letterSpacing: 0 },
    brandDe: { color: '#FF3B30', fontWeight: '700', letterSpacing: 0 },
    captureTagline: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#94a3b8' : '#93c5fd',
      textAlign: 'center',
      marginTop: 2,
    },
  });
}
