import { Platform } from 'react-native';

// This is an informational client label, not proof of device identity.
export function getPlatformHeaders() {
  return Platform.OS === 'android' || Platform.OS === 'ios'
    ? { 'X-App-Platform': Platform.OS }
    : {};
}
