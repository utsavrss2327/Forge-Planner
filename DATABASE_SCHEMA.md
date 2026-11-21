# FORGE database

The original 21 Supabase tables remain the source of truth for profiles, roadmap hierarchy, learning, tasks/timers, assessments, mastery, revision and placement records. Row ownership is enforced through RLS and parent joins. Production modules no longer read the prototype file store.

## Planning migration 00007

Adds subject, prerequisite IDs and resource URL to existing roadmap topics; JSON planning preferences to profiles; routine/session links and start minutes to existing daily tasks.

`weekly_routines` holds one week per owner, mutable draft, optimistic version, approved snapshot/version and state. `routine_versions` holds immutable saved snapshots. Clients can select their own rows; mutations go through authenticated RPCs. A draft can be invalid while editing; approval revalidates coverage, availability, capacity, overlap, prerequisites and max subjects inside the transaction. Locked sessions cannot be changed by ordinary draft saves. Explicit unlock and availability-edit paths are separate. Approving again is idempotent. Existing manual, unfinished and completed tasks are preserved; conflicting activation fails atomically.

## Assessment migration 00008

Extends existing assessment tables with saved source snapshots, generation metadata, deadline, source IDs, subject, rubric, estimated minutes and grading details. One answer per question; one revision item per assessment/question. Authenticated callers read owned assessment metadata and safe question columns. Correct answers, explanations and rubrics require the server service role; results release them only after evaluation. Clients cannot write exam scores. Authenticated start/autosave/submit RPCs enforce owner and server deadline. Service-only creation/finalization RPCs persist all related records atomically and prevent repeated grading from duplicating mastery/revisions. Blank/MCQ marks are deterministic; written/code grades are bounded per rubric criterion in application validation.

Exports include routine history and redact pending answer keys; reset deletes only the authenticated caller's root records and cascaded children. No service key reaches the browser. Migrations are additive and never run sample-data inserts or reset functions during setup.

## Deployment

Apply 00007 then 00008 after the previously verified foundation history. The hosted foundation was registered as a bundled migration; do not blindly run `supabase db push` against the original short-numbered files. Use the recorded migration receipt/history and a reviewed incremental deployment. Never replay the bootstrap on this populated project.

## Routine task guard migration 00009

A server-side task trigger prevents direct client inserts/reattachments from claiming an unapproved routine link. Explicit routine locks also protect linked daily-task schedule/assignment fields and deletion. Notes, timer transitions and completion remain editable. Users may explicitly unlock through the routine editor. Unlocked individual overrides are allowed, become unslotted daily work and preserve their historical routine link; this permits overdue recovery beyond the original week. Validated activation and explicit data-reset/account-deletion functions retain their intended transactional behavior.
