import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useApi } from '../hooks/useApi';

const stickers = [
  ['🎉', 'Congratulations', 'Congrats'],
  ['👏', 'All the best', 'All the best'],
  ['❤️', 'Sending love', 'Love'],
  ['✈️', 'Flying to Germany', 'Germany'],
];

function Sticker({ emoji, label, compact }) {
  const { colors } = useTheme();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withRepeat(withTiming(1, {
      duration: 680,
      easing: Easing.inOut(Easing.sin),
      reduceMotion: ReduceMotion.System,
    }), 4, true, undefined, ReduceMotion.System);
  }, [progress]);
  const motion = useAnimatedStyle(() => ({
    transform: [
      { translateY: -8 * progress.value },
      { scale: 1 + 0.16 * progress.value },
      { rotate: `${(emoji === '✈️' ? -16 : 12) * progress.value}deg` },
    ],
  }));

  return (
    <View style={[stickerStyles.tile, compact && stickerStyles.compactTile]}>
      <Animated.Text style={[stickerStyles.icon, compact && stickerStyles.compactIcon, motion]}>{emoji === '✈️' ? '✈️ 🇩🇪' : emoji}</Animated.Text>
      <Text style={[stickerStyles.label, compact && stickerStyles.compactLabel, { color: colors.textPrimary }]}>{label}</Text>
    </View>
  );
}

const stickerStyles = StyleSheet.create({
  tile: { paddingHorizontal: 8, paddingTop: 14, paddingBottom: 9, borderRadius: 14, alignItems: 'center', gap: 4 },
  compactTile: { paddingHorizontal: 0, paddingTop: 6, paddingBottom: 4 },
  compactIcon: { fontSize: 18, lineHeight: 24 },
  compactLabel: { fontSize: 10 },
  icon: { fontSize: 30, lineHeight: 38 },
  label: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
});

