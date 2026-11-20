/* eslint-disable @typescript-eslint/no-require-imports -- Local PostgreSQL bootstrap verification. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');

test('reviewed Supabase bootstrap creates 21 protected tables and refuses reapplication', { timeout: 60000 }, async () => {
  const db = new PGlite();
  try {
    await db.exec(`CREATE ROLE authenticated NOLOGIN; CREATE SCHEMA auth;
      CREATE TABLE auth.users(id uuid PRIMARY KEY, raw_user_meta_data jsonb DEFAULT '{}');
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;`);
    const script = fs.readFileSync('supabase/bootstrap-forge.sql', 'utf8');
    await db.exec(script);
    const result = (await db.query("SELECT count(*)::int total, bool_and(rowsecurity) protected FROM pg_tables WHERE schemaname='public'")).rows[0];
    assert.equal(result.total, 21); assert.equal(result.protected, true);
    await assert.rejects(db.exec(script), /Database is not empty/);
    await db.exec('ROLLBACK');
    assert.equal((await db.query("SELECT count(*)::int total FROM pg_tables WHERE schemaname='public'")).rows[0].total, 21);
  } finally { await db.close(); }
});
