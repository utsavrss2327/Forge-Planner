# FORGE work log and resume point

Last updated: 2026-11-20 (Asia/Kolkata).

## Resume instructions

Read this file, `IMPLEMENTATION_PLAN.md`, and `AGENTS.md` before changing code. Continue the first unfinished increment below. Preserve existing user data and `.env.local`; do not print credentials. Update this log after each increment and before ending a session, including exact commands and outcomes. A passing build is not proof of live service behavior.

## Scope of the current request

Extend the existing FORGE app under the new master specification: personal subject selection, responsive phone/tablet/laptop layouts, real module navigation, reviewed roadmap import/generation, mandatory routine editing and user approval, subject-based daily topic planning/completion, and sourced assessment/rubric feedback using Gemini's free tier. Preserve the completed foundation and user data. Keep exact validation, deployment limits and a resumable log. The full extended master specification remains phased; see FEATURE_STATUS.md for implemented scope and remaining refinements.

## Baseline from the previous session

- Supabase learning reads/writes and transactional playlist/video progress RPCs; explicit local demo mode.
- Video study route with notes, topics, difficulty and manual completion.
- YouTube import failures are visible and never replaced with invented videos.
- Recovery pages, learning search and persisted-data dashboard.
- Architecture, prioritized plan, environment example and two database migrations.
- Previously executed: 8 isolated regression tests passed, TypeScript passed, lint passed, webpack production build passed.
- No live Supabase, email delivery or YouTube integration verification was performed.

## Foundation increment queue

1. **Completed — identity and preparation preferences:** reusable authenticated profile access, robust validation, correct onboarding gate without redirect loops, editable persisted preferences, honest auth/session errors and consistent timezone dates.
2. **Completed — learning management:** edit/archive tracks, import a playlist into an existing track, edit/delete journals, validation and stale-save protection.
3. **Completed — daily planner and recorded study time:** create/edit/reschedule tasks; start/pause/complete study sessions; persisted server timing and capacity warnings; accurate dashboard summaries.
4. **Completed — account settings and reliability:** data export/deletion, configuration status, error/loading boundaries and navigable foundation routes.
5. **Completed — verification:** regression and database ownership/transaction tests, browser journey where available, lint/types/build; document any service-dependent checks that cannot run.

## Current checkpoint

The connected roadmap → routine editor → approval → subject planner and sourced assessment/rubric workflows are implemented and locally verified. Hosted migrations 00007–00009 are applied; 23 RLS tables and private grading controls are verified. Gemini Flash-Lite generation/grading passed a live nonpersonal fixture (17 sources, 5 subjects, 7 questions, 60 minutes, unrelated answer0). Both private keys are configured locally, never printed. Final checks: 77 tests, Chromium7, WebKit7, types/lint/build all PASS. Source changes are NOT pushed or deployed to Vercel. Resume from the production handoff at the end of this file; do not replay the bootstrap or claim all master-spec refinements are complete.

## External requirements

Production: configured Supabase project with all migrations applied, Auth redirect URLs and email provider. YouTube: server-side Data API key. AI: server-only provider key for later milestones. Local demo is single-user sample data and must be labeled; it is not secure authentication.

### Increment 1 completed — identity and preparation preferences

- Added authenticated profile access and shared calendar/timezone/form validation.
- Onboarding now loads saved values, supports name/timezone/completed topics, displays validation/save errors, and prevents invalid/past dates or empty availability/subjects.
- Production request gate sends incomplete profiles to onboarding, exempts onboarding/settings to prevent loops, and rejects forged demo cookies when demo is disabled. Demo database calls now fail explicitly instead of returning invented profile records.
- App shell/progress dates use the saved timezone. Login/signup and recovery validate form/configuration inputs; failed sign-out is not reported as success.
- Validation executed: `npm test` **13 passed**; `npx tsc --noEmit` passed; `npm run lint` passed; `npm run build` passed (webpack).
- Live Supabase sessions and email delivery remain unverified.
- Next: increment 2, learning-track editing/archiving, existing-track playlist import, and editable journals with stale-write checks.

### Increment 2 completed — learning management

- Track editing includes status/archive/restore, goals, deadline, notes and validated resource URLs; stale edits are rejected.
- Existing tracks can import additional real YouTube playlists. Import RPC locks the parent track and rejects duplicates; local import reloads data after network work to preserve concurrent edits.
- Track/hub progress includes all linked playlists. Track reflections and resources are visible; reflections can be edited/deleted with owner/version checks.
- Video edits support clearing difficulty ratings and optional optimistic concurrency checks (migration 00003).
- Added shared TypeScript test loader, comprehensive form limits and no inferred learning topics/durations.
- Executed: `npm test` **17 passed**, `npx tsc --noEmit` passed, `npm run lint` passed, `npm run build` passed.
- New migration: `00003_learning_management.sql`; not applied to a live Supabase project.
- Next: increment 3, planner CRUD, persisted start/pause/complete sessions and truthful recorded time.

