import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useApi } from '../hooks/useApi';
import { AuthContext } from '../context/AuthProvider';
import { useTheme } from '../context/ThemeContext';

export default function DeleteAccountScreen({ navigation }) {
  const { apiRequest } = useApi();
  const { signOut } = React.useContext(AuthContext);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await apiRequest('/api/users/me/delete', { method: 'POST' });
              await signOut();
            } catch (e) {
              Alert.alert('Error', e.message);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delete Account</Text>
      <Text style={styles.subtitle}>
        Permanently delete your findindian.de account and all associated data.
      </Text>
      <TouchableOpacity style={styles.btn} onPress={confirmDelete} disabled={deleting}>
        {deleting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Delete My Account</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.cancel}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: colors.shellBg },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 8, color: colors.germanyRed },
    subtitle: { color: colors.textSecondary, marginBottom: 24, lineHeight: 22 },
    btn: {
      backgroundColor: colors.germanyRed,
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    btnText: { color: '#fff', fontWeight: '700' },
    cancel: { textAlign: 'center', marginTop: 16, color: colors.primary, fontWeight: '600' },
  });
}
