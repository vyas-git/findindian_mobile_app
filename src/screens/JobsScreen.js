import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { useApi } from '../hooks/useApi';
import { useAppShell } from '../context/AppShellContext';
import { useTheme } from '../context/ThemeContext';

export default function JobsScreen() {
  const { apiRequest } = useApi();
  const { setHeader } = useAppShell();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setHeader({ variant: 'title', title: 'Jobs' });
      return () => setHeader({ variant: 'app', title: '' });
    }, [setHeader])
  );

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

  const openApplyLink = async (url) => {
    if (!url) {
      Alert.alert('No link', 'This job does not have an apply URL.');
      return;
    }
    try {
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: colors.headerBg,
        controlsColor: colors.primary,
        showTitle: true,
      });
    } catch (e) {
      Alert.alert('Could not open link', e.message || 'Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.listContainer}
      data={jobs}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadJobs(); }} />
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.company}>{item.company || item.source}</Text>
          {item.location ? <Text style={styles.location}>{item.location}</Text> : null}
          {item.url ? (
            <TouchableOpacity style={styles.applyBtn} onPress={() => openApplyLink(item.url)}>
              <Ionicons name="open-outline" size={16} color="#fff" />
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No jobs found</Text>}
    />
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.shellBg },
    listContainer: { flex: 1, backgroundColor: colors.shellBg },
    list: { padding: 12 },
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    title: { fontWeight: '700', fontSize: 16, color: colors.textPrimary },
    company: { color: colors.primary, marginTop: 4 },
    location: { color: colors.textSecondary, marginTop: 2, fontSize: 13 },
    applyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 12,
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    empty: { textAlign: 'center', color: colors.textSecondary, padding: 24 },
  });
}
