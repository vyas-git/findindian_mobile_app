import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useApi } from '../hooks/useApi';
import { AuthContext } from '../context/AuthProvider';
import { useTheme } from '../context/ThemeContext';

function LeaderboardRow({ member, currentUserId, onPress, colors, isDark }) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  const initial = (member.name || 'U').charAt(0).toUpperCase();
  const isSelf = member.id === currentUserId;
  const rank = member.rank || 0;

  let borderColor = colors.divider;
  let rankColor = colors.textSecondary;
  if (rank === 1) {
    borderColor = isDark ? '#E8E8E8' : '#111111';
    rankColor = borderColor;
  } else if (rank === 2) {
    borderColor = '#DD0000';
    rankColor = '#DD0000';
  } else if (rank === 3) {
    borderColor = '#FFCE00';
    rankColor = isDark ? '#FFCE00' : '#B08900';
  }

  return (
    <TouchableOpacity
      style={[
        styles.lbRow,
        {
          borderColor,
          borderWidth: rank <= 3 ? 2 : 1,
        },
        isSelf && styles.lbRowSelf,
      ]}
      onPress={() => !isSelf && onPress(member)}
      activeOpacity={isSelf ? 1 : 0.85}
      disabled={isSelf}
    >
      <Text style={[styles.lbRank, { color: rankColor }]}>#{rank}</Text>
      {member.avatar_url ? (
        <Image source={{ uri: member.avatar_url }} style={styles.lbAvatar} />
      ) : (
        <View style={styles.lbAvatarFallback}>
          <Text style={styles.lbAvatarText}>{initial}</Text>
        </View>
      )}
      <View style={styles.lbMeta}>
        <Text style={styles.lbName} numberOfLines={1}>
          {member.name || 'User'}
        </Text>
        {member.germany_city ? (
          <Text style={styles.lbCity} numberOfLines={1}>
            {member.germany_city}
          </Text>
        ) : null}
      </View>
      <Text style={styles.lbPoints}>{member.points ?? 0} pts</Text>
    </TouchableOpacity>
  );
}

export default function LeaderboardScreen({ navigation }) {
  const { apiRequest } = useApi();
  const { user } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [topMembers, setTopMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTop = useCallback(async () => {
    try {
      const data = await apiRequest('/api/users/top?period=all&limit=20');
      setTopMembers(data.users || []);
    } catch (e) {
      console.warn('loadTop', e);
      setTopMembers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    loadTop();
  }, [loadTop]);

  const handleMemberPress = (member) => {
    navigation.navigate('Channel', {
      dmUserId: member.id,
      dmUserName: member.name,
      returnTo: 'Leaderboard',
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadTop();
          }}
        />
      }
    >
      <Text style={styles.howto}>
        <Text style={styles.howtoLabel}>How to be top</Text>
        {' — a post · 10 pts, a message in channel · 2 pts, reply to a post · 5 pts, daily open · 5 pts'}
      </Text>

      {topMembers.length === 0 ? (
        <Text style={styles.empty}>No points yet — post, chat, reply, or open the app daily to climb.</Text>
      ) : (
        <View style={styles.list}>
          {topMembers.map((member) => (
            <LeaderboardRow
              key={member.id}
              member={member}
              currentUserId={user?.id}
              onPress={handleMemberPress}
              colors={colors}
              isDark={isDark}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.shellBg },
    content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.shellBg },
    howto: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    howtoLabel: { fontWeight: '700', color: colors.textPrimary },
    list: { gap: 8 },
    empty: { textAlign: 'center', color: colors.textSecondary, paddingVertical: 28, fontSize: 14 },
    lbRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.divider,
      backgroundColor: colors.cardBg || colors.shellBg,
    },
    lbRowSelf: { opacity: 0.85 },
    lbRank: { minWidth: 28, fontSize: 13, fontWeight: '800' },
    lbAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: colors.divider,
    },
    lbAvatarFallback: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.shellBg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.divider,
    },
    lbAvatarText: { fontWeight: '700', color: colors.primary, fontSize: 14 },
    lbMeta: { flex: 1, minWidth: 0 },
    lbName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    lbCity: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
    lbPoints: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  });
}
