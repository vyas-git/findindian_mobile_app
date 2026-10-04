import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import CollapsibleHeroScroll from '../components/CollapsibleHeroScroll';
import MembersMap from '../components/MembersMap';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../hooks/useApi';
import { useAppShell } from '../context/AppShellContext';
import { AuthContext } from '../context/AuthProvider';
import { useTheme } from '../context/ThemeContext';

const GRID_PADDING = 12;
const GRID_GAP = 10;
const GRID_COLUMNS = 3;

function MemberGridItem({ member, onPress, avatarSize }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, avatarSize), [colors, avatarSize]);
  const initial = (member.name || 'U').charAt(0).toUpperCase();
  const currentCity = member.city?.trim();
  const germanyCity = member.germany_city?.trim();

  return (
    <TouchableOpacity
      style={styles.gridItem}
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
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const mapHeroHeight = windowHeight * 0.34;
  const columnWidth = (windowWidth - GRID_PADDING * 2) / GRID_COLUMNS;
  const avatarSize = Math.min(72, columnWidth - 12);

  const { apiRequest } = useApi();
  const { searchQuery } = useAppShell();
  const { user, userProfile } = useContext(AuthContext);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, avatarSize), [colors, avatarSize]);
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
    navigation.navigate('Channel', {
      dmUserId: member.id,
      dmUserName: member.name,
      returnTo: 'Members',
    });
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
          heroHeight={mapHeroHeight}
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
              <MemberGridItem
                key={member.id}
                member={member}
                onPress={handleMemberPress}
                avatarSize={avatarSize}
              />
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

function createStyles(colors, avatarSize) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.shellBg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.shellBg },
    mapSection: { flex: 1 },
    listHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    listTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
    listSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    filterChip: {
      alignSelf: 'flex-start',
      marginTop: 8,
      backgroundColor: colors.chipBg,
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
    },
    gridItem: {
      width: `${100 / GRID_COLUMNS}%`,
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: GRID_GAP / 2,
      marginBottom: GRID_GAP,
    },
    avatar: {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
      borderWidth: 2,
      borderColor: colors.divider,
    },
    avatarFallback: {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
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
