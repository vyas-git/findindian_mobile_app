import { getValidSession } from './session';
import { getAppConfig } from './appConfig';
import { supabase } from './supabase';

const { apiUrl: API_URL } = getAppConfig();

async function authorizedFetch(session, endpoint, options = {}) {
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...options.headers,
    },
  });
}

export async function apiRequestWithSession(endpoint, options = {}) {
  let session = await getValidSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  let response = await authorizedFetch(session, endpoint, options);

  if (response.status === 401) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    session = refreshed?.session ?? null;
    if (session) {
      response = await authorizedFetch(session, endpoint, options);
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || errorData.message || 'Request failed');
  }

  if (response.status === 204) return null;
  return response.json();
}