### Increment 3 completed — daily planner and recorded time

- Added `/planner` with date navigation, daily/seven-day agendas, create/edit/delete tasks, track/resource links, priority and explicit capacity/rest-day overrides.
- Added authenticated transactional task RPCs and per-user locking. Starting a second running task is rejected; pause/resume records separate server-timed segments; completing twice does not add time. Refresh/closing the browser does not discard an active session.
- Recorded sessions survive task deletion. Reopening/skipping/rescheduling stops a running segment and preserves recorded time. Estimates never become actual minutes automatically.
- Dashboard totals now include paused sessions and retain recorded history after deletion. Weekly recorded time is explicitly grouped by session start date; running time is excluded until recorded.
- Executed: `npm test` **21 passed**, `npx tsc --noEmit` passed, `npm run lint` passed, `npm run build` passed.
- New migration: `00004_planner_sessions.sql`. Database/RLS/timing RPC behavior still needs real SQL-engine tests in increment 5; no live Supabase claim.
- Next: increment 4, settings, private data export/deletion and reliability boundaries.

### Increment 4 completed — settings, data controls and reliability

- Added `/settings` with saved preference summary/editing and credential-presence status without displaying secret values or claiming service health.
- Added private no-store JSON export, authenticated preparation reset and password-confirmed full account deletion. Preparation reset retains the Auth login; account deletion uses a narrowly scoped, search-path-pinned definer RPC that deletes only `auth.uid()`.
- Added loading/error boundaries. Foundation navigation now includes planner/settings; later modules remain labeled Planned.
- Executed: `npm test` **24 passed**, `npx tsc --noEmit` passed, `npm run lint` passed, `npm run build` passed.
- New migration: `00005_account_data.sql`; not applied to a live Supabase project. Full account deletion against hosted Supabase/storage remains a deployment integration check.
- Next: increment 5, run SQL migrations and ownership/transaction tests in a local PostgreSQL engine, browser end-to-end checks, repair findings, update setup/status documentation.

### Verification finding — onboarding review could submit early

The expanded browser run caught a real UI timing issue: React reused the Continue button as the final submit button during the same click, allowing the form to submit before the review action. The test ended on the dashboard while waiting for the final button. Fixed by preventing the Continue click's default action and giving Continue/Submit distinct keys. The browser test now explicitly checks the review screen before submitting. Rerun is required; this failed run is not counted as passing.

### Increment 5 completed — SQL, browser and final verification

- Installed development-only PGlite and Playwright dependencies. All five migration files execute unchanged in PostgreSQL; the initial schema now uses native `gen_random_uuid()` rather than requiring uuid-ossp.
- SQL integration tests switch to a non-superuser authenticated role and test nested RLS, cross-user write rejection, child-insert rollback, reversible/idempotent video counters, versioned saves, duplicate imports, capacity/rest days, one open session, database-clock timing, preservation of session history, private export/reset and caller-only account deletion.
- The final Playwright journey passed with headless Chrome. It covers unauthenticated access/export, demo login, persisted onboarding preferences, invalid/import-unavailable playlist behavior, track creation/archive, journal edit/search, explicit video completion/notes, task creation/timer refresh/pause, private export, mobile width, preparation reset and sign-out.
- Browser tests build a separate `.next-e2e` application with external credentials disabled at both build and runtime, use a unique temporary demo store, block the YouTube iframe and never read/write the developer's `.data`. `scripts/e2e-server.cjs` handles the isolated build/server lifecycle.
- Fixed the early-submit onboarding bug found by the browser test. A later test-selector mismatch was corrected to use the accessible Status combobox. Failed attempts are not counted as passing; the final expanded run passed.
- Editors now retain the version captured when opened, so a background render cannot silently advance the version of an unsaved edit. Video saves return the exact updated timestamp from the same database transaction via migration 00003's versioned wrapper.
- Added generated-test-build ignores, reduced-motion styling, inactive-mobile-drawer focus protection, logout errors, timezone-correct heatmap dates, import timeouts/pagination limits and roadmap progress derived from persisted tasks.
- Updated README, architecture, implementation plan, environment/git-ignore handling and resume instructions.

## Final executed validation (2026-11-20)

- `npm test`: **33 passed, 0 failed**, including actual PostgreSQL-engine migration/RLS/transaction tests.
- `npm run test:e2e`: **1 complete browser journey passed** (expanded final run, 22.5 seconds including isolated build/start; test body 8.3 seconds).
- `npm run lint`: passed with no warnings/errors.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed; production foundation routes compiled and generated successfully.

## Exact next milestone

All five foundation increments are complete locally. Next is **AI roadmap generation and adaptive scheduling**, following `IMPLEMENTATION_PLAN.md`:

