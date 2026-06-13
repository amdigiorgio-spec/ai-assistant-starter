# Phase 0 Audit

Date: 2026-06-12

Scope: planning and repository audit only. Do not implement Phase 1 from this document without user confirmation.

## Current Stack

- Framework: Next.js App Router.
- Language: TypeScript.
- UI: single client page in `app/page.tsx`.
- Styling: global CSS in `app/globals.css`.
- Database client: `@supabase/supabase-js`, server-only service role helper in `lib/supabase-admin.ts`.
- AI: OpenAI Responses API with Zod structured output in `lib/openai-extract.ts`.
- Notion: `@notionhq/client` helper in `lib/notion.ts`.
- Validation: Zod schemas in `lib/schemas.ts`.
- Package scripts:
  - `npm run dev`
  - `npm run typecheck`
  - `npm run build`
  - `npm run start`

## Current App Behavior

The app currently proves a narrow capture-to-review loop:

1. User pastes text into the home page.
2. `POST /api/extract` validates the payload.
3. If Supabase env vars are configured, a `source_items` row is created.
4. OpenAI extracts structured tasks, calendar events, reminders, journal entries, goals, and memories.
5. Extracted items are normalized into `proposed_actions`.
6. If Supabase is configured, proposed actions are stored.
7. If Notion is configured, proposed action pages are created.
8. `POST /api/process-approved` processes Supabase actions already marked `Approved`.

## Current Files

- `AGENTS.md`: durable repository rules.
- `README.md`: beginner setup and project direction.
- `docs/architecture-plan.md`: long-term architecture and phases.
- `docs/security-rules.md`: starter safety rules.
- `docs/notion-setup.md`: starter Notion database setup.
- `docs/codex-prompts.md`: earlier prompt sequence.
- `supabase/schema.sql`: starter SQL schema.
- `app/page.tsx`: starter manual input UI.
- `app/api/extract/route.ts`: extraction endpoint.
- `app/api/process-approved/route.ts`: conservative approval processor.
- `lib/schemas.ts`: input and extraction schemas.
- `lib/openai-extract.ts`: OpenAI extraction prompt and call.
- `lib/normalize.ts`: extracted output to proposed action rows.
- `lib/notion.ts`: Notion proposed-action helpers.
- `lib/supabase-admin.ts`: server-only Supabase client.

## Current Environment Variables

Documented in `.env.example`:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NOTION_TOKEN`
- `NOTION_PROPOSED_ACTIONS_DATABASE_ID`
- `NOTION_TASKS_DATABASE_ID`
- `NOTION_JOURNAL_DATABASE_ID`
- `NOTION_GOALS_DATABASE_ID`

## Missing Environment Variables For Target Assistant

These are not required for the current starter, but will be needed as phases are implemented:

- `APP_BASE_URL`: canonical deployed app URL for OAuth redirects, webhooks, and links.
- `CRON_SECRET`: protects scheduled endpoints.
- `SUPABASE_ANON_KEY`: client-safe key if browser-side Supabase Auth/session reads are added.
- `NEXT_PUBLIC_SUPABASE_URL`: only if the browser needs the Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: only if using Supabase Auth from the browser.
- `NOTION_PROPOSED_ACTIONS_DATA_SOURCE_ID`: preferred newer Notion data source ID.
- `NOTION_TASKS_DATA_SOURCE_ID`
- `NOTION_PROJECTS_DATA_SOURCE_ID`
- `NOTION_GOALS_DATA_SOURCE_ID`
- `NOTION_REVIEWS_DATA_SOURCE_ID`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GMAIL_WATCH_LABELS`
- `GOOGLE_CALENDAR_IDS`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `MICROSOFT_TENANT_ID`
- `MICROSOFT_REDIRECT_URI`
- `OUTLOOK_CALENDAR_IDS`
- `SLACK_BOT_TOKEN`
- `SLACK_SIGNING_SECRET`
- `SLACK_APP_TOKEN`: only if socket mode or app-level Slack flows are used.
- `TIMEZONE`
- `MORNING_BRIEFING_TIME`
- `EVENING_BRIEFING_TIME`

Do not add secrets to chat or source files. Document names only.

## Current Schema Gaps

The current schema is intentionally small. It does not yet match the target assistant data model.

Missing tables:

- `users`
- `user_settings`
- `integration_accounts`
- `source_item_attachments`
- `approval_decisions`
- `projects`
- `project_updates`
- `goals`
- `calendar_sources`
- `calendar_busy_blocks`
- `meeting_requests`
- `meeting_options`
- `email_threads`
- `email_messages`
- `email_style_examples`
- `email_style_profile`
- `spam_candidates`
- `slack_messages`
- `reminders`
- `daily_reviews`
- `weekly_reviews`
- `monthly_reviews`
- `memory_embeddings`
- `memory_review_queue`
- `job_runs`
- `error_log`

Tables that exist but need expansion:

- `source_items`
  - Current `source_type` values are too narrow.
  - Missing canonical source types such as `gmail`, `forwarded_email`, `slack`, `google_calendar`, `outlook_calendar`, `calendar_request`, and future placeholders.
  - Missing idempotency/external source identity fields.
  - Missing source excerpt/body retention strategy fields.

- `proposed_actions`
  - Missing `Error` status.
  - Missing action types such as `project_update`, `meeting_options`, `spam_candidate`, and `email_style_example`.
  - Uses `ai_summary`; target calls for `reason_summary`.
  - Uses `payload`; target calls for `raw_json`.
  - Missing required `idempotency_key`.
  - Needs stronger duplicate prevention.

