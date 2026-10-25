import { useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthProvider';
import { getValidSession } from '../lib/session';
import { supabase } from '../lib/supabase';
import { getAppConfig } from '../lib/appConfig';
import { getPlatformHeaders } from '../lib/platformHeaders';
import { isChannelDiagnosticRequest, summarizeChannelResponse } from '../utils/channelDiagnostics';

const { apiUrl: API_URL } = getAppConfig();

export function useApi() {
  const { signOut } = useContext(AuthContext);

  const apiRequest = useCallback(
    async (endpoint, options = {}) => {
      const debugChannel = typeof __DEV__ !== 'undefined' && __DEV__ &&
        isChannelDiagnosticRequest(endpoint, options.method || 'GET');
      if (debugChannel) console.log('[channel-api] request', { url: `${API_URL}${endpoint}`, method: 'GET' });
      let session = await getValidSession();
      if (!session) {
        if (debugChannel) console.log('[channel-api] no authenticated session');
        throw new Error('Not authenticated');
      }

      const doFetch = async (activeSession) => {
        let response;
        try {
          response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${activeSession.access_token}`,
              ...options.headers,
              ...getPlatformHeaders(),
            },
          });
        } catch (error) {
          if (debugChannel) console.log('[channel-api] network error', { name: error?.name || 'Error' });
          throw error;
        }
        if (debugChannel) console.log('[channel-api] HTTP status', response.status);
        return response;
      };

      let response = await doFetch(session);

      if (response.status === 401) {
        if (debugChannel) console.log('[channel-api] refreshing session after HTTP 401');
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && refreshed?.session) {
          session = refreshed.session;
          response = await doFetch(session);
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (debugChannel) console.log('[channel-api] error response summary', summarizeChannelResponse(errorData));
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
      const data = await response.json();
      if (debugChannel) console.log('[channel-api] response summary', summarizeChannelResponse(data));
      return data;
    },
    [signOut]
  );

  return { apiRequest, API_URL };
}

export { API_URL };
