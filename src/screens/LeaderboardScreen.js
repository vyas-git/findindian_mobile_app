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
import { useFocusEffect } from '@react-navigation/native';
import { useApi } from '../hooks/useApi';
import { AuthContext } from '../context/AuthProvider';
import { useTheme } from '../context/ThemeContext';
import { useAppShell } from '../context/AppShellContext';

function LeaderboardRow({ member, currentUserId, onPress, colors }) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  const initial = (member.name || 'U').charAt(0).toUpperCase();
  const isSelf = member.id === currentUserId;
  const rank = member.rank || 0;

  let bg = colors.cardBg || colors.shellBg;
  let borderColor = colors.divider;
  let nameColor = colors.textPrimary;
  let cityColor = colors.textSecondary;
  let pointsColor = colors.textSecondary;
  let rankColor = colors.textSecondary;
  let avatarBorder = colors.divider;

  if (rank === 1) {
    bg = '#000000';
    borderColor = '#000000';
    nameColor = '#ffffff';
    cityColor = 'rgba(255,255,255,0.72)';
    pointsColor = '#ffffff';
    rankColor = '#ffffff';
    avatarBorder = 'rgba(255,255,255,0.35)';
  } else if (rank === 2) {
    bg = '#DD0000';
    borderColor = '#DD0000';
    nameColor = '#ffffff';
    cityColor = 'rgba(255,255,255,0.78)';
    pointsColor = '#ffffff';
    rankColor = '#ffffff';
    avatarBorder = 'rgba(255,255,255,0.4)';
  } else if (rank === 3) {
    bg = '#FFCC00';
    borderColor = '#FFCC00';
    nameColor = '#111111';
    cityColor = 'rgba(17,17,17,0.7)';
    pointsColor = '#111111';
    rankColor = '#111111';
    avatarBorder = 'rgba(17,17,17,0.2)';
  }

  return (
    <TouchableOpacity
      style={[
        styles.lbRow,
        {
          borderColor,
          borderWidth: rank <= 3 ? 2 : 1,
          backgroundColor: bg,
        },
        isSelf && styles.lbRowSelf,
      ]}
      onPress={() => !isSelf && onPress(member)}
      activeOpacity={isSelf ? 1 : 0.85}
      disabled={isSelf}
    >
      <Text style={[styles.lbRank, { color: rankColor }]}>#{rank}</Text>
      {member.avatar_url ? (
        <Image source={{ uri: member.avatar_url }} style={[styles.lbAvatar, { borderColor: avatarBorder }]} />
      ) : (
        <View style={[styles.lbAvatarFallback, { borderColor: avatarBorder }]}>
          <Text style={styles.lbAvatarText}>{initial}</Text>
        </View>
      )}
      <View style={styles.lbMeta}>
        <Text style={[styles.lbName, { color: nameColor }]} numberOfLines={1}>
          {member.name || 'User'}
        </Text>
        {member.germany_city ? (
          <Text style={[styles.lbCity, { color: cityColor }]} numberOfLines={1}>
            {member.germany_city}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.lbPoints, { color: pointsColor }]}>{member.points ?? 0} pts</Text>
    </TouchableOpacity>
  );
}

export default function LeaderboardScreen({ navigation }) {
  const { apiRequest } = useApi();
  const { user } = useContext(AuthContext);
  const { colors } = useTheme();
  const { setHeader } = useAppShell();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [period, setPeriod] = useState('week');
  const [topMembers, setTopMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setHeader({ variant: 'title', title: 'Top members in community' });
      return () => setHeader({ variant: 'app', title: '' });
    }, [setHeader])
  );

  const loadTop = useCallback(async () => {
    try {
      const data = await apiRequest(`/api/users/top?period=${period}&limit=20`);
      setTopMembers(data.users || []);
    } catch (e) {
      console.warn('loadTop', e);
      setTopMembers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiRequest, period]);

  useEffect(() => {
    setLoading(true);
    loadTop();
  }, [loadTop]);

  const handleMemberPress = (member) => {
    navigation.navigate('Channel', {
      dmUserId: member.id,
      dmUserName: member.name,
      returnTo: 'Leaderboard',
    });
  };

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
        {' — post · 10 pts, flyer · 10 pts, channel message · 2 pts, reply · 5 pts, daily open · 5 pts'}
      </Text>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, period === 'week' && styles.tabActive]}
          onPress={() => setPeriod('week')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, period === 'week' && styles.tabTextActive]}>Weekly</Text>
          {period === 'week' ? <View style={styles.tabIndicator} /> : null}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, period === 'all' && styles.tabActive]}
          onPress={() => setPeriod('all')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, period === 'all' && styles.tabTextActive]}>All time</Text>
          {period === 'all' ? <View style={styles.tabIndicator} /> : null}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.inlineCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : topMembers.length === 0 ? (
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
    inlineCenter: { paddingVertical: 40, alignItems: 'center' },
    howto: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 14,
      lineHeight: 20,
    },
    howtoLabel: { fontWeight: '700', color: colors.textPrimary },
    tabs: {
      flexDirection: 'row',
      gap: 4,
      marginBottom: 18,
      padding: 4,
      borderRadius: 12,
      backgroundColor: colors.shellBg,
      borderWidth: 1,
      borderColor: colors.borderColor || colors.divider,
    },
    tab: {
      flex: 1,
      paddingTop: 10,
      paddingBottom: 12,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 9,
      position: 'relative',
    },
    tabActive: {
      backgroundColor: colors.cardBg || colors.bgWhite,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    tabText: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.2,
      color: colors.textSecondary,
      opacity: 0.7,
    },
    tabTextActive: {
      color: colors.textPrimary,
      opacity: 1,
      fontWeight: '700',
    },
    tabIndicator: {
      position: 'absolute',
      bottom: 5,
      width: '36%',
      height: 2,
      borderRadius: 2,
      backgroundColor: colors.germanyRed || '#DD0000',
    },
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
