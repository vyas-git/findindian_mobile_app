import { useEffect } from 'react';
import { Alert } from 'react-native';

/**
 * Checks EAS Update on launch (production/preview builds only).
 * Skipped in __DEV__ and when the native module is missing (rebuild required).
 */
export function useAppUpdates() {
  useEffect(() => {
    if (__DEV__) return;

    let cancelled = false;

    (async () => {
      try {
        const Updates = await import('expo-updates');
        if (!Updates.isEnabled) return;

        const update = await Updates.checkForUpdateAsync();
        if (cancelled || !update.isAvailable) return;

        await Updates.fetchUpdateAsync();
        if (cancelled) return;

        Alert.alert('Update ready', 'A new version was downloaded. Restart now to apply it?', [
          { text: 'Later', style: 'cancel' },
          { text: 'Restart', onPress: () => Updates.reloadAsync() },
        ]);
      } catch (e) {
        console.warn(
          '[updates] skipped:',
          e?.message || e,
          '— rebuild the app after adding expo-updates, or ignore in dev.'
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);
}
