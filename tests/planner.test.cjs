/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Node tests. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers.cjs');
const { transitionTask, capacityWarning } = load('src/lib/planner.ts');
function task(id = 'task') { return { id, user_id: 'owner', title: 'Task', learning_track_id: null, subject: 'DBMS', scheduled_date: '2026-11-23', estimated_minutes: 30, status: 'pending', actual_minutes: null, completed_at: null }; }
test('server timer segments pause, resume and complete without double-counting', () => {
  const item = task(), sessions = [];
  transitionTask(item, sessions, 'owner', 'in_progress', new Date('2026-11-23T08:00:00Z'), 's1');
  transitionTask(item, sessions, 'owner', 'in_progress', new Date('2026-11-23T08:00:10Z'), 'ignored');
  assert.equal(sessions.length, 1);
  transitionTask(item, sessions, 'owner', 'pending', new Date('2026-11-23T08:02:10Z'), 'ignored');
  assert.equal(sessions[0].duration_seconds, 130); assert.equal(item.actual_minutes, 2);
  transitionTask(item, sessions, 'owner', 'in_progress', new Date('2026-11-23T09:00:00Z'), 's2');
  transitionTask(item, sessions, 'owner', 'completed', new Date('2026-11-23T09:01:00Z'), 'ignored');
  transitionTask(item, sessions, 'owner', 'completed', new Date('2026-11-23T09:02:00Z'), 'ignored');
  assert.equal(sessions.reduce((n, s) => n + s.duration_seconds, 0), 190); assert.equal(item.actual_minutes, 3);
  assert.equal(item.completed_at, '2026-11-23T09:01:00.000Z');
});
test('only one task may run and ownership is required', () => {
  const sessions = [], first = task(), second = task('second');
  transitionTask(first, sessions, 'owner', 'in_progress', new Date(), 'session');
  assert.throws(() => transitionTask(second, sessions, 'owner', 'in_progress', new Date(), 'other'), /Pause/);
  assert.throws(() => transitionTask(first, sessions, 'stranger', 'completed', new Date(), 'other'), /not found/);
  assert.equal(first.status, 'in_progress');
});
test('completed tasks must be reopened and reopening retains recorded time', () => {
  const item = task(), sessions = [];
  transitionTask(item, sessions, 'owner', 'in_progress', new Date('2026-11-23T08:00:00Z'), 's');
  transitionTask(item, sessions, 'owner', 'completed', new Date('2026-11-23T08:03:00Z'), 'none');
  assert.throws(() => transitionTask(item, sessions, 'owner', 'in_progress', new Date(), 'x'), /Reopen/);
  transitionTask(item, sessions, 'owner', 'pending', new Date(), 'none');
  assert.equal(item.actual_minutes, 3); assert.equal(item.completed_at, null);
});
test('capacity checks include completed work, exclude skipped work and respect rest days', () => {
  const profile = { available_days: ['monday'], daily_study_hours: 1 };
  const a = { ...task(), estimated_minutes: 45, status: 'completed' };
  assert.ok(capacityWarning([a], profile, '2026-11-23', 30));
  assert.equal(capacityWarning([a], profile, '2026-11-23', 30, a.id), null);
  assert.equal(capacityWarning([{ ...a, status: 'skipped' }], profile, '2026-11-23', 30), null);
  assert.ok(capacityWarning([], profile, '2026-11-24', 1));
});
