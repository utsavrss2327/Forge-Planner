/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness compiles isolated TypeScript modules with dependency mocks. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers.cjs');
const youtube = load('src/lib/youtube.ts');
test('playlist parsing accepts YouTube and direct IDs, rejects unrelated hosts and malformed IDs', () => {
  assert.equal(youtube.extractPlaylistId('https://www.youtube.com/playlist?list=PLabcdefghijk'), 'PLabcdefghijk');
  assert.equal(youtube.extractPlaylistId('PLabcdefghijk'), 'PLabcdefghijk');
  for (const url of ['https://evil.test/?list=PLabcdefghijk', 'javascript:alert(1)', 'https://youtube.com/?list=bad!', 'garbage']) assert.equal(youtube.extractPlaylistId(url), null);
});
function fixture(overrides = {}) {
  const store = { learningTracks: [{ id: 'track', completed_items: 1, total_items: 1 }], youtubePlaylists: [{ id: 'playlist', learning_track_id: 'track', completed_videos: 1, total_videos: 1 }], playlistVideos: [{ id: 'video', playlist_id: 'playlist', status: 'completed', completed_at: '2026-11-20', topics_learned: [] }], journalEntries: [], activityLogs: [] };
  let saves = 0;
  const actions = load('src/app/(app)/learning/actions.ts', {
    'next/cache': { revalidatePath() {} },
    '@/lib/storage/store': { getStore: () => structuredClone(store), saveStore: (next) => { Object.assign(store, next); saves++; } },
    '@/lib/storage/learning': { learningContext: async () => ({ demo: true, userId: 'user' }), readLearning: async () => store },
    '@/lib/youtube': { ...youtube, ...overrides },
    '@/lib/storage/profile': { readProfile: async () => ({ timezone: 'Asia/Kolkata' }) },
  });
  return { actions, store, saves: () => saves };
}
test('reopening and recompleting a video recalculates counters without drift', async () => {
  const { actions, store } = fixture();
  await actions.updateVideoProgressAction({ videoId: 'video', status: 'in_progress' });
  assert.equal(store.youtubePlaylists[0].completed_videos, 0);
  assert.equal(store.learningTracks[0].completed_items, 0);
  assert.equal(store.playlistVideos[0].completed_at, null);
  await actions.updateVideoProgressAction({ videoId: 'video', status: 'completed' });
  await actions.updateVideoProgressAction({ videoId: 'video', status: 'completed' });
  assert.equal(store.youtubePlaylists[0].completed_videos, 1);
  assert.equal(store.learningTracks[0].completed_items, 1);
  assert.equal(store.activityLogs.length, 1);
});
test('invalid progress and difficulty do not mutate persistence', async () => {
  const { actions, saves } = fixture();
  assert.ok((await actions.updateVideoProgressAction({ videoId: 'video', status: 'fake' })).error);
  assert.ok((await actions.updateVideoProgressAction({ videoId: 'video', status: 'completed', difficultyRating: 6 })).error);
  assert.equal(saves(), 0);
});
test('failed YouTube import returns error and does not save invented metadata or partial tracks', async () => {
  const { actions, store, saves } = fixture({ fetchPlaylistInfo: async () => { throw new Error('API unavailable'); } });
  const form = new FormData(); form.set('title', 'Track'); form.set('playlistUrl', 'https://youtube.com/playlist?list=PLabcdefghijk');
  assert.equal((await actions.createLearningTrackAction(form)).error, 'API unavailable');
  assert.equal(saves(), 0); assert.equal(store.learningTracks.length, 1);
});
test('empty journal and invalid track are rejected', async () => {
  const { actions, saves } = fixture();
  assert.ok((await actions.saveJournalEntryAction(new FormData())).error);
  const form = new FormData(); form.set('summary', 'Learned recursion'); form.set('trackId', 'other-user-track');
  assert.ok((await actions.saveJournalEntryAction(form)).error); assert.equal(saves(), 0);
});
test('notes and concepts persist with explicit video status', async () => {
  const { actions, store } = fixture();
  await actions.updateVideoProgressAction({ videoId: 'video', status: 'in_progress', notes: 'Explain the invariant', topicsLearned: ['Binary search'] });
  assert.equal(store.playlistVideos[0].notes, 'Explain the invariant');
  assert.deepEqual(store.playlistVideos[0].topics_learned, ['Binary search']);
});

