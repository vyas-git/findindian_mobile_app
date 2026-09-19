import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { countryFlag, formatTravelDate } from '../utils/travelUtils';

function GermanyStripe() {
  return (
    <View style={{ flexDirection: 'row', height: 8 }}>
      <View style={{ flex: 1, backgroundColor: '#000' }} />
      <View style={{ flex: 1, backgroundColor: '#DD0000' }} />
      <View style={{ flex: 1, backgroundColor: '#FFCE00' }} />
    </View>
  );
}

export default function FlyersTripCard({
  event,
  showJoin,
  isOwner,
  onJoin,
  onShare,
  onDownload,
  onDelete,
  deleting,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const user = event?.user || {};
  const name = user.name || 'Traveler';
  const initial = name.charAt(0).toUpperCase();

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <GermanyStripe />

        <View style={styles.profile}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
          <Text style={styles.name}>{name}</Text>
          {user.germany_city ? (
            <Text style={styles.city}>{user.germany_city}, Germany</Text>
          ) : null}
        </View>

        <Text style={styles.date}>{formatTravelDate(event.travel_date)}</Text>

        <View style={styles.routePanel}>
          <View style={styles.routeEnd}>
            <Text style={styles.routeFlag}>{countryFlag(event.from_country)}</Text>
            <Text style={styles.routeLabel}>From</Text>
            <Text style={styles.routeAirport} numberOfLines={2}>
              {event.from_airport}
            </Text>
          </View>
          <View style={styles.routeMid}>
            <View style={styles.routeLine} />
            <Text style={styles.routeIcon}>✈️</Text>
            <View style={styles.routeLine} />
          </View>
          <View style={styles.routeEnd}>
            <Text style={styles.routeFlag}>{countryFlag(event.to_country)}</Text>
            <Text style={styles.routeLabel}>To</Text>
            <Text style={styles.routeAirport} numberOfLines={2}>
              {event.to_airport}
            </Text>
          </View>
        </View>

        {event.status_note ? (
          <Text style={styles.note}>&ldquo;{event.status_note}&rdquo;</Text>
        ) : null}

        <View style={styles.btns}>
          {showJoin ? (
            <TouchableOpacity style={styles.joinBtn} onPress={onJoin} activeOpacity={0.9}>
              <Text style={styles.joinBtnText}>Join me</Text>
            </TouchableOpacity>
          ) : null}

          {onDownload ? (
            <TouchableOpacity style={styles.secondaryBtn} onPress={onDownload} activeOpacity={0.85}>
              <Text style={styles.secondaryBtnText}>Download Flyer Card</Text>
            </TouchableOpacity>
          ) : null}

          {onShare ? (
            <TouchableOpacity style={styles.secondaryBtn} onPress={onShare} activeOpacity={0.85}>
              <Text style={styles.secondaryBtnText}>Share Flyer</Text>
            </TouchableOpacity>
          ) : null}

          {isOwner && onDelete ? (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={onDelete}
              disabled={deleting}
              activeOpacity={0.85}
            >
              <Text style={styles.deleteBtnText}>{deleting ? 'Deleting…' : 'Delete trip'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    wrap: { width: '100%' },
    card: {
      width: '100%',
      backgroundColor: colors.cardBg,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.divider,
      overflow: 'hidden',
      paddingBottom: 20,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    profile: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      marginBottom: 12,
      borderWidth: 3,
      borderColor: colors.divider,
    },
    avatarFallback: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.searchBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      borderWidth: 3,
      borderColor: colors.divider,
    },
    avatarInitial: { fontSize: 32, fontWeight: '700', color: colors.primary },
    name: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
    city: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
    date: {
      textAlign: 'center',
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
      marginTop: 14,
      marginBottom: 4,
    },
    routePanel: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.searchBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.divider,
      paddingVertical: 18,
      paddingHorizontal: 10,
      marginHorizontal: 16,
      marginTop: 14,
    },
    routeEnd: { flex: 1, alignItems: 'center', gap: 4 },
    routeFlag: { fontSize: 34 },
    routeLabel: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    routeAirport: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
      paddingHorizontal: 4,
    },
    routeMid: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 },
    routeLine: { width: 14, height: 2, backgroundColor: colors.divider, borderRadius: 1 },
    routeIcon: { fontSize: 22 },
    note: {
      textAlign: 'center',
      fontStyle: 'italic',
      color: colors.textSecondary,
      marginTop: 16,
      marginHorizontal: 20,
      fontSize: 15,
      lineHeight: 22,
    },
    btns: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 10 },
    joinBtn: {
      backgroundColor: '#ffce00',
      borderWidth: 1,
      borderColor: '#000',
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    joinBtnText: { fontSize: 17, fontWeight: '800', color: '#111827' },
    secondaryBtn: {
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: 14,
      paddingVertical: 13,
      alignItems: 'center',
      backgroundColor: colors.cardBg,
    },
    secondaryBtnText: { fontWeight: '700', color: colors.textPrimary, fontSize: 15 },
    deleteBtn: {
      borderWidth: 1,
      borderColor: 'rgba(220,38,38,0.35)',
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    deleteBtnText: { fontWeight: '700', color: '#dc2626', fontSize: 14 },
  });
}
