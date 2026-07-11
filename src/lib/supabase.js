import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_PUBLISH_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISH_KEY || process.env.SUPABASE_PUBLISH_KEY || process.env.SUPABASE_ANON_KEY || 'your-publish-key';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_PUBLISH_KEY && !SUPABASE_URL.includes('your-project') && !SUPABASE_PUBLISH_KEY.includes('your-')
);

if (!isSupabaseConfigured) {
  console.error('Supabase placeholder detected. Set SUPABASE_URL and SUPABASE_PUBLISH_KEY in .env or app.json extras.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISH_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

export default supabase;
