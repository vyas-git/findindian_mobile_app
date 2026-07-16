import { supabase } from './supabase';

/** Refresh access token if it expires within this many seconds. */
const REFRESH_BUFFER_SEC = 120;
const REFRESH_TIMEOUT_MS = 8000;
const GET_SESSION_TIMEOUT_MS = 5000;

let refreshInFlight = null;

function sessionNeedsRefresh(session) {
  if (!session?.expires_at) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  return session.expires_at <= nowSec + REFRESH_BUFFER_SEC;
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function refreshSessionOnce() {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = withTimeout(
    supabase.auth.refreshSession(),
    REFRESH_TIMEOUT_MS,
    'refreshSession'
  )
    .then((result) => result)
    .catch((error) => {
      console.warn('[auth] refreshSession failed', error);
      return { data: { session: null }, error };
    })
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

/**
 * Returns a session with a valid access token, refreshing when needed.
 * On refresh timeout/failure, returns the existing session when still present
 * so the app can continue instead of hanging on the loading gate.
 */
export async function getValidSession({ forceRefresh = false } = {}) {
  let session = null;
  try {
    const { data, error } = await withTimeout(
      supabase.auth.getSession(),
      GET_SESSION_TIMEOUT_MS,
      'getSession'
    );
    if (error) {
      console.warn('[auth] getSession error', error);
      return null;
    }
    session = data?.session ?? null;
  } catch (e) {
    console.warn('[auth] getSession failed', e);
    return null;
  }

  if (!session) return null;

  if (forceRefresh || sessionNeedsRefresh(session)) {
    const { data: refreshed, error: refreshError } = await refreshSessionOnce();
    if (refreshError || !refreshed?.session) {
      // Prefer keeping a still-usable token over clearing the user on transient failure.
      const nowSec = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at > nowSec) {
        return session;
      }
      return null;
    }
    session = refreshed.session;
  }

  return session;
}

export async function refreshSessionIfNeeded() {
  return getValidSession();
}
