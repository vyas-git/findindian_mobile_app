import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../hooks/useApi';
import { useTheme } from '../context/ThemeContext';
import { TOP_CITIES, ALL_GERMANY_PLACES } from '../data/germanyPlaces';

function uniquePreserveOrder(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = String(item).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

const ALL_UNIQUE = uniquePreserveOrder([...TOP_CITIES, ...ALL_GERMANY_PLACES]);
const TOP_SET = new Set(TOP_CITIES.map((c) => c.toLowerCase()));

/**
 * @param {object} props
 * @param {boolean} props.visible
 * @param {(city: string) => void} [props.onSaved] - first-login: saves via API then callback
 * @param {(city: string) => void} [props.onSelect] - settings: pick only, parent saves later
 * @param {() => void} [props.onClose] - dismiss (settings)
 * @param {boolean} [props.allowDismiss] - show close button
 * @param {string} [props.selectedCity] - highlight current selection
 */
export default function GermanyCityModal({
  visible,
  onSaved,
  onSelect,
  onClose,
  allowDismiss = false,
  selectedCity = '',
}) {
  const insets = useSafeAreaInsets();
  const { apiRequest } = useApi();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const pickOnly = typeof onSelect === 'function';

  useEffect(() => {
    if (visible) setQuery('');
  }, [visible]);

  const cities = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      const popular = TOP_CITIES.filter((c) => TOP_SET.has(c.toLowerCase()));
      const rest = ALL_UNIQUE.filter((c) => !TOP_SET.has(c.toLowerCase())).sort((a, b) =>
        a.localeCompare(b, 'de')
      );
      return { list: [...popular, ...rest], popularCount: popular.length };
    }
    return {
      list: ALL_UNIQUE.filter((place) => place.toLowerCase().includes(q)).sort((a, b) => {
        const aTop = TOP_SET.has(a.toLowerCase()) ? 0 : 1;
        const bTop = TOP_SET.has(b.toLowerCase()) ? 0 : 1;
        if (aTop !== bTop) return aTop - bTop;
        return a.localeCompare(b, 'de');
      }),
      popularCount: 0,
    };
  }, [query]);

  const handlePick = async (city) => {
    if (pickOnly) {
      onSelect(city);
      return;
    }

    setSaving(true);
    try {
      await apiRequest('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify({ germany_city: city }),
      });
      onSaved?.(city);
    } catch (e) {
      console.warn('saveCity', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <KeyboardAvoidingView
        style={[styles.flex, { backgroundColor: colors.shellBg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.container,
            {
              paddingTop: Math.max(insets.top, 20) + 12,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          {allowDismiss ? (
            <TouchableOpacity style={styles.closeRow} onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : null}

          <Text style={styles.title}>Select your City/Place in Germany 🇩🇪</Text>
          <Text style={styles.subtitle}>
            Search from 1000+ cities, towns, villages, and neighborhoods
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Search city, town, or neighborhood..."
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="words"
            clearButtonMode="while-editing"
          />
          {saving ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              style={styles.list}
              data={cities.list}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={40}
              windowSize={12}
              contentContainerStyle={styles.listContent}
              renderItem={({ item, index }) => {
                const showPopularLabel = !query && index === 0;
                const showMoreLabel =
                  !query && cities.popularCount > 0 && index === cities.popularCount;
                const isSelected =
                  selectedCity &&
                  String(selectedCity).toLowerCase() === String(item).toLowerCase();
                return (
                  <View>
                    {showPopularLabel ? <Text style={styles.sectionHeader}>Popular cities</Text> : null}
                    {showMoreLabel ? <Text style={styles.sectionHeader}>All places A–Z</Text> : null}
                    <TouchableOpacity style={styles.cityRow} onPress={() => handlePick(item)}>
                      <Text style={[styles.cityText, isSelected && styles.cityTextSelected]}>
                        {item}
                      </Text>
                      {isSelected ? (
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      ) : null}
                    </TouchableOpacity>
                  </View>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.empty}>No matching places. Try another spelling.</Text>
              }
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1, paddingHorizontal: 20 },
    closeRow: { alignSelf: 'flex-end', marginBottom: 4, padding: 4 },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 8, color: colors.textPrimary },
    subtitle: { color: colors.textSecondary, marginBottom: 16, fontSize: 14 },
    input: {
      borderWidth: 1,
      borderColor: colors.borderColor,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      fontSize: 16,
      backgroundColor: colors.inputBg,
      color: colors.textPrimary,
    },
    list: { flex: 1 },
    listContent: { paddingBottom: 32 },
    sectionHeader: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      marginTop: 12,
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    cityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    cityText: { fontSize: 16, fontWeight: '500', color: colors.textPrimary, flex: 1, paddingRight: 8 },
    cityTextSelected: { color: colors.primary, fontWeight: '700' },
    empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 24 },
  });
}
