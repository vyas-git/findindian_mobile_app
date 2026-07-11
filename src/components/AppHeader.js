import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function AppHeader({
  user,
  userProfile,
  onProfilePress,
  onMessagesPress,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search',
  messageBadge,
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const avatar =
    userProfile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const initial = (
    userProfile?.name ||
    user?.user_metadata?.first_name ||
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.charAt(0) ||
    'U'
  )
    .charAt(0)
    .toUpperCase();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <TouchableOpacity style={styles.avatarBtn} onPress={onProfilePress}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder={searchPlaceholder}
          placeholderTextColor={colors.textSecondary}
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>

      <TouchableOpacity style={styles.msgBtn} onPress={onMessagesPress}>
        <Ionicons name="chatbox-ellipses-outline" size={26} color={colors.textPrimary} />
        {messageBadge > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{messageBadge > 9 ? '9+' : messageBadge}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingBottom: 10,
      backgroundColor: colors.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      gap: 10,
    },
    avatarBtn: { padding: 2 },
    avatar: { width: 36, height: 36, borderRadius: 18 },
    avatarFallback: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.shellBg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.borderColor,
    },
    avatarText: { fontWeight: '700', color: colors.primary, fontSize: 14 },
    searchWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.searchBg,
      borderRadius: 8,
      paddingHorizontal: 10,
      height: 40,
      gap: 6,
    },
    searchInput: { flex: 1, fontSize: 15, paddingVertical: 0, color: colors.textPrimary },
    msgBtn: { padding: 4, position: 'relative' },
    badge: {
      position: 'absolute',
      top: 0,
      right: 0,
      backgroundColor: '#cc1016',
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  });
}
