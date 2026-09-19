import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  FlatList,
  Pressable,
  SafeAreaView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../hooks/useApi';
import { useTheme } from '../context/ThemeContext';
import { formatTravelDate, todayIso } from '../utils/travelUtils';
import {
  INDIA_AIRPORTS,
  GERMANY_AIRPORTS,
  formatAirportLabel,
  airportLabelWithName,
} from '../data/airports';

function toIsoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseIsoDate(iso) {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function TravelDateField({ value, onChange, colors, styles }) {
  const [show, setShow] = useState(false);
  const [iosDraft, setIosDraft] = useState(parseIsoDate(value));
  const minDate = useMemo(() => startOfToday(), []);
  const parsed = parseIsoDate(value);

  const openPicker = () => {
    setIosDraft(parsed);
    setShow(true);
  };

  const handleAndroidChange = (event, selected) => {
    setShow(false);
    if (event?.type === 'dismissed' || !selected) return;
    onChange(toIsoDate(selected));
  };

  const confirmIos = () => {
    onChange(toIsoDate(iosDraft));
    setShow(false);
  };

  return (
    <View style={styles.fieldBlock}>
      <TouchableOpacity
        style={styles.selectBtn}
        onPress={openPicker}
        activeOpacity={0.85}
        accessibilityLabel="Travel date"
      >
        <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
        <Text style={styles.selectText}>{formatTravelDate(value)}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      {show && Platform.OS === 'android' ? (
        <DateTimePicker
          value={parsed}
          mode="date"
          minimumDate={minDate}
          onChange={handleAndroidChange}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={show} animationType="slide" transparent onRequestClose={() => setShow(false)}>
          <View style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={() => setShow(false)} />
            <SafeAreaView style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Travel date</Text>
                <TouchableOpacity onPress={confirmIos} hitSlop={12}>
                  <Text style={styles.modalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={iosDraft}
                mode="date"
                display="spinner"
                minimumDate={minDate}
                onChange={(_, selected) => {
                  if (selected) setIosDraft(selected);
                }}
                style={styles.datePicker}
              />
            </SafeAreaView>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

function AirportPickerField({
  flag,
  value,
  placeholder,
  airports,
  onSelect,
  colors,
  styles,
  accessibilityLabel,
}) {
  const [open, setOpen] = useState(false);
  const selected = airports.find((a) => a.code === value);

  return (
    <View style={styles.fieldBlock}>
      <TouchableOpacity
        style={styles.selectBtn}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
        accessibilityLabel={accessibilityLabel}
      >
        <Text style={styles.selectFlag}>{flag}</Text>
        <Text style={[styles.selectText, !selected && styles.selectPlaceholder]} numberOfLines={1}>
          {selected ? airportLabelWithName(selected) : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)} />
          <SafeAreaView style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {flag} {accessibilityLabel}
              </Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={airports}
              keyExtractor={(item) => item.code}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const active = item.code === value;
                return (
                  <TouchableOpacity
                    style={[styles.airportRow, active && styles.airportRowActive]}
                    onPress={() => {
                      onSelect(item.code);
                      setOpen(false);
                    }}
                  >
                    <View style={styles.airportMeta}>
                      <Text
                        style={[styles.airportCity, active && styles.airportCityActive]}
                        numberOfLines={1}
                      >
                        {item.code} - {item.city}
                      </Text>
                    </View>
                    {active ? <Ionicons name="checkmark-circle" size={22} color="#ff4500" /> : null}
                  </TouchableOpacity>
                );
              }}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

export default function CreateTravelPage({ navigation }) {
  const { apiRequest } = useApi();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const [travelDate, setTravelDate] = useState(todayIso());
  const [fromCode, setFromCode] = useState('');
  const [toCode, setToCode] = useState('FRA');
  const [statusNote, setStatusNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fromAirport = INDIA_AIRPORTS.find((a) => a.code === fromCode);
  const toAirport = GERMANY_AIRPORTS.find((a) => a.code === toCode);

  const handleSubmit = async () => {
    if (!travelDate) {
      setError('Travel date is required');
      return;
    }
    if (!fromAirport) {
      setError('Please select a departure airport in India');
      return;
    }
    if (!toAirport) {
      setError('Please select an arrival airport in Germany');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const data = await apiRequest('/api/travel', {
        method: 'POST',
        body: JSON.stringify({
          travel_date: travelDate,
          from_airport: formatAirportLabel(fromAirport),
          to_airport: formatAirportLabel(toAirport),
          from_country: 'IN',
          to_country: 'DE',
          status_note: statusNote.trim() || null,
        }),
      });
      if (data.slug) {
        navigation.replace('TravelEventPage', { slug: data.slug, celebrate: true });
      } else {
        navigation.navigate('Main', { screen: 'TravelList' });
      }
    } catch (e) {
      setError(e.message || 'Failed to create trip');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <View style={styles.stripe}>
          <View style={styles.stripeBlack} />
          <View style={styles.stripeRed} />
          <View style={styles.stripeGold} />
        </View>
        <View style={styles.hero}>
          <Text style={styles.heroCloudLeft}>☁️</Text>
          <Text style={styles.heroCloudRight}>☁️</Text>
          <Text style={styles.heroPlane}>✈️</Text>
          <View style={styles.routeBadge}>
            <Text style={styles.routeBadgeFlag}>🇮🇳</Text>
            <View style={styles.routeBadgeLine} />
            <Text style={styles.routeBadgeLabel}>Flyers</Text>
            <View style={styles.routeBadgeLine} />
            <Text style={styles.routeBadgeFlag}>🇩🇪</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>Add your flight</Text>
          <Text style={styles.intro}>
            Pick your India → Germany airports so others on a similar date can find you.
          </Text>

          <TravelDateField
            value={travelDate}
            onChange={setTravelDate}
            colors={colors}
            styles={styles}
          />

          <AirportPickerField
            flag="🇮🇳"
            value={fromCode}
            placeholder="From · Select Indian airport…"
            airports={INDIA_AIRPORTS}
            onSelect={setFromCode}
            colors={colors}
            styles={styles}
            accessibilityLabel="From India airport"
          />

          <AirportPickerField
            flag="🇩🇪"
            value={toCode}
            placeholder="To · Select German airport…"
            airports={GERMANY_AIRPORTS}
            onSelect={setToCode}
            colors={colors}
            styles={styles}
            accessibilityLabel="To Germany airport"
          />

          {(fromAirport || toAirport) && (
            <View style={styles.preview}>
              <Text style={styles.previewText}>
                {fromAirport ? fromAirport.code : '—'}
                <Text style={styles.previewPlane}> ✈️ </Text>
                {toAirport ? toAirport.code : '—'}
              </Text>
              <Text style={styles.previewNames}>
                ({fromAirport ? fromAirport.name : '—'} → {toAirport ? toAirport.name : '—'})
              </Text>
            </View>
          )}

          <Text style={styles.label}>
            Short note <Text style={styles.optional}>(optional)</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={statusNote}
            onChangeText={setStatusNote}
            placeholder="Happy to connect & split expenses. Connect with me Bangalore → Berlin flyers."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={200}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
              disabled={submitting}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Add yours</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function createStyles(colors, isDark = false) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.shellBg },
    content: { padding: 12, paddingBottom: 32 },
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.divider,
      overflow: 'hidden',
    },
    stripe: { height: 8, flexDirection: 'row' },
    stripeBlack: { flex: 1, backgroundColor: '#000' },
    stripeRed: { flex: 1, backgroundColor: '#DD0000' },
    stripeGold: { flex: 1, backgroundColor: '#FFCE00' },
    hero: {
      height: 96,
      backgroundColor: isDark ? '#1e293b' : '#dbeafe',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingBottom: 12,
    },
    heroCloudLeft: { position: 'absolute', top: 12, left: 18, fontSize: 18, opacity: 0.7 },
    heroCloudRight: { position: 'absolute', top: 28, right: 22, fontSize: 14, opacity: 0.65 },
    heroPlane: { position: 'absolute', top: 34, left: '22%', fontSize: 22 },
    routeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: 999,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    routeBadgeFlag: { fontSize: 14 },
    routeBadgeLine: { width: 16, height: 1, backgroundColor: colors.divider },
    routeBadgeLabel: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
    body: { padding: 16 },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 6,
    },
    intro: {
      color: colors.textSecondary,
      fontSize: 14,
      marginBottom: 18,
      lineHeight: 20,
      textAlign: 'center',
    },
    fieldBlock: { marginBottom: 4 },
    label: { fontWeight: '700', fontSize: 13, color: colors.textPrimary, marginBottom: 6 },
    optional: { fontWeight: '500', color: colors.textSecondary },
    input: {
      borderWidth: 1,
      borderColor: colors.borderColor || colors.divider,
      borderRadius: 10,
      padding: 12,
      fontSize: 15,
      backgroundColor: colors.inputBg,
      color: colors.textPrimary,
      marginBottom: 14,
    },
    textarea: { minHeight: 84, textAlignVertical: 'top' },
    selectBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      borderColor: colors.borderColor || colors.divider,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 12,
      backgroundColor: colors.inputBg,
      marginBottom: 14,
    },
    selectFlag: { fontSize: 18 },
    selectText: { flex: 1, fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
    selectPlaceholder: { color: colors.textSecondary, fontWeight: '400' },
    preview: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.shellBg,
      borderWidth: 1,
      borderColor: colors.divider,
      marginBottom: 14,
    },
    previewText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
    previewPlane: { fontSize: 16 },
    previewNames: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 16,
      paddingHorizontal: 4,
    },
    error: { color: '#dc2626', fontSize: 13, marginBottom: 10, textAlign: 'center' },
    actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    cancelBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      backgroundColor: colors.cardBg,
    },
    cancelText: { fontWeight: '700', color: colors.textPrimary, fontSize: 15 },
    submitBtn: {
      flex: 1,
      backgroundColor: '#ff4500',
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
    },
    submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    modalRoot: { flex: 1, justifyContent: 'flex-end' },
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    modalSheet: {
      maxHeight: '72%',
      backgroundColor: colors.cardBg,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingBottom: 8,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    modalTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
    modalDone: { fontSize: 16, fontWeight: '700', color: '#ff4500' },
    datePicker: { alignSelf: 'stretch' },
    airportRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    airportRowActive: { backgroundColor: colors.searchBg || colors.shellBg },
    airportMeta: { flex: 1, minWidth: 0 },
    airportCity: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    airportCityActive: { color: colors.textPrimary },
  });
}
