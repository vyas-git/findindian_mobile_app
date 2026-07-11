import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useApi } from '../hooks/useApi';
import colors from '../theme/colors';

export default function JobsScreen() {
  const { apiRequest } = useApi();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadJobs = useCallback(async () => {
    try {
      const data = await apiRequest('/api/jobs?limit=50&offset=0');
      setJobs(data.jobs || []);
    } catch (e) {
      console.warn('loadJobs', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={jobs}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadJobs(); }} />
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => item.url && Linking.openURL(item.url)}
        >
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.company}>{item.company || item.source}</Text>
          <Text style={styles.location}>{item.location}</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No jobs found</Text>}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  title: { fontWeight: '700', fontSize: 16 },
  company: { color: colors.primary, marginTop: 4 },
  location: { color: colors.textSecondary, marginTop: 2, fontSize: 13 },
  empty: { textAlign: 'center', color: colors.textSecondary, padding: 24 },
});
