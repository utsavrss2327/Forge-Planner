# FORGE — placement preparation workspace

FORGE connects personal preparation preferences, reviewed roadmaps, user-approved study routines, learning notes and active recall. Existing account, learning and timer data is preserved.

## Run locally

```sh
npm install
cp .env.example .env.local
npm run dev
```

Use the existing `.env.local` if one is already configured; do not overwrite it. Open http://localhost:3000. Set Supabase's site/callback URLs to the environment you are using. Google client credentials belong in Supabase Auth > Providers, not browser environment variables.

## Connected workflow

1. Complete four-step onboarding and choose your subjects.
2. Create a manual roadmap, import learning material, or request an AI proposal.
3. Review subjects, topics, time estimates, resources and prerequisites.
4. Open `/planner/customize`, set per-day availability and weekly subject targets, and propose a balanced week.
5. Edit the draft using calendar drops or keyboard/touch-friendly inspector controls. Lock important sessions, add fixed commitments, compare proposals, undo changes and resolve validation errors.
6. Choose **Approve & activate**. Only this step creates daily planner tasks. Existing unfinished work is retained and conflicts block activation.
7. Add the day's specific topics under each scheduled subject, study, and mark tasks/subjects complete. Timers record actual time separately.
8. Record notes/topics on studied playlist videos, link journals to a subject track, and log DSA approaches/mistakes.
9. Review assessment learning sources, generate a 60-minute test, start its timer, answer and submit. Review criterion-level feedback and source references; revisit weak concepts and take a fresh retest.

The sidebar now links to real roadmap, routine, assessment, DSA, revision, analytics, applications and mentor pages. AI-dependent actions show explicit setup/provider errors; they never substitute invented questions, scores or mentor replies.

## Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your hosted Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public publishable/anon key, never a service key |
| `NEXT_PUBLIC_SITE_URL` | Canonical app origin, e.g. https://forge-planner-22.vercel.app |
| `FORGE_DEMO_MODE` | `false` for real accounts; local demo is labelled single-user sample data |
| `YOUTUBE_API_KEY` | Server-only YouTube Data API key for playlist metadata |
| `AI_PROVIDER` | `gemini` by default; `groq` or `openai` only when explicitly selected |
| `AI_MODEL` | Default `gemini-3.1-flash-lite`; may be changed to a model available to your account |
| `GEMINI_API_KEY` | Server-only Gemini key from Google AI Studio |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only assessment persistence/grading key; protects private answer keys |
| `SUPABASE_ACCESS_TOKEN` | Optional local provisioning token; never required in the deployed app |

Gemini's current free tier has model/account quotas and may use content for product improvement. Review [Google's pricing and data terms](https://ai.google.dev/gemini-api/docs/pricing). There is no automatic paid fallback. Keep the Google project on the intended free setup; FORGE cannot enforce a billing tier configured outside the app. The model is configurable; stronger models may have higher latency or different quotas. A Google login OAuth client is different from a Gemini API key.

Set environment variables separately in Vercel Production and redeploy; `NEXT_PUBLIC_*` values are included at build time. Never commit `.env.local` or send private keys in chat.

## Database

New installations apply migrations `00001` through `00009` in order. The original guarded `supabase/bootstrap-forge.sql` bundles only `00001`–`00005`; it is retained as a historical bootstrap and refuses populated databases. Existing hosted project migration history uses a recorded foundation bundle and separate hardening versions; reconcile that history before any CLI `db push`. Never replay the bootstrap on the live project.

The new migrations extend existing tables and add routine draft/history tables. Migration 00009 prevents daily-task mutations from bypassing routine activation or explicit locks, while allowing unlocked daily overrides and overdue recovery. Owned reads use RLS. Routine mutation/activation runs through validated authenticated RPCs. Exam creation/finalization requires the server service role; start/autosave/submit uses the authenticated user's RPCs. Reference answers/rubrics are hidden before evaluation. Export/reset includes routine data and remains scoped to the caller.

## Import capabilities

TXT, Markdown, CSV and JSON extraction; DOCX plain-text extraction; XLSX worksheet/row text extraction. PDF/JPG/PNG transcription is wired to Gemini and requires its key. All extracted material is reviewed before roadmap persistence. Office archive/size limits are enforced; formulas and uploaded code are never executed. Audio/video transcription and extended formats are not enabled.

## Verification

```sh
npm test
npx tsc --noEmit
npm run lint
npm run build
npm run test:e2e
```

Database tests execute actual migrations in PostgreSQL-compatible PGlite fixtures and check owner isolation, locks, stale versions, approval atomicity, private answer keys, deadlines, submission freeze and idempotent feedback. Browser tests use an isolated, explicitly labelled local demo and Chromium desktop/mobile viewport sizes. They do not prove real Google OAuth, Gemini responses, hosted writes, Safari or physical iPhone behavior.

See [WORK_LOG.md](WORK_LOG.md) for exact executed outcomes and the resume point; [FEATURE_STATUS.md](FEATURE_STATUS.md), [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md), [SCHEDULING_ENGINE.md](SCHEDULING_ENGINE.md) and [AI_SYSTEM_DESIGN.md](AI_SYSTEM_DESIGN.md) for contracts and remaining work.

## Current limits

The scheduler plans one week at a time. Rebalancing is previewed and approved, not silently applied across months. Resizing uses inspector controls rather than a pointer resize handle. AI allocation optimization does not interpret every arbitrary time-window preference. Coding feedback is AI reasoning review, not sandboxed execution. Provider-backed generation/OCR needs a live API key and verification. AI actions use a 120-second route limit and bounded provider requests; verify compatible function-duration settings on your Vercel plan. The full master specification remains a staged roadmap, including background grading, extended imports, interview simulation and more detailed planning preferences.