test('real learning requests reject missing authentication before accessing local data', async () => {
  let localReads = 0;
  const service = load('src/lib/storage/learning.ts', {
    'server-only': {},
    'next/navigation': { redirect: () => { throw new Error('login-required'); } },
    '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }) },
    '@/lib/supabase/middleware': { isSupabaseConfigured: () => true },
    './store': { getStore: () => { localReads++; return {}; } },
  });
  await assert.rejects(service.readLearning(), /login-required/);
  assert.equal(localReads, 0);
});

test('authenticated database reads scope parent records to the user and never read JSON storage', async () => {
  const calls = [];
  const service = load('src/lib/storage/learning.ts', {
    'server-only': {},
    'next/navigation': { redirect: () => { throw new Error('unexpected redirect'); } },
    '@/lib/supabase/server': { createClient: async () => ({
      auth: { getUser: async () => ({ data: { user: { id: 'real-user' } } }) },
      from(table) {
        const query = { select() { return this; }, eq(key, value) { calls.push([table, key, value]); return this; }, order() { return this; }, then(resolve) { resolve({ data: [], error: null }); } };
        return query;
      },
    }) },
    '@/lib/supabase/middleware': { isSupabaseConfigured: () => true },
    './store': { getStore: () => { throw new Error('Production accessed demo data'); } },
  });
  const result = await service.readLearning();
  assert.deepEqual(result.tracks, []);
  for (const table of ['learning_tracks', 'youtube_playlists', 'journal_entries']) assert.ok(calls.some(([t, k, v]) => t === table && k === 'user_id' && v === 'real-user'));
});

test('stale video edits are rejected without overwriting saved notes', async () => {
  const { actions, saves } = fixture();
  const result = await actions.updateVideoProgressAction({ videoId: 'video', status: 'in_progress', notes: 'stale', expectedUpdatedAt: 'old-version' });
  assert.ok(result.error); assert.equal(saves(), 0);
});
test('track edits cannot modify another owner and reject stale versions', async () => {
  const { actions, store, saves } = fixture();
  Object.assign(store.learningTracks[0], { user_id: 'user', updated_at: 'current', title: 'Original' });
  const form = new FormData();
  for (const [k, v] of Object.entries({ trackId: 'track', title: 'Changed', expectedUpdatedAt: 'old', status: 'archived', priority: 'high' })) form.set(k, v);
  assert.ok((await actions.updateLearningTrackAction(form)).error); assert.equal(saves(), 0);
  form.set('expectedUpdatedAt', 'current');
  assert.ok((await actions.updateLearningTrackAction(form)).success); assert.equal(store.learningTracks[0].status, 'archived');
  form.set('expectedUpdatedAt', store.learningTracks[0].updated_at); store.learningTracks[0].user_id = 'someone-else';
  assert.ok((await actions.updateLearningTrackAction(form)).error); assert.equal(saves(), 1);
});
test('existing-track playlist imports are real, reversible and reject duplicate imports', async () => {
  const { actions, store } = fixture({
    fetchPlaylistInfo: async () => ({ title: 'Real metadata', description: '', thumbnailUrl: '' }),
    fetchPlaylistVideos: async () => [{ videoId: 'youtube-id', title: 'Real video', durationSeconds: null, position: 0 }],
  });
  store.learningTracks[0].user_id = 'user';
  const form = new FormData(); form.set('trackId', 'track'); form.set('playlistUrl', 'PLabcdefghijk');
  assert.ok((await actions.importPlaylistAction(form)).success);
  assert.equal(store.playlistVideos[1].title, 'Real video'); assert.equal(store.playlistVideos[1].duration_seconds, null);
  assert.ok((await actions.importPlaylistAction(form)).error); assert.equal(store.playlistVideos.length, 2);
});
test('journal editing and deletion require ownership and the current version', async () => {
  const { actions, store } = fixture();
  store.journalEntries.push({ id: 'journal', user_id: 'user', updated_at: 'current', summary: 'Original' });
  const form = new FormData(); form.set('journalId', 'journal'); form.set('expectedUpdatedAt', 'current'); form.set('summary', 'Explained binary search');
  assert.ok((await actions.updateJournalEntryAction(form)).success);
  assert.equal(store.journalEntries[0].summary, 'Explained binary search');
  assert.ok((await actions.deleteJournalEntryAction('journal', 'current')).error);
  assert.ok((await actions.deleteJournalEntryAction('journal', store.journalEntries[0].updated_at)).success);
  assert.equal(store.journalEntries.length, 0);
});
