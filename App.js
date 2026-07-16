import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './src/context/AuthProvider';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { useAppUpdates } from './src/hooks/useAppUpdates';
import AppNavigator from './src/navigation/AppNavigator';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppContent() {
  const { isDark } = useTheme();
  useAppUpdates();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