export default function FlyerComments({ slug, userId, onMessage }) {
  const { apiRequest } = useApi();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const endpoint = `/api/travel/${encodeURIComponent(slug)}/comments`;
  const pendingComment = useRef(null);
  const [comments, setComments] = useState([]);
  const [next, setNext] = useState('');
  const [content, setContent] = useState('');
  const [selectedSticker, setSelectedSticker] = useState(stickers[0][0]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [postError, setPostError] = useState('');

  const loadComments = useCallback(async (cursor = '', signal) => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await apiRequest(cursor ? `${endpoint}?before=${encodeURIComponent(cursor)}` : endpoint, { signal });
      if (signal?.aborted) return;
      setComments((current) => cursor ? [...current, ...data.comments] : data.comments);
      setNext(data.next);
    } catch (error) {
      if (!signal?.aborted) setLoadError(error.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [apiRequest, endpoint]);

  useEffect(() => {
    const controller = new AbortController();
    loadComments('', controller.signal);
    return () => controller.abort();
  }, [loadComments]);

  const canPost = !posting && !loading && !loadError && Boolean(content.trim() || selectedSticker);

  const sendComment = async (draft) => {
    if (!canPost) return;
    setPosting(true);
    setPostError('');
    try {
      const previous = pendingComment.current;
      if (previous?.content !== draft.content || previous?.sticker !== draft.sticker) {
        const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
        const id = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
        pendingComment.current = { id, ...draft };
      }
      const comment = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(pendingComment.current),
      });
      pendingComment.current = null;
      setComments((current) => [comment, ...current.filter((item) => item.id !== comment.id)]);
      setContent('');
      setSelectedSticker(stickers[0][0]);
    } catch (error) {
      setPostError(error.message);
    } finally {
      setPosting(false);
    }
  };

  const reportComment = (comment) => {
    Alert.alert('Report comment?', 'Send this comment to the findIndian.de moderators.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report',
        onPress: async () => {
          try {
            await apiRequest('/api/reports', {
              method: 'POST',
              body: JSON.stringify({
                reported_user_id: comment.user_id,
                content_type: 'travel_comment',
                content_id: comment.id,
                reason: 'Objectionable flyer comment',
              }),
            });
            Alert.alert('Report sent', 'Thanks. Your report has been sent to the moderators.');
          } catch (error) {
            Alert.alert('Could not report', error.message);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.composer}>
        <TextInput
          accessibilityLabel="Write a flyer comment"
          placeholder="Wish the traveler well…"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          value={content}
          onChangeText={setContent}
          editable={!posting}
          multiline
          maxLength={500}
        />
        <View style={styles.stickerRow}>
          {stickers.map(([emoji, label, shortLabel]) => (
            <TouchableOpacity
              key={emoji}
              style={[styles.stickerOption, selectedSticker === emoji && styles.selectedSticker]}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: selectedSticker === emoji }}
              disabled={posting}
              onPress={() => setSelectedSticker((current) => current === emoji ? '' : emoji)}
            >
              <Sticker emoji={emoji} label={shortLabel} compact />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        style={[styles.submit, !canPost && styles.disabled]}
        disabled={!canPost}
        onPress={() => sendComment({ content: content.trim(), sticker: selectedSticker })}
      >
        <Text style={styles.submitText}>{posting ? 'Posting…' : 'Post comment'}</Text>
      </TouchableOpacity>
      {postError ? <Text accessibilityRole="alert" style={styles.status}>{postError}</Text> : null}
      {comments.length > 0 ? <Text accessibilityRole="header" style={styles.listTitle}>Comments:</Text> : null}
      {comments.map((comment) => {
        const name = comment.author_name || 'Member';
        const canMessage = Boolean(comment.user_id && comment.user_id !== userId && onMessage);
        const messageAuthor = () => onMessage(comment.user_id, name);
        return (
          <View key={comment.id} style={styles.comment}>
            <TouchableOpacity style={styles.avatar} disabled={!canMessage}
              accessible={canMessage} accessibilityRole="button" accessibilityLabel={`Message ${name}`}
              onPress={messageAuthor}>
              <Text style={styles.author}>{comment.author_name?.trim().charAt(0).toUpperCase() || '?'}</Text>
              {comment.author?.avatar_url ? (
                <Image source={{ uri: comment.author.avatar_url }} style={styles.avatarPhoto} />
              ) : null}
            </TouchableOpacity>
            <View style={styles.commentContent}>
              <View style={styles.commentMeta}>
                <View style={styles.byline}>
                  <Text style={[styles.author, canMessage && styles.authorLink]} accessibilityRole={canMessage ? 'link' : undefined}
                    onPress={canMessage ? messageAuthor : undefined}>{name}</Text>
                  {comment.created_at ? (
                    <Text style={styles.commentDate}>{new Date(comment.created_at).toLocaleDateString()}</Text>
                  ) : null}
                </View>
                {comment.user_id !== userId ? (
                  <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Report comment by ${comment.author_name || 'member'}`}
                    onPress={() => reportComment(comment)}>
                    <Text style={styles.action}>Report</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {comment.content ? <Text style={styles.body}>{comment.content}</Text> : null}
              {comment.sticker ? (
                <View style={styles.postedSticker}>
                  <Sticker emoji={comment.sticker} label={stickers.find(([emoji]) => emoji === comment.sticker)?.[1]} />
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
      {loading ? <Text style={styles.status}>Loading comments…</Text> : null}
      {!loading && !loadError && comments.length === 0 ? <Text style={styles.empty}>Be the first to leave a comment.</Text> : null}
      {loadError ? <Text accessibilityRole="alert" style={styles.status}>{loadError}</Text> : null}
      {!loading && (next || loadError) ? (
        <TouchableOpacity accessibilityRole="button" disabled={posting} onPress={() => loadComments(next)}>
          <Text style={styles.action}>{loadError ? 'Retry loading comments' : 'Load older comments'}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    card: { marginTop: 16, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.cardBg },
    listTitle: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 20, marginBottom: 8 },
    composer: { borderWidth: 1, borderColor: colors.divider, borderRadius: 12 },
    input: { minHeight: 76, padding: 10, color: colors.textPrimary, textAlignVertical: 'top' },
    stickerRow: { flexDirection: 'row', alignItems: 'stretch', gap: 4, paddingHorizontal: 6, paddingBottom: 6 },
    stickerOption: { flex: 1, minWidth: 0, minHeight: 48, borderWidth: 1, borderColor: 'transparent', borderRadius: 8 },
    selectedSticker: { borderColor: colors.primary, backgroundColor: colors.shellBg },
    submit: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', marginTop: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#b42318' },
    submitText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
    disabled: { opacity: 0.55 },
    comment: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderTopWidth: 1, borderTopColor: colors.divider, paddingVertical: 12 },
    avatar: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.shellBg },
    avatarPhoto: { ...StyleSheet.absoluteFill, width: 36, height: 36 },
    commentContent: { flex: 1, minWidth: 0 },
    byline: { flex: 1, flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 8, rowGap: 2 },
    commentDate: { color: colors.textSecondary, fontSize: 12 },
    commentMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    authorLink: { textDecorationLine: 'underline' },
    author: { color: colors.textPrimary, fontWeight: '700' },
    body: { alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderTopLeftRadius: 4, backgroundColor: colors.shellBg, color: colors.textPrimary, lineHeight: 20 },
    postedSticker: { alignSelf: 'flex-start', minWidth: 125 },
    status: { color: colors.textSecondary, marginTop: 10 },
    empty: { marginTop: 12, paddingVertical: 14, color: colors.textSecondary, textAlign: 'center' },
    action: { color: colors.textSecondary, textDecorationLine: 'underline', paddingVertical: 8 },
  });
}