1. Inspect existing `src/lib/ai/agents/roadmap-planner.ts`, schemas/prompts and roadmap tables; preserve the finished foundation.
2. Build an authenticated roadmap repository and editable manual roadmap workflow first, then the validated AI generator with honest missing-key errors.
3. Add a dependency-aware scheduler that uses profile availability/capacity/completed topics, reserves revision/assessment time, returns unscheduled work explicitly and supports preview/commit rebalancing after missed days.
4. Test capacity, prerequisites, missing days, impossible deadlines, preserved incomplete tasks and owner isolation before exposing the workflow.
5. Then proceed to sourced active recall, timed assessments and the weakness → revision → retest loop. Do not claim these later modules already work.

## Outstanding external checks (not a reason to repeat local foundation work)

Apply unapplied migrations to a Supabase test project and verify hosted signup/confirmation/session refresh/recovery email, PostgREST permissions/RPC calls, a real YouTube playlist import, and hosted Auth/Storage account-deletion behavior. These were **not executed** against a live account. Local SQL uses a small Auth-schema/identity fixture; browser authentication is explicitly demo-only. No deployment was performed.

### Follow-up — Google sign-in (2026-11-20)

User requested Google login while using the local app. Added the OAuth integration work ahead of the next roadmap milestone. Supabase URL/key and site URL in `.env.local` are missing/placeholders (values were not logged); live Google authentication cannot be completed until project/provider setup is supplied. Implementing the real Supabase PKCE boundary, UI, callbacks/errors and regression coverage; no Google/demo success is being fabricated. Preserve the finished foundation and resume the roadmap milestone after this follow-up.

### Google sign-in follow-up implemented — external activation pending

- Added Continue with Google to login and signup; existing email/password forms remain available.
- Added server-side Supabase OAuth initiation with fixed Google provider, account selection, PKCE cookies via the SSR client, validated site origin and an allowlisted project authorize URL. No Google client secret is exposed to browser code and no demo identity substitutes for OAuth.
- Callback exchanges the code (including optional flow ID), allowlists dashboard/settings/password-reset destinations, strips provider error descriptions and returns no-store/no-referrer redirects. Cancellation/expired-code/setup errors are rendered safely on login.
- Google-only account deletion uses recent signature-verified OAuth authentication timestamps for the current user; email/password account deletion keeps password verification. Reauthentication alone never deletes an account; the user must return and confirm deletion.
- Added environment comments and full Google/Supabase setup instructions in README, based on the official Supabase guides and installed SDK APIs. `.env.local` was inspected only to determine configuration presence; its values were neither printed nor changed.
- Executed: `npm test` **40 passed**, `npx tsc --noEmit` passed, targeted ESLint over all changed auth/settings/test files passed, `npm run build` passed, final `npm run test:e2e` **3 passed** (foundation journey plus Google setup-error and callback-safety browser cases).
- Initial Google browser assertions matched both the app alert and Next.js's built-in route announcer; selectors were narrowed and the final rerun passed. No real Google consent/session exchange was executed.
- Full `npm run lint` currently reports unrelated errors/warnings in additional workspace modules (including mentor); they were not changed as part of this auth request. Additional roadmap/assessment/placement route files are now present in the shared workspace, so inspect their current state before starting that milestone rather than assuming the earlier foundation-only inventory is still current.
- Local `/login` responded HTTP 200 and served the Google button on port 3000.

**Resume here for live Google activation:** provide real Supabase project URL/anon key and `NEXT_PUBLIC_SITE_URL=http://localhost:3000` in the local environment, enable Google with its web OAuth client ID/secret in Supabase, configure the Supabase callback in Google and FORGE callback in Supabase, restart the dev server and verify a real test-account sign-in. Google client secrets belong in Supabase's provider configuration, not in chat or browser environment variables. Until then, the app intentionally shows a setup error when Google is selected.


### Supabase project supplied — dashboard sign-in pending (2026-11-20)

- User supplied project dashboard: https://supabase.com/dashboard/project/zcgsdaboiqrrzxdfturq.
- Opened that project in the shared in-app browser; it redirected to Supabase sign-in. No authenticated dashboard access, key retrieval, migration application or provider setting change has occurred.
- Prepared the canonical hosted project URL and local site URL in `.env.local` unless an existing configuration belonged to another project. Preserved other environment values; no keys/passwords were printed.
- Resume after the user signs into the shared Supabase tab: verify project identity/endpoint, retrieve its public anon/publishable key, finish local environment configuration, inspect database migration state and Google provider/redirect settings. Never copy a service-role/secret key into NEXT_PUBLIC configuration.
- Google client credentials and any required credential-entry steps must be handled in the provider's setup UI; do not request that secrets be pasted into chat.


### Live Supabase connection configured — remote setup staged, not applied (2026-11-20)

