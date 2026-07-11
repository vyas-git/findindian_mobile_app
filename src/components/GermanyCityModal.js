import React, { useEffect, useState } from 'react';
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
import colors from '../theme/colors';

const COMMON_CITIES = [
  'Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart',
  'Düsseldorf', 'Dortmund', 'Hannover', 'Leipzig', 'Bremen', 'Dresden',
];

export default function GermanyCityModal({ visible, onSaved }) {
  const { apiRequest } = useApi();
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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: colors.textSecondary, marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  cityRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  cityText: { fontSize: 16, fontWeight: '500' },
});
