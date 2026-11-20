// Run with: node --env-file=.env.local scripts/supabase-project-setup.mjs check|record-existing
// Management credentials stay in the local environment and are never logged.
import { readFile, readdir, writeFile, appendFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const project = "zcgsdaboiqrrzxdfturq";
const migrationName = "forge_foundation_00001_to_00005";
const expectedHash = "e7f4ba874204dd86ebf66e153540291df4375f9d5be63d7202bed9bd8cfb707f";
const mode = process.argv[2] ?? "check";
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token || token === "your_token_here") throw new Error("Save a real SUPABASE_ACCESS_TOKEN locally first.");
if (!["check", "record-existing"].includes(mode)) throw new Error("Use check or record-existing.");
if (new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname !== `${project}.supabase.co`) throw new Error("The local project URL does not match the reviewed project.");

async function request(path, method = "GET", body) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${project}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(45000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Supabase ${method} ${path} returned HTTP ${response.status}. No automatic retry was attempted.`);
  return data;
}

const summaryQuery = `SELECT count(*)::int AS table_count,
  count(*) FILTER (WHERE rowsecurity)::int AS rls_table_count,
  (SELECT count(*)::int FROM pg_policies WHERE schemaname='public') AS policy_count,
  (SELECT count(*)::int FROM auth.users) AS app_user_count
  FROM pg_tables WHERE schemaname='public';`;
async function databaseSummary() {
  const rows = await request("/database/query", "POST", { query: summaryQuery, read_only: true });
  if (!Array.isArray(rows) || !rows[0] || !Number.isInteger(rows[0].table_count)) throw new Error("Unexpected database summary response.");
  return rows[0];
}
function authSummary(auth) {
  return { siteUrl: auth.site_url, localhostCallbackConfigured: String(auth.uri_allow_list ?? "").split(",").map((v) => v.trim()).includes("http://localhost:3000/auth/callback"),
    googleEnabled: Boolean(auth.external_google_enabled), googleClientIdConfigured: Boolean(auth.external_google_client_id), googleSecretConfigured: Boolean(auth.external_google_secret) };
}

try {
  const [before, history, auth] = await Promise.all([databaseSummary(), request("/database/migrations"), request("/config/auth")]);
  if (!Array.isArray(history)) throw new Error("Unexpected migration history response.");
  console.log(JSON.stringify({ project, database: before, migrationCount: history.length, auth: authSummary(auth) }));
  if (mode === "record-existing") {
    if (before.table_count !== 21 || before.rls_table_count !== 21 || before.policy_count !== 23) throw new Error("Existing schema is incomplete. No migration record was written.");
    if (history.length) throw new Error("Migration history is no longer empty. Review it before changing metadata.");
    const source = await readFile("supabase/bootstrap-forge.sql", "utf8");
    const hash = createHash("sha256").update(source).digest("hex");
    if (hash !== expectedHash) throw new Error("The reviewed bootstrap changed.");
    const expected = new Map();
    for (const file of (await readdir("supabase/migrations")).filter((name) => /^0000[1-5]_.*\.sql$/.test(name)).sort()) {
      const sql = await readFile(`supabase/migrations/${file}`, "utf8");
      if (!source.includes(sql)) throw new Error("A source migration changed since bootstrap review.");
      for (const match of sql.matchAll(/CREATE OR REPLACE FUNCTION public\.(\w+)\s*\([\s\S]*?\)\s*RETURNS[\s\S]*?\$\$([\s\S]*?)\$\$/gi)) expected.set(match[1], match[2]);
    }
    const functions = await request("/database/query", "POST", { query: `SELECT p.proname AS name,p.prosrc AS body,
      has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute,
      has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'`, read_only: true });
    const normalize = (value) => value.replace(/\s+/g, " ").trim();
    for (const [name, body] of expected) {
      const row = functions.find((fn) => fn.name === name);
      if (!row || normalize(row.body) !== normalize(body)) throw new Error(`Function ${name} does not match the reviewed migration.`);
      if (!name.startsWith("handle_") && (row.anon_execute || !row.authenticated_execute)) throw new Error(`Function ${name} has unexpected execution grants.`);
    }
    if (expected.size !== 14) throw new Error("Unexpected source function inventory.");
    const features = await request("/database/query", "POST", { query: `SELECT
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='study_sessions' AND column_name='duration_seconds') AS timer_seconds,
      EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='one_running_session_per_user') AS single_session_index,
      EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='auth.users'::regclass AND tgname='on_auth_user_created' AND tgenabled<>'D') AS signup_trigger`, read_only: true });
    if (!features[0]?.timer_seconds || !features[0]?.single_session_index || !features[0]?.signup_trigger) throw new Error("Existing schema is missing required foundation features.");
    // Official metadata-only endpoint: this does not execute the SQL again.
    await request("/database/migrations", "PUT", { name: migrationName, query: source });
    const recordedHistory = await request("/database/migrations");
    const entry = recordedHistory.find((item) => item.name === migrationName);
    if (!entry) throw new Error("Migration record was not verified. Inspect history before retrying.");
    const receipt = { project, verifiedAt: new Date().toISOString(), deployment: "Existing schema verified; migration history recorded without rerunning SQL",
      sourceSha256: hash, matchingFunctionCount: expected.size, executionGrantsVerified: true,
      appliedMigration: { version: entry.version, name: entry.name }, database: before, features: features[0], auth: authSummary(auth) };
    await writeFile("supabase/setup-receipt.json", JSON.stringify(receipt, null, 2) + "\n");
    await appendFile("WORK_LOG.md", `\n\nExisting hosted schema verified at ${receipt.verifiedAt}: 21 tables with RLS, 23 policies, all 14 function bodies matching source and RPC execution grants restricted to authenticated callers. Recorded migration metadata ${entry.version} (${entry.name}) through the metadata-only API; did not rerun SQL. Receipt: supabase/setup-receipt.json.\n`);
    console.log(JSON.stringify({ recordedExistingDeployment: true, migration: receipt.appliedMigration, database: before, matchingFunctions: expected.size, auth: authSummary(auth) }));
  }

} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown setup error.";
  console.error(message.split(token).join("[REDACTED]"));
  process.exitCode = 1;
}