- User signed into the shared dashboard for project `zcgsdaboiqrrzxdfturq` (FORGE-Ai-based-learning).
- Retrieved only the existing public publishable key from the visible API Keys page. Configured `.env.local` with that key (using the compatible ANON_KEY variable), the verified project URL, localhost site URL, and FORGE_DEMO_MODE=false. Preserved other values and did not reveal/copy the secret/service-role key.
- Live public authentication endpoint check returned HTTP 200, Google disabled, email enabled.
- Read-only SQL in the hosted dashboard returned public_tables=0, app_users=0, PostgreSQL 17.12. No schema writes have been executed.
- Verified site URL is already http://localhost:3000 and there are no allowed redirect URLs. Google provider is disabled and both client ID and client secret are empty. Its Google-side callback is https://zcgsdaboiqrrzxdfturq.supabase.co/auth/v1/callback.
- Created `supabase/bootstrap-forge.sql`: the five source migrations in a single guarded transaction, no sample data and no invocation of deletion functions. It refuses an already initialized public schema and checks for 21 RLS-enabled tables before commit.
- Staged this exact script in the SQL Editor and verified the copied editor content exactly matched the local file (43,528 characters at staging). Did NOT click Run.
- Staged http://localhost:3000/auth/callback in an Add redirect URL dialog. Did NOT click Save URLs. No remote authentication permissions have changed.
- Local validation: original database integration suite 9 tests passed; new bootstrap integration test 1 passed, including 21 protected tables and refusal to rerun.
- Review screenshots: `supabase/setup-review.jpg`, `supabase/callback-review.jpg`.
- Browser control became unavailable after staging. Do not attempt browser automation through another technology to bypass the browser-control restriction. No pending processes remain from these checks.

Resume: inspect the actual current dashboard before acting. Apply the reviewed bootstrap and save the exact localhost callback only after the required browser confirmation (these change database access policies/authentication permissions), or have the user perform those final actions directly. Verify 21 tables with RLS and the saved callback after execution. Then the user must create/provide a Google Web OAuth client and enter its credentials directly in Supabase provider settings; secrets must not be pasted into chat. Enable the provider only with appropriate confirmation and test a real Google sign-in. No live Google sign-in is working yet.

Bootstrap SHA256 at checkpoint: `e7f4ba874204dd86ebf66e153540291df4375f9d5be63d7202bed9bd8cfb707f`.


### Resumed setup — Supabase plugin connection requested (2026-11-20)

- User asked to continue. Re-read repository instructions and the pending live-setup checkpoint. Browser/computer-control tools are still not available.
- Live read-only Auth settings returned HTTP 200, Google disabled, email enabled. A zero-row request to the profiles endpoint returned HTTP 404 / PGRST205, confirming the required profiles table is not available. The OpenAPI root returned 401; do not interpret its empty result as a table count.
- No remote schema, redirect or provider changes were submitted. The local environment retains the verified project URL/public publishable key and real-auth configuration.
- Used the plugin-management skill to discover a Supabase plugin with SQL/migration/project-management capabilities. Confirmed it was not installed and suggested it for installation/connection. It has NOT been confirmed connected; do not claim access or call its tools yet.
- Resume after the user installs/connects Supabase: discover the actual plugin tools, verify project zcgsdaboiqrrzxdfturq and inspect current schema, then apply the reviewed migrations using the authorized connector and verify all 21 tables have RLS. Inspect available Auth configuration capabilities rather than assuming them. Google OAuth client credentials still need user setup directly in Supabase.

Bootstrap unchanged at checkpoint: True; includes current migration sources: True.


Applying RPC execution-grant hardening through the Management API at 2026-11-20T07:48:38.726Z. This revokes PUBLIC/anon invocation of the 12 app RPCs and preserves authenticated execution; it changes no function bodies or user rows.

RPC grant hardening verified at 2026-11-20T07:48:41.776Z: all 12 application RPCs deny anon execution and retain authenticated execution. Migration source: 00006_rpc_execution_grants.sql. Migration history still needs metadata registration; no tables or user records were recreated.


Existing hosted schema verified at 2026-11-20T07:49:53.358Z: 21 tables with RLS, 23 policies, all 14 function bodies matching source and RPC execution grants restricted to authenticated callers. Recorded migration metadata 20261120074952 (forge_foundation_00001_to_00005) through the metadata-only API; did not rerun SQL. Receipt: supabase/setup-receipt.json.

Grant-hardening migration metadata recorded as 20261120075135 (00006_rpc_execution_grants) at 2026-11-20T07:51:36.211Z. Both migration records verified without rerunning schema SQL; receipt updated.


### Management API access verified; live database setup completed (2026-11-20)

