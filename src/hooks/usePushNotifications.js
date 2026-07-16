import { useEffect, useRef } from 'react';
import { AppState, PermissionsAndroid, Platform } from 'react-native';
import Constants from 'expo-constants';
import { useApi, API_URL } from './useApi';
import { getValidSession } from '../lib/session';

// Importing expo-notifications on Android Expo Go crashes at module load (SDK 53+).
export function isRemotePushSupported() {
  if (Platform.OS === 'web') return false;
  return !(Constants.appOwnership === 'expo' && Platform.OS === 'android');
}

let notificationsModulePromise = null;
let deviceModulePromise = null;

function loadNotificationsModule() {
  if (!isRemotePushSupported()) return Promise.resolve(null);
  if (!notificationsModulePromise) {
    notificationsModulePromise = import('expo-notifications');
  }
  return notificationsModulePromise;
}

function loadDeviceModule() {
  if (!deviceModulePromise) {
    deviceModulePromise = import('expo-device');
  }
  return deviceModulePromise;
}

async function ensureAndroidNotificationPermission() {
  if (Platform.OS !== 'android' || Platform.Version < 33) return true;

  const granted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
  );
  if (granted) return true;

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export function usePushNotifications(onNotificationTap) {
  const { apiRequest } = useApi();
  const tokenRef = useRef(null);
  const responseListener = useRef(null);
  const appStateListener = useRef(null);
  const registeringRef = useRef(false);
  const handledColdStartRef = useRef(false);
  const apiRequestRef = useRef(apiRequest);
  const onNotificationTapRef = useRef(onNotificationTap);

  apiRequestRef.current = apiRequest;
  onNotificationTapRef.current = onNotificationTap;

  const navigateFromNotification = async (data) => {
    if (!data) return;
    const session = await getValidSession();
    if (!session) {
      console.warn('[push] notification tap ignored — no valid session');
      return;
    }
    onNotificationTapRef.current?.(data);
  };

  useEffect(() => {
    if (!isRemotePushSupported()) {
      console.log(
        '[push] Skipping remote push in Expo Go on Android. Use a development build for device notifications.'
      );
      return undefined;
    }

    let mounted = true;

    console.log('[push] hook mounted', {
      api: API_URL,
      appOwnership: Constants.appOwnership,
      executionEnvironment: Constants.executionEnvironment,
    });

    const registerPushToken = async () => {
      if (registeringRef.current) return;
      registeringRef.current = true;

      try {
        console.log('[push] setup start');

        const [Notifications, Device] = await Promise.all([
          loadNotificationsModule(),
          loadDeviceModule(),
        ]);
        if (!mounted || !Notifications?.getPermissionsAsync) {
          console.error(
            '[push] expo-notifications unavailable. Rebuild the dev client after adding the plugin.'
          );
          return;
        }

        Notifications.setNotificationHandler({
          handleNotification: async () => {
            const isForeground = AppState.currentState === 'active';
            return {
              shouldShowAlert: !isForeground,
              shouldPlaySound: !isForeground,
              shouldSetBadge: true,
            };
          },
        });

        if (!Device.isDevice) {
          console.warn('[push] requires a physical device (not emulator).');
          return;
        }

        const androidGranted = await ensureAndroidNotificationPermission();
        if (!androidGranted) {
          console.warn('[push] Android POST_NOTIFICATIONS denied.');
          return;
        }

        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== 'granted') {
          console.log('[push] requesting notification permission…');
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.warn('[push] notification permission not granted:', finalStatus);
          return;
        }

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('messages', {
            name: 'Messages',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
          });
          await Notifications.setNotificationChannelAsync('posts', {
            name: 'Posts',
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }

        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        if (!projectId) {
          console.error('[push] missing EAS projectId in app.json extra.eas.projectId');
          return;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        const token = tokenData.data;
        if (!mounted || !token) return;

        if (tokenRef.current === token) {
          console.log('[push] token unchanged, skip backend sync');
          return;
        }

        const session = await getValidSession();
        if (!session) {
          console.warn('[push] session not ready, will retry on next app focus');
          return;
        }

        tokenRef.current = token;
        await apiRequestRef.current('/api/users/me/push-token', {
          method: 'POST',
          body: JSON.stringify({
            expo_push_token: token,
            platform: Platform.OS,
          }),
        });
        console.log('[push] token registered with', API_URL);
        console.log('[push] Expo push token:', token);
      } catch (e) {
        const message = e?.message || String(e);
        if (message.includes('Firebase') || message.includes('googleServicesFile')) {
          console.error(
            '[push] Firebase not configured. Add google-services.json from Firebase Console ' +
              '(package com.findindian.de), upload FCM key to EAS, then rebuild the dev client. ' +
              'Guide: https://docs.expo.dev/push-notifications/fcm-credentials/'
          );
        } else if (message.includes('Not authenticated')) {
          console.warn('[push] session not ready, will retry on next app focus');
        } else {
          console.error('[push] setup failed:', message);
          if (__DEV__ && e?.stack) console.error(e.stack);
        }
      } finally {
        registeringRef.current = false;
      }
    };

    registerPushToken();

    loadNotificationsModule().then((Notifications) => {
      if (!mounted || !Notifications?.addNotificationResponseReceivedListener) return;

      if (!handledColdStartRef.current && Notifications.getLastNotificationResponseAsync) {
        handledColdStartRef.current = true;
        Notifications.getLastNotificationResponseAsync()
          .then((response) => {
            if (!response) return;
            const data = response.notification.request.content.data;
            navigateFromNotification(data);
          })
          .catch((e) => console.warn('[push] cold start notification handling failed', e));
      }

      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = response.notification.request.content.data;
          navigateFromNotification(data);
        }
      );
    });

    appStateListener.current = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        registerPushToken();
      }
    });

    return () => {
      mounted = false;
      responseListener.current?.remove();
      appStateListener.current?.remove();
    };
  }, []);

  const unregister = async () => {
    if (!tokenRef.current || !isRemotePushSupported()) return;
    try {
      await apiRequestRef.current('/api/users/me/push-token', {
        method: 'DELETE',
        body: JSON.stringify({ expo_push_token: tokenRef.current }),
      });
    } catch (e) {
      console.warn('unregister push token', e);
    }
    tokenRef.current = null;
  };

  return { unregisterPushToken: unregister };
}
