/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Node regression harness. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers.cjs');
const dates = load('src/lib/dates.ts');
const validation = load('src/lib/validation.ts', { './dates': dates });
test('calendar validation rejects overflow dates and respects timezone boundaries', () => {
  assert.equal(dates.isDateKey('2026-02-30'), false);
  assert.equal(dates.isDateKey('2028-02-29'), true);
  assert.equal(dates.studyDate('Asia/Kolkata', new Date('2026-11-20T19:00:00Z')), '2026-11-21');
  assert.equal(dates.shiftDate('2026-12-31', 1), '2027-01-01');
  assert.equal(dates.isTimezone('not-a-timezone'), false);
});
function profileForm() {
  const form = new FormData();
  for (const [key, value] of Object.entries({ fullName: 'Student', targetRole: 'SDE-1', educationLevel: 'BTech', targetDate: '2099-01-01', targetCompanies: 'Google', preparationLevel: 'beginner', dailyStudyHours: '3', availableDays: 'monday,tuesday', preparationSubjects: 'DBMS,Algorithms', strongSubjects: '', weakSubjects: 'DBMS', completedTopics: 'Arrays', studyPreference: 'structured', timezone: 'Asia/Kolkata' })) form.set(key, value);
  return form;
}
test('invalid preferences are returned as recoverable errors without writing', async () => {
  let writes = 0;
  const actions = load('src/app/(app)/onboarding/actions.ts', {
    'next/cache': { revalidatePath() {} }, '@/lib/storage/store': { saveProfile() { writes++; } },
    '@/lib/storage/learning': { learningContext: async () => ({ userId: 'owner', demo: true }) },
    '@/lib/validation': validation, '@/lib/dates': dates,
  });
  for (const [key, value] of [['dailyStudyHours', 'NaN'], ['availableDays', ''], ['targetDate', '2026-02-30'], ['timezone', 'invalid'], ['preparationSubjects', '']]) {
    const form = profileForm(); form.set(key, value); assert.ok((await actions.saveOnboardingAction(form)).error);
  }
  assert.equal(writes, 0);
});
test('preferences use the authenticated owner and retain explicitly empty strength lists', async () => {
  let saved;
  const actions = load('src/app/(app)/onboarding/actions.ts', {
    'next/cache': { revalidatePath() {} }, '@/lib/storage/store': { saveProfile(value) { saved = value; } },
    '@/lib/storage/learning': { learningContext: async () => ({ userId: 'owner', demo: true }) },
    '@/lib/validation': validation, '@/lib/dates': dates,
  });
  const form = profileForm(); form.set('id', 'another-user');
  assert.ok((await actions.saveOnboardingAction(form)).success);
  assert.equal(saved.id, 'owner'); assert.deepEqual(saved.strong_subjects, []);
  assert.equal(saved.onboarding_completed, true);
});

function request(path, cookie) {
  const url = new URL(path, 'http://localhost:3000'); url.clone = () => new URL(url);
  return { nextUrl: url, cookies: { get: () => cookie ? { value: cookie } : undefined, getAll: () => [], set() {} } };
}
test('onboarding gate redirects incomplete profiles without trapping the onboarding route', async () => {
  const previous = { url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY };
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'; process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'public-test-key';
  class Response {
    constructor(body, options) { this.body = body; this.status = options.status; }
    static next() { return { kind: 'next', cookies: { set() {} } }; }
    static redirect(url) { return { kind: 'redirect', path: url.pathname }; }
  }
  try {
    const middleware = load('src/lib/supabase/middleware.ts', {
      '@supabase/ssr': { createServerClient: () => ({ auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) }, from: () => ({ select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: { onboarding_completed: false }, error: null }) }) }) },
      'next/server': { NextResponse: Response },
    });
    assert.equal((await middleware.updateSession(request('/dashboard'))).path, '/onboarding');
    assert.equal((await middleware.updateSession(request('/onboarding'))).kind, 'next');
  } finally {
    for (const [key, value] of [['NEXT_PUBLIC_SUPABASE_URL', previous.url], ['NEXT_PUBLIC_SUPABASE_ANON_KEY', previous.key]]) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});
test('disabled demo mode rejects a forged demo cookie', async () => {
  const previous = { url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, demo: process.env.FORGE_DEMO_MODE };
  delete process.env.NEXT_PUBLIC_SUPABASE_URL; delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; process.env.FORGE_DEMO_MODE = 'false';
  try {
    const middleware = load('src/lib/supabase/middleware.ts', { '@supabase/ssr': {}, 'next/server': { NextResponse: { next: () => ({ kind: 'next' }), redirect: (url) => ({ path: url.pathname }) } } });
    assert.equal((await middleware.updateSession(request('/dashboard', JSON.stringify({ email: 'forged@example.com' })))).path, '/login');
    assert.equal((await middleware.updateSession(request('/login'))).kind, 'next');
  } finally {
    for (const [key, value] of [['NEXT_PUBLIC_SUPABASE_URL', previous.url], ['NEXT_PUBLIC_SUPABASE_ANON_KEY', previous.key], ['FORGE_DEMO_MODE', previous.demo]]) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});
