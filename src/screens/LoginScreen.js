import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthProvider';
import colors from '../theme/colors';

const BG_SYMBOLS = [
  { emoji: '🇮🇳', top: '15%', left: '10%' },
  { emoji: '🇮🇳', top: '70%', left: '80%' },
  { emoji: '🇩🇪', top: '25%', left: '75%' },
  { emoji: '🇩🇪', top: '60%', left: '15%' },
  { emoji: '✈️', top: '45%', left: '50%' },
  { emoji: '✈️', top: '80%', left: '65%' },
  { emoji: '💬', top: '35%', left: '25%' },
  { emoji: '📲', top: '55%', left: '85%' },
];

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signInWithGoogle, signInWithLinkedIn } = React.useContext(AuthContext);
  const [loadingProvider, setLoadingProvider] = useState(null);

  const handleSignIn = async (provider, signInFn) => {
    setLoadingProvider(provider);
    try {
      const { error } = await signInFn();
      if (error) {
        Alert.alert('Login failed', error.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.fixedBg}>
        {BG_SYMBOLS.map((item, index) => (
          <Text key={index} style={[styles.bgSymbol, { top: item.top, left: item.left }]}>
            {item.emoji}
          </Text>
        ))}
      </View>

      <LinearGradient
        colors={[colors.germanyBlack, colors.germanyBlack, colors.germanyRed, colors.germanyGold]}
        locations={[0, 0.33, 0.66, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.flagStripe, { height: 4 + insets.top }]}
      />

      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: 24 + insets.top, paddingBottom: 160 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>
            <Text style={styles.titlePrefix}>Find Indians In </Text>
            <Text style={styles.typingText}>Germany</Text>
          </Text>
          <Text style={styles.subtitle}>Connect, Meet, Grow Together</Text>
          <Text style={styles.description}>
            Join in different channels to find accommodation, jobs and grow network with Indians in Germany.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.loginBtn}
              disabled={loadingProvider !== null}
              onPress={() => handleSignIn('google', signInWithGoogle)}
            >
              {loadingProvider === 'google' ? (
                <ActivityIndicator color={colors.germanyRed} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} color="#4285F4" />
                  <Text style={styles.loginBtnText}>Login with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginBtn, styles.linkedinBtn]}
              disabled={loadingProvider !== null}
              onPress={() => handleSignIn('linkedin', signInWithLinkedIn)}
            >
              {loadingProvider === 'linkedin' ? (
                <ActivityIndicator color={colors.linkedinBlue} />
              ) : (
                <>
                  <Ionicons name="logo-linkedin" size={18} color={colors.linkedinBlue} />
                  <Text style={styles.loginBtnText}>Login with LinkedIn</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
        <Text style={styles.logo}>
          <Text style={{ color: colors.logoFind }}>find</Text>
          <Text style={{ color: colors.logoInd }}>ind</Text>
          <Text style={{ color: colors.logoIan }}>ian</Text>
          <Text style={{ color: colors.textPrimary }}>.</Text>
          <Text style={{ color: colors.logoDe }}>de</Text>
        </Text>
        <Text style={styles.footerText}>Made with ❤️ for Indians 🇮🇳 🚀</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.loginBg },
  fixedBg: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  bgSymbol: { position: 'absolute', fontSize: 32, opacity: 0.25 },
  flagStripe: { width: '100%' },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
  content: { maxWidth: 440, width: '100%', alignSelf: 'center' },
  title: { fontSize: 36, fontWeight: '700', lineHeight: 42, marginBottom: 16, textAlign: 'center' },
  titlePrefix: { color: colors.textPrimary },
  typingText: { color: colors.germanyRed },
  subtitle: { fontSize: 20, color: colors.textSecondary, marginBottom: 16, fontWeight: '500', textAlign: 'center' },
  description: { fontSize: 16, color: colors.textSecondary, lineHeight: 24, marginBottom: 32, textAlign: 'center' },
  actions: { gap: 12 },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: colors.borderColor,
    borderRadius: 8,
    backgroundColor: colors.bgWhite,
    minHeight: 52,
  },
  linkedinBtn: {},
  loginBtnText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', paddingTop: 16 },
  logo: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  footerText: { color: colors.textSecondary, fontSize: 14 },
});
