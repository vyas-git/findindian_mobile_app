import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useApi } from '../hooks/useApi';
import { useTheme } from '../context/ThemeContext';

export default function EmailAllMembersScreen() {
  const { apiRequest } = useApi();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!subject.trim() || !body.trim()) {
      Alert.alert('Error', 'Subject and message are required');
      return;
    }
    setSaving(true);
    try {
      await apiRequest('/api/send-email-all', {
        method: 'POST',
        body: JSON.stringify({ subject: subject.trim(), body: body.trim() }),
      });
      Alert.alert('Submitted', 'Your email request has been queued.');
      setSubject('');
      setBody('');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Email All Members</Text>
      <Text style={styles.subtitle}>Send a message to the community (paid feature on web).</Text>
      <TextInput
        style={styles.input}
        placeholder="Subject"
        placeholderTextColor={colors.textSecondary}
        value={subject}
        onChangeText={setSubject}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Message"
        placeholderTextColor={colors.textSecondary}
        value={body}
        onChangeText={setBody}
        multiline
      />
      <TouchableOpacity style={styles.btn} onPress={submit} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit</Text>}
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: colors.shellBg },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 8, color: colors.textPrimary },
    subtitle: { color: colors.textSecondary, marginBottom: 20 },
    input: {
      borderWidth: 1,
      borderColor: colors.borderColor,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      fontSize: 16,
      backgroundColor: colors.inputBg,
      color: colors.textPrimary,
    },
    textArea: { minHeight: 120, textAlignVertical: 'top' },
    btn: {
      backgroundColor: colors.primary,
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    btnText: { color: '#fff', fontWeight: '700' },
  });
}
