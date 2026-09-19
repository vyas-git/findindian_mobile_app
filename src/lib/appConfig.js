import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? Constants.easConfig?.extra ?? {};

export const PROD_API_URL = 'https://api.findindian.de';
export const LOCAL_API_URL = 'http://localhost:8080';

let didLogApiEnv = false;

function isLocalApiHost(hostname) {
  if (!hostname) return false;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  if (/^192\.168\.\d+\.\d+$/.test(hostname)) return true;
  if (/^10\.\d+\.\d+\.\d+$/.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname)) return true;
  return false;
}

/** Metro / Expo Go host (LAN IP for device dev). Tunnel (*.exp.direct) is Metro-only — skip for API. */
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
    if (!host || host === 'localhost' || host === '127.0.0.1') continue;
    if (host.includes('.exp.direct')) continue;
    return host;
  }
  return null;
}

/**
 * On a physical device in __DEV__, localhost is the phone — rewrite to the
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

function pickConfiguredUrl() {
  return (
    process.env.EXPO_PUBLIC_API_URL ||
    extra.EXPO_PUBLIC_API_URL ||
    extra.API_URL ||
    ''
  );
}

function resolveApiUrl() {
  const configured = pickConfiguredUrl().trim();
  const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

  // Production / release builds must never use a local/LAN API URL, even if
  // .env leaked into an OTA bundle during `eas update`.
  if (!isDev) {
    if (configured) {
      try {
        const host = new URL(configured).hostname;
        if (!isLocalApiHost(host)) {
          return {
            apiUrl: configured.replace(/\/$/, ''),
            source: 'release env (prod API)',
          };
        }
      } catch {
        // fall through to production default
      }
    }
    return { apiUrl: PROD_API_URL, source: 'production default (blocked local URL)' };
  }

  // Dev: prefer .env / extra, rewrite localhost → Metro LAN IP (LAN only, not tunnel host)
  if (configured) {
    return {
      apiUrl: rewriteLocalhostForDevice(configured),
      source: process.env.EXPO_PUBLIC_API_URL
        ? 'process.env.EXPO_PUBLIC_API_URL'
        : 'app.json extra',
    };
  }

  return {
    apiUrl: rewriteLocalhostForDevice(LOCAL_API_URL),
    source: '__DEV__ default (local)',
  };
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
    const envLabel = isLocalApiHost(
      (() => {
        try {
          return new URL(apiUrl).hostname;
        } catch {
          return '';
        }
      })()
    )
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
