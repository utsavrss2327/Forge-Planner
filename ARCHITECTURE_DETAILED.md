# FORGE — Architecture Document

## System Overview

FORGE (Full-stack Optimization & Readiness for Getting Employed) is an AI-powered SDE placement preparation platform built as a Next.js full-stack application with Supabase as the backend-as-a-service layer.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│  Next.js App Router │ React │ TypeScript │ Tailwind/shadcn   │
│  Monaco Editor │ Recharts │ Motion Animations                │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│                    NEXT.JS SERVER                            │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ App Router   │  │ Server       │  │ API Routes        │  │
│  │ (RSC + SSR)  │  │ Actions      │  │ /api/*            │  │
│  └─────────────┘  └──────────────┘  └───────────────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              AI AGENT SERVICES                       │    │
│  │  ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ │    │
│  │  │ Learning   │ │Assessment│ │ Roadmap  │ │Perf. │ │    │
│  │  │ Coach      │ │Examiner  │ │ Planner  │ │Analyst│ │    │
│  │  └────────────┘ └──────────┘ └──────────┘ └──────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────────┐    │
│  │ Supabase Client (SSR)│  │ External API Clients     │    │
│  │ Auth │ DB │ Storage   │  │ OpenAI │ YouTube │ OCR   │    │
│  └──────────────────────┘  └──────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      SUPABASE                                │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │ PostgreSQL  │  │ Auth       │  │ Storage              │  │
│  │ + RLS       │  │ (GoTrue)   │  │ (Resumes, PDFs)      │  │
│  └────────────┘  └────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 15 (App Router) | Full-stack React framework |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS 4 + shadcn/ui | Design system |
| Icons | Lucide React | Consistent iconography |
| Animation | Motion (framer-motion) | Subtle UI animations |
| Charts | Recharts | Data visualization |
| Code Editor | Monaco Editor | Assessment coding questions |
| Database | Supabase PostgreSQL | Persistent storage with RLS |
| Auth | Supabase Auth | Authentication & sessions |
| Storage | Supabase Storage | File uploads (PDFs, resumes) |
| Validation | Zod | Schema validation |
| AI | OpenAI API | Assessment generation, grading, mentoring |
| Video API | YouTube Data API v3 | Playlist metadata |
| PDF Parsing | pdf-parse | PDF text extraction |
| Testing | Vitest + Playwright | Unit + E2E tests |

## Directory Structure

```
forge-tracker/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Auth pages (login, signup)
│   │   ├── (app)/             # Main app pages (dashboard, etc.)
│   │   ├── api/               # API routes
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── layout/            # Sidebar, TopNav, etc.
│   │   ├── dashboard/         # Dashboard widgets
│   │   ├── roadmap/           # Roadmap components
│   │   ├── learning/          # Learning track components
│   │   ├── assessment/        # Assessment components
│   │   ├── dsa/               # DSA tracker components
│   │   ├── planner/           # Daily planner components
│   │   ├── revision/          # Revision center components
│   │   ├── analytics/         # Analytics charts
│   │   ├── applications/      # Job application components
│   │   └── mentor/            # AI mentor chat
│   ├── lib/
│   │   ├── supabase/          # Supabase client config
│   │   ├── ai/                # AI agent services
│   │   │   ├── agents/        # Individual agent implementations
│   │   │   ├── prompts/       # Prompt templates
│   │   │   └── schemas/       # Zod schemas for AI outputs
│   │   ├── utils/             # Utility functions
│   │   ├── hooks/             # Custom React hooks
│   │   ├── validators/        # Zod validation schemas
│   │   └── constants/         # App constants
│   ├── types/                 # TypeScript type definitions
│   └── styles/                # Global styles
├── supabase/
│   ├── migrations/            # Database migrations
│   └── seed.sql               # Development seed data
├── public/                    # Static assets
├── tests/
│   ├── unit/                  # Vitest unit tests
│   └── e2e/                   # Playwright E2E tests
└── docs/                      # Documentation
```

## Database Design Principles

- Normalized schema with proper foreign keys
- Row-Level Security (RLS) on all user-data tables
- UUIDs for primary keys (matching Supabase Auth)
- Timestamps (created_at, updated_at) on all tables
- Soft deletes where appropriate
- Proper indexes on frequently queried columns

## AI Agent Architecture

Four specialized agents share a common interface:

```typescript
interface AIAgent {
  name: string;
  systemPrompt: string;
  execute(context: AgentContext): Promise<AgentResponse>;
}
```

Each agent:
- Has focused system prompts
- Receives relevant user context
- Returns structured JSON (validated with Zod)
- Handles errors gracefully
- Respects rate limits

## Security Model

1. **Authentication**: Supabase Auth with JWT tokens
2. **Authorization**: Row-Level Security in PostgreSQL
3. **API Security**: Server-side API key storage
4. **Input Validation**: Zod schemas on all inputs
5. **File Safety**: Size limits, type validation
6. **Code Execution**: No server-side code execution of user input

## Key Design Decisions

1. **Server Components by default** — Client components only when interactivity needed
2. **Server Actions for mutations** — Type-safe, progressively enhanced
3. **Optimistic UI** — Immediate feedback, server reconciliation
4. **Streaming for AI** — Progressive rendering of AI responses
5. **Modular AI services** — Easy to swap providers or add agents
