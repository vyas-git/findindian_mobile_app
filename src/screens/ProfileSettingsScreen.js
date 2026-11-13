import React, { useContext, useMemo, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../context/AuthProvider';
import { useTheme } from '../context/ThemeContext';
import { useApi } from '../hooks/useApi';

const BIO_WORD_LIMIT = 75;

const genders = {
  woman: 'Woman', man: 'Man', non_binary: 'Non-binary',
  self_describe: 'Another identity', prefer_not_to_say: 'Prefer not to say',
};

export default function ProfileSettingsScreen() {
  const { userProfile: profile, refreshProfile, signOut } = useContext(AuthContext);
  const { apiRequest } = useApi();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const bioWords = (draft.bio ?? profile?.bio ?? '').trim().split(/\s+/u).filter(Boolean).length;
  const bioOverLimit = bioWords > BIO_WORD_LIMIT && draft.bio !== undefined;

  const save = async () => {
    if (busy || bioOverLimit) return;
    setBusy(true);
    setMessage('');
    try {
      await apiRequest('/api/users/me', { method: 'PUT', body: JSON.stringify(draft) });
      await refreshProfile();
      setDraft({});
      setMessage('Profile saved.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (busy || confirmation !== 'DELETE') return;
    setBusy(true);
    setDeleteError('');
    try {
      await apiRequest('/api/users/me/delete', { method: 'POST', body: JSON.stringify({ confirmation }) });
      await signOut();
    } catch (error) {
      setDeleteError(error.message);
      setBusy(false);
    }
  };

  if (!profile) return <Text style={styles.text}>Loading profile…</Text>;

  const provider = { google: 'Google', linkedin: 'LinkedIn', linkedin_oidc: 'LinkedIn', apple: 'Apple' }[profile.provider] || 'your sign-in provider';
  const change = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <View style={styles.identity}>
          {profile.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={styles.avatar} /> : (
            <View style={styles.avatar}><Text style={styles.heading}>{profile.name?.charAt(0).toUpperCase()}</Text></View>
          )}
          <View style={styles.identityText}>
            <Text style={styles.heading}>{profile.name}</Text>
            <Text style={styles.note}>{profile.email}</Text>
          </View>
          <TouchableOpacity accessibilityRole="button" disabled={busy} style={[styles.option, styles.signOut]} onPress={async () => {
            try {
              await signOut();
            } catch (error) {
              setMessage(error.message || 'Could not sign out');
            }
          }}>
            <Text style={styles.note}>Sign out</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.note}>Your name, email and photo come from {provider}. Update them with your sign-in provider.</Text>
      </View>
      <View style={styles.card}>
        {[
          ['bio', 'About you'],
          ['germany_city', 'City in Germany'],
          ['instagram_handle', 'Instagram handle'],
          ['linkedin_url', 'LinkedIn URL'],
        ].map(([key, label]) => (
          <View key={key} style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput accessibilityLabel={label} editable={!busy} multiline={key === 'bio'}
              maxLength={key === 'bio' ? 500 : undefined}
              placeholder={key === 'bio' ? 'Share a little about yourself' : undefined}
              placeholderTextColor={colors.textSecondary} style={[styles.input, key === 'bio' && styles.bio]}
              value={draft[key] ?? profile[key] ?? ''} onChangeText={(value) => change(key, value)} />
            {key === 'bio' ? <Text style={styles.note}>{bioWords} / {BIO_WORD_LIMIT} words</Text> : null}
          </View>
        ))}
        <Text style={styles.label}>Gender</Text>
        {profile.gender ? <Text style={styles.text}>{genders[profile.gender]}</Text> : (
          <View style={styles.options}>
            {Object.entries(genders).map(([value, label]) => (
              <TouchableOpacity key={value} accessibilityRole="button" accessibilityState={{ selected: draft.gender === value }}
                disabled={busy} style={[styles.option, draft.gender === value && styles.selected]}
                onPress={() => change('gender', draft.gender === value ? undefined : value)}>
                <Text style={styles.text}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <Text style={styles.note}>Gender is optional, private and can be set once.</Text>
        <TouchableOpacity accessibilityRole="button" disabled={busy || bioOverLimit} style={[styles.primary, (busy || bioOverLimit) && styles.disabled]} onPress={save}>
          <Text style={styles.primaryText}>{busy && !confirmOpen ? 'Saving…' : 'Save profile'}</Text>
        </TouchableOpacity>
        {message ? <Text accessibilityLiveRegion="polite" style={styles.note}>{message}</Text> : null}
      </View>
      <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.deleteLink} onPress={() => {
        setConfirmation('');
        setDeleteError('');
        setConfirmOpen(true);
      }}>
        <Text style={styles.link}>Delete account</Text>
      </TouchableOpacity>
      <Modal visible={confirmOpen} animationType="fade" transparent onRequestClose={() => { if (!busy) setConfirmOpen(false); }}>
        <View style={styles.backdrop}>
          <View style={[styles.card, styles.dialog]} accessibilityViewIsModal>
            <Text style={styles.heading}>Delete your account?</Text>
            <Text style={styles.text}>You’ll lose access to your account. Type DELETE to confirm.</Text>
            <TextInput accessibilityLabel="Confirmation" autoCapitalize="characters" autoCorrect={false}
              editable={!busy} style={styles.input} value={confirmation} onChangeText={setConfirmation} />
            {deleteError ? <Text accessibilityRole="alert" style={styles.note}>{deleteError}</Text> : null}
            <View style={styles.options}>
              <TouchableOpacity accessibilityRole="button" style={styles.option} disabled={busy} onPress={() => setConfirmOpen(false)}>
                <Text style={styles.text}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" disabled={busy || confirmation !== 'DELETE'}
                style={[styles.primary, (busy || confirmation !== 'DELETE') && styles.disabled]} onPress={remove}>
                <Text style={styles.primaryText}>{busy ? 'Deleting…' : 'Delete account'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    page: { padding: 16, paddingBottom: 40, gap: 14 },
    card: { padding: 16, gap: 12, backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.divider, borderRadius: 16 },
    identity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    identityText: { flex: 1, minWidth: 0 },
    signOut: { alignSelf: 'flex-start' },
    avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.shellBg },
    heading: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
    text: { color: colors.textPrimary },
    note: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
    field: { gap: 6 },
    label: { color: colors.textPrimary, fontWeight: '600' },
    input: { padding: 10, borderWidth: 1, borderColor: colors.divider, borderRadius: 8, backgroundColor: colors.shellBg, color: colors.textPrimary },
    bio: { minHeight: 104, textAlignVertical: 'top' },
    options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    option: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderRadius: 8, borderColor: colors.divider },
    selected: { borderColor: colors.primary, backgroundColor: colors.shellBg },
    primary: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, backgroundColor: '#b42318', borderRadius: 8 },
    primaryText: { color: '#fff', fontWeight: '700' },
    deleteLink: { alignSelf: 'flex-start', padding: 10 },
    link: { fontSize: 13, color: colors.textSecondary, textDecorationLine: 'underline' },
    disabled: { opacity: 0.55 },
    backdrop: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0009' },
    dialog: { width: '100%', maxWidth: 400 },
  });
}
