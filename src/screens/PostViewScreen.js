import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useApi } from '../hooks/useApi';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthProvider';

export default function PostViewScreen({ route, navigation }) {
  const { postId } = route.params;
  const { apiRequest } = useApi();
  const { user } = useContext(AuthContext);
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

  const showSafetyActions = () => {
    const authorId = post.user_id;
    if (!authorId || authorId === user?.id) return;
    Alert.alert('Safety options', `Manage your interaction with ${post.author_name || post.user_name || 'this member'}.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report post',
        onPress: async () => {
          try {
            await apiRequest('/api/reports', {
              method: 'POST',
              body: JSON.stringify({ reported_user_id: authorId, content_type: 'post', content_id: post.id, reason: 'Objectionable content' }),
            });
            Alert.alert('Report sent', 'Thank you. Our team will review this within 24 hours.');
          } catch (e) { Alert.alert('Could not report', e.message); }
        },
      },
      {
        text: 'Block user',
        style: 'destructive',
        onPress: () => Alert.alert('Block this user?', 'Their posts and messages will be hidden immediately, and our moderation team will be notified.', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Block user', style: 'destructive', onPress: async () => {
              try {
                await apiRequest('/api/blocks', { method: 'POST', body: JSON.stringify({ blocked_user_id: authorId }) });
                Alert.alert('User blocked', 'Their content has been removed from your experience.');
                navigation.goBack();
              } catch (e) { Alert.alert('Could not block user', e.message); }
            },
          },
        ]),
      },
    ]);
  };

  const showCommentSafetyActions = (comment) => {
    const authorId = comment.user_id;
    if (!authorId || authorId === user?.id) return;
    Alert.alert('Comment options', 'Report this comment to the findIndian.de moderators?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report comment', onPress: async () => {
        try {
          await apiRequest('/api/reports', { method: 'POST', body: JSON.stringify({ reported_user_id: authorId, content_type: 'comment', content_id: comment.id, reason: 'Objectionable comment' }) });
          Alert.alert('Report sent', 'Thank you. Our team will review this within 24 hours.');
        } catch (e) { Alert.alert('Could not report', e.message); }
      } },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.titleRow}>
        {post.title ? <Text style={styles.title}>{post.title}</Text> : null}
        {post.user_id && post.user_id !== user?.id ? <TouchableOpacity onPress={showSafetyActions} accessibilityLabel="Report or block user"><Text style={styles.more}>•••</Text></TouchableOpacity> : null}
      </View>
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
          <View style={styles.commentHeader}><Text style={styles.commentAuthor}>{c.user_name || 'User'}</Text>{c.user_id && c.user_id !== user?.id ? <TouchableOpacity onPress={() => showCommentSafetyActions(c)} accessibilityLabel="Report comment"><Text style={styles.commentMore}>•••</Text></TouchableOpacity> : null}</View>
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
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    more: { color: colors.textSecondary, fontSize: 20, letterSpacing: 1, paddingHorizontal: 6 },
    meta: { color: colors.textSecondary, marginBottom: 16 },
    body: { fontSize: 16, lineHeight: 24, color: colors.textPrimary },
    image: { width: '100%', height: 200, borderRadius: 8, marginTop: 16 },
    commentsTitle: { fontWeight: '700', fontSize: 18, marginTop: 24, marginBottom: 12, color: colors.textPrimary },
    comment: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider },
    commentAuthor: { fontWeight: '700', fontSize: 13, color: colors.textPrimary },
    commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    commentMore: { color: colors.textSecondary, fontSize: 16, letterSpacing: 1 },
    commentBody: { marginTop: 4, fontSize: 14, color: colors.textPrimary },
    empty: { color: colors.textSecondary },
  });
}