- User saved SUPABASE_ACCESS_TOKEN locally and requested a check. Token access to Auth config, SQL metadata and migration history succeeded; no token or provider secret was printed.
- Current hosted state had already changed: 21 public tables, all with RLS, 23 policies, 0 app users, and the exact localhost callback saved. Preserved that installation; did not rerun the bootstrap. All 14 foundation function bodies matched the migration source.
- Detected a hosted-default privilege difference: explicit anon EXECUTE grants survived the original PUBLIC revocations. Added/tested 00006_rpc_execution_grants.sql, applied its grant narrowing in one transaction, and verified all 12 app RPCs reject anon execution while retaining authenticated access. No function bodies or user rows changed; no account/data deletion function was invoked.
- Registered the existing foundation bundle and grant correction through the official metadata-only migration API. Verified history entries: 20261120074952 forge_foundation_00001_to_00005; 20261120075135 00006_rpc_execution_grants. Receipt: supabase/setup-receipt.json. Original short-numbered local migration files do not directly match these generated bundle versions; reconcile history before future Supabase CLI db push.
- Live Data API verification: profiles endpoint HTTP 200; anonymous export RPC HTTP 401 (denied). Auth config confirms localhost site/callback, Google disabled, and no Google client ID or client secret.
- Added a server-side provider-enabled check so Google login stays in FORGE with a clear configuration message instead of redirecting to a disabled-provider API error. Added regressions for enabled/disabled/unavailable provider discovery.
- Executed: npm test 44 passed; npx tsc --noEmit passed; scoped ESLint over all changed auth/provisioning/test files passed; npm run build passed. Full-repository lint was not re-claimed as passing; unrelated earlier module issues remain outside this setup change.
- Updated setup documentation and environment example. Management token remains local/ignored and is used only for provisioning, never browser configuration.

Resume here: Supabase access, database setup, migration bookkeeping and localhost callback are verified. Google OAuth client creation is the remaining blocker. The user needs a Web application OAuth client in Google Auth Platform, with JavaScript origin http://localhost:3000 and authorized redirect https://zcgsdaboiqrrzxdfturq.supabase.co/auth/v1/callback. Enter its ID/secret directly in this Supabase project's Google provider settings and enable it. Then recheck Auth settings and have the user complete a real Google sign-in from localhost to verify session/onboarding. Do not claim Google login is live yet. No Supabase plugin or browser control is required for the remaining read-only Management API checks.

### Production deployment inspection — 2026-11-20

- User supplied https://forge-planner-22.vercel.app/ for review. Read-only HTTP checks: / and /login return 200; /dashboard redirects 307 to /login. Landing and Google login UI are served.
- /auth/callback without a code redirects to /login?error=oauth_setup. In current source that branch specifically means isSupabaseConfigured() is false, indicating production Supabase URL/public-key configuration is missing or invalid (rather than the expected missing-code error). Production environment itself was not accessible to inspect; no real Google login was completed.
- Read-only Management API confirms Google is now enabled and client ID/secret are present. Production callback https://forge-planner-22.vercel.app/auth/callback is allow-listed. Supabase Site URL still points to the different forge-planner-utsavrss2327s-projects.vercel.app hostname.
- Next step: set Vercel Production NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (public publishable key), NEXT_PUBLIC_SITE_URL=https://forge-planner-22.vercel.app, FORGE_DEMO_MODE=false; redeploy because NEXT_PUBLIC values are baked into the build. Align Supabase Site URL with this production domain, then verify a real Google sign-in. No remote configuration changes made during inspection.

### Production onboarding verification — 2026-11-20

- Read-only live checks: /onboarding and /dashboard return 307 to /login for signed-out requests; /login returns 200; anonymous /api/account/export returns 401.
- Previous missing-Supabase configuration symptom is resolved: /auth/callback without a code now returns auth_callback_error, the expected missing-code branch, rather than oauth_setup.
- Google provider remains enabled, production callback is allowed. Supabase Site URL still uses the alternate forge-planner-utsavrss2327s-projects.vercel.app host; canonical production domain remains to be aligned.
- Read only aggregate database counts: 1 auth user, 1 profile, 0 missing profiles, 0 completed onboarding profiles. No personal fields fetched or modified. Account/profile creation has occurred; successful onboarding save has not yet been evidenced.
- Ran node --test tests/foundation.test.cjs tests/oauth.test.cjs: 13 passed, 0 failed. These cover local validation/auth logic, not an authenticated production form submission.
- Cannot access user's browser session; no signed-in visual inspection or live onboarding submission performed. Next concrete verification: user completes four onboarding steps and submits, then confirm dashboard redirect and persisted preferences/completion flag. Do not claim all live app features work from public-route/aggregate checks.

### Expanded master-spec implementation in progress — 2026-11-21

User expanded request: fix grounded assessment generation/grading with best free resources; responsive iOS/macOS layouts; subject selectors must respect selections; enable real modules; roadmap-driven subject/day planner with topic notes and subject completion; mandatory routine editor/approval workflow. Master prompt attachment: /Users/utsavrajsingh/.codex/attachments/0c082309-2dce-4763-8193-08a1c7356b41/Pasted text.txt. Audit first; preserve foundations. User selected Gemini free tier via async question. No paid fallback.

