import { useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';

async function checkForOtaUpdate({ promptRestart = true } = {}) {
  const Updates = await import('expo-updates');
  if (!Updates.isEnabled) return false;

  const result = await Updates.checkForUpdateAsync();
  if (!result.isAvailable) return false;

  await Updates.fetchUpdateAsync();

  if (promptRestart) {
    Alert.alert('Update ready', 'A new version was downloaded. Restart now to apply it?', [
      { text: 'Later', style: 'cancel' },
      { text: 'Restart', onPress: () => Updates.reloadAsync() },
    ]);
  } else {
    await Updates.reloadAsync();
  }

  return true;
}

/**
 * Checks EAS Update on launch and when returning to the app (production/preview builds).
 * Skipped in __DEV__ and when the native expo-updates module is missing (rebuild required).
 */
export function useAppUpdates() {
  const checkingRef = useRef(false);

  useEffect(() => {
    if (__DEV__) return undefined;

    let cancelled = false;

    const runCheck = async () => {
      if (checkingRef.current || cancelled) return;
      checkingRef.current = true;
      try {
        await checkForOtaUpdate({ promptRestart: true });
      } catch (e) {
        console.warn(
          '[updates] skipped:',
          e?.message || e,
          '— rebuild the app after adding expo-updates, or ignore in dev.'
        );
      } finally {
        checkingRef.current = false;
      }
    };

    runCheck();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        runCheck();
      }
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);
}
