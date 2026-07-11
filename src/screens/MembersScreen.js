import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import CollapsibleHeroScroll from '../components/CollapsibleHeroScroll';
import MembersMap from '../components/MembersMap';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../hooks/useApi';
import { useAppShell } from '../context/AppShellContext';
import { AuthContext } from '../context/AuthProvider';
import { useTheme } from '../context/ThemeContext';

const MAP_HERO_HEIGHT = Dimensions.get('window').height * 0.34;
const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_PADDING = 12;
const GRID_GAP = 10;
const GRID_COLUMNS = 3;
const GRID_ITEM_WIDTH =
  (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
const AVATAR_SIZE = Math.min(72, GRID_ITEM_WIDTH - 8);

function MemberGridItem({ member, onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const initial = (member.name || 'U').charAt(0).toUpperCase();
  const currentCity = member.city?.trim();
  const germanyCity = member.germany_city?.trim();

  return (
    <TouchableOpacity
      style={[styles.gridItem, { width: GRID_ITEM_WIDTH }]}
      onPress={() => onPress(member)}
      activeOpacity={0.85}
    >
      {member.avatar_url ? (
        <Image source={{ uri: member.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      )}
      <Text style={styles.memberName} numberOfLines={1}>
        {member.name || 'User'}
      </Text>
      {currentCity ? (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={11} color={colors.textSecondary} style={styles.locationIcon} />
          <Text style={styles.cityLine} numberOfLines={1}>
            {currentCity}
          </Text>
        </View>
      ) : null}
      {germanyCity ? (
        <Text style={styles.germanyCityLine} numberOfLines={1}>
          {germanyCity} 🇩🇪
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

export default function MembersScreen({ navigation }) {
  const { apiRequest } = useApi();
  const { searchQuery } = useAppShell();
  const { user, userProfile } = useContext(AuthContext);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [members, setMembers] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMembers = useCallback(async () => {
    try {
      const data = await apiRequest('/api/users/list');
      setMembers(data.users || []);
    } catch (e) {
      console.warn('loadMembers', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const filteredMembers = useMemo(() => {
    let list = members;
    if (selectedCity) {
      list = list.filter((m) => m.germany_city?.toLowerCase() === selectedCity.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.name?.toLowerCase().includes(q) ||
          m.germany_city?.toLowerCase().includes(q) ||
          m.city?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [members, searchQuery, selectedCity]);

  const handleMemberPress = (member) => {
    navigation.navigate('Channel', { dmUserId: member.id, dmUserName: member.name });
  };

  const welcomeName =
    userProfile?.name?.split(' ')[0] ||
    user?.user_metadata?.first_name ||
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'Friend';

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.mapSection}>
        <CollapsibleHeroScroll
          hero={<MembersMap members={members} selectedCity={selectedCity} onCityPress={setSelectedCity} />}
          heroHeight={MAP_HERO_HEIGHT}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadMembers(); }} />
          }
        >
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Willkommen {welcomeName}</Text>
            <Text style={styles.listSubtitle}>
              {members.length} Inder 🇮🇳 in Deutschland 🇩🇪, Say Hallo !!
            </Text>
            {selectedCity ? (
              <TouchableOpacity style={styles.filterChip} onPress={() => setSelectedCity(null)}>
                <Text style={styles.filterChipText}>{selectedCity} ×</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.grid}>
            {filteredMembers.map((member) => (
              <MemberGridItem key={member.id} member={member} onPress={handleMemberPress} />
            ))}
          </View>

          {filteredMembers.length === 0 ? (
            <Text style={styles.empty}>No members found</Text>
          ) : null}
        </CollapsibleHeroScroll>
      </View>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    flex: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    mapSection: { flex: 1 },
    listHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    listTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
    listSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    filterChip: {
      alignSelf: 'flex-start',
      marginTop: 8,
      backgroundColor: '#e8f5e9',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    filterChipText: { color: colors.whatsappGreen, fontWeight: '600', fontSize: 13 },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: GRID_PADDING,
      paddingBottom: 24,
      gap: GRID_GAP,
    },
    gridItem: {
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      borderWidth: 2,
      borderColor: colors.divider,
    },
    avatarFallback: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      backgroundColor: colors.shellBg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.divider,
    },
    avatarText: { fontWeight: '700', color: colors.primary, fontSize: 22 },
    memberName: {
      fontWeight: '700',
      fontSize: 12,
      color: colors.textPrimary,
      marginTop: 6,
      textAlign: 'center',
      width: '100%',
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 3,
      width: '100%',
      paddingHorizontal: 2,
    },
    locationIcon: { marginRight: 2 },
    cityLine: {
      flexShrink: 1,
      fontSize: 10,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    germanyCityLine: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 2,
      textAlign: 'center',
      width: '100%',
    },
    empty: { textAlign: 'center', color: colors.textSecondary, padding: 24 },
  });
}
