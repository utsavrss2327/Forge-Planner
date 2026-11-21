# FORGE architecture

Next.js App Router renders the application; server actions own mutations. Supabase Auth and PostgreSQL with row-level security provide identity and persistence for learning, onboarding and dashboard workflows. Migration 00002 adds atomic learning RPCs and ownership checks. The existing JSON store is used only in explicitly enabled single-user demo mode; it must not be deployed for multiple users. Existing migration `supabase/migrations/00001_initial_schema.sql` defines profiles, learning tracks, playlists, videos, journals, roadmaps, tasks, assessments, mastery, revisions and applications.

## Feedback loop

Learn → Test → Analyze → Revise → Retest → Improve.

Notes, explicit video completion and completed topics ground questions. Video completion measures curriculum progress only. Assessment answers and rubric results provide estimated knowledge evidence; coding skill is verified only by a configured external judge. Readiness must show evidence counts, recency and repeated weaknesses, never infer mastery from videos watched.

Scheduling must respect available days, daily capacity, prerequisites and deadlines. Rebalancing retains all incomplete tasks and reports overflow. Assessment results should add targeted revisions, followed by fresh recall questions to measure improvement.

## Integration boundaries

YouTube metadata comes only from the Data API; failed requests must not create invented content. Unknown durations remain null. OpenAI services are server-side and structured output is validated. Notes and imports are untrusted data. Candidate code must never execute on the Next.js server.

## Foundation services and persistence

`learningContext()` validates the session and provides the authenticated database client/user ID; `readProfile()` is shared by preferences, layout, learning and planning. Forms use shared Zod schemas and real calendar/timezone validation. The request proxy gates incomplete profiles without redirecting onboarding/settings into loops.

Learning RPCs use invoker permissions and RLS. Track and journal edits compare `updated_at`; video updates can require the current version. Existing-track imports lock their parent track and commit metadata/videos/counters together.

Planner mutations lock the profile row per user, then the affected task. This serializes capacity checks and timer transitions. A partial unique index permits only one open session per user. Pause/complete closes a segment using the database clock; resume opens a new segment. Session history survives task deletion. The demo repository mirrors the same transition logic using the server clock.

Exports and preparation reset run under invoker permissions/RLS. Full account deletion is the sole new definer RPC: fixed empty search path, no caller-supplied user ID, authenticated-only execute, and deletion restricted to `auth.uid()`. The server action requires current-password verification before calling it. External Storage/Auth-service behavior remains a hosted integration check.

The local SQL test harness runs migrations unchanged in PGlite with an Auth-schema/identity fixture and a non-superuser authenticated role. Playwright builds an isolated credential-free app and tests a temporary demo store; it does not validate hosted Supabase Auth or actual YouTube playback.


## Hosted privilege verification

Supabase can assign explicit EXECUTE grants to the anon role through default privileges; revoking PUBLIC alone does not remove those grants. Migration 00006 revokes both PUBLIC and anon access to the twelve application RPCs and retains authenticated execution. Database tests reproduce the hosted default and verify the restriction. New RPC migrations must revoke both roles explicitly.

Local provisioning reads the management token only from the ignored environment file. The project setup helper checks the exact project, source fingerprints and hosted state before recording existing migration metadata; it does not expose credentials or rerun a populated schema. The deployment receipt records non-secret verification results. Google provider settings are checked server-side before redirecting so a disabled provider produces an actionable in-app error.

## Connected planning and assessment workflow (2026-11-21)

The foundation is retained. Roadmap, DSA, applications, revision, mentor and evidence analytics now use authenticated Supabase repositories. `/planner/customize` is a mandatory draft/review/approval workspace, backed by deterministic validation and atomic SQL activation. The daily planner groups activated tasks by subject and accepts the day's topic notes and subject completion. The shared prototype store is limited to explicit local demonstrations; AI workflows fail clearly when their required real services are absent.

Assessment provenance/context/schema lives in `src/lib/assessment`. Server actions authorize the user before any service-role operation. RLS and column grants protect reference solutions, deadlines and submission state; generation/finalization use service-only RPCs. See DATABASE_SCHEMA.md, SCHEDULING_ENGINE.md and AI_SYSTEM_DESIGN.md for contracts and current limits. Responsive changes use dynamic viewport height, safe-area padding, touch-sized controls, scrollable dialogs and form alternatives to desktop drag/drop.

Server mutations follow the installed Next.js 16.4 action contract: revalidation includes the current route's updated RSC payload. Redundant client refreshes were removed from learning/planner/placement saves after WebKit exposed navigation races. Revision review resets to the first remaining due item after the server removes the reviewed card, preventing skipped cards. Gemini requests use the native endpoint and simplified provider output structure; complete bounds and business invariants remain in server-side Zod validation.