Implemented locally (NOT yet deployed or remotely migrated):
- FEATURE_STATUS.md audit and expanded IMPLEMENTATION_PLAN.
- Personal subject helper and Learning Hub dropdown; scrollable safe-height dialogs, dvh app shell, iOS input sizes/touch targets/safe-area CSS.
- src/lib/routine/{schema,engine}.ts: schema validation, cycle detection, deterministic fair rotation, availability/rest/capacity, overlap, max subjects, prerequisites, coverage, locks. tests/routine.test.cjs 4 passed.
- Migration 00007: additive roadmap subject/prerequisite/resource columns, profile planning prefs, weekly_routines + routine_versions with read-owner policies, save_reviewed_roadmap RPC, draft/version/lock checks, explicit unlock, SQL validation, transactional approve to daily_tasks. Existing tasks preserved, capacity/overlap rechecked, approved preferences reused. Availability edits may explicitly modify fixed commitments; ordinary save cannot.
- Roadmap routes now use Supabase; text/JSON/manual review + optional AI proposal; no silent fallback; generation does not activate tasks. Current imports only TXT/MD/pipe-separated CSV/JSON; PDF/Office/vision not implemented yet and UI says so.
- /planner/customize: subject library, week/day/agenda calendar, HTML desktop drag/drop time grid, form-based move/resize, lock/unlock, commitments availability panel, undo/redo, local draft recovery, serialized autosave + version checks, proposal comparison, AI allocation optimization, hard-error-blocked approval. Need further browser/testing and autosave/lock edge audit.
- Planner subject groups allow individual topic notes and subject completion checkbox; existing timers/task editor retained. Onboarding now routes to /roadmaps/new after saving.
- AI client configurable Gemini(default)/Groq/OpenAI using existing SDK, no paid automatic fallback, bounded timeout, explicit rate errors. Default Gemini model gemini-3.1-flash-lite checked against official current pricing/docs; provider not live-tested (no Gemini key).
- src/lib/assessment/schema/context: source provenance, four-subject playlists + DSA context, notes/topics requirements, timezone date selection, per-subject round robin bounds, 60min validation, correct-answer and rubric stripping, deterministic MCQs/blanks and bounded per-criterion AI grading. tests/assessment.test.cjs 4 passed (four playlists + DSA included; long nonsense earns0).
- Migration 00008: existing assessments/questions/answers extended; safe question column grants; authenticated reads only for exam write tables; service-role-only atomic exam creation and grading; server deadline/autosave/submission freeze; idempotent grading/mastery/revision; SM2 review RPC; export/reset updated to include routines and avoid pending answer keys, caller-only definer filters. Requires SUPABASE_SERVICE_ROLE_KEY (server only), not yet set by this work.
- Assessment pages/actions completely replace prototype fallback/length grading with saved sources preview, generated draft, explicit start, server deadline, autosave, submit/retry grading, per-question rubric/source results. No code executor; clearly AI code review.
- DSA/apps/revision/mentor/analytics replaced prototype actions with owned Supabase persistence and real evidence; mentor no invented fallback/readiness scores. Sidebar links all enabled, routine added. Error UI improvements partially done; inspect remaining swallowed failures.

Validation executed so far: foundation database integration10 pass; routine4 pass; assessment4 pass; new workflows-database10 pass (includes owner isolation, draft invalid approval rollback, locks, stale saves, no duplicate activation, service-only grader, protected answer keys, idempotent grading/revisions, frozen answers, late answer rejection, anon denial). tsc passed before latest small prefs edits. Global lint currently being cleaned (last run in session74770). Browser tests/build/full test suite NOT run for final changes yet. No new remote writes or deployment made.

Resume: poll running eslint session74770 if needed; inspect /tmp/forge-lint.json for errors. Resolve remaining lint/types/security tests; improve routine autosave and activation constraints, placement UI error handling; decide core import adapters; run full tests/build and browser responsive checks where permitted. Do not bypass unavailable user-browser control. Existing local Playwright is available for app tests, but user browser session is inaccessible. Once migrations validated, apply 00007/00008 via authorized Supabase Management API and record exact migration versions/checks without rerunning bootstrap. Vercel access not yet available; do not claim deployed fixes. User Gemini key will be needed in local/Vercel env (not chat). Keep receipt and required docs current.

Applying tested incremental migration 00007_routine_planning (SHA256 cbdeaac18e1d670da1384847c0f6bc05ba561b6fd53a962b66f8d72fd65f93ec) through the Management API. No bootstrap/sample-data/reset queries are included.

Applying tested incremental migration 00008_grounded_assessments (SHA256 33f51a05ddc25e968ad6b09d25dcba74c9568f8b2f49fb6fb3932df2e0c1dc36) through the Management API. No bootstrap/sample-data/reset queries are included.

Incremental planning/assessment migration history verified. Database: {"tables":23,"rls_tables":23}. Receipt: supabase/planning-upgrade-receipt.json. No user content was created, reset or deleted by provisioning.

### Connected workflow verification and hosted upgrade — 2026-11-21

