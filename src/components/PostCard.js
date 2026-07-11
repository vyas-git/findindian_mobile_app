import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import colors from '../theme/colors';

export default function PostCard({ post, onPress }) {
  const initial = (post.author_name || post.user_name || 'U').charAt(0).toUpperCase();
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress?.(post)}>
      <View style={styles.header}>
        {post.user_avatar || post.avatar_url ? (
          <Image source={{ uri: post.user_avatar || post.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
        <View>
          <Text style={styles.author}>{post.author_name || post.user_name || 'User'}</Text>
          <Text style={styles.meta}>{post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}</Text>
        </View>
      </View>
      {post.title ? <Text style={styles.title}>{post.title}</Text> : null}
      <Text style={styles.body} numberOfLines={4}>
        {post.content || post.text || ''}
      </Text>
      {post.image_url ? <Image source={{ uri: post.image_url }} style={styles.image} resizeMode="cover" /> : null}
      <View style={styles.footer}>
        <Text style={styles.comments}>{post.comment_count ?? 0} comments</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.shellBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: { fontWeight: '700', color: colors.primary },
  author: { fontWeight: '700', fontSize: 14 },
  meta: { color: colors.textSecondary, fontSize: 12 },
  title: { fontWeight: '700', fontSize: 16, marginBottom: 6 },
  body: { color: colors.textPrimary, lineHeight: 20, fontSize: 14 },
  image: { width: '100%', height: 180, borderRadius: 8, marginTop: 10 },
  footer: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 8 },
  comments: { color: colors.textSecondary, fontSize: 13 },
});
