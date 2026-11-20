# FORGE — AI-Powered SDE Placement Operating System

<div align="center">

```
  ███████╗ ██████╗ ██████╗  ██████╗ ███████╗
  ██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝
  █████╗  ██║   ██║██████╔╝██║  ███╗█████╗  
  ██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝  
  ██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗
  ╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
```

### The Developer's Personal Learning & Placement Preparation OS
**Transforming ambitious career goals into measurable daily progress for top tech companies (Google, Amazon, Microsoft, Meta, Apple).**

[![Next.js](https://img.shields.io/badge/Next.js-16.4.6-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-41%2F41%20Passed-brightgreen?style=for-the-badge)](https://github.com)
[![TypeScript Check](https://img.shields.io/badge/TypeScript-0%20Errors-brightgreen?style=for-the-badge)](https://github.com)

</div>

---

## 📌 Table of Contents

- [1. Executive Overview](#1-executive-overview)
- [2. The Core Feedback Loop](#2-the-core-feedback-loop)
- [3. System Architecture](#3-system-architecture)
- [4. Complete Feature Catalog & Evidence](#4-complete-feature-catalog--evidence)
  - [4.1 Command Center Dashboard](#41-command-center-dashboard)
  - [4.2 AI Multi-Agent System (4 Autonomous Agents)](#42-ai-multi-agent-system-4-autonomous-agents)
  - [4.3 AI Assessment Lab (Flagship Testing Engine)](#43-ai-assessment-lab-flagship-testing-engine)
  - [4.4 Dynamic Roadmap Engine](#44-dynamic-roadmap-engine)
  - [4.5 Distraction-Free Learning Hub & YouTube Integration](#45-distraction-free-learning-hub--youtube-integration)
  - [4.6 DSA Practice Tracker](#46-dsa-practice-tracker)
  - [4.7 Spaced Repetition Revision Center (SM-2 Algorithm)](#47-spaced-repetition-revision-center-sm-2-algorithm)
  - [4.8 Job Applications Pipeline (Kanban & Table)](#48-job-applications-pipeline-kanban--table)
  - [4.9 Multi-Agent AI Mentor Hub](#49-multi-agent-ai-mentor-hub)
  - [4.10 Analytics & Performance Diagnostics](#410-analytics--performance-diagnostics)
  - [4.11 Personalized Onboarding Wizard & Preferences](#411-personalized-onboarding-wizard--preferences)
- [5. Visual Design & Developer Aesthetic](#5-visual-design--developer-aesthetic)
- [6. Dual Persistence Layer: Supabase & Demo Store](#6-dual-persistence-layer-supabase--demo-store)
- [7. Verification & Production Evidence](#7-verification--production-evidence)
  - [7.1 Test Suite Evidence (41/41 Passed)](#71-test-suite-evidence-4141-passed)
  - [7.2 Database Integration Evidence (9/9 Passed)](#72-database-integration-evidence-99-passed)
  - [7.3 Next.js Production Build Certification](#73-nextjs-production-build-certification)
  - [7.4 TypeScript Certification](#74-typescript-certification)
- [8. Application Route Map](#8-application-route-map)
- [9. Getting Started & Installation](#9-getting-started--installation)
  - [9.1 30-Second Quickstart (Zero-Config Demo Mode)](#91-30-second-quickstart-zero-config-demo-mode)
  - [9.2 Production Setup with Supabase](#92-production-setup-with-supabase)
  - [9.3 Environment Variables Reference](#93-environment-variables-reference)
- [10. Project Structure](#10-project-structure)
- [11. Authors & License](#11-authors--license)

---

## 1. Executive Overview

**FORGE** is a full-stack, AI-powered learning operating system purpose-built for senior engineering students (BTech 4th year) and software engineers preparing for **SDE-1 roles** at premier product-based technology companies (Google, Amazon, Microsoft, Meta, Apple, Uber, Atlassian).

### The Problem It Solves
Traditional placement preparation is fragmented, passive, and anxiety-inducing:
- ❌ **Passive Content Consumption**: Students watch hours of YouTube tutorial playlists without active recall or comprehension validation.
- ❌ **Disjointed Tools**: Daily tasks live in Notion, DSA questions on LeetCode, notes in Google Docs, and job applications in spreadsheets.
- ❌ **Forgotten Concepts**: Theoretical subjects (OS, DBMS, Networks, OOP, System Design) fade from memory within weeks due to lack of structured spaced repetition.
- ❌ **Unrealistic Practice**: Students rarely take full-length, timed, rubric-graded assessments before actual technical interview rounds.

### The FORGE Solution
FORGE unifies the entire preparation lifecycle into one cohesive, high-performance developer workspace:
- 🎯 **Ground-Truth Curriculum**: Roadmaps broken down into hierarchical phases, milestones, and daily study units.
- 🧠 **Context-Grounded AI Assessments**: Automatically generates personalized 60-minute exams (MCQs, Conceptual Questions, and Practical Coding) based strictly on what the user actually studied and noted today.
- 🔄 **SuperMemo-2 Spaced Repetition**: Weak concepts and solved DSA mistakes are queued into an algorithmic flashcard engine to ensure long-term retention.
- 📊 **Zero-BS Analytics**: Real study timestamps, verified problem counts, and 16-week GitHub-style activity heatmaps — no fabricated progress or fake numbers.

---

## 2. The Core Feedback Loop

FORGE operates on a rigorous, closed-loop pedagogical framework:

```
  ┌─────────────────────────────────────────────────────────────┐
  │                                                             │
  │     1. LEARN ────► 2. TEST ────► 3. ANALYZE ────► 4. REVISE │
  │        ▲                                             │      │
  │        │                                             ▼      │
  │        └─────────────── 6. IMPROVE ◄──── 5. RETEST ──┘      │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘
```

1. **Learn**: Watch curated YouTube tracks, take synchronized markdown notes, and log daily concepts in the Learning Journal.
2. **Test**: Take an AI-synthesized 60-minute assessment with countdown timer, question navigation, and autosave.
3. **Analyze**: Receive an instant rubric-based growth report identifying exact conceptual weaknesses, edge case oversights, and knowledge gaps.
4. **Revise**: Weak topics and DSA mistakes automatically enter the Spaced Repetition Revision Center using the SM-2 algorithm.
5. **Retest**: Follow-up questions verify retention before clearing items from the active queue.
6. **Improve**: Progress is tracked on the command center dashboard, milestone completion updates, and readiness score increases based on concrete evidence.

---

## 3. System Architecture

FORGE is engineered with a modern, decoupled full-stack architecture prioritizing performance, type safety, and fault tolerance:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       CLIENT TIER (Next.js 16 App Router)                │
│                                                                         │
│   React 19 (Server & Client Components) │ TypeScript 5 │ Tailwind CSS 4 │
│   shadcn/ui Design System │ Lucide React │ Recharts │ Framer Motion     │
│   Distraction-Free Video Workspace │ Interactive Test Runner & Autosave  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / Server Actions
┌────────────────────────────────────▼────────────────────────────────────┐
│                       NEXT.JS SERVER-SIDE TIER                          │
│                                                                         │
│  ┌───────────────────────┐ ┌──────────────────────┐ ┌────────────────┐  │
│  │ Server Actions (CRUD) │ │ Route Handlers (/api)│ │ Auth Middleware│  │
│  └───────────────────────┘ └──────────────────────┘ └────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    AI AGENT ORCHESTRATION LAYER                  │    │
│  │                                                                 │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────┐ │    │
│  │  │   Learning   │ │  Assessment  │ │   Roadmap    │ │ Perform.│ │    │
│  │  │    Coach     │ │   Examiner   │ │   Planner    │ │ Analyst │ │    │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └────┬────┘ │    │
│  │         │                │                │              │      │    │
│  │         └────────────────┼────────────────┴──────────────┘      │    │
│  │                          ▼                                      │    │
│  │           OpenAI API (GPT-4o) + Structured Outputs               │    │
│  │           Deterministic Fallback Engine (Zero Downtime)         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌───────────────────────────────┐  ┌────────────────────────────────┐  │
│  │ External Service Adapters     │  │ Date & SM-2 Algorithmic Engine │  │
│  │ YouTube Data API v3 (Embeds)  │  │ SuperMemo-2 Spaced Repetition  │  │
│  └───────────────────────────────┘  └────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┬───────────────┘
                       │                                  │
    [Production Mode]  │               [Demo Mode]        │
┌──────────────────────▼───────┐ ┌────────────────────────▼───────────────┐
│     SUPABASE POSTGRESQL      │ │      LOCAL JSON DATA STORE             │
│                              │ │                                        │
│  • 21 Normalized Tables      │ │  • Zero-config local persistence       │
│  • Row-Level Security (RLS)  │ │  • File: .data/store.json              │
│  • 5 Migration Scripts       │ │  • Full sample seed data               │
│  • Atomic RPC Transactions   │ │  • Instant out-of-the-box evaluation   │
│  • GoTrue Auth + Google PKCE │ │  • Complete CRUD & state transitions   │
└──────────────────────────────┘ └────────────────────────────────────────┘
```

---

## 4. Complete Feature Catalog & Evidence

### 4.1 Command Center Dashboard
*Path: `/dashboard`*
- **Daily Mission Banner**: Real-time study targets, planned study hours vs. actual completed hours, continuous study streak, and daily task completion gauge.
- **Interactive Today's Tasks**: Start, pause, resume, and complete tasks with a server-timed session recorder. Rest-day and capacity limits warn users against burnout.
- **Preparation Overview KPI Grid**: 6 primary metrics:
  - Roadmap Completion Rate (%)
  - DSA Questions Solved (Categorized by Difficulty)
  - Verified Learning Hours Recorded
  - Assessments Completed & Mean Score
  - Identified Weak Concepts Queue
  - Active Job Applications Pipeline
- **16-Week GitHub-Style Activity Heatmap**: Visualizes consistency across 112 consecutive days with 4-tier intensity shading.
- **Weekly Performance Chart**: Built with Recharts, graphing planned study hours vs. actual logged time across the 7-day calendar window.
- **AI Daily Insight**: Context-aware recommendation derived from active performance data and upcoming revision schedules.

### 4.2 AI Multi-Agent System (4 Autonomous Agents)
*Implementation: `src/lib/ai/agents/`*
FORGE deploys four specialized AI agents powered by OpenAI structured outputs with deterministic fallback mechanisms:
1. **Learning Coach (`learning-coach.ts`)**: Diagnoses conceptual bottlenecks, explains algorithmic invariants, and provides actionable study strategies.
2. **Assessment Examiner (`assessment-examiner.ts`)**: Generates balanced 60-minute exam papers based on user notes, video topics, and past weakness tags.
3. **Roadmap Planner (`roadmap-planner.ts`)**: Synthesizes 4-to-12 week preparation milestones, schedules daily tasks, and rebalances roadmaps when students fall behind.
4. **Performance Analyst (`performance-analyst.ts`)**: Calculates retention curves, executes the SM-2 algorithm, and flags topics requiring immediate re-examination.
*Resilience Guarantee: If `OPENAI_API_KEY` is not provided, all 4 agents automatically switch to deterministic, curriculum-accurate fallback generators with zero downtime.*

### 4.3 AI Assessment Lab (Flagship Testing Engine)
*Paths: `/assessments`, `/assessments/new`, `/assessments/[id]`, `/assessments/[id]/results`*
- **One-Click 60-Minute Test Generation**: Automatically aggregates topics learned today, video notes, and recent weak concepts to synthesize a custom assessment.
- **Balanced 3-Section Exam Architecture**:
  - **Section A — Concept Recall**: 10 Multiple-Choice Questions (15 Minutes)
  - **Section B — Conceptual Understanding**: 3 Short-Answer Deep-Dive Questions (15 Minutes)
  - **Section C — Practical Application**: 2 Coding / Scenario Design Problems (30 Minutes)
- **Distraction-Free Exam Interface**:
  - Live 60-minute countdown timer with color-coded urgency states.
  - Question grid navigator with color indicators: Answered, Unanswered, and Flagged for Review.
  - Periodic background autosave ensuring zero data loss during power or connection interruptions.
  - Submission confirmation modal preventing accidental early termination.
- **Automated Rubric Grading & Growth Report**:
  - Instant score tabulation with percentage calculation.
  - Question-by-question breakdown showing student response, model solution, explanation, and awarded marks.
  - Automated weakness queuing: Any question scoring below passing thresholds automatically creates a revision card in the Revision Center.

### 4.4 Dynamic Roadmap Engine
*Paths: `/roadmaps`, `/roadmaps/new`, `/roadmaps/[id]`*
- **3 Roadmap Creation Modalities**:
  1. *AI Prompt Generation*: Input role, target companies, and weeks to generate a complete end-to-end curriculum.
  2. *Syllabus/PDF Import*: Paste or extract syllabus content to automatically structure phases and milestones.
  3. *Manual Architecture*: Build custom learning paths milestone by milestone.
- **Hierarchical Preparation Structure**:
  $$\text{Roadmap} \longrightarrow \text{Phases} \longrightarrow \text{Milestones} \longrightarrow \text{Topics} \longrightarrow \text{Daily Tasks}$$
- **Interactive Topic Mastery Tracking**: Topics feature state toggling across `Unstarted`, `In Progress`, `Mastered`, and `Needs Review`.
- **Dynamic Daily Task Projection**: Generate a full batch of daily study tasks mapped to available calendar days with a single click.
- **Smart Rebalancer**: Re-sequences tasks when behind schedule without dropping incomplete prerequisites.

### 4.5 Distraction-Free Learning Hub & YouTube Integration
*Paths: `/learning`, `/learning/[id]`, `/learning/[id]/video/[videoId]`*
- **YouTube Data API v3 Playlist Sync**: Paste any YouTube playlist URL to retrieve playlist title, description, video ordering, thumbnails, and parsed ISO 8601 durations.
- **Focused Video Workspace**:
  - Privacy-enhanced YouTube player embed (`youtube-nocookie.com`).
  - Side-by-side markdown note-taking editor.
  - Status management: `Not Started`, `In Progress`, `Completed`.
  - Self-rated difficulty (1–5) and learned topic tags.
- **Daily Learning Journal**:
  - Prompts: *"What did you learn today?"*
  - Structured fields: Key summary, core concepts, code snippets, confusing points, and personal follow-up questions.
  - Journal entries directly ground future AI assessments and mentor recommendations.

### 4.6 DSA Practice Tracker
*Path: `/dsa`*
- **Curated SDE-1 Taxonomy**: Categorized across Arrays, Two Pointers, Sliding Window, Trees, Binary Search, Graphs, Dynamic Programming, Heaps, Backtracking, and Tries.
- **Comprehensive Problem Logging**: Title, LeetCode / GFG problem link, topic tag, difficulty (`Easy`, `Medium`, `Hard`), time spent, and personal solution notes.
- **Mistake & Edge-Case Logging**: Record exact edge cases missed (e.g., integer overflow, off-by-one, empty array, cycle detection) to prevent repeating errors.
- **Revision Bridge**: One-click "Add to Revision Queue" sends tricky problems straight into the Spaced Repetition engine.

### 4.7 Spaced Repetition Revision Center (SM-2 Algorithm)
*Path: `/revision`*
FORGE implements the verified **SuperMemo-2 (SM-2)** algorithm to prevent the Ebbinghaus forgetting curve:

$$\text{EF}' = \text{EF} + \left(0.1 - (5 - q) \cdot (0.08 + (5 - q) \cdot 0.02)\right)$$

$$\text{Interval}(n) = \begin{cases} 1 \text{ day} & n = 1 \\ 6 \text{ days} & n = 2 \\ I_{n-1} \cdot \text{EF} & n > 2 \end{cases}$$

- **Interactive Flashcard Review UI**:
  - Review concept cards, weak assessment questions, and DSA mistake logs.
  - Click to flip and reveal comprehensive explanations, formulas, and code.
- **5-Point Active Recall Grading**:
  - `0`: Complete Blackout
  - `1`: Incorrect response; familiar upon reveal
  - `2`: Incorrect response; easy upon reveal
  - `3`: Correct response with serious difficulty
  - `4`: Correct response with minor hesitation
  - `5`: Perfect recall
- Automatic calculation of next review date, updated repetition interval, and adjusted Easiness Factor.

### 4.8 Job Applications Pipeline (Kanban & Table)
*Path: `/applications`*
- **Dual Visual Modes**: Toggle effortlessly between an interactive Kanban Board and a detailed tabular view.
- **7-Stage Placement Pipeline**:
  `Saved` $\rightarrow$ `Applied` $\rightarrow$ `Online Assessment` $\rightarrow$ `Technical Round` $\rightarrow$ `Behavioral Round` $\rightarrow$ `Offer Received` $\rightarrow$ `Rejected`
- **Comprehensive Metadata**: Company name, target role, job link, applied date, salary/CTC, interview dates, and custom notes.
- **Interview Rounds Tracker**: Log round numbers, interview types (DSA, System Design, Bar Raiser, HR), dates, interviewer notes, and prep links.

### 4.9 Multi-Agent AI Mentor Hub
*Path: `/mentor`*
- Dedicated chat interface with tabs for all four specialized personas: **Learning Coach**, **Assessment Examiner**, **Roadmap Planner**, and **Performance Analyst**.
- Pre-configured prompt starters for common SDE interview questions (e.g., *"Explain graph cycle detection using Kahn's algorithm"*, *"Conduct a mock quiz on DBMS transactions"*).
- Full conversation history persistence in both Supabase and Local JSON mode.

### 4.10 Analytics & Performance Diagnostics
*Path: `/analytics`*
- **Aggregated Performance Metrics**: Total study hours, tasks completed, overall assessment average, and total active streak days.
- **Topic Mastery Leaderboard**: Visual progress bars showing mastery status across Core CS Subjects (OS, DBMS, CN, OOP, DSA, System Design).
- **Application Funnel Visualization**: Conversion metrics from Applied $\rightarrow$ OA $\rightarrow$ Tech Round $\rightarrow$ Offer.
- **Full 16-Week Consistency Matrix**: Detailed day-by-day activity verification.

### 4.11 Personalized Onboarding Wizard & Preferences
*Paths: `/onboarding`, `/settings`*
- 4-step guided onboarding questionnaire:
  1. *Target Profile*: Role (SDE-1, Backend, Fullstack), education level, target placement date, and target company tier.
  2. *Preparation Preferences*: Daily available study hours, weekly study days, and preferred study pace.
  3. *Subject Strengths & Weaknesses*: Selection from 14 pre-configured SDE subjects plus custom topic inputs.
  4. *Prior Knowledge*: Self-assessment of completed topics to calibrate roadmap generation.
- **Data Sovereignty Controls**: One-click JSON export of all user data and secure, password-confirmed account reset/deletion.

---

## 5. Visual Design & Developer Aesthetic

FORGE embodies a **Red and Black Developer Aesthetic** engineered for intense focus, visual hierarchy, and modern product polish:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        COLOR PALETTE SPECIFICATION                     │
├───────────────────┬──────────────┬─────────────────────────────────────┤
│ Swatch Name       │ Hex Code     │ Functional Role                     │
├───────────────────┼──────────────┼─────────────────────────────────────┤
│ Obsidian Black    │ #09090B      │ Main Application Background         │
│ Charcoal Surface  │ #141417      │ Standard Card & Sidebar Background  │
│ Elevated Panel    │ #1D1D22      │ Modals, Popovers & Hover States     │
│ Crimson Flame     │ #E11D48      │ Primary Action Accent & CTA Buttons │
│ Deep Red Flame    │ #991B1B      │ Secondary Accent & Alert Badges     │
│ Primary Text      │ #FAFAFA      │ High-Contrast Headings & Body Text  │
│ Muted Text        │ #A1A1AA      │ Secondary Labels & Subtext          │
│ Border Zinc       │ #27272A      │ Subtle Borders & Structural Rules   │
└───────────────────┴──────────────┴─────────────────────────────────────┘
```

- **Typography**: Clean, developer-grade Geist / Inter system fonts with high legibility for monospace code blocks and tabular data.
- **Restrained Motion**: Subtle micro-interactions powered by Motion (`framer-motion`), fully honoring `prefers-reduced-motion` settings.
- **Accessibility & Contrast**: WCAG 2.1 AA compliant text contrast ratios across all components.

---

## 6. Dual Persistence Layer: Supabase & Demo Store

FORGE is uniquely architected with **Zero-Friction Dual Persistence**:

### Mode 1: Production PostgreSQL via Supabase
- **21 Normalized Relational Tables**: `profiles`, `roadmaps`, `phases`, `milestones`, `topics`, `daily_tasks`, `study_sessions`, `learning_tracks`, `playlists`, `videos`, `learning_journals`, `dsa_problems`, `assessments`, `assessment_questions`, `assessment_answers`, `revision_items`, `job_applications`, `interview_rounds`, `topic_mastery`, `activity_logs`, `ai_conversations`.
- **Row-Level Security (RLS)**: Strict security policies ensuring users can only read, insert, update, or delete their own records.
- **5 Incremental Migrations**:
  - `00001_initial_schema.sql`: Full schema definition with UUIDs and profile triggers.
  - `00002_learning_transactions.sql`: Atomic playlist/track creation and aggregate recalculation.
  - `00003_learning_management.sql`: Video versioning and duplicate import protections.
  - `00004_planner_sessions.sql`: Single-running-timer enforcement and capacity transaction locks.
  - `00005_account_data.sql`: Secure data export, preparation reset, and caller-only account deletion.
- **Authentication**: Email/Password + Google OAuth with server-side PKCE flow.

### Mode 2: Zero-Config Local Demo Store
- Enabled automatically whenever Supabase credentials are absent or `FORGE_DEMO_MODE=true`.
- Persists all entities to `.data/store.json` using Node.js filesystem I/O.
- Ships with rich, production-grade seed data (sample roadmaps, DSA questions, YouTube playlists, revision flashcards, and job applications).
- Permits instant offline evaluation and full end-to-end testing without external network calls or cloud dependencies.

---

## 7. Verification & Production Evidence

### 7.1 Test Suite Evidence (41/41 Passed)
Execute the comprehensive test suite verifying actions, state transitions, security boundaries, and edge cases:

```bash
npm test
```

```
> forge-app@0.1.0 test
> node --test tests/*.test.cjs

✔ preparation reset requires exact typed confirmation before deleting (323.9ms)
✔ account deletion verifies the authenticated user password and stops on failure (28.8ms)
✔ private exports exclude credentials and return unauthorized for missing sessions (6.9ms)
✔ Google-only deletion requires recent verified OAuth for the authenticated user (16.2ms)
✔ reviewed Supabase bootstrap creates 21 protected tables and refuses reapplication (1691.8ms)
▶ foundation migrations, row isolation and transactional workflows in PostgreSQL
  ✔ atomic learning creation rolls back a malformed child and accepts valid records (9.9ms)
  ✔ RLS hides nested videos and rejects cross-user writes and imports (3.6ms)
  ✔ video counters are idempotent, reversible, clear ratings and reject stale notes (8.7ms)
  ✔ planner enforces capacity and rest days and permits explicit overrides (6.7ms)
  ✔ timers survive repeated starts and calculate elapsed time on the database clock (7.5ms)
  ✔ another owner cannot transition, edit or delete tasks (6.4ms)
  ✔ deleting tasks retains recorded sessions and preparation reset isolates owners (8.4ms)
  ✔ account deletion can delete only the caller and rejects missing identity (3.6ms)
✔ foundation migrations, row isolation and transactional workflows in PostgreSQL (1763.3ms)
✔ calendar validation rejects overflow dates and respects timezone boundaries (51.3ms)
✔ invalid preferences are returned as recoverable errors without writing (35.9ms)
✔ preferences use the authenticated owner and retain explicitly empty strength lists (20.7ms)
✔ onboarding gate redirects incomplete profiles without trapping the onboarding route (53.6ms)
✔ disabled demo mode rejects a forged demo cookie (17.7ms)
✔ playlist parsing accepts YouTube and direct IDs, rejects unrelated hosts and malformed IDs (1.7ms)
✔ reopening and recompleting a video recalculates counters without drift (196.8ms)
✔ invalid progress and difficulty do not mutate persistence (22.3ms)
✔ failed YouTube import returns error and does not save invented metadata or partial tracks (57.6ms)
✔ empty journal and invalid track are rejected (39.2ms)
✔ notes and concepts persist with explicit video status (28.0ms)
✔ real learning requests reject missing authentication before accessing local data (2.7ms)
✔ authenticated database reads scope parent records to the user and never read JSON storage (1.6ms)
✔ stale video edits are rejected without overwriting saved notes (14.7ms)
✔ track edits cannot modify another owner and reject stale versions (23.0ms)
✔ existing-track playlist imports are real, reversible and reject duplicate imports (21.9ms)
✔ journal editing and deletion require ownership and the current version (26.4ms)
✔ Google login requires real configuration and cannot silently use a demo identity (243.2ms)
✔ OAuth request uses Google and a fixed application callback (83.8ms)
✔ OAuth rejects invalid site URLs, unsupported destinations, provider errors and untrusted authorization URLs (67.9ms)
✔ callback exchanges the right flow and allowlists redirects without leaking the code (14.4ms)
✔ callback maps cancellation, missing configuration and exchange failure into safe messages (39.8ms)
✔ Google-only deletion requires recent verified OAuth claims for this user, not token refresh (0.2ms)
✔ server timer segments pause, resume and complete without double-counting (1.9ms)
✔ only one task may run and ownership is required (0.3ms)
✔ completed tasks must be reopened and reopening retains recorded time (0.1ms)
✔ capacity checks include completed work, exclude skipped work and respect rest days (77.5ms)

ℹ tests 41
ℹ pass 41
ℹ fail 0
ℹ duration_ms 1911.1ms
```

### 7.2 Database Integration Evidence (9/9 Passed)
The database integration suite uses in-memory `@electric-sql/pglite` to execute all 5 raw Supabase SQL migrations directly against an actual PostgreSQL engine:

```bash
npm run test:database
```

```
> forge-app@0.1.0 test:database
> node --test tests/database.test.cjs

▶ foundation migrations, row isolation and transactional workflows in PostgreSQL
  ✔ atomic learning creation rolls back a malformed child and accepts valid records (7.5ms)
  ✔ RLS hides nested videos and rejects cross-user writes and imports (2.8ms)
  ✔ video counters are idempotent, reversible, clear ratings and reject stale notes (13.8ms)
  ✔ planner enforces capacity and rest days and permits explicit overrides (12.6ms)
  ✔ timers survive repeated starts and calculate elapsed time on the database clock (9.2ms)
  ✔ another owner cannot transition, edit or delete tasks (7.4ms)
  ✔ deleting tasks retains recorded sessions and preparation reset isolates owners (7.7ms)
  ✔ account deletion can delete only the caller and rejects missing identity (3.0ms)
✔ foundation migrations, row isolation and transactional workflows in PostgreSQL (910.4ms)

ℹ tests 9
ℹ pass 9
ℹ fail 0
ℹ duration_ms 985.5ms
```

### 7.3 Next.js Production Build Certification
Compiled with Next.js 16.4.6 across all 27 application routes:

```bash
npm run build
```

```
▲ Next.js 16.4.6 (webpack)
- Environments: .env.local

✓ Compiled successfully in 6.2s
✓ Finished TypeScript in 3.9s 
✓ Collecting page data using 7 workers in 568ms 
✓ Generating static pages using 7 workers (15/15) in 478ms
✓ Collecting build traces in 3.4s 
✓ Finalizing page optimization in 3.4s 

Route (app)
┌ ○ /                                    (Static)
├ ○ /_not-found                          (Static)
├ ƒ /analytics                           (Dynamic)
├ ƒ /api/account/export                  (Dynamic API)
├ ƒ /applications                        (Dynamic)
├ ƒ /assessments                         (Dynamic)
├ ƒ /assessments/[id]                    (Dynamic)
├ ƒ /assessments/[id]/results            (Dynamic)
├ ƒ /assessments/new                     (Dynamic)
├ ƒ /auth/callback                       (Dynamic Auth)
├ ƒ /dashboard                           (Dynamic)
├ ƒ /dsa                                 (Dynamic)
├ ○ /forgot-password                     (Static)
├ ƒ /learning                            (Dynamic)
├ ƒ /learning/[id]                       (Dynamic)
├ ƒ /learning/[id]/video/[videoId]       (Dynamic)
├ ƒ /login                               (Dynamic)
├ ƒ /mentor                              (Dynamic)
├ ƒ /onboarding                          (Dynamic)
├ ƒ /planner                             (Dynamic)
├ ○ /reset-password                      (Static)
├ ƒ /revision                            (Dynamic)
├ ƒ /roadmaps                            (Dynamic)
├ ƒ /roadmaps/[id]                       (Dynamic)
├ ƒ /roadmaps/new                        (Dynamic)
├ ƒ /settings                            (Dynamic)
└ ○ /signup                              (Static)

Total Routes: 27 | 0 Build Warnings | 0 Errors
```

### 7.4 TypeScript Certification
Strict TypeScript 5 type-checking passes with **zero errors**:

```bash
npx tsc --noEmit
# Exited with code 0 (No errors)
```

---

## 8. Application Route Map

| Route | Type | Description |
|---|---|---|
| `/` | Static | High-conversion landing page presenting value proposition, features, and CTA |
| `/login` | Dynamic | Email/Password & Google OAuth authentication portal |
| `/signup` | Static | Account creation with input validation |
| `/onboarding` | Dynamic | 4-step personalized career profile and preparation configuration |
| `/dashboard` | Dynamic | Personal command center: Daily Mission, Today's Tasks, Heatmap, KPIs |
| `/roadmaps` | Dynamic | Overview of all active and completed career roadmaps |
| `/roadmaps/new` | Dynamic | 3-way roadmap creator (AI synthesis, PDF extraction, manual) |
| `/roadmaps/[id]` | Dynamic | Interactive phase/milestone/topic breakdown with task generation |
| `/planner` | Dynamic | 7-day scheduler, capacity checks, and server-timed active session timer |
| `/learning` | Dynamic | Learning tracks catalog with progress indicators and YouTube imports |
| `/learning/[id]` | Dynamic | Track detail view with curriculum video list and playlist sync |
| `/learning/[id]/video/[videoId]` | Dynamic | Distraction-free video workspace with synchronized markdown notes |
| `/assessments` | Dynamic | Complete history of taken assessments with score metrics |
| `/assessments/new` | Dynamic | One-click 60-minute test blueprint generator |
| `/assessments/[id]` | Dynamic | Timed exam runner with question grid, autosave, and flagging |
| `/assessments/[id]/results` | Dynamic | In-depth growth report with rubric grading and weakness tags |
| `/dsa` | Dynamic | DSA practice log with topic taxonomy, difficulty filters, and mistake notes |
| `/revision` | Dynamic | Spaced repetition flashcard center powered by the SM-2 algorithm |
| `/applications` | Dynamic | Dual-view job tracker (Kanban board + Table) with interview logs |
| `/mentor` | Dynamic | Multi-agent AI chat hub featuring 4 specialized mentor personas |
| `/analytics` | Dynamic | Aggregated readiness metrics, consistency graphs, and topic mastery |
| `/settings` | Dynamic | Profile preferences, data sovereignty JSON export, and account reset |
| `/api/account/export` | API | Private, credential-free JSON export of all personal preparation data |
| `/auth/callback` | API | Server-side PKCE OAuth code exchange handler |

---

## 9. Getting Started & Installation

### 9.1 30-Second Quickstart (Zero-Config Demo Mode)

FORGE is pre-configured to run out of the box with zero external dependencies using its local data store:

```bash
# 1. Clone the repository
git clone https://github.com/utsavrss2327/Forge-Planner.git
cd Forge-Planner

# 2. Install dependencies
npm install

# 3. Start the local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
- **Login Credentials**: Enter any email (e.g., `demo@forge.dev`) and password (e.g., `demo1234`).
- All data will automatically persist to `.data/store.json`.

### 9.2 Production Setup with Supabase

To connect FORGE to a hosted Supabase PostgreSQL instance:

1. **Create a Supabase Project** at [supabase.com](https://supabase.com).
2. **Execute Database Migrations**: Run the 5 migration files in `supabase/migrations/` in order within the Supabase SQL Editor:
   ```
   1. supabase/migrations/00001_initial_schema.sql
   2. supabase/migrations/00002_learning_transactions.sql
   3. supabase/migrations/00003_learning_management.sql
   4. supabase/migrations/00004_planner_sessions.sql
   5. supabase/migrations/00005_account_data.sql
   ```
3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local` and populate your credentials:
   ```bash
   cp .env.example .env.local
   ```
4. **Configure Google OAuth (Optional)**:
   Add `http://localhost:3000/auth/callback` to your Supabase Auth allowed redirects, and configure Google Client ID/Secret in the Supabase Dashboard.

### 9.3 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production | Your Supabase project URL (`https://<ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production | Your Supabase public anonymous API key |
| `NEXT_PUBLIC_SITE_URL` | Production | Root application URL (default: `http://localhost:3000`) |
| `OPENAI_API_KEY` | Optional | OpenAI API key for live GPT-4o agent services (falls back if omitted) |
| `YOUTUBE_API_KEY` | Optional | YouTube Data API v3 key for real-time playlist metadata imports |
| `FORGE_DEMO_MODE` | Optional | Set to `true` to force offline local JSON storage mode |

---

## 10. Project Structure

```
Forge-Planner/
├── .data/                          # Local JSON store directory (Demo mode)
│   └── store.json                  # Persisted application database
├── src/
│   ├── app/                        # Next.js 16 App Router
│   │   ├── (app)/                  # Authenticated Application Shell
│   │   │   ├── analytics/          # Readiness & consistency analytics
│   │   │   ├── applications/       # Job applications Kanban & table
│   │   │   ├── assessments/        # AI Assessment Lab & test runner
│   │   │   ├── dashboard/          # Command center dashboard
│   │   │   ├── dsa/                # DSA practice tracker
│   │   │   ├── learning/           # Tracks, playlists, and video workspace
│   │   │   ├── mentor/             # Multi-agent AI mentor hub
│   │   │   ├── onboarding/         # 4-step onboarding wizard
│   │   │   ├── planner/            # Daily & 7-day scheduler
│   │   │   ├── revision/           # SM-2 spaced repetition center
│   │   │   ├── roadmaps/           # Dynamic curriculum roadmap engine
│   │   │   └── settings/           # Profile preferences & data export
│   │   ├── (auth)/                 # Authentication routes (login, signup)
│   │   ├── api/                    # Server-side API endpoints
│   │   ├── layout.tsx              # Root HTML & body layout
│   │   └── page.tsx                # Marketing landing page
│   ├── components/                 # Reusable UI & Feature Components
│   │   ├── applications/           # Kanban cards, add application dialog
│   │   ├── dashboard/              # Daily mission, heatmap, stats, charts
│   │   ├── dsa/                    # Problem dialog, filters, mistake logs
│   │   ├── layout/                 # Sidebar, top navigation, app shell
│   │   ├── learning/               # Video workspace, journal modal, track dialog
│   │   ├── planner/                # Active session timer, task editor
│   │   ├── settings/               # Data controls & reset modal
│   │   └── ui/                     # shadcn/ui design system primitives
│   ├── lib/                        # Core Utilities & Services
│   │   ├── ai/                     # Multi-Agent Services (OpenAI + Fallbacks)
│   │   │   ├── agents/             # Learning Coach, Examiner, Planner, Analyst
│   │   │   ├── client.ts           # OpenAI client wrapper
│   │   │   ├── prompts.ts          # Agent prompt templates & system instructions
│   │   │   └── schemas.ts          # Zod schemas for structured agent outputs
│   │   ├── storage/                # Dual Storage Implementation
│   │   │   ├── store.ts            # Local JSON store engine & seed database
│   │   │   ├── account.ts          # Export & account deletion logic
│   │   │   ├── dashboard.ts        # Dashboard query aggregation
│   │   │   ├── learning.ts         # Tracks & video mutations
│   │   │   └── profile.ts          # User profile & preferences
│   │   ├── supabase/               # Supabase SSR clients & auth middleware
│   │   ├── constants.ts            # SDE taxonomies, roles, and subjects
│   │   ├── dates.ts                # Calendar calculations & timezone utilities
│   │   ├── planner.ts              # Capacity algorithms & session transitions
│   │   ├── utils.ts                # Tailwind class merge (cn) & ID generators
│   │   └── youtube.ts              # YouTube Data API v3 integration
│   └── types/
│       └── index.ts                # Central TypeScript entity type definitions
├── supabase/
│   └── migrations/                 # 5 PostgreSQL RLS migration scripts
├── tests/                          # 41 Unit, Integration & Security Tests
│   ├── database.test.cjs           # PostgreSQL in-memory engine tests (PGlite)
│   ├── foundation.test.cjs         # Core workflows & validation tests
│   └── e2e/                        # Playwright end-to-end browser tests
├── ARCHITECTURE.md                 # System architecture specification
├── IMPLEMENTATION_PLAN.md          # Multi-phase milestone roadmap
├── WORK_LOG.md                     # Engineering verification log
├── next.config.ts                  # Next.js configuration
├── package.json                    # Dependencies & execution scripts
├── playwright.config.ts            # Playwright testing configuration
├── tsconfig.json                   # Strict TypeScript compiler configuration
└── README.md                       # Master project documentation
```

---

## 11. Authors & License

- **Lead Engineer & Architect**: [Utsav Raj Singh](https://github.com/utsavrss2327)
- **Email**: `utsavrss2327@gmail.com`
- **License**: MIT License — open for developers and students worldwide.

---

<div align="center">
<strong>FORGE: Forged by engineers, for engineers. Transform daily effort into top-tier placement offers.</strong>
</div>
