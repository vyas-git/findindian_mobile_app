import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { useApi } from '../hooks/useApi';
import { useAppShell } from '../context/AppShellContext';
import { useTheme } from '../context/ThemeContext';

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

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
      renderItem={({ item }) => {
        const applyUrl = item.apply_url || item.source_url;
        const description = item.description
          ? item.description.length > 200
            ? `${item.description.substring(0, 200)}...`
            : item.description
          : null;
        const tags = Array.isArray(item.tags) ? item.tags.slice(0, 5) : [];

        return (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            {item.company || item.source ? (
              <Text style={styles.company}>{item.company || item.source}</Text>
            ) : null}

            <View style={styles.details}>
              {item.location ? (
                <Text style={styles.detailItem}>📍 {item.location}</Text>
              ) : null}
              {item.job_type ? (
                <Text style={styles.detailItem}>⏰ {item.job_type}</Text>
              ) : null}
              {item.salary ? (
                <Text style={styles.detailItem}>💰 {item.salary}</Text>
              ) : null}
              {item.posted_date ? (
                <Text style={styles.detailItem}>📅 {formatDate(item.posted_date)}</Text>
              ) : null}
            </View>

            {description ? <Text style={styles.description}>{description}</Text> : null}

            {tags.length > 0 ? (
              <View style={styles.tags}>
                {tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.cardFooter}>
              <TouchableOpacity style={styles.applyBtn} onPress={() => openApplyLink(applyUrl)}>
                <Text style={styles.applyBtnText}>Apply Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
      ListEmptyComponent={<Text style={styles.empty}>No jobs found</Text>}
    />
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.shellBg },
    listContainer: { flex: 1, backgroundColor: colors.shellBg },
    list: { padding: 12, gap: 12 },
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: 12,
      padding: 16,
      marginBottom: 4,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    title: { fontWeight: '600', fontSize: 17, color: colors.textPrimary },
    company: { color: colors.textSecondary, marginTop: 4, fontSize: 15, fontWeight: '500' },
    details: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 10,
      marginBottom: 4,
    },
    detailItem: { color: colors.textSecondary, fontSize: 13 },
    description: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 8,
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
    },
    tag: {
      backgroundColor: colors.searchBg,
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 16,
    },
    tagText: { color: colors.textSecondary, fontSize: 12 },
    cardFooter: {
      marginTop: 14,
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    applyBtn: {
      backgroundColor: '#ff4500',
      paddingVertical: 10,
      paddingHorizontal: 24,
      borderRadius: 8,
    },
    applyBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    empty: { textAlign: 'center', color: colors.textSecondary, padding: 24 },
  });
}
