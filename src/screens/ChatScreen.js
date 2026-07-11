import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApi } from '../hooks/useApi';
import { AuthContext } from '../context/AuthProvider';
import { NotificationContext } from '../context/NotificationContext';
import colors from '../theme/colors';

function MessageBubble({ message, isOwn }) {
  return (
    <View style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {!isOwn && message.user_name ? (
          <Text style={styles.senderName}>{message.user_name}</Text>
        ) : null}
        <Text style={styles.bubbleText}>{message.text}</Text>
      </View>
    </View>
  );
}

export default function ChatScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const { markChatRead, setActiveChat } = useContext(NotificationContext);
  const { apiRequest } = useApi();
  const [mode, setMode] = useState('channel');
  const [channel, setChannel] = useState(null);
  const [dmUserId, setDmUserId] = useState(null);
  const [dmUser, setDmUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const pollRef = useRef(null);

  const inDM = mode === 'dm' && Boolean(dmUserId);

  const handleBackFromDM = useCallback(() => {
    setMode('channel');
    setDmUserId(null);
    navigation.setParams({ dmUserId: undefined, dmUserName: undefined });
    navigation.navigate('Members');
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const paramDmId = route.params?.dmUserId;
      if (paramDmId) {
        setMode('dm');
        setDmUserId(paramDmId);
      } else {
        setMode('channel');
        setDmUserId(null);
      }
    }, [route.params?.dmUserId])
  );

  const loadChannels = useCallback(async () => {
    const data = await apiRequest('/api/channels');
    const channels = data.channels || [];
    const general = channels.find((c) => c.name?.toLowerCase() === 'general') || channels[0];
    setChannel(general || null);
    return general;
  }, [apiRequest]);

  const loadMessages = useCallback(async () => {
    try {
      if (mode === 'channel' && channel?.id) {
        const data = await apiRequest(`/api/channels/${channel.id}/messages?limit=50`);
        setMessages(data.messages || []);
        markChatRead('channel', channel.id);
      } else if (mode === 'dm' && dmUserId) {
        const data = await apiRequest(`/api/dms/${dmUserId}/messages?limit=50`);
        setMessages(data.messages || []);
        markChatRead('dm', dmUserId);
      } else {
        setMessages([]);
      }
    } catch (e) {
      console.warn('loadMessages', e);
    }
  }, [apiRequest, mode, channel?.id, dmUserId, markChatRead]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadChannels();
      setLoading(false);
    })();
  }, [loadChannels]);

  useEffect(() => {
    if (dmUserId) {
      apiRequest(`/api/users/${dmUserId}`)
        .then(setDmUser)
        .catch(() => setDmUser({ name: route.params?.dmUserName || 'User' }));
    } else {
      setDmUser(null);
    }
  }, [dmUserId, apiRequest, route.params?.dmUserName]);

  useEffect(() => {
    if ((mode === 'channel' && channel) || (mode === 'dm' && dmUserId)) {
      loadMessages();
      setActiveChat({ mode, channelId: channel?.id, dmUserId });
    } else {
      setActiveChat(null);
    }
    return () => setActiveChat(null);
  }, [mode, channel, dmUserId, loadMessages, setActiveChat]);

  useEffect(() => {
    pollRef.current = setInterval(loadMessages, mode === 'dm' ? 3000 : 5000);
    return () => clearInterval(pollRef.current);
  }, [loadMessages, mode]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    if (mode === 'dm' && !dmUserId) return;
    setSending(true);
    const msgText = text.trim();
    setText('');
    try {
      if (mode === 'channel' && channel?.id) {
        const res = await apiRequest(`/api/channels/${channel.id}/messages`, {
          method: 'POST',
          body: JSON.stringify({ text: msgText }),
        });
        setMessages((prev) => [...prev, res]);
      } else if (mode === 'dm' && dmUserId) {
        const res = await apiRequest(`/api/dms/${dmUserId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ text: msgText }),
        });
        setMessages((prev) => [...prev, res]);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      Alert.alert('Failed to send', e.message);
      setText(msgText);
    } finally {
      setSending(false);
    }
  };

  const renderHeader = () => {
    if (inDM && dmUser) {
      const initial = (dmUser.name || 'U').charAt(0).toUpperCase();
      return (
        <View style={[styles.chatHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBackFromDM}>
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          {dmUser.avatar_url ? (
            <Image source={{ uri: dmUser.avatar_url }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarFallback}>
              <Text style={styles.headerAvatarText}>{initial}</Text>
            </View>
          )}
          <View style={styles.dmHeaderInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {dmUser.name || 'User'}
            </Text>
            <View style={styles.locationRow}>
              {dmUser.city ? <Text style={styles.locationText}>{dmUser.city}</Text> : null}
              {dmUser.germany_city ? (
                <Text style={styles.locationText}>🇩🇪 {dmUser.germany_city}</Text>
              ) : null}
            </View>
          </View>
        </View>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const canSend = mode === 'channel' || Boolean(dmUserId);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {renderHeader()}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isOwn={item.user_id === user?.id || item.from_user_id === user?.id}
          />
        )}
        style={styles.messageList}
        contentContainerStyle={[
          styles.messageListContent,
          messages.length === 0 && styles.messageListEmpty,
        ]}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {inDM
              ? 'No messages yet. Start the conversation!'
              : 'No messages yet. Say hello in the group!'}
          </Text>
        }
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          editable={canSend}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={sending || !canSend}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.shellBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e6eb',
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e4e6eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { fontWeight: '700', color: colors.primary },
  dmHeaderInfo: { flex: 1 },
  locationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  locationText: { fontSize: 12, color: colors.textSecondary },
  messageList: { flex: 1 },
  messageListContent: { paddingVertical: 12, paddingHorizontal: 4 },
  messageListEmpty: { flexGrow: 1, justifyContent: 'center' },
  bubbleRow: { paddingHorizontal: 12, paddingVertical: 4, alignItems: 'flex-start' },
  bubbleRowOwn: { alignItems: 'flex-end' },
  bubble: { maxWidth: '78%', padding: 10, borderRadius: 12 },
  bubbleOwn: { backgroundColor: colors.sentBubble },
  bubbleOther: { backgroundColor: colors.receivedBubble, borderWidth: 1, borderColor: '#eee' },
  senderName: { fontSize: 11, fontWeight: '700', color: colors.primary, marginBottom: 2 },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  empty: { textAlign: 'center', color: colors.textSecondary, padding: 24, fontSize: 15 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e4e6eb',
    backgroundColor: '#fff',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.whatsappGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
