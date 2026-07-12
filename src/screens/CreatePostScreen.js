import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useApi } from '../hooks/useApi';
import { useTheme } from '../context/ThemeContext';

export default function CreatePostScreen({ navigation, route }) {
  const { apiRequest } = useApi();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please write something');
      return;
    }
    setSaving(true);
    try {
      await apiRequest('/api/posts', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      route.params?.onCreated?.();
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.label}>Title (optional)</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
        placeholderTextColor={colors.textSecondary}
      />
      <Text style={styles.label}>Content</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={content}
        onChangeText={setContent}
        placeholder="What's on your mind?"
        placeholderTextColor={colors.textSecondary}
        multiline
      />
      <TouchableOpacity style={styles.btn} onPress={submit} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Post</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.shellBg },
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
    textArea: { minHeight: 120, textAlignVertical: 'top' },
    btn: {
      backgroundColor: colors.primary,
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 24,
    },
    btnText: { color: '#fff', fontWeight: '700' },
  });
}
