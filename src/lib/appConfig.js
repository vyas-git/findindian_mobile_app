import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? Constants.easConfig?.extra ?? {};

export const PROD_API_URL = 'https://api.findindian.de';
export const LOCAL_API_URL = 'http://localhost:8080';

let didLogApiEnv = false;

/** Metro / Expo Go host (your machine LAN IP when the app runs on a phone). */
function getExpoDevHost() {
  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    Constants.manifest2?.extra?.expoGo?.debuggerHost,
    Constants.manifest?.debuggerHost,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const hostPort = String(candidate).split('/')[0];
    const host = hostPort.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
  }
  return null;
}

/**
 * On a physical device / emulator, localhost is the phone — rewrite to the
 * machine IP Expo is already using for Metro (e.g. 192.168.x.x:8080).
 */
function rewriteLocalhostForDevice(apiUrl) {
  try {
    const url = new URL(apiUrl);
    if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
      return apiUrl.replace(/\/$/, '');
    }
    const host = getExpoDevHost();
    if (!host) return apiUrl.replace(/\/$/, '');
    url.hostname = host;
    return url.toString().replace(/\/$/, '');
  } catch {
    return apiUrl.replace(/\/$/, '');
  }
}

function resolveApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return {
      apiUrl: rewriteLocalhostForDevice(process.env.EXPO_PUBLIC_API_URL),
      source: 'process.env.EXPO_PUBLIC_API_URL',
    };
  }
  if (extra.EXPO_PUBLIC_API_URL) {
    return {
      apiUrl: rewriteLocalhostForDevice(extra.EXPO_PUBLIC_API_URL),
      source: 'app.json extra.EXPO_PUBLIC_API_URL',
    };
  }
  if (extra.API_URL) {
    return {
      apiUrl: rewriteLocalhostForDevice(extra.API_URL),
      source: 'app.json extra.API_URL',
    };
  }
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return {
      apiUrl: rewriteLocalhostForDevice(LOCAL_API_URL),
      source: '__DEV__ default (local)',
    };
  }
  return { apiUrl: PROD_API_URL, source: 'production default' };
}

/** Config available in dev (.env) and EAS builds (eas.json env / app.json extra). */
export function getAppConfig() {
  const supabaseUrl =
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    extra.SUPABASE_URL ||
    '';

  const supabasePublishKey =
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISH_KEY ||
    extra.SUPABASE_PUBLISH_KEY ||
    extra.SUPABASE_ANON_KEY ||
    '';

  const { apiUrl, source } = resolveApiUrl();

  if (!didLogApiEnv) {
    didLogApiEnv = true;
    const envLabel =
      apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1') || /\b192\.168\.|\b10\.|\b172\.(1[6-9]|2\d|3[0-1])\./.test(apiUrl)
        ? 'local'
        : apiUrl.includes('api.findindian.de')
          ? 'production'
          : 'custom';
    console.log(
      `[config] API env=${envLabel} url=${apiUrl} source=${source} __DEV__=${Boolean(__DEV__)} expoHost=${getExpoDevHost() || 'n/a'}`
    );
  }

  return { supabaseUrl, supabasePublishKey, apiUrl, apiSource: source };
}

export function isSupabaseConfigured(config = getAppConfig()) {
  const { supabaseUrl, supabasePublishKey } = config;
  return Boolean(
    supabaseUrl &&
      supabasePublishKey &&
      !supabaseUrl.includes('your-project') &&
      !supabasePublishKey.includes('your-')
  );
}
