import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Image,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApi } from '../hooks/useApi';
import { AuthContext } from '../context/AuthProvider';
import { NotificationContext } from '../context/NotificationContext';
import { useAppShell } from '../context/AppShellContext';
import { useTheme } from '../context/ThemeContext';

const TAB_BAR_HEIGHT = 56;
const SCREEN_HEADER_HEIGHT = 52;

function MessageBubble({ message, isOwn, styles, showSender, onPressSender }) {
  const senderId = message.user_id || message.from_user_id;
  const name = message.user_name || 'Member';
  const avatar = message.user_avatar;
  const initial = name.charAt(0).toUpperCase();
  const canOpen = Boolean(showSender && !isOwn && senderId && onPressSender);

  const openSender = () => {
    if (canOpen) onPressSender(senderId, name);
  };

  return (
    <View style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
      {!isOwn && showSender ? (
        <TouchableOpacity
          style={styles.bubbleAvatarWrap}
          onPress={openSender}
          disabled={!canOpen}
          activeOpacity={0.7}
        >
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.bubbleAvatar} />
          ) : (
            <View style={styles.bubbleAvatarFallback}>
              <Text style={styles.bubbleAvatarText}>{initial}</Text>
            </View>
          )}
        </TouchableOpacity>
      ) : null}
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {!isOwn && showSender ? (
          <TouchableOpacity onPress={openSender} disabled={!canOpen} activeOpacity={0.7}>
            <Text style={styles.senderName}>{name}</Text>
          </TouchableOpacity>
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
  const { setHeader } = useAppShell();
  const { apiRequest } = useApi();
  const { colors } = useTheme();
  const isFocused = useIsFocused();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
  const messagesRef = useRef([]);
  const isNearBottomRef = useRef(true);
  const didInitialScrollRef = useRef(false);
  const pendingInitialScrollRef = useRef(false);

  const inDM = mode === 'dm' && Boolean(dmUserId);
  const conversationKey = inDM ? `dm:${dmUserId}` : `channel:${channel?.id || ''}`;
  const keyboardVerticalOffset =
    Platform.OS === 'ios'
      ? inDM
        ? insets.top + SCREEN_HEADER_HEIGHT
        : insets.top + SCREEN_HEADER_HEIGHT + TAB_BAR_HEIGHT
      : 0;

  messagesRef.current = messages;

  const handleBackFromDM = useCallback(() => {
    const returnTo = route.params?.returnTo;

    // Returning to Channel: exit DM mode in place (same tab).
    if (returnTo === 'Channel') {
      setMode('channel');
      setDmUserId(null);
      navigation.setParams({
        dmUserId: undefined,
        dmUserName: undefined,
        returnTo: undefined,
      });
      return;
    }

    // Leaving to another tab — navigate first so we don't briefly set #channel header.
    navigation.setParams({
      dmUserId: undefined,
      dmUserName: undefined,
      returnTo: undefined,
    });

    if (returnTo === 'Messages') {
      navigation.getParent()?.navigate('Messages');
      return;
    }
    if (returnTo === 'Posts') {
      navigation.navigate('Posts');
      return;
    }
    if (returnTo === 'Members') {
      navigation.navigate('Members');
      return;
    }
    if (returnTo === 'Leaderboard') {
      navigation.navigate('Leaderboard');
      return;
    }
    if (returnTo === 'TravelList') {
      navigation.getParent()?.navigate('Main', { screen: 'TravelList' });
      return;
    }
    navigation.navigate('Members');
  }, [navigation, route.params?.returnTo]);

  const openSenderDM = useCallback(
    (userId, userName) => {
      if (!userId || userId === user?.id) return;
      navigation.setParams({
        dmUserId: userId,
        dmUserName: userName,
        returnTo: 'Channel',
      });
    },
    [navigation, user?.id]
  );

  useFocusEffect(
    useCallback(() => {
      const paramDmId = route.params?.dmUserId;
      if (paramDmId) {
        setMode('dm');
        setDmUserId(paramDmId);
        setHeader({ variant: 'none', title: '' });
      } else {
        setMode('channel');
        setDmUserId(null);
        setHeader({ variant: 'title', title: 'Channel' });
      }
      return () => setHeader({ variant: 'app', title: '' });
    }, [route.params?.dmUserId, setHeader])
  );

  useEffect(() => {
    if (!isFocused || inDM || !channel?.name) return;
    const label = channel.name.startsWith('#') ? channel.name : `#${channel.name}`;
    setHeader({ variant: 'title', title: label });
  }, [isFocused, inDM, channel?.name, setHeader]);

  const scrollToBottom = useCallback((animated = true) => {
    const list = listRef.current;
    if (!list) return;
    const count = messagesRef.current.length;
    if (count > 0) {
      try {
        list.scrollToIndex({ index: count - 1, animated, viewPosition: 1 });
        return;
      } catch {
        // fall through to scrollToEnd
      }
    }
    list.scrollToEnd({ animated });
  }, []);

  const handleContentSizeChange = useCallback(() => {
    if (pendingInitialScrollRef.current) {
      pendingInitialScrollRef.current = false;
      didInitialScrollRef.current = true;
      requestAnimationFrame(() => scrollToBottom(false));
    }
  }, [scrollToBottom]);

  const handleScrollToIndexFailed = useCallback((info) => {
    setTimeout(() => {
      listRef.current?.scrollToIndex({
        index: info.index,
        animated: false,
        viewPosition: 1,
      });
    }, 100);
  }, []);

  useEffect(() => {
    didInitialScrollRef.current = false;
    pendingInitialScrollRef.current = false;
    isNearBottomRef.current = true;
  }, [conversationKey]);

  const loadChannels = useCallback(async () => {
    const data = await apiRequest('/api/channels');
    const channels = data.channels || [];
    const general = channels.find((c) => c.name?.toLowerCase() === 'general') || channels[0];
    setChannel(general || null);
    return general;
  }, [apiRequest]);

  const loadMessages = useCallback(
    async ({ scroll = 'if-near-bottom' } = {}) => {
      try {
        let newMessages = [];
        if (mode === 'channel' && channel?.id) {
          const data = await apiRequest(`/api/channels/${channel.id}/messages?limit=50`);
          newMessages = data.messages || [];
          markChatRead('channel', channel.id);
        } else if (mode === 'dm' && dmUserId) {
          const data = await apiRequest(`/api/dms/${dmUserId}/messages?limit=50`);
          newMessages = data.messages || [];
          markChatRead('dm', dmUserId);
        } else {
          setMessages([]);
          return;
        }

        const prev = messagesRef.current;
        const prevLastId = prev[prev.length - 1]?.id;
        const newLastId = newMessages[newMessages.length - 1]?.id;
        const grewAtEnd =
          newMessages.length > prev.length ||
          (newLastId && newLastId !== prevLastId && newMessages.length >= prev.length);

        setMessages(newMessages);

        if (!didInitialScrollRef.current) {
          pendingInitialScrollRef.current = true;
        } else if (
          scroll === 'always' ||
          (scroll === 'if-near-bottom' && grewAtEnd && isNearBottomRef.current)
        ) {
          setTimeout(() => scrollToBottom(true), 50);
        }
      } catch (e) {
        console.warn('loadMessages', e);
      }
    },
    [apiRequest, mode, channel?.id, dmUserId, markChatRead, scrollToBottom]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const openingDM = Boolean(route.params?.dmUserId);
      try {
        if (openingDM) {
          loadChannels().catch(() => {});
        } else {
          await loadChannels();
        }
      } catch (e) {
        console.warn('loadChannels', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadChannels, route.params?.dmUserId]);

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
    pollRef.current = setInterval(() => loadMessages({ scroll: 'if-near-bottom' }), mode === 'dm' ? 3000 : 5000);
    return () => clearInterval(pollRef.current);
  }, [loadMessages, mode]);

  useEffect(() => {
    const eventName = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(eventName, () => {
      if (isNearBottomRef.current) {
        setTimeout(() => scrollToBottom(true), 80);
      }
    });
    return () => sub.remove();
  }, [scrollToBottom]);

  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - layoutMeasurement.height - contentOffset.y;
    isNearBottomRef.current = distanceFromBottom < 80;
  };

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
        isNearBottomRef.current = true;
        setTimeout(() => scrollToBottom(true), 50);
      } else if (mode === 'dm' && dmUserId) {
        const res = await apiRequest(`/api/dms/${dmUserId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ text: msgText }),
        });
        setMessages((prev) => [...prev, res]);
        isNearBottomRef.current = true;
        setTimeout(() => scrollToBottom(true), 50);
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
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
            styles={styles}
            showSender={!inDM}
            onPressSender={openSenderDM}
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
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onContentSizeChange={handleContentSizeChange}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      />

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor={colors.textSecondary}
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

function createStyles(colors) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.shellBg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.shellBg },
    chatHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
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
      backgroundColor: colors.searchBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerAvatarText: { fontWeight: '700', color: colors.primary },
    dmHeaderInfo: { flex: 1 },
    locationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
    locationText: { fontSize: 12, color: colors.textSecondary },
    messageList: { flex: 1, backgroundColor: colors.shellBg },
    messageListContent: { paddingVertical: 12, paddingHorizontal: 4 },
    messageListEmpty: { flexGrow: 1, justifyContent: 'center' },
    bubbleRow: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      paddingVertical: 4,
      alignItems: 'flex-end',
      gap: 8,
    },
    bubbleRowOwn: { alignItems: 'flex-end', justifyContent: 'flex-end' },
    bubbleAvatarWrap: { marginBottom: 2 },
    bubbleAvatar: { width: 32, height: 32, borderRadius: 16 },
    bubbleAvatarFallback: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.searchBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bubbleAvatarText: { fontWeight: '700', color: colors.primary, fontSize: 13 },
    bubble: { maxWidth: '72%', padding: 10, borderRadius: 12 },
    bubbleOwn: { backgroundColor: colors.sentBubble },
    bubbleOther: {
      backgroundColor: colors.receivedBubble,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    senderName: { fontSize: 12, fontWeight: '700', color: colors.primary, marginBottom: 4 },
    bubbleText: { fontSize: 15, lineHeight: 20, color: colors.bubbleText },
    empty: { textAlign: 'center', color: colors.textSecondary, padding: 24, fontSize: 15 },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      backgroundColor: colors.headerBg,
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
      backgroundColor: colors.inputBg,
      color: colors.textPrimary,
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
}
