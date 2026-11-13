import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ScrollView,
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
import { useFocusEffect } from '@react-navigation/native';

const GRID_PADDING = 12;
const GRID_GAP = 10;
const GRID_COLUMNS = 3;

function MemberGridItem({ member, onPress, avatarSize, width, isSelf }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, avatarSize, isDark), [colors, avatarSize, isDark]);
  const initial = (member.name || 'U').charAt(0).toUpperCase();
  const currentCity = member.city?.trim();
  const germanyCity = member.germany_city?.trim();

  return (
    <TouchableOpacity
      style={[styles.gridItem, { width }, isSelf && styles.selfCard]}
      accessibilityRole="button"
      accessibilityLabel={isSelf ? `${member.name || 'You'} (you)` : `Message ${member.name || 'member'}`}
      disabled={isSelf}
      onPress={() => onPress(member)}
      activeOpacity={0.85}
    >
      {member.avatar_url ? (
        <Image source={{ uri: member.avatar_url }} style={[styles.avatar, isSelf && styles.selfAvatar]} />
      ) : (
        <View style={[styles.avatarFallback, isSelf && styles.selfAvatar]}>
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
  const mapHeroHeight = Math.min(260, Math.max(200, windowHeight * 0.34));
  const columnWidth = Math.floor((windowWidth - GRID_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS);
  const avatarSize = Math.min(72, columnWidth - 18);

  const { apiRequest } = useApi();
  const { searchQuery } = useAppShell();
  const { user, userProfile } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, avatarSize, isDark), [colors, avatarSize, isDark]);
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

  useFocusEffect(useCallback(() => {
    loadMembers();
  }, [loadMembers]));

  const matchingMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return members.filter((member) => [member.name, member.city, member.germany_city]
      .some((value) => value?.toLowerCase().includes(query)) || !query);
  }, [members, searchQuery]);
  const cityOptions = useMemo(() => {
    const counts = new Map();
    for (const member of matchingMembers) {
      const city = member.germany_city?.trim();
      if (city) counts.set(city, (counts.get(city) || 0) + 1);
    }
    return [...counts].sort(([cityA, countA], [cityB, countB]) => countB - countA || cityA.localeCompare(cityB)).slice(0, 8);
  }, [matchingMembers]);
  const filteredMembers = selectedCity
    ? matchingMembers.filter((member) => member.germany_city?.trim().toLowerCase() === selectedCity.toLowerCase())
    : matchingMembers;

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
          hero={<MembersMap members={matchingMembers} selectedCity={selectedCity} onCityPress={setSelectedCity} />}
          heroHeight={mapHeroHeight}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadMembers(); }} />
          }
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}
            keyboardShouldPersistTaps="handled">
            {[[null, matchingMembers.length], ...cityOptions].map(([city, count]) => (
              <TouchableOpacity key={city || 'all'} accessibilityRole="button" accessibilityState={{ selected: city === selectedCity }}
                style={[styles.filterChip, city === selectedCity && styles.filterChipActive]} onPress={() => setSelectedCity(city)}>
                <Text style={styles.filterChipText}>{city || 'All members'}  {count}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Willkommen, {welcomeName}</Text>
            <Text style={styles.listSubtitle}>{matchingMembers.length} Indians in Germany — say hello.</Text>
          </View>

          <View style={styles.grid}>
            {filteredMembers.map((member) => (
              <MemberGridItem
                key={member.id}
                member={member}
                onPress={handleMemberPress}
                avatarSize={avatarSize}
                width={columnWidth}
                isSelf={member.id === user?.id}
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

function createStyles(colors, avatarSize, isDark) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.shellBg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.shellBg },
    mapSection: { flex: 1 },
    listHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    listTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
    listSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    filters: { paddingHorizontal: 12, paddingTop: 12, gap: 8 },
    filterChip: { minHeight: 36, justifyContent: 'center', backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.divider, paddingHorizontal: 12, borderRadius: 18 },
    filterChipActive: { borderColor: '#dd0000', backgroundColor: isDark ? '#351f1d' : '#fff0ed' },
    filterChipText: { color: colors.textPrimary, fontWeight: '600', fontSize: 13 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP, paddingHorizontal: GRID_PADDING, paddingBottom: 24 },
    gridItem: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 7, borderRadius: 16, borderWidth: 1, borderColor: isDark ? '#3a3732' : '#efe6d8', backgroundColor: isDark ? '#1c1b19' : '#fff' },
    selfCard: { borderColor: '#ffce00' },
    selfAvatar: { borderColor: '#ffce00', borderWidth: 3 },
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
