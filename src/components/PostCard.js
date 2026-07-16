import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Pressable } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function PostCard({ post, onPress, onPressAuthor }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const authorName = post.author_name || post.user_name || 'User';
  const authorId = post.user_id;
  const avatar = post.user_avatar || post.avatar_url;
  const initial = authorName.charAt(0).toUpperCase();
  const canOpenAuthor = Boolean(authorId && onPressAuthor);

  const openAuthor = () => {
    if (canOpenAuthor) onPressAuthor(post);
  };

  const openPost = () => onPress?.(post);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={openAuthor}
        disabled={!canOpenAuthor}
        activeOpacity={0.7}
      >
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
        <View style={styles.authorInfo}>
          <Text style={styles.author}>{authorName}</Text>
          <Text style={styles.meta}>
            {post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}
          </Text>
        </View>
      </TouchableOpacity>

      <Pressable onPress={openPost}>
        {post.title ? <Text style={styles.title}>{post.title}</Text> : null}
        <Text style={styles.body} numberOfLines={4}>
          {post.content || post.text || ''}
        </Text>
        {post.image_url ? (
          <Image source={{ uri: post.image_url }} style={styles.image} resizeMode="cover" />
        ) : null}
        <View style={styles.footer}>
          <Text style={styles.comments}>{post.comment_count ?? 0} comments</Text>
        </View>
      </Pressable>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.cardBg,
      marginHorizontal: 12,
      marginBottom: 12,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.divider,
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
    authorInfo: { flex: 1 },
    author: { fontWeight: '700', fontSize: 14, color: colors.primary },
    meta: { color: colors.textSecondary, fontSize: 12 },
    title: { fontWeight: '700', fontSize: 16, marginBottom: 6, color: colors.textPrimary },
    body: { color: colors.textPrimary, lineHeight: 20, fontSize: 14 },
    image: { width: '100%', height: 180, borderRadius: 8, marginTop: 10 },
    footer: { marginTop: 10, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 8 },
    comments: { color: colors.textSecondary, fontSize: 13 },
  });
}
