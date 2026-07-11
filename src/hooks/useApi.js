import { useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthProvider';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

export function useApi() {
  const { getSession, signOut } = useContext(AuthContext);

  const apiRequest = useCallback(
    async (endpoint, options = {}) => {
      const session = await getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        const errorMessage = errorData.error || 'Request failed';

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
    [getSession, signOut]
  );

  return { apiRequest, API_URL };
}

export { API_URL };
