import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { getAppConfig, isSupabaseConfigured as checkSupabaseConfigured } from './appConfig';

const { supabaseUrl, supabasePublishKey } = getAppConfig();

export const isSupabaseConfigured = checkSupabaseConfigured({ supabaseUrl, supabasePublishKey });

if (!isSupabaseConfigured) {
  console.error(
    'Supabase not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISH_KEY in .env, app.json extra, or eas.json build env.'
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

export default supabase;
