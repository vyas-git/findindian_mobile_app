import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function SimpleScreenHeader({
  title,
  onBack,
  user,
  userProfile,
  onProfilePress,
  onMessagesPress,
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
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      {onBack ? (
        <TouchableOpacity style={styles.sideBtn} onPress={onBack} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
      ) : onProfilePress ? (
        <TouchableOpacity style={styles.avatarBtn} onPress={onProfilePress}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.sideSpacer} />
      )}

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {onMessagesPress ? (
        <TouchableOpacity style={styles.msgBtn} onPress={onMessagesPress}>
          <Ionicons name="chatbox-ellipses-outline" size={26} color={colors.textPrimary} />
          {messageBadge > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{messageBadge > 9 ? '9+' : messageBadge}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      ) : (
        <View style={styles.sideSpacer} />
      )}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      paddingHorizontal: 12,
      paddingBottom: 10,
      gap: 10,
    },
    sideBtn: { padding: 4, width: 36 },
    sideSpacer: { width: 36 },
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
    title: {
      flex: 1,
      textAlign: 'center',
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    msgBtn: { padding: 4, position: 'relative', width: 36, alignItems: 'center' },
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
