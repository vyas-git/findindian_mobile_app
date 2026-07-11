import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../hooks/useApi';
import colors from '../theme/colors';

function ConversationRow({ dm, onPress }) {
  const initial = (dm.other_user_name || 'U').charAt(0).toUpperCase();
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      {dm.other_user_avatar ? (
        <Image source={{ uri: dm.other_user_avatar }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      )}
      <View style={styles.rowBody}>
        <Text style={styles.name} numberOfLines={1}>
          {dm.other_user_name || 'User'}
        </Text>
        <Text style={styles.preview} numberOfLines={1}>
          {dm.last_message || 'Tap to open conversation'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

export default function ConversationsScreen({ navigation }) {
  const { apiRequest } = useApi();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/dms');
      setConversations(data.conversations || []);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    load();
  }, [load]);

  const openDM = (userId, userName) => {
    navigation.navigate('Main', {
      screen: 'Channel',
      params: { dmUserId: userId, dmUserName: userName },
    });
  };

  const openChannel = () => {
    navigation.navigate('Main', {
      screen: 'Channel',
      params: { dmUserId: undefined, dmUserName: undefined },
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.channelRow} onPress={openChannel}>
        <View style={styles.channelIcon}>
          <Text style={styles.channelHash}>#</Text>
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.name}>Group Channel</Text>
          <Text style={styles.preview}>Community chat for all members</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.divider} />
      <Text style={styles.sectionLabel}>Recent conversations</Text>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {conversations.length ? (
            conversations.map((dm) => (
              <ConversationRow
                key={dm.id || dm.other_user_id}
                dm={dm}
                onPress={() => openDM(dm.other_user_id, dm.other_user_name)}
              />
            ))
          ) : (
            <Text style={styles.empty}>No conversations yet. Message a member from the list.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16 },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  channelIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelHash: { fontSize: 22, fontWeight: '700', color: colors.whatsappGreen },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e4e6eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontWeight: '700', color: colors.primary },
  rowBody: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  preview: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#e4e6eb', marginVertical: 8 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loader: { marginTop: 32 },
  empty: { paddingVertical: 24, color: colors.textSecondary, textAlign: 'center', fontSize: 14 },
});
