import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../hooks/useApi';
import { AuthContext } from '../context/AuthProvider';
import { useTheme } from '../context/ThemeContext';
import GermanyCityModal from './GermanyCityModal';

export default function ProfileModal({ visible, onClose, onUpdated, onDeleteAccount }) {
  const { refreshProfile, signOut } = React.useContext(AuthContext);
  const { apiRequest } = useApi();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCityPickerOpen(false);
      return;
    }
    apiRequest('/api/users/me')
      .then(setProfile)
      .catch(console.warn);
  }, [visible, apiRequest]);

  const save = async () => {
    setSaving(true);
    try {
      await apiRequest('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          name: profile.name,
          city: profile.city,
          germany_city: profile.germany_city,
          instagram_handle: profile.instagram_handle,
          linkedin_url: profile.linkedin_url,
        }),
      });
      await refreshProfile();
      onUpdated?.();
      onClose?.();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Modal>
    );
  }

  return (
    <>
      <Modal visible={visible && !cityPickerOpen} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={profile.name || ''}
            onChangeText={(v) => setProfile({ ...profile, name: v })}
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={styles.label}>City/Place in Germany 🇩🇪</Text>
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setCityPickerOpen(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.selectFieldText,
                !profile.germany_city && styles.selectFieldPlaceholder,
              ]}
              numberOfLines={1}
            >
              {profile.germany_city || 'Select from list…'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.label}>Instagram</Text>
          <TextInput
            style={styles.input}
            value={profile.instagram_handle || ''}
            onChangeText={(v) => setProfile({ ...profile, instagram_handle: v })}
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.label}>LinkedIn URL</Text>
          <TextInput
            style={styles.input}
            value={profile.linkedin_url || ''}
            onChangeText={(v) => setProfile({ ...profile, linkedin_url: v })}
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => {
              onClose?.();
              onDeleteAccount?.();
            }}
          >
            <Text style={styles.deleteBtnText}>Delete Account</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      <GermanyCityModal
        visible={visible && cityPickerOpen}
        allowDismiss
        selectedCity={profile.germany_city || ''}
        onClose={() => setCityPickerOpen(false)}
        onSelect={(city) => {
          setProfile({ ...profile, germany_city: city });
          setCityPickerOpen(false);
        }}
      />
    </>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: colors.shellBg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.shellBg },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 20, color: colors.textPrimary },
    label: { fontWeight: '600', marginBottom: 6, marginTop: 12, color: colors.textPrimary },
    input: {
      borderWidth: 1,
      borderColor: colors.borderColor,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: colors.inputBg,
      color: colors.textPrimary,
    },
    selectField: {
      borderWidth: 1,
      borderColor: colors.borderColor,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: colors.inputBg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    selectFieldText: { flex: 1, fontSize: 16, color: colors.textPrimary },
    selectFieldPlaceholder: { color: colors.textSecondary },
    saveBtn: {
      backgroundColor: colors.primary,
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 24,
    },
    saveBtnText: { color: '#fff', fontWeight: '700' },
    deleteBtn: { marginTop: 16, alignItems: 'center' },
    deleteBtnText: { color: colors.germanyRed, fontWeight: '600' },
    signOutBtn: { marginTop: 24, alignItems: 'center' },
    signOutText: { color: colors.textSecondary, fontWeight: '600' },
  });
}
