# FORGE prioritized implementation

## Current state

The five sequential foundation increments are implemented: identity/preferences, learning management, daily planner/server-timed sessions, settings/data controls, and local verification. `WORK_LOG.md` is the authoritative resume log, including commands, outcomes and external checks. See README for setup and the five migrations.

## Next milestones, in the user's order

1. **Foundation service verification:** apply unapplied migrations to a Supabase test project, validate hosted signup/confirmation/session refresh/recovery, RLS through PostgREST, real YouTube import and account deletion/storage behavior. These require external configuration and have not been claimed as passing. They do not block local development of the next milestone.
2. **Roadmaps and scheduling:** validated AI roadmap output; reviewed text/PDF/image extraction; editable phases/milestones/topics/prerequisites; capacity-aware daily scheduling with buffer/rest days. Preview and commit rebalancing after missed days, preserving every incomplete task and reporting overflow/deadline compromises explicitly. Use completed topics and assessment evidence to adjust priorities.
3. **Active recall and assessments:** ground questions in saved notes/completed topics with validated source IDs; persistent 60-minute exams, server deadlines, autosave and idempotent submission; objective/rubric grading; topic weakness evidence → revision tasks → fresh retest. Existing AI helpers are scaffolding, not completed workflows.
4. **Placement preparation:** confirmed DSA attempts, spaced repetition, application tracking and grounded mentor.
5. **Refinement:** interview simulator, evidence-based readiness dashboard, detailed analytics, drag-and-drop planning, notifications, Pomodoro presets and production hardening.

## Product acceptance gates

- **Active recall:** notes → sourced questions → answers → explained weaknesses → revision → fresh retest, all persisted for the authenticated user. Completion of videos alone does not establish understanding.
- **Adaptive scheduling:** redistribute missed work within real availability/capacity and prerequisites. Do not silently drop topics or extend deadlines. Explain tradeoffs when capacity is insufficient.
- **Interview readiness:** show separate DSA performance, CS assessment evidence, mock results and recurring weaknesses with dates/sample counts. State insufficient evidence; distinguish estimated mastery from verified skills and never predict hiring outcomes as fact.

## Foundation acceptance

Local checks cover authenticated ownership, invalid input, stale writes, real metadata boundaries, reversible progress, one running timer, refresh recovery, capacity/rest-day warnings, preserved session history, private export and caller-only data deletion. The browser journey uses isolated demo data; PostgreSQL tests use the actual migrations with an Auth-schema fixture. Hosted integrations require the separate checks above.
