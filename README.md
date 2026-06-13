# AI Assistant Starter

This is a beginner-friendly starter for a private, human-approved AI assistant.

The planned product is single-user first: one private assistant, protected before deployment, with Supabase as the source of truth and Notion as a human-facing dashboard.

The Phase 2 version currently does this:

```text
Sign in as the single owner
  -> Open the mobile app shell
  -> Quick-add manual notes
  -> OpenAI extracts proposed actions
  -> Supabase stores source + proposals
  -> Review queue lets you edit, approve, reject, or request clarification
  -> Approved manual proposals can become tasks, goals, reminders, project updates, or pending memories
  -> Nothing external is executed automatically
```

The goal is to prove the core loop before adding Gmail, Slack, Google Calendar, Outlook Calendar, scheduled briefings, memory retrieval, or a polished custom dashboard.

For the full phase-by-phase plan, see `docs/architecture-plan.md`.

## What this starter includes

- Next.js app with a protected mobile-first shell
- Single-user Supabase Auth session boundary
- OpenAI Structured Outputs extraction
- Supabase Phase 1 schema for source items, proposed actions, approvals, tasks, projects, goals, calendars, email, Slack, reviews, memory, jobs, audit, and errors
- Idempotent approved-action processor for manual task, goal, reminder, project update, and memory proposals
- Review queue filters and richer proposal editing
- Notion Proposed Actions review queue integration
- Conservative approval processor
- Codex prompt sequence for building the next slices

## Prerequisites

You need:

- Node.js installed
- An OpenAI API key
- A Supabase project
- A Notion workspace
- A Notion internal integration
- Codex, once you are ready to work with the code

## 1. Install Codex

On macOS/Linux:

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

Alternative with npm:

```bash
npm install -g @openai/codex
```

## 2. Install dependencies

```bash
npm install
```

## 3. Create `.env.local`

```bash
cp .env.example .env.local
```

Fill in:

```text
OPENAI_API_KEY
OPENAI_MODEL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
APP_BASE_URL
TIMEZONE
```

Notion variables are optional in Phase 1 unless you want proposed actions mirrored there.

## 4. Set up Supabase

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Create one Supabase Auth user for yourself.
5. Copy your project URL, anon key, and service role key into `.env.local`.

If you ran an older or partial version of the schema while setting up locally, run
`supabase/phase2-repair.sql` once in the Supabase SQL Editor. It is safe to rerun.

Important: the service role key must only be used server-side. Do not expose it in browser code.

## 5. Set up Notion

Follow `docs/notion-setup.md` exactly. The property names need to match the starter code.

## 6. Run locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Paste something like:

```text
Remind me to call the contractor by Friday. Also remember that I prefer deep work in the morning.
```

You should see:

- A sign-in screen
- The Today, Inbox, Projects, Tasks, Calendar Assistant, Memory, Email Review, and Settings pages
- A source item in Supabase
- Proposed actions in Supabase
- Pending rows in Notion if Notion env vars are configured

## 7. Use Codex

From this project folder:

```bash
codex
```

Start with:

```text
Explain this repo to me like I am a beginner. Tell me what each folder does, where environment variables go, and how the extract flow works from the form to OpenAI to Supabase to Notion.
```

Then use the prompts in `docs/codex-prompts.md`.

## Current limitations

This starter does not yet include:

- Gmail ingestion
- Slack quick capture
- Google Calendar read-only sync
- Outlook Calendar read-only sync
- Daily scheduled digests
- Expanded Notion sync or approval polling
- Calendar-aware meeting option generation
- Public multi-user signup
- Browser-side table policies

That is intentional. This starter proves the core workflow first.

## Recommended next build slices

1. Add expanded Notion sync for review items, tasks, projects, goals, and reviews.
2. Add Slack DM quick capture.
3. Add Gmail intake while preserving unread state.
4. Add Google Calendar and Outlook Calendar read-only availability.
5. Add morning/evening summaries and weekly/monthly reviews.
6. Add approved-memory context and later vector retrieval.
