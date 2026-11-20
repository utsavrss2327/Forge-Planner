/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Node tests. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers.cjs');
test('preparation reset requires exact typed confirmation before deleting', async () => {
  let deletions = 0;
  const actions = load('src/app/(app)/settings/actions.ts', {
    'next/cache': { revalidatePath() {} },
    '@/lib/storage/learning': { learningContext: async () => ({ demo: true, userId: 'owner' }) },
    '@/lib/storage/account': { clearDemoData: (id) => { assert.equal(id, 'owner'); deletions++; } },
  });
  assert.ok((await actions.clearPreparationDataAction(new FormData())).error); assert.equal(deletions, 0);
  const form = new FormData(); form.set('confirmation', 'DELETE MY PREPARATION DATA');
  assert.ok((await actions.clearPreparationDataAction(form)).success); assert.equal(deletions, 1);
});
test('account deletion verifies the authenticated user password and stops on failure', async () => {
  let called = 0;
  const actions = load('src/app/(app)/settings/actions.ts', {
    'next/cache': { revalidatePath() {} }, '@/lib/storage/account': {},
    '@/lib/storage/learning': { learningContext: async () => ({ demo: false, db: {
      auth: { getUser: async () => ({ data: { user: { email: 'owner@example.com' } } }), signInWithPassword: async (credentials) => { assert.equal(credentials.email, 'owner@example.com'); return { error: new Error('wrong password') }; } },
      rpc: async () => { called++; },
    } }) },
  });
  const form = new FormData(); form.set('confirmation', 'DELETE MY ACCOUNT'); form.set('password', 'wrong'); form.set('email', 'someoneelse@example.com');
  assert.ok((await actions.deleteAccountAction(form)).error); assert.equal(called, 0);
});
test('private exports exclude credentials and return unauthorized for missing sessions', async () => {
  let user = null;
  const handler = load('src/app/api/account/export/route.ts', {
    '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user }, error: null }) } }) },
    '@/lib/supabase/middleware': { isSupabaseConfigured: () => false },
    '@/lib/storage/account': { exportDemoData: () => ({ learningTracks: [] }) },
  });
  assert.equal((await handler.GET()).status, 401);
  user = { id: 'owner' }; const response = await handler.GET(); const body = await response.json();
  assert.match(response.headers.get('cache-control'), /no-store/); assert.match(response.headers.get('content-disposition'), /attachment/);
  assert.equal(body.demo, true); assert.equal(body.format, 'forge-export-v1'); assert.deepEqual(body.data, { learningTracks: [] });
});

test('Google-only deletion requires recent verified OAuth for the authenticated user', async () => {
  let stamp = Math.floor(Date.now() / 1000) - 600, claimedUser = 'owner', deletions = 0;
  const actions = load('src/app/(app)/settings/actions.ts', {
    'next/cache': { revalidatePath() {} }, '@/lib/storage/account': {},
    '@/lib/storage/learning': { learningContext: async () => ({ demo: false, db: {
      auth: {
        getUser: async () => ({ data: { user: { id: 'owner', email: 'owner@example.com', identities: [{ provider: 'google' }] } } }),
        getClaims: async () => ({ data: { claims: { sub: claimedUser, amr: [{ method: 'oauth', timestamp: stamp }] } }, error: null }),
        signInWithPassword: async () => { throw new Error('Google-only accounts must not require a password'); },
        signOut: async () => ({ error: null }),
      },
      rpc: async (name) => { assert.equal(name, 'delete_forge_account'); deletions++; return { error: null }; },
    } }) },
  });
  const form = new FormData(); form.set('confirmation', 'DELETE MY ACCOUNT');
  assert.ok((await actions.deleteAccountAction(form)).error); assert.equal(deletions, 0);
  stamp = Math.floor(Date.now() / 1000); claimedUser = 'another-user';
  assert.ok((await actions.deleteAccountAction(form)).error); assert.equal(deletions, 0);
  claimedUser = 'owner'; assert.ok((await actions.deleteAccountAction(form)).success); assert.equal(deletions, 1);
});
