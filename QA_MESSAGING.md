# Testing messaging against QA

The QA API uses a separate Supabase project. Obtain its **project URL** and
**publishable/anon key** from the QA Supabase dashboard; never use a secret or
service-role key in a mobile app. Create an ignored `.env.qa.local` file:

```dotenv
QA_SUPABASE_URL=https://<qa-project-ref>.supabase.co
QA_SUPABASE_PUBLISH_KEY=<qa-publishable-or-anon-key>
```

Run `npm run start:qa` and open the session on Android. It selects
`https://api-qa.findindian.de`, disables automatic loading of the production
`.env`, and requires the QA Supabase configuration. Use QA test accounts and
test messages; QA data and logins are separate from production. QA OAuth and
redirects must be configured if using a social login.

