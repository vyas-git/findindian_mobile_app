import React, { createContext, useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import Constants from 'expo-constants';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { apiRequestWithSession } from '../lib/api';
import { getValidSession, refreshSessionIfNeeded } from '../lib/session';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

function getOAuthRedirectUri() {
  // Must match at runtime — Expo Go uses exp://<laptop-ip>:8081/--/auth/callback
  if (Constants.appOwnership === 'expo') {
    return makeRedirectUri({ path: 'auth/callback' });
  }
  return makeRedirectUri({
    scheme: 'findindianmobile',
    path: 'auth/callback',
  });
}

export const AuthContext = createContext({
  user: null,
  userProfile: null,
  loading: true,
  getSession: async () => null,
  refreshProfile: async () => {},
  signIn: async () => {},
  signOut: async () => {},
});

async function createSessionFromUrl(url) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);

  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return data.session;
  }

  const parsedUrl = new URL(url);
  const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ''));
  const access_token = hashParams.get('access_token') || params.access_token;
  const refresh_token = hashParams.get('refresh_token') || params.refresh_token;

  if (!access_token) return null;

  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) throw error;
  return data.session;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const getSession = useCallback(async () => {
    return getValidSession();
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      await apiRequestWithSession('/api/auth/me');
      const profile = await apiRequestWithSession('/api/users/me');
      setUserProfile(profile);
      return profile;
    } catch (e) {
      console.warn('refreshProfile error', e);
      return null;
    }
  }, []);

  const syncUserAfterAuth = useCallback(async () => {
    try {
      await apiRequestWithSession('/api/auth/me');
      const profile = await apiRequestWithSession('/api/users/me');
      setUserProfile(profile);
    } catch (e) {
      console.warn('syncUserAfterAuth error', e);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    WebBrowser.warmUpAsync();
    supabase.auth.startAutoRefresh();

    (async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const session = await createSessionFromUrl(initialUrl);
          if (mounted && session?.user) {
            setUser(session.user);
            // Don't block the loading gate on profile sync.
            syncUserAfterAuth();
          }
        }

        const session = await getValidSession();
        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            syncUserAfterAuth();
          }
        }
      } catch (e) {
        console.warn('supabase getSession error', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const appStateSub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        supabase.auth.startAutoRefresh();
        try {
          const session = await refreshSessionIfNeeded();
          if (session?.user) {
            setUser(session.user);
            syncUserAfterAuth();
            return;
          }
          // Only sign the user out when there is truly no stored session.
          const { data } = await supabase.auth.getSession();
          if (!data?.session) {
            setUser(null);
            setUserProfile(null);
          }
        } catch (e) {
          console.warn('session refresh on resume error', e);
        }
        return;
      }
      if (nextState === 'background' || nextState === 'inactive') {
        supabase.auth.stopAutoRefresh();
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        syncUserAfterAuth();
      } else {
        setUserProfile(null);
      }
    });

    const subscription = Linking.addEventListener('url', async ({ url }) => {
      try {
        const session = await createSessionFromUrl(url);
        if (session?.user) {
          setUser(session.user);
          syncUserAfterAuth();
        }
      } catch (e) {
        console.warn('Auth callback error', e);
      }
    });

    return () => {
      mounted = false;
      appStateSub?.remove?.();
      listener?.subscription?.unsubscribe?.();
      subscription?.remove?.();
      supabase.auth.stopAutoRefresh();
      WebBrowser.coolDownAsync();
    };
  }, [syncUserAfterAuth]);

  const signIn = async ({ email, password }) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signInWithProvider = async (provider, queryParams = {}) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured yet. Add real values to .env or app.json extras.') };
    }

    const redirectTo = getOAuthRedirectUri();
    console.log('OAuth redirect URI:', redirectTo);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams,
        },
      });

      if (error) {
        console.error('Supabase OAuth error', error);
        return { error };
      }

      if (!data?.url) {
        return { error: new Error('No OAuth URL returned from Supabase') };
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
        showInRecents: true,
      });

      if (result.type === 'success' && result.url) {
        const session = await createSessionFromUrl(result.url);
        if (session?.user) {
          setUser(session.user);
          await syncUserAfterAuth();
        }
        return { data: result };
      }

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return { error: new Error('Login cancelled') };
      }

      const hint =
        `Add this exact URL in Supabase → Auth → Redirect URLs:\n${redirectTo}\n\n` +
        'Use your laptop IP from Metro (exp://192.168.x.x:8081), not your phone IP.';
      return { error: new Error(`OAuth did not return to the app.\n\n${hint}`) };
    } catch (e) {
      console.error('OAuth sign-in failed', e);
      return { error: e };
    }
  };

  const signInWithGoogle = () =>
    signInWithProvider('google', { access_type: 'offline', prompt: 'consent' });

  const signInWithLinkedIn = () => signInWithProvider('linkedin_oidc');

  const signOut = useCallback(async () => {
    setUserProfile(null);
    return supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        getSession,
        refreshProfile,
        signIn,
        signOut,
        signInWithGoogle,
        signInWithLinkedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
