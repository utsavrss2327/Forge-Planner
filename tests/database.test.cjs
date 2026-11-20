/* eslint-disable @typescript-eslint/no-require-imports -- Real local PostgreSQL-engine integration tests. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
const A = '10000000-0000-0000-0000-000000000001', B = '20000000-0000-0000-0000-000000000002';
const TRACK = '30000000-0000-0000-0000-000000000003', PLAYLIST = '40000000-0000-0000-0000-000000000004', VIDEO = '50000000-0000-0000-0000-000000000005';

test('foundation migrations, row isolation and transactional workflows in PostgreSQL', { timeout: 60000 }, async (t) => {
  const db = new PGlite();
  async function owner(id) { await db.exec('RESET ROLE'); await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id ?? '']); await db.exec('SET ROLE authenticated'); }
  async function query(sql, params = []) { return (await db.query(sql, params)).rows; }
  try {
    await db.exec(`CREATE ROLE authenticated NOLOGIN; CREATE ROLE anon NOLOGIN; CREATE SCHEMA auth;
      CREATE TABLE auth.users(id uuid PRIMARY KEY, raw_user_meta_data jsonb DEFAULT '{}', email text);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
      GRANT USAGE ON SCHEMA public, auth TO authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;`);
    for (const file of fs.readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort()) await db.exec(fs.readFileSync(`supabase/migrations/${file}`, 'utf8'));
    await db.exec('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated');
    await db.query('INSERT INTO auth.users(id) VALUES ($1), ($2)', [A, B]);
    await owner(A);
    await db.exec("UPDATE profiles SET daily_study_hours = 1, available_days = ARRAY['monday'], onboarding_completed = true");
    const now = new Date().toISOString();
    const track = { id: TRACK, user_id: A, title: 'Owned track', description: null, subject: 'DBMS', target_outcome: null, start_date: '2026-11-23', deadline: null, priority: 'high', daily_goal: null, weekly_goal: null, resource_links: [], status: 'active', notes: null, total_items: 1, completed_items: 0, created_at: now, updated_at: now };
    const playlist = { id: PLAYLIST, user_id: A, learning_track_id: TRACK, playlist_id: 'PLabcdefghijk', title: 'Real imported metadata fixture', description: null, thumbnail_url: null, total_videos: 1, completed_videos: 0, created_at: now, updated_at: now };
    const video = { id: VIDEO, playlist_id: PLAYLIST, video_id: 'abc12345678', title: 'Concept', thumbnail_url: null, duration_seconds: null, order_index: 0, status: 'not_started', difficulty_rating: null, topics_learned: [], notes: null, last_studied_at: null, completed_at: null, created_at: now, updated_at: now };
    await t.test('atomic learning creation rolls back a malformed child and accepts valid records', async () => {
      await assert.rejects(db.query('select create_learning_track($1,$2,$3)', [track, playlist, [{ ...video, playlist_id: B }]]));
      assert.equal((await query('select count(*)::int n from learning_tracks'))[0].n, 0);
      await db.query('select create_learning_track($1,$2,$3)', [track, playlist, [video]]);
      assert.equal((await query('select count(*)::int n from playlist_videos'))[0].n, 1);
    });
    await t.test('RLS hides nested videos and rejects cross-user writes and imports', async () => {
      await owner(B);
      assert.equal((await query('select count(*)::int n from playlist_videos'))[0].n, 0);
      await assert.rejects(db.query('insert into journal_entries(user_id,learning_track_id,date,summary) values ($1,$2,current_date,$3)', [B, TRACK, 'foreign link']));
      await assert.rejects(db.query('select import_learning_playlist($1,$2)', [{ ...playlist, id: B, user_id: B }, []]));
      assert.equal((await query('select save_video_progress($1,$2) saved', [VIDEO, { status: 'completed' }]))[0].saved, false);
      await owner(A);
    });
    await t.test('video counters are idempotent, reversible, clear ratings and reject stale notes', async () => {
      const versioned = (await query('select save_video_progress_with_version($1,$2) result', [VIDEO, { status: 'completed', difficultyRating: 4, notes: 'Saved' }]))[0].result;
      assert.equal(versioned.saved, true); assert.ok(versioned.updated_at);
      await db.query('select save_video_progress($1,$2)', [VIDEO, { status: 'completed' }]);
      assert.equal((await query('select completed_items from learning_tracks'))[0].completed_items, 1);
      await assert.rejects(db.query('select save_video_progress($1,$2)', [VIDEO, { status: 'in_progress', expectedUpdatedAt: '2000-01-01T00:00:00Z', notes: 'stale' }]));
      assert.equal((await query('select notes from playlist_videos'))[0].notes, 'Saved');
      await db.query('select save_video_progress($1,$2)', [VIDEO, { status: 'in_progress', difficultyRating: null }]);
      const record = (await query('select completed_at,difficulty_rating from playlist_videos'))[0];
      assert.equal(record.completed_at, null); assert.equal(record.difficulty_rating, null);
      assert.equal((await query('select completed_items from learning_tracks'))[0].completed_items, 0);
      await assert.rejects(db.query('select import_learning_playlist($1,$2)', [playlist, []]));
    });
    let taskId;
    const taskData = { title: 'Practice transactions', description: '', subject: 'DBMS', scheduled_date: '2026-11-23', estimated_minutes: 45, priority: 'high', source_url: null, learning_track_id: TRACK };
    await t.test('planner enforces capacity and rest days and permits explicit overrides', async () => {
      taskId = (await query('select save_daily_task(null,null,$1,false) id', [taskData]))[0].id;
      await assert.rejects(db.query('select save_daily_task(null,null,$1,false)', [{ ...taskData, estimated_minutes: 30 }]));
      await assert.rejects(db.query('select move_study_task($1,$2,false)', [taskId, '2026-11-24']));
      await db.query('select move_study_task($1,$2,true)', [taskId, '2026-11-24']);
      assert.equal(String((await query('select scheduled_date::text as scheduled from daily_tasks where id=$1', [taskId]))[0].scheduled), '2026-11-24');
    });
    await t.test('timers survive repeated starts and calculate elapsed time on the database clock', async () => {
      await db.query('select transition_study_task($1,$2)', [taskId, 'in_progress']);
      await db.query('select transition_study_task($1,$2)', [taskId, 'in_progress']);
      assert.equal((await query('select count(*)::int n from study_sessions where ended_at is null'))[0].n, 1);
      const otherId = (await query('select save_daily_task(null,null,$1,true) id', [{ ...taskData, title: 'Other task', estimated_minutes: 1 }]))[0].id;
      await assert.rejects(db.query('select transition_study_task($1,$2)', [otherId, 'in_progress']));
      const activeVersion = (await query('select updated_at::text version from daily_tasks where id=$1', [taskId]))[0].version;
      await assert.rejects(db.query('select delete_study_task($1,$2)', [taskId, activeVersion]));
      // Move the persisted clock backwards to verify elapsed calculation without sleeping.
      await db.exec("update study_sessions set started_at = clock_timestamp() - interval '125 seconds' where ended_at is null");
      await db.query('select transition_study_task($1,$2)', [taskId, 'pending']);
      assert.ok((await query('select duration_seconds from study_sessions'))[0].duration_seconds >= 125);
      assert.equal((await query('select actual_minutes from daily_tasks where id=$1', [taskId]))[0].actual_minutes, 2);
      await db.query('select transition_study_task($1,$2)', [taskId, 'completed']);
      await db.query('select transition_study_task($1,$2)', [taskId, 'completed']);
      assert.equal((await query('select count(*)::int n from study_sessions'))[0].n, 1);
    });
    await t.test('another owner cannot transition, edit or delete tasks', async () => {
      await owner(B);
      await assert.rejects(db.query('select transition_study_task($1,$2)', [taskId, 'pending']));
      await assert.rejects(db.query('select save_daily_task($1,now(),$2,true)', [taskId, taskData]));
      await assert.rejects(db.query('select delete_study_task($1,now())', [taskId]));
      const exported = (await query('select export_preparation_data() data'))[0].data;
      assert.equal(exported.learning_tracks.length, 0); assert.equal(exported.profiles.length, 1); assert.equal(exported.profiles[0].id, B);
      await owner(A);
    });
    await t.test('deleting tasks retains recorded sessions and preparation reset isolates owners', async () => {
      const version = (await query('select updated_at::text version from daily_tasks where id=$1', [taskId]))[0].version;
      await db.query('select delete_study_task($1,$2)', [taskId, version]);
      assert.equal((await query('select count(*)::int n from study_sessions where task_id is null'))[0].n, 1);
      await owner(B); await db.exec("insert into learning_tracks(user_id,title) values (auth.uid(),'Keep B data')");
      await owner(A); await db.exec('select clear_preparation_data()');
      assert.equal((await query('select count(*)::int n from learning_tracks'))[0].n, 0);
      assert.equal((await query('select onboarding_completed from profiles'))[0].onboarding_completed, false);
      await owner(B); assert.equal((await query('select count(*)::int n from learning_tracks'))[0].n, 1);
    });
    await t.test('account deletion can delete only the caller and rejects missing identity', async () => {
      await owner(A); await db.exec('select delete_forge_account()');
      await db.exec('RESET ROLE');
      assert.equal((await query('select count(*)::int n from auth.users where id=$1', [A]))[0].n, 0);
      assert.equal((await query('select count(*)::int n from auth.users where id=$1', [B]))[0].n, 1);
      await owner(null); await assert.rejects(db.exec('select delete_forge_account()'));
      await assert.rejects(db.exec('select export_preparation_data()'));
      await owner(B); await db.exec('select delete_forge_account()'); await db.exec('RESET ROLE');
      assert.equal((await query('select count(*)::int n from learning_tracks'))[0].n, 0);
    });
  } finally { await db.close(); }
});
