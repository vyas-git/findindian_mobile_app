import { useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthProvider';
import { getValidSession } from '../lib/session';
import { supabase } from '../lib/supabase';
import { getAppConfig } from '../lib/appConfig';

const { apiUrl: API_URL } = getAppConfig();

export function useApi() {
  const { signOut } = useContext(AuthContext);

  const apiRequest = useCallback(
    async (endpoint, options = {}) => {
      let session = await getValidSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const doFetch = (activeSession) =>
        fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeSession.access_token}`,
            ...options.headers,
          },
        });

      let response = await doFetch(session);

      if (response.status === 401) {
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && refreshed?.session) {
          session = refreshed.session;
          response = await doFetch(session);
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || errorData.message || `Request failed (${response.status})`;

        if (
          errorMessage.includes('Invalid or expired token') ||
          errorMessage.includes('Invalid or expired') ||
          response.status === 401
        ) {
          await signOut();
          throw new Error('Session expired. Please login again.');
        }

        if (response.status === 429 || errorMessage.includes('limit reached')) {
          const err = new Error(errorMessage);
          err.status = response.status;
          throw err;
        }

        throw new Error(errorMessage);
      }

      if (response.status === 204) return null;
      return response.json();
    },
    [signOut]
  );

  return { apiRequest, API_URL };
}

export { API_URL };
