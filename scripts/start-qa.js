// Start a local Expo session against QA without changing the normal dev or
// release configuration. QA auth and the QA API must use the same project.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const dotenv = require('dotenv');

const root = path.resolve(__dirname, '..');
const QA_API_URL = 'https://api-qa.findindian.de';

function makeQAEnvironment(source, productionSupabaseUrl) {
  const qaUrl = (source.QA_SUPABASE_URL || '').trim();
  const qaKey = (source.QA_SUPABASE_PUBLISH_KEY || '').trim();
  if (!qaUrl || !qaKey || /your[_-]|<|>/i.test(qaUrl + qaKey)) {
    throw new Error('Set QA_SUPABASE_URL and QA_SUPABASE_PUBLISH_KEY in .env.qa.local or your environment.');
  }
  let parsed;
  try { parsed = new URL(qaUrl); } catch { throw new Error('QA_SUPABASE_URL must be a valid HTTPS URL.'); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('QA_SUPABASE_URL must be an HTTPS project URL without credentials, query or fragment.');
  }
  if (parsed.origin === new URL(productionSupabaseUrl).origin) {
    throw new Error('QA_SUPABASE_URL points to the production Supabase project.');
  }
  let legacyRole;
  try {
    legacyRole = JSON.parse(Buffer.from(qaKey.split('.')[1] || '', 'base64url').toString()).role;
  } catch {
    // Publishable keys are not JWTs; Supabase validates the key at runtime.
  }
  if (qaKey.startsWith('sb_secret_') || legacyRole === 'service_role') {
    throw new Error('Use the QA publishable/anon key, never a Supabase secret key.');
  }
  return {
    ...process.env,
    EXPO_NO_DOTENV: '1',
    EXPO_PUBLIC_API_URL: QA_API_URL,
    EXPO_PUBLIC_SUPABASE_URL: qaUrl,
    EXPO_PUBLIC_SUPABASE_PUBLISH_KEY: qaKey,
  };
}

function main() {
  const file = path.join(root, '.env.qa.local');
  const local = fs.existsSync(file) ? dotenv.parse(fs.readFileSync(file)) : {};
  const productionSupabaseUrl = require('../app.json').expo.extra.SUPABASE_URL;
  let env;
  try {
    env = makeQAEnvironment({ ...local, ...process.env }, productionSupabaseUrl);
  } catch (error) {
    console.error(`QA start aborted: ${error.message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Starting Expo against QA API ${QA_API_URL} with the QA Supabase project.`);
  const expo = path.join(root, 'node_modules', '.bin', 'expo');
  const result = spawnSync(expo, ['start', '--lan', '--clear'], { cwd: root, env, stdio: 'inherit' });
  if (result.error) {
    console.error(`Could not start Expo: ${result.error.message}`);
    process.exitCode = 1;
  } else {
    process.exitCode = result.status ?? 1;
  }
}

if (require.main === module) main();
module.exports = { makeQAEnvironment, QA_API_URL };
