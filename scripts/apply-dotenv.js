const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const root = process.cwd();
const envPath = path.join(root, '.env');

if (!fs.existsSync(envPath)) {
  console.warn('.env not found, skipping apply-dotenv');
  process.exit(0);
}

const env = dotenv.parse(fs.readFileSync(envPath));

if (env.SUPABASE_URL) process.env.EXPO_PUBLIC_SUPABASE_URL = env.SUPABASE_URL;
if (env.SUPABASE_PUBLISH_KEY) process.env.EXPO_PUBLIC_SUPABASE_PUBLISH_KEY = env.SUPABASE_PUBLISH_KEY;
if (env.EXPO_PUBLIC_API_URL) process.env.EXPO_PUBLIC_API_URL = env.EXPO_PUBLIC_API_URL;
if (env.API_URL) process.env.EXPO_PUBLIC_API_URL = env.API_URL;

console.log('Loaded .env into Expo public env');