- Finalized real Supabase-backed roadmap/assessment/DSA/revision/applications/mentor/evidence analytics routes; sidebar now navigates to them. Subject selector uses profile and active-roadmap subjects, with live public Data API relationship-query HTTP 200 verification. Daily planner groups scheduled tasks by subject, shows start times, accepts per-task topic notes, and completes subject tasks via authenticated transitions.
- Added DOCX/XLSX extraction (Mammoth/ExcelJS), TXT/MD/CSV/JSON text imports, and configured Gemini PDF/JPG/PNG transcription. Multi-file size/archive limits, reviewed text, source references and truthful unavailable states are in place. Real DOCX and multi-sheet XLSX fixtures pass. Audio/video imports remain unavailable. Pinned ExcelJS's UUID transitive dependency to patched ^11.1.1; npm install audit reported 0 vulnerabilities.
- Default provider upgraded from the initial Lite plan to gemini-4-hydrogen after checking the current official pricing/compatibility pages: free-tier input/output is available for it. Explicit AI_MODEL can select Lite for latency/quota needs. No paid fallback. User selected Gemini free tier.
- Last full local verification: 70 tests passed (0 failed), TypeScript passed, full ESLint passed with 0 warnings, production build passed. Added action tests for failed submission staying editable, quota failures preserving submitted state without fabricated marks, exact MCQs without AI, validated partial credit and no automatic OpenAI fallback.
- Browser verification: Chromium 7 tests passed, including existing foundation/Google error journeys and responsive 320/390/768/1440 widths. Fixed a real early-hydration video-note editing issue using a hydration-ready gate; saved exact notes now survive reload. Responsive tests initialize their own preferences after the foundation clear-data test.
- Applied only the tested additive migrations through the official Management API: 00007_routine_planning -> 20261121055552; 00008_grounded_assessments -> 20261121055555. Receipt: supabase/planning-upgrade-receipt.json; source hashes recorded. No bootstrap/sample data/reset/user-content deletion was run.
- Hosted read-only verification: 23 tables, all 23 with RLS; authenticated reference-answer SELECT false; safe question text SELECT true; authenticated finalization false; service-role finalization true; anon new RPC execution false. Existing project content retained.
- Automatic approval review initially rejected retrieving/storing the service-role key because privileged secret extraction was not explicitly authorized. No command ran or file was written on that rejection. User then explicitly approved 'Approve retrieving and saving locally'. Retried exactly that authorized scope; saved the existing service-role key only in ignored .env.local with mode0600, never printed it, and verified a server-only storage read. No Vercel secret was changed.
- GEMINI_API_KEY is not yet configured. Asked user to save a key from Google AI Studio locally, never in chat; no live AI generation/grading/OCR claim is made.
- Vercel frontend has NOT been redeployed; these source changes remain local. Required production env: AI_PROVIDER=gemini, AI_MODEL=gemini-4-hydrogen, GEMINI_API_KEY, SUPABASE_SERVICE_ROLE_KEY (server-only), existing public Supabase/site variables, FORGE_DEMO_MODE=false. No Vercel credentials/connected deployment tool are configured here.
- WebKit test attempt did not launch: cached browser version2336 was incompatible with current Playwright expecting2388. Installing the exact official WebKit runtime through Playwright (session62803) for local app QA; no user-browser automation attempted. Do not report WebKit/Safari passed until rerun succeeds.

Resume: finish WebKit download/test, inspect responsive screenshots and resolve any actual failures. Finalize clean checks after remaining UI edits, update FEATURE_STATUS/README/log accurately. Recheck Gemini key only after user says it is saved, then test real provider responses without creating fake records in the production user's account. Do not retrieve/store any more secrets or deploy to Vercel without the relevant authorization/configuration. The latest master prompt remains staged beyond the connected core: document the remaining multi-week optimization, deeper onboarding, extended imports, background grading and interview simulation honestly.

Applying tested incremental migration 00009_routine_task_guards (SHA256 6d2902fe57ee5fb4f301bd4af67f6a7201bd23706d3a8938637c44451212ad35) through the Management API. No bootstrap/sample-data/reset queries are included.

Incremental planning/assessment migration history verified. Database: {"tables":23,"rls_tables":23}. Receipt: supabase/planning-upgrade-receipt.json. No user content was created, reset or deleted by provisioning.

### Final implementation checkpoint — 2026-11-21

Delivered connected core, retaining the existing foundation:
- Personal subject choices from the profile and active reviewed roadmaps; no global Java/C++ options injected into track creation.
- Reviewed roadmap creation/import, deterministic subject rotation, remaining-topic time allocation, actual assessment/missed-work priority hints, per-day availability and deadline warnings.
- Mandatory routine editor at /planner/customize: laptop three-panel workspace; phone/tablet Subjects/Calendar/Session tabs; week/day/agenda, desktop drop controls, accessible move/resize, commitments, explicit locks, draft autosave/recovery/version history, before/after proposals and approval.
- Daily planner subject groups, topic notes, completion checkboxes, original timers, retained unfinished work, and explicit unlocked daily overrides. Migration 00009 enforces locks/activation links even through direct task APIs. Existing approved templates are not silently replaced by AI.
- Supabase-backed later modules, real context/evidence analytics and mentor, explicit provider/setup errors. No fixed test substitutions, length-based grades, invented activity or hiring-readiness scores.

