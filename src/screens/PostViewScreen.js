import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useApi } from '../hooks/useApi';
import { useTheme } from '../context/ThemeContext';

export default function PostViewScreen({ route }) {
  const { postId } = route.params;
  const { apiRequest } = useApi();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [postData, commentsData] = await Promise.all([
          apiRequest(`/api/posts/${postId}`),
          apiRequest(`/api/posts/${postId}/comments`),
        ]);
        setPost(postData);
        setComments(commentsData.comments || []);
      } catch (e) {
        console.warn('PostView', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [postId, apiRequest]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Post not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {post.title ? <Text style={styles.title}>{post.title}</Text> : null}
      <Text style={styles.meta}>
        {post.author_name || post.user_name} · {new Date(post.created_at).toLocaleDateString()}
      </Text>
      <Text style={styles.body}>{post.content || post.text}</Text>
      {post.image_url ? (
        <Image source={{ uri: post.image_url }} style={styles.image} resizeMode="cover" />
      ) : null}
      <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
      {comments.map((c) => (
        <View key={c.id} style={styles.comment}>
          <Text style={styles.commentAuthor}>{c.user_name || 'User'}</Text>
          <Text style={styles.commentBody}>{c.content || c.text}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.shellBg },
    container: { flex: 1, backgroundColor: colors.shellBg },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 8, color: colors.textPrimary },
    meta: { color: colors.textSecondary, marginBottom: 16 },
    body: { fontSize: 16, lineHeight: 24, color: colors.textPrimary },
    image: { width: '100%', height: 200, borderRadius: 8, marginTop: 16 },
    commentsTitle: { fontWeight: '700', fontSize: 18, marginTop: 24, marginBottom: 12, color: colors.textPrimary },
    comment: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider },
    commentAuthor: { fontWeight: '700', fontSize: 13, color: colors.textPrimary },
    commentBody: { marginTop: 4, fontSize: 14, color: colors.textPrimary },
    empty: { color: colors.textSecondary },
  });
}
