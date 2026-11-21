# FORGE implementation status — 2026-11-21

The working authentication, profiles, four-step onboarding, learning tracks/playlists/video notes/journals, daily tasks/timers, settings/export/reset foundation has been preserved.

## Audit and changes

The later modules previously used a shared prototype store, hardcoded identities, canned assessments and length-based grading; the sidebar disabled them intentionally. The subject selector used the global catalog rather than the user's choices. There was no routine approval workflow.

| Workflow | Current state | Verification / remaining dependency |
|---|---|---|
| Personal subject selectors | Uses selected profile subjects and owned active-roadmap subjects; no global Java/C++ options injected | Local browser checks |
| Responsive foundation | Dynamic viewport height, safe-area padding, scrollable dialogs, touch controls, no input zoom on phones | Chromium 320/390/768/1440 widths passed; WebKit verification recorded in WORK_LOG |
| Reviewed roadmaps | Manual topics, prerequisite/resource/estimate review, local Office/text extraction, optional AI proposal | Local parser tests; Gemini proposal/OCR is configured; OCR-specific live checks remain |
| Deterministic routine | Rotation, targets, capacity/rest windows, overlap/prerequisites, subject limits, retained locked sessions | Unit and PostgreSQL integration tests |
| Mandatory routine editor | Week/day/agenda, subject library, desktop drops, accessible inspector move/resize, commitments, locks, undo/redo, draft recovery/autosave, history preview, proposal comparison | Local browser controls + DB persistence tests; authenticated live journey still to verify |
| Approval → daily planner | Explicit approval, transactional activation, stale-edit checks, retained existing tasks, subject topic notes and completion | PostgreSQL tests + preserved foundation browser journey |
| Grounded assessments | Multi-subject video notes/tags, linked journals, completed task notes, DSA approaches and due revision; source/coverage validation | Unit regression models four subject playlists and one DSA attempt |
| Assessment feedback | Exact MCQ scoring, blank zero, AI per-criterion partial credit, no length scoring/fixed fallback; submitted-answer retry | Tests cover invalid grades, provider failures, freeze, deadlines, idempotent mastery/revision; live generation/grading fixture passed |
| DSA, applications, revision | Authenticated Supabase persistence; errors surfaced; deterministic spaced-repetition RPC | Existing schema/RLS + local validation; full hosted interaction not yet verified |
| Mentor | Real saved context, configurable provider, no canned personal scores/activities | Provider key configured; chat cannot mutate schedules |
| Analytics | Separate actual DSA self-reports, assessment samples and topic/revision evidence | No invented placement-ready percentage |

## Hosted state

Migrations 00007, 00008 and 00009 were applied to the existing Supabase project. There are 23 RLS-enabled tables. Hosted checks confirm authenticated users cannot select reference answer keys or invoke final grading, the service role can finalize, and anon cannot invoke the new RPCs. See `supabase/planning-upgrade-receipt.json` for versions and source hashes. Existing user content was not reset.

Frontend changes are local until Vercel redeployment. `GEMINI_API_KEY` is now configured locally and live sourced generation/grading passed with a nonpersonal fixture. The server-only Supabase key was saved locally after explicit user approval and a storage read was verified. The initial automatic approval rejection was resolved by that explicit authorization; no credentials were printed. Production Vercel variables still need configuration.

## Staged requirements, not claimed complete

The entire master prompt is a phased product specification. Remaining refinements include deeper onboarding per-subject priorities/commitments, full hierarchical roadmap editing/merging, automatic multi-week deadline optimization, pointer resize handles, broader natural-language time-window optimization, background grading/usage monitoring, sandboxed code execution, extended/audio/video imports, interview simulation, and physical-device verification. Core routine editing and approval are implemented now; these refinements do not turn prototypes into falsely completed features.

Live AI receipt: `supabase/gemini-verification.json` records 17 fixture sources across four subjects plus DSA, seven validated questions totaling 60 minutes, validated rubric feedback and zero marks for an unrelated written answer. No production assessment records were created by that verification. Gemini uses its native endpoint with a simplified structural output schema; complete bounds, source coverage and rubric sums are enforced on the server after generation.

Final verification: 77 unit/database/action/parser tests; TypeScript; full lint; production build; Chromium7 and WebKit7 browser tests, all passing. Browser widths:320/390/768/1440, with touch-enabled WebKit; physical devices not tested. Redundant client save refreshes were removed to resolve WebKit races. New-week priority hints now use assessment/missed-work evidence, saved optional/mandatory targets persist, final topic blocks use remaining time, and target-date overflow is visible. The production frontend still requires deployment of these source changes and production environment configuration.