Live Gemini verification:
- User saved GEMINI_API_KEY locally. Verified the key can list models.
- Hydrogen compatibility/native requests timed out; Flash3.8 probe timed out. Native Flash-Lite probe succeeded. Chose explicit default AI_MODEL=gemini-3.1-flash-lite; no runtime paid/model fallback.
- Native generation initially omitted explanations, so strict validation rejected it without saving. Added provider JSON output shape. The fully bounded schema exceeded Gemini's serving-state complexity; structural types/required fields/enums go to Gemini, while full numeric/text/array/source/rubric invariants stay enforced by server Zod checks.
- Final live script `node --env-file=.env.local scripts/verify-gemini-assessment.cjs` PASSED production generator/grader code paths with nonpersonal, in-memory persistence: 17 records (four subject playlists + DSA), 5 represented subjects, 7 questions, exactly 60 minutes; validated rubric grading gave unrelated long prose 0 marks. No production user assessment/progress records were created. Receipt: supabase/gemini-verification.json.
- Native timeout90s, AI action route maxDuration120. Verify Vercel function-duration configuration during deployment. Code review is AI reasoning review, not sandbox execution. OCR-specific live ingestion and a real signed-in production exam remain separate checks.

Database deployment:
- 00007_routine_planning: 20261121055552.
- 00008_grounded_assessments: 20261121055555.
- 00009_routine_task_guards: 20261121063616.
- Source hashes match deployed receipts. 23 tables, all with RLS. Authenticated reference-answer read/finalization denied, service finalization allowed, anon new RPCs denied. Hosted task guard enabled and not publicly invocable. No bootstrap replay, resets or fake data inserts.
- Service-role key saved ONLY locally after explicit user approval; ignored .env.local permissions verified0600. Gemini key is also local. No private values printed or sent to browser. Initial automatic approval rejection was resolved by explicit authorization; no credential action remains pending.

Final validation:
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS, 0 errors/warnings.
- `npm test`: 77 passed, 0 failed.
- `npm run build`: PASS.
- `npm run test:e2e`: Chromium 7 passed, including full foundation/Google error journeys and 320/390/768/1440 viewport checks across dashboard/planner/DSA/revision/applications/analytics/mentor/settings plus learning/roadmap/routine controls.
- `FORGE_TEST_BROWSER=webkit npm run test:e2e`: WebKit 7 passed with the same widths and touch-enabled controls. Exact required WebKit runtime was installed. Physical iPhone/Safari-app verification was not performed.
- WebKit exposed redundant `router.refresh()` calls after action revalidation; removed them according to installed Next16.4 docs, which include updated RSC in the action response. Also fixed revision-card index advancement after the reviewed card leaves the due list. Tests wait for persisted data, with no retries/sleeps masking failures.
- Additional regressions: JSONB key reordering does not falsely change locks/recovery; last topic block uses remaining time; ZIP inflation bounds actual output even if archive metadata lies; provider failures never create estimated marks or automatic paid fallback.
- `git diff --check`: PASS. npm install audit after the patched ExcelJS UUID override reported0 vulnerabilities.

Resume / production handoff:
1. All source changes remain LOCAL; Vercel was NOT redeployed and code was NOT pushed/merged. Existing Vercel URL will not show these UI changes until this code is deployed.
2. Deploy the reviewed source to the existing connected Vercel project (do not create a new app). Set Production GEMINI_API_KEY and server-only SUPABASE_SERVICE_ROLE_KEY directly; AI_PROVIDER=gemini, AI_MODEL=gemini-3.1-flash-lite, FORGE_DEMO_MODE=false, existing Supabase public variables and NEXT_PUBLIC_SITE_URL=https://forge-planner-22.vercel.app. Never prefix private keys NEXT_PUBLIC. No Vercel credential/access is configured in this workspace.
3. After deployment, verify real Google sign-in, reviewed roadmap save, draft/approval/planner persistence and a real signed-in exam. Existing production callbacks are allow-listed; earlier Auth Site URL pointed to a different alias, so align the canonical origin if still needed.
4. Full master-spec refinements remain staged: deeper onboarding preferences, hierarchical roadmap editing/merging, pointer resize handles (form resizing works), multi-week deadline optimization, broader AI time-window instructions, background grading/usage accounting, code sandboxing, extended/audio/video imports and interview simulation. Undo/redo is bounded and does not cross an explicit persisted-unlock barrier. FEATURE_STATUS.md is authoritative about scope.
5. Do not replay old migrations/bootstrap, re-extract credentials without authorization, claim all master requirements finished, or claim live website changes based on local checks.
