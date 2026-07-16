import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import PostCard from '../components/PostCard';
import { useApi } from '../hooks/useApi';
import { useAppShell } from '../context/AppShellContext';
import { useTheme } from '../context/ThemeContext';

function StartPostRow({ onPress, styles }) {
  return (
    <TouchableOpacity style={styles.startPostBtn} onPress={onPress}>
      <Ionicons name="add-circle" size={22} color="#ff4500" />
      <Text style={styles.startPostText}>Start a post...</Text>
    </TouchableOpacity>
  );
}

export default function PostsScreen({ navigation }) {
  const { apiRequest } = useApi();
  const { setHeader } = useAppShell();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setHeader({ variant: 'title', title: 'Community Posts' });
      return () => setHeader({ variant: 'app', title: '' });
    }, [setHeader])
  );

  const loadData = useCallback(async () => {
    try {
      const postsData = await apiRequest('/api/posts?limit=500');
      setPosts(postsData.posts || []);
    } catch (e) {
      console.warn('loadPosts', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={posts}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        <StartPostRow
          onPress={() => navigation.navigate('CreatePost', { onCreated: loadData })}
          styles={styles}
        />
      }
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onPress={(p) => navigation.navigate('PostView', { postId: p.id })}
          onPressAuthor={(p) => {
            if (!p.user_id) return;
            navigation.navigate('Channel', {
              dmUserId: p.user_id,
              dmUserName: p.author_name || p.user_name,
              returnTo: 'Posts',
            });
          }}
        />
      )}
      ListEmptyComponent={<Text style={styles.empty}>No posts yet. Be the first!</Text>}
      contentContainerStyle={posts.length === 0 ? styles.listEmpty : styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadData();
          }}
        />
      }
    />
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.shellBg },
    list: { flex: 1, backgroundColor: colors.shellBg },
    listContent: { paddingBottom: 24 },
    listEmpty: { flexGrow: 1, paddingBottom: 24 },
    startPostBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.cardBg,
      marginHorizontal: 12,
      marginTop: 12,
      marginBottom: 8,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderColor,
    },
    startPostText: { fontSize: 16, color: colors.textSecondary, fontWeight: '500' },
    empty: { textAlign: 'center', color: colors.textSecondary, padding: 24 },
  });
}
