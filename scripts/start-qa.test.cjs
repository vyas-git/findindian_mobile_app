const { test } = require('node:test');
const assert = require('node:assert/strict');
const { makeQAEnvironment, QA_API_URL } = require('./start-qa');

const prodUrl = 'https://production.supabase.co';
const valid = { QA_SUPABASE_URL: 'https://qa.supabase.co', QA_SUPABASE_PUBLISH_KEY: 'sb_publishable_test' };

test('sets QA API and auth and disables automatic production dotenv loading', () => {
  const env = makeQAEnvironment(valid, prodUrl);
  assert.equal(env.EXPO_PUBLIC_API_URL, QA_API_URL);
  assert.equal(env.EXPO_PUBLIC_SUPABASE_URL, valid.QA_SUPABASE_URL);
  assert.equal(env.EXPO_PUBLIC_SUPABASE_PUBLISH_KEY, valid.QA_SUPABASE_PUBLISH_KEY);
  assert.equal(env.EXPO_NO_DOTENV, '1');
});

test('refuses missing, placeholder, production and secret-key configuration', () => {
  assert.throws(() => makeQAEnvironment({}, prodUrl));
  assert.throws(() => makeQAEnvironment({ ...valid, QA_SUPABASE_URL: 'https://YOUR_QA_REF.supabase.co' }, prodUrl));
  assert.throws(() => makeQAEnvironment({ ...valid, QA_SUPABASE_URL: prodUrl }, prodUrl));
  assert.throws(() => makeQAEnvironment({ ...valid, QA_SUPABASE_PUBLISH_KEY: 'sb_secret_test' }, prodUrl));
  const serviceRole = `header.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.signature`;
  assert.throws(() => makeQAEnvironment({ ...valid, QA_SUPABASE_PUBLISH_KEY: serviceRole }, prodUrl));
});
