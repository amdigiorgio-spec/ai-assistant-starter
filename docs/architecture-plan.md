# AI Assistant Architecture Plan

This project is a private, single-user AI assistant. The first production-minded version should be useful from a phone, hosted on Vercel, backed by Supabase, and governed by approval before action.

## Current Repo State

- Next.js app with a single paste-in form.
- OpenAI structured extraction route at `/api/extract`.
- Supabase starter schema for source items, proposed actions, tasks, calendar events, memory facts, and audit log.
- Notion helper that can create proposed action pages.
- Conservative approval processor for approved tasks and memories.
- No authentication yet.
- No tests yet.
- No Gmail, Slack, Google Calendar, Outlook Calendar, cron, or deployed webhook flow yet.

## Canonical Architecture

Supabase is the source of truth. Every input becomes a `source_items` row first. AI extraction creates `proposed_actions`; it never executes external effects. Approval decisions convert proposals into durable records such as tasks, projects, reminders, meeting requests, active memories, and review items. Notion mirrors human-facing data. Slack is a mobile capture and notification layer.

```text
Manual / Gmail / Slack / Calendar / Forwarded email
  -> source_items
  -> AI extraction
  -> proposed_actions
  -> review queue
  -> approval_decisions + audit_log
  -> tasks / projects / goals / reminders / memory / meeting options
  -> optional Notion or Slack sync
```

## Single-User Scope

Build for one private user first. Use authentication before deployment so private assistant data is not public. Keep user-aware columns where they make the schema clearer, but do not build teams, organizations, shared workspaces, delegated access, billing, or public account management in v1.

## Non-Negotiables

- Human approval before external side effects.
- No Outlook email access.
- Outlook Calendar only, using calendar scopes only.
- Preserve Gmail unread state.
- No email replies or reply drafting in v1.
- Proposed memories must be approved before becoming active.
- All background jobs and external sync writes must be idempotent.
- Every proposal, approval, rejection, and execution must be auditable.

## Phases

### Phase 0: Repo Rules And Plan

- Add durable repo rules in `AGENTS.md`.
- Document architecture and implementation phases.
- Update README so the starter describes the real assistant direction.
- Keep coding changes limited to documentation and planning.

### Phase 1: Core Data And Mobile Shell

- Expand the Supabase schema for the v1 data model.
- Add single-user authentication.
- Create mobile-first pages: Today, Review Queue, Projects, Tasks, Calendar Assistant, Memory, Email Review, and Settings.
- Keep integrations stubbed until the core review flow is solid.

### Phase 2: Manual Capture And Approval Flow

- Improve manual quick-add.
- Store source items and proposed actions with idempotency keys.
- Add approve, reject, edit, and needs-clarification flows.
- Process approved tasks, goals, project updates, reminders, and memories.
- Add audit logging and duplicate prevention tests.

### Phase 3: Notion Sync

- Sync pending proposed actions, approved tasks, projects, goals, and reviews to Notion.
- Store Notion page IDs in Supabase.
- Make sync retryable and idempotent.
- Log failures without losing source data.

### Phase 4: Slack Quick Capture

- Add Slack DM intake and command-like quick capture.
- Store Slack messages as source items.
- Create proposed actions from Slack content unless settings explicitly allow trusted direct capture.
- Send private assistant notifications by DM.

### Phase 5: Gmail Intake

- Poll or watch configured Gmail labels.
- Preserve unread state.
- Store thread and message metadata.
- Extract proposed tasks, reminders, project updates, meeting requests, and spam/newsletter candidates.
- Support forwarded-email instructions without sending or drafting replies.

### Phase 6: Calendar Read-Only Availability

- Add Google Calendar read-only sync for selected calendars.
- Add Microsoft Graph Outlook Calendar read-only sync with calendar scopes only.
- Store events and busy blocks in Supabase.
- Generate meeting options from both calendar sources.

### Phase 7: Briefings And Reviews

- Add protected cron routes using `CRON_SECRET`.
- Generate morning and evening briefings.
- Generate weekly and monthly reviews.
- Store reviews in Supabase and optionally sync to Notion or Slack.

### Phase 8: Controlled Memory

- Add memory categories, sensitivity, expiration, source links, and approval queue.
- Use only Active approved memories in future extraction and briefing context.
- Keep embeddings/vector search as a future-ready extension rather than a blocker.

### Phase 9: Deployment Hardening

- Add Vercel cron and webhook setup docs.
- Add environment validation.
- Add production checklist for Vercel, Supabase, Notion, Google, Microsoft, Slack, and OpenAI.
- Add tests for extraction parsing, approval processing, idempotency, cron auth, Gmail unread preservation, Notion sync, calendar sync, meeting options, Slack parsing, and audit logs.

## V1 Acceptance Target

The v1 assistant is acceptable when the user can open a protected mobile web app, review proposed actions, approve or reject them, see tasks/projects/calendar context/memories, capture from Slack and Gmail without destructive side effects, generate calendar-aware briefings, and deploy the whole system to Vercel without depending on a local desktop machine.
