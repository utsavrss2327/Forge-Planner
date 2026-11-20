/* eslint-disable @typescript-eslint/no-require-imports -- Isolated authentication regressions. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers.cjs');
const oauth = load('src/lib/auth/oauth.ts');
function withEnv(values, run) {
  const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  for (const [key, value] of Object.entries(values)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  return Promise.resolve().then(run).finally(() => { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
}
function actions(configured, auth, providerEnabled = true) {
  return load('src/app/(auth)/actions.ts', {
    '@/lib/auth/google-provider': { isGoogleProviderEnabled: async () => providerEnabled },
    'next/navigation': { redirect() { throw new Error('Unexpected redirect'); } }, 'next/headers': {},
    '@/lib/supabase/middleware': { isSupabaseConfigured: () => configured }, '@/lib/supabase/server': { createClient: async () => ({ auth }) },
  });
}
test('Google login requires real configuration and cannot silently use a demo identity', async () => {
  let calls = 0;
  const result = await actions(false, { signInWithOAuth: async () => { calls++; } }).googleSignInAction();
  assert.match(result.error, /requires Supabase configuration/); assert.equal(calls, 0);
});
test('OAuth request uses Google and a fixed application callback', async () => {
  await withEnv({ NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co' }, async () => {
    let input;
    const result = await actions(true, { signInWithOAuth: async (value) => { input = value; return { data: { url: 'https://project.supabase.co/auth/v1/authorize?provider=google&code_challenge=test' }, error: null }; } }).googleSignInAction();
    assert.equal(input.provider, 'google'); assert.equal(input.options.skipBrowserRedirect, true);
    assert.equal(input.options.redirectTo, 'http://localhost:3000/auth/callback?next=%2Fdashboard');
    assert.deepEqual(input.options.queryParams, { prompt: 'select_account' }); assert.match(result.url, /^https:\/\/project\.supabase\.co/);
  });
});
test('OAuth rejects invalid site URLs, unsupported destinations, provider errors and untrusted authorization URLs', async () => {
  await withEnv({ NEXT_PUBLIC_SITE_URL: 'https://forge.example', NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co' }, async () => {
    const invalid = actions(true, { signInWithOAuth: async () => ({ data: { url: 'https://evil.example/auth/v1/authorize?provider=google' }, error: null }) });
    assert.ok((await invalid.googleSignInAction()).error); assert.ok((await invalid.googleSignInAction('//evil.example')).error);
    assert.ok((await actions(true, { signInWithOAuth: async () => ({ data: {}, error: { message: 'provider disabled' } }) }).googleSignInAction()).error);
    process.env.NEXT_PUBLIC_SITE_URL = 'javascript:alert(1)'; assert.ok((await invalid.googleSignInAction()).error);
  });
});
function callback(configured, exchange) {
  return load('src/app/auth/callback/route.ts', {
    'next/server': { NextResponse: { redirect: (url, init) => ({ url: url.toString(), headers: init.headers }) } },
    '@/lib/supabase/middleware': { isSupabaseConfigured: () => configured }, '@/lib/supabase/server': { createClient: async () => ({ auth: { exchangeCodeForSession: exchange } }) },
  }).GET;
}
test('callback exchanges the right flow and allowlists redirects without leaking the code', async () => {
  let args;
  const handler = callback(true, async (...values) => { args = values; return { error: null }; });
  let result = await handler(new Request('http://localhost:3000/auth/callback?code=secret-code&sb_flow_id=flow-1&next=https://evil.example'));
  assert.deepEqual(args, ['secret-code', { flowId: 'flow-1' }]); assert.equal(result.url, 'http://localhost:3000/dashboard');
  assert.match(result.headers['Cache-Control'], /no-store/); assert.equal(result.headers['Referrer-Policy'], 'no-referrer');
  result = await handler(new Request('http://localhost:3000/auth/callback?code=test&next=/reset-password')); assert.equal(result.url, 'http://localhost:3000/reset-password');
  result = await handler(new Request('http://localhost:3000/auth/callback?code=test&next=/settings')); assert.equal(result.url, 'http://localhost:3000/settings');
});
test('callback maps cancellation, missing configuration and exchange failure into safe messages', async () => {
  const handler = callback(true, async () => { throw new Error('provider secret must never be echoed'); });
  assert.match((await handler(new Request('http://localhost:3000/auth/callback?error=access_denied&error_description=unsafe'))).url, /error=oauth_cancelled$/);
  assert.match((await handler(new Request('http://localhost:3000/auth/callback?code=test'))).url, /error=auth_callback_error$/);
  assert.match((await handler(new Request('http://localhost:3000/auth/callback'))).url, /error=auth_callback_error$/);
  assert.match((await callback(false)(new Request('http://localhost:3000/auth/callback?code=test'))).url, /error=oauth_setup$/);
});
test('Google-only deletion requires recent verified OAuth claims for this user, not token refresh', () => {
  assert.equal(oauth.isGoogleOnlyAccount({ identities: [{ provider: 'google' }] }), true);
  assert.equal(oauth.isGoogleOnlyAccount({ identities: [{ provider: 'google' }, { provider: 'email' }] }), false);
  assert.equal(oauth.hasRecentGoogleAuthentication({ sub: 'owner', amr: [{ method: 'oauth', timestamp: 900 }] }, 'owner', 1000), true);
  for (const claims of [{ sub: 'other', amr: [{ method: 'oauth', timestamp: 900 }] }, { sub: 'owner', amr: [{ method: 'oauth', timestamp: 600 }] }, { sub: 'owner', amr: [{ method: 'token_refresh', timestamp: 999 }] }, { sub: 'owner', amr: ['oauth'] }]) assert.equal(oauth.hasRecentGoogleAuthentication(claims, 'owner', 1000), false);
});


test('a configured project with Google disabled stays in the app instead of redirecting to an API error', async () => {
  await withEnv({ NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co' }, async () => {
    let redirects = 0;
    const result = await actions(true, { signInWithOAuth: async () => { redirects++; } }, false).googleSignInAction();
    assert.match(result.error, /not enabled/); assert.equal(redirects, 0);
  });
});

test('Google provider discovery uses the public settings endpoint and rejects unavailable responses', async () => {
  await withEnv({ NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-key' }, async () => {
    const provider = load('src/lib/auth/google-provider.ts', { 'server-only': {} });
    const enabled = await provider.isGoogleProviderEnabled(async (url, options) => {
      assert.equal(url.toString(), 'https://project.supabase.co/auth/v1/settings');
      assert.equal(options.headers.apikey, 'public-key'); assert.equal(options.cache, 'no-store');
      return Response.json({ external: { google: true } });
    });
    assert.equal(enabled, true);
    assert.equal(await provider.isGoogleProviderEnabled(async () => Response.json({ external: { google: false } })), false);
    await assert.rejects(provider.isGoogleProviderEnabled(async () => new Response('{}', { status: 503 })));
  });
});
