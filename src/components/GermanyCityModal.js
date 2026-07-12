import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useApi } from '../hooks/useApi';
import { useTheme } from '../context/ThemeContext';

const COMMON_CITIES = [
  'Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart',
  'Düsseldorf', 'Dortmund', 'Hannover', 'Leipzig', 'Bremen', 'Dresden',
];

export default function GermanyCityModal({ visible, onSaved }) {
  const { apiRequest } = useApi();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const cities = COMMON_CITIES.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase())
  );

  const saveCity = async (city) => {
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
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <Text style={styles.title}>Select your city in Germany</Text>
        <Text style={styles.subtitle}>This helps other members find you on the map.</Text>
        <TextInput
          style={styles.input}
          placeholder="Search city..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
        />
        {saving ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={cities}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.cityRow} onPress={() => saveCity(item)}>
                <Text style={styles.cityText}>{item} 🇩🇪</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: colors.shellBg },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 8, color: colors.textPrimary },
    subtitle: { color: colors.textSecondary, marginBottom: 16 },
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
    cityRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.divider },
    cityText: { fontSize: 16, fontWeight: '500', color: colors.textPrimary },
  });
}
