import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CollapsibleHeroScroll from '../components/CollapsibleHeroScroll';
import PostCard from '../components/PostCard';
import { useApi } from '../hooks/useApi';
import colors from '../theme/colors';

function PostsHero({ memberCount, onCreatePost }) {
  return (
    <View style={styles.hero}>
      <Text style={styles.heroTitle}>Community Posts</Text>
      <Text style={styles.heroSubtitle}>
        {memberCount != null ? `${memberCount}+ Indians in Germany` : 'Share updates with the community'}
      </Text>
      <TouchableOpacity style={styles.startPostBtn} onPress={onCreatePost}>
        <Ionicons name="add-circle" size={22} color="#ff4500" />
        <Text style={styles.startPostText}>Start a post...</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function PostsScreen({ navigation }) {
  const { apiRequest } = useApi();
  const [posts, setPosts] = useState([]);
  const [memberCount, setMemberCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [postsData, countData] = await Promise.all([
        apiRequest('/api/posts?limit=500'),
        apiRequest('/api/users/count').catch(() => ({ count: null })),
      ]);
      setPosts(postsData.posts || []);
      setMemberCount(countData.count ?? null);
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
    <CollapsibleHeroScroll
      hero={
        <PostsHero
          memberCount={memberCount}
          onCreatePost={() => navigation.navigate('CreatePost', { onCreated: loadData })}
        />
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
      }
    >
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onPress={(p) => navigation.navigate('PostView', { postId: p.id })}
        />
      ))}
      {posts.length === 0 ? <Text style={styles.empty}>No posts yet. Be the first!</Text> : null}
    </CollapsibleHeroScroll>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    flex: 1,
    backgroundColor: colors.feedBg,
    padding: 20,
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  heroSubtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 8, marginBottom: 20 },
  startPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  startPostText: { fontSize: 16, color: colors.textSecondary, fontWeight: '500' },
  empty: { textAlign: 'center', color: colors.textSecondary, padding: 24 },
});