- `tasks`
  - Missing project relationship, waiting state fields, Notion sync fields, idempotency fields, and richer status semantics.

- `calendar_events`
  - Currently models proposed/created events more than read-only calendar source events.
  - Missing source calendar IDs, provider IDs, busy/free status, recurrence metadata, and Outlook support.

- `memory_facts`
  - Current status includes `Archived`; target wants `Pending`, `Active`, `Rejected`, `Expired`.
  - Current categories do not match target categories.
  - Missing `approved_at`, `sensitivity`, source link behavior, and explicit review queue fields.
  - Has an embedding field, but no separate embedding lifecycle table.

- `audit_log`
  - Missing user/integration/job context, idempotency key, before/after details, and consistent action naming.

Missing database behaviors:

- RLS policies for deployed authenticated use.
- Updated-at triggers.
- Consistent `idempotency_key` uniqueness.
- Job run tracking and retry metadata.
- Error logging table.
- Notion page ID storage across domain tables.
- Approval-decision history.

## Current Code Gaps

- No authentication.
- No mobile navigation shell.
- No readable review queue UI.
- No edit/approve/reject UI.
- No tests.
- No cron routes.
- No webhook signature verification.
- No Gmail integration.
- No Slack integration.
- No Google Calendar integration.
- No Outlook Calendar integration.
- No Notion approval polling.
- No job runner abstraction.
- No environment validation helper.
- OpenAI extraction prompt has a hardcoded date and should become dynamic.
- Source types in UI and schemas do not match the target canonical source types.

## Exact Phase 1 Implementation Proposal

Phase 1 should establish the private single-user foundation without adding Gmail, Slack, Notion sync expansion, cron jobs, or calendar integrations yet.

### 1. Schema Foundation

Create a new versioned SQL migration or replace the starter schema with a clearly documented v1 schema, depending on how the user wants to manage Supabase. For this repo, the simplest next step is to add `supabase/migrations` and keep `supabase/schema.sql` as a readable snapshot.

Add or expand:

- `users`
- `user_settings`
- `integration_accounts`
- `source_items`
- `source_item_attachments`
- `proposed_actions`
- `approval_decisions`
- `tasks`
- `projects`
- `project_updates`
- `goals`
- `reminders`
- `calendar_sources`
- `calendar_events`
- `calendar_busy_blocks`
- `meeting_requests`
- `meeting_options`
- `email_threads`
- `email_messages`
- `spam_candidates`
- `slack_messages`
- `daily_reviews`
- `weekly_reviews`
- `monthly_reviews`
- `memory_facts`
- `memory_embeddings`
- `job_runs`
- `audit_log`
- `error_log`

Keep these future-ready but not overbuilt:

- `email_style_examples`
- `email_style_profile`
- future source type enum values for voice memo, journal, health, finance, and meal tracker.

### 2. Single-User Auth Boundary

Use Supabase Auth for login, but keep the app single-user:

- Add auth helper functions.
- Add middleware or server-side checks to protect private pages.
- Add a setup note explaining that only the owner account should be allowed.
- Do not build signup flows for public users.

### 3. Mobile App Shell

Replace the single starter page with a real mobile-first app shell:

- Today
- Inbox / Review Queue
- Projects
- Tasks
- Calendar Assistant
- Memory
- Email Review
- Settings

Each page should be backed by Supabase reads where possible. Empty states are acceptable. The goal is navigation and data visibility, not integrations yet.

### 4. Review Queue MVP

Build the first useful approval UI:

- List pending proposed actions.
- Filter by action type and status.
- Show source excerpt, confidence, reason summary, and raw JSON debug details.
- Approve, reject, and mark needs clarification.
- Record each decision in `approval_decisions`.
- Write audit log entries for each decision.

Do not execute external side effects in Phase 1.

### 5. Manual Quick Add

Keep manual input as the first source:

- Save manual input as `source_items`.
- Run extraction.
- Create `proposed_actions`.
- Use idempotency keys to avoid duplicates on repeated submits.
- Keep memory facts pending until explicitly approved.

### 6. Basic Domain Views

Add read-only or simple local views:

- Tasks by status and due date.
- Projects and recent project updates.
- Goals.
- Pending and active memories.
- Calendar Assistant placeholder showing no connected calendars yet.
- Email Review placeholder showing no Gmail integration yet.
- Settings page showing configured timezone and integration status placeholders.

### 7. Environment Documentation

Update `.env.example` and README with Phase 1 variables only:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `APP_BASE_URL`
- `TIMEZONE`

Leave Gmail, Google, Microsoft, Slack, and cron variables documented as future Phase 2+ or later sections, not required for Phase 1.

### 8. Testing And Verification

Add a test runner and focused tests:

- extraction schema parsing
- proposed action normalization
- idempotency key generation
- approval decision creation
- audit log helper behavior
- memory remains pending until approval

Run before final:

- typecheck
- tests
- build

## Explicitly Out Of Scope For Phase 1

- Gmail ingestion.
- Slack app or webhooks.
- Google Calendar OAuth/sync.
- Outlook Calendar OAuth/sync.
- Notion expanded sync.
- Morning/evening/weekly/monthly scheduled jobs.
- Email reply drafting.
- Email sending.
- Calendar writes.
- Public multi-user signup.
- Vector memory retrieval.
- Health, finance, meal, journal, or voice memo integrations.
