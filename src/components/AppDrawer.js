import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthProvider';
import { useTheme } from '../context/ThemeContext';
import { useApi } from '../hooks/useApi';

function DrawerLink({ label, onPress, active, styles }) {
  return (
    <TouchableOpacity style={[styles.linkRow, active && styles.linkRowActive]} onPress={onPress}>
      <Text style={[styles.linkText, active && styles.linkTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SectionItem({ icon, label, onPress, iconColor, styles }) {
  return (
    <TouchableOpacity style={styles.sectionItem} onPress={onPress}>
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text style={styles.sectionItemText}>{label}</Text>
    </TouchableOpacity>
  );
}

function ThemeOption({ icon, label, active, onPress, iconColor, styles }) {
  return (
    <TouchableOpacity style={[styles.themeOption, active && styles.themeOptionActive]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text style={[styles.themeOptionText, active && styles.themeOptionTextActive]}>{label}</Text>
      {active ? <Ionicons name="checkmark" size={18} color={iconColor} /> : null}
    </TouchableOpacity>
  );
}

export default function AppDrawer({
  visible,
  onClose,
  activeRoute,
  onNavigate,
  onEditProfile,
  onEmailAll,
  memberCount,
}) {
  const insets = useSafeAreaInsets();
  const { colors, theme, setTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user, userProfile } = useContext(AuthContext);
  const { apiRequest } = useApi();
  const [loadedCount, setLoadedCount] = useState(memberCount);

  const avatar = userProfile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const name =
    userProfile?.name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.first_name ||
    user?.email?.split('@')[0] ||
    'User';
  const initial = name.charAt(0).toUpperCase();
  const headline = userProfile?.germany_city
    ? `${userProfile.germany_city}, Germany`
    : userProfile?.city || 'findindian.de member';

  useEffect(() => {
    if (!visible) return;
    if (memberCount != null) {
      setLoadedCount(memberCount);
      return;
    }
    apiRequest('/api/users/list')
      .then((data) => setLoadedCount((data.users || []).length))
      .catch(() => {});
  }, [visible, memberCount, apiRequest]);

  const handleNav = (route, params) => {
    onNavigate?.(route, params);
    onClose?.();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.drawer, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.profileHeader}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.profileAvatar} />
              ) : (
                <View style={styles.profileAvatarFallback}>
                  <Text style={styles.profileInitial}>{initial}</Text>
                </View>
              )}
              <View style={styles.profileText}>
                <Text style={styles.profileName}>{name}</Text>
                <View style={styles.profileLinks}>
                  <TouchableOpacity onPress={onEditProfile}>
                    <Text style={styles.profileLink}>View Profile</Text>
                  </TouchableOpacity>
                  <Text style={styles.profileDot}> · </Text>
                  <TouchableOpacity onPress={onEditProfile}>
                    <Text style={styles.profileLink}>Settings</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.profileHeadline}>{headline}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.premiumRow} onPress={() => { onEmailAll?.(); onClose?.(); }}>
              <View style={styles.premiumIcon}>
                <Ionicons name="mail" size={16} color="#fff" />
              </View>
              <Text style={styles.premiumText}>Email all members</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <Text style={styles.sectionHeading}>APPEARANCE</Text>
            <ThemeOption
              icon="sunny-outline"
              label="Light"
              active={theme === 'light'}
              onPress={() => setTheme('light')}
              iconColor={colors.textSecondary}
              styles={styles}
            />
            <ThemeOption
              icon="moon-outline"
              label="Dark"
              active={theme === 'dark'}
              onPress={() => setTheme('dark')}
              iconColor={colors.textSecondary}
              styles={styles}
            />

            <View style={styles.divider} />

            <Text style={styles.sectionHeading}>NAVIGATION</Text>
            <DrawerLink
              label={loadedCount ? `Members (${loadedCount}+)` : 'Members'}
              active={activeRoute === 'Members'}
              onPress={() => handleNav('Members')}
              styles={styles}
            />
            <DrawerLink label="Posts" active={activeRoute === 'Posts'} onPress={() => handleNav('Posts')} styles={styles} />
            <DrawerLink
              label="Channel"
              active={activeRoute === 'Channel'}
              onPress={() => handleNav('Channel', { dmUserId: undefined, dmUserName: undefined })}
              styles={styles}
            />
            <DrawerLink label="Jobs" active={activeRoute === 'Jobs'} onPress={() => handleNav('Jobs')} styles={styles} />

            <View style={styles.divider} />

            <Text style={styles.sectionHeading}>QUICK LINKS</Text>
            <SectionItem icon="people-outline" label="Browse members map" onPress={() => handleNav('Members')} iconColor={colors.textSecondary} styles={styles} />
            <SectionItem icon="newspaper-outline" label="Community posts" onPress={() => handleNav('Posts')} iconColor={colors.textSecondary} styles={styles} />
            <SectionItem
              icon="chatbubbles-outline"
              label="Group channel"
              onPress={() => handleNav('Channel', { dmUserId: undefined, dmUserName: undefined })}
              iconColor={colors.textSecondary}
              styles={styles}
            />
          </ScrollView>
        </View>
        <Pressable style={styles.backdrop} onPress={onClose} />
      </View>
    </Modal>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    overlay: { flex: 1, flexDirection: 'row' },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
    drawer: {
      width: '86%',
      maxWidth: 340,
      backgroundColor: colors.headerBg,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    closeBtn: { alignSelf: 'flex-end', paddingHorizontal: 16, paddingBottom: 4 },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 16,
      gap: 12,
      paddingBottom: 8,
    },
    profileAvatar: { width: 56, height: 56, borderRadius: 28 },
    profileAvatarFallback: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.shellBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileInitial: { fontSize: 22, fontWeight: '700', color: colors.primary },
    profileText: { flex: 1, paddingTop: 2 },
    profileName: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
    profileLinks: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' },
    profileLink: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    profileDot: { color: colors.textSecondary, fontSize: 13 },
    profileHeadline: { fontSize: 12, color: colors.textSecondary, marginTop: 6, lineHeight: 16 },
    divider: { height: 1, backgroundColor: colors.divider, marginVertical: 10 },
    premiumRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 12,
    },
    premiumIcon: {
      width: 28,
      height: 28,
      borderRadius: 4,
      backgroundColor: '#e7a33e',
      alignItems: 'center',
      justifyContent: 'center',
    },
    premiumText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    sectionHeading: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      letterSpacing: 0.4,
    },
    themeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      gap: 12,
    },
    themeOptionActive: { backgroundColor: colors.drawerActiveBg },
    themeOptionText: { flex: 1, fontSize: 16, color: colors.textPrimary },
    themeOptionTextActive: { fontWeight: '700' },
    linkRow: { paddingVertical: 12, paddingHorizontal: 16 },
    linkRowActive: { backgroundColor: colors.drawerActiveBg },
    linkText: { fontSize: 16, color: colors.textPrimary },
    linkTextActive: { fontWeight: '700' },
    sectionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      gap: 12,
    },
    sectionItemText: { fontSize: 15, color: colors.textPrimary },
  });
}
