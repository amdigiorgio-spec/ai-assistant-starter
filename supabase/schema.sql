-- AI Assistant Phase 1 schema
-- Run this in Supabase SQL Editor for a fresh Phase 1 database.
-- Supabase is the source of truth. Notion and Slack are mirrors/interfaces only.

create extension if not exists pgcrypto;
create extension if not exists vector;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text unique,
  display_name text,
  timezone text not null default 'America/Los_Angeles',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  timezone text not null default 'America/Los_Angeles',
  morning_briefing_time time,
  evening_briefing_time time,
  memory_enabled boolean not null default true,
  email_style_learning_enabled boolean not null default false,
  slack_notifications_enabled boolean not null default false,
  notion_sync_enabled boolean not null default false,
  settings_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists integration_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  provider text not null check (provider in ('notion', 'gmail', 'google_calendar', 'outlook_calendar', 'slack', 'openai')),
  account_label text,
  external_account_id text,
  scopes text[] not null default '{}',
  status text not null default 'not_configured' check (status in ('not_configured', 'connected', 'error', 'disabled')),
  metadata jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, external_account_id)
);

create table if not exists source_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  source_type text not null check (source_type in (
    'manual',
    'gmail',
    'forwarded_email',
    'slack',
    'google_calendar',
    'outlook_calendar',
    'calendar_request',
    'voice_memo_future',
    'journal_future',
    'health_future',
    'finance_future',
    'meal_tracker_future'
  )),
  source_title text not null,
  sender text,
  body_text text not null,
  source_excerpt text,
  external_id text,
  external_thread_id text,
  raw_metadata jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

create table if not exists source_item_attachments (
  id uuid primary key default gen_random_uuid(),
  source_item_id uuid references source_items(id) on delete cascade,
  attachment_type text not null default 'file',
  file_name text,
  mime_type text,
  storage_path text,
  external_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists proposed_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  source_item_id uuid references source_items(id) on delete set null,
  action_type text not null check (action_type in (
    'task',
    'project_update',
    'calendar_event',
    'meeting_options',
    'reminder',
    'goal',
    'memory',
    'journal_entry',
    'spam_candidate',
    'email_style_example'
  )),
  title text not null,
  description text,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected', 'Needs Clarification', 'Completed', 'Error')),
  priority text check (priority in ('low', 'medium', 'high', 'none')),
  due_at timestamptz,
  start_at timestamptz,
  end_at timestamptz,
  confidence numeric not null default 0 check (confidence >= 0 and confidence <= 1),
  reason_summary text,
  raw_json jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  notion_page_id text,
  error text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

create table if not exists approval_decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  proposed_action_id uuid references proposed_actions(id) on delete cascade,
  decision text not null check (decision in ('Approved', 'Rejected', 'Needs Clarification')),
  edited_json jsonb,
  decision_note text,
  decided_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'waiting', 'stalled', 'done', 'archived')),
  next_action text,
  notion_page_id text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

create table if not exists project_updates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  source_item_id uuid references source_items(id) on delete set null,
  proposed_action_id uuid references proposed_actions(id) on delete set null,
  update_text text not null,
  status text not null default 'noted',
  notion_page_id text,
  created_at timestamptz not null default now()
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  time_horizon text check (time_horizon in ('day', 'week', 'month', 'quarter', 'year', 'unknown')),
  next_action text,
  notion_page_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  proposed_action_id uuid references proposed_actions(id) on delete set null,
  source_item_id uuid references source_items(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'today' check (status in ('today', 'this_week', 'overdue', 'waiting', 'done', 'backlog')),
  priority text check (priority in ('low', 'medium', 'high', 'none')),
  due_at timestamptz,
  completed_at timestamptz,
  notion_page_id text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  proposed_action_id uuid references proposed_actions(id) on delete set null,
  source_item_id uuid references source_items(id) on delete set null,
  title text not null,
  description text,
  remind_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'sent', 'done', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists calendar_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  provider text not null check (provider in ('google_calendar', 'outlook_calendar')),
  external_calendar_id text not null,
  name text not null,
  include_in_availability boolean not null default true,
  is_primary boolean not null default false,
  status text not null default 'not_connected' check (status in ('not_connected', 'connected', 'error', 'disabled')),
  metadata jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_calendar_id)
);

create table if not exists calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  calendar_source_id uuid references calendar_sources(id) on delete set null,
  proposed_action_id uuid references proposed_actions(id) on delete set null,
  source_item_id uuid references source_items(id) on delete set null,
  provider text check (provider in ('google_calendar', 'outlook_calendar', 'manual')),
  external_event_id text,
  title text not null,
  description text,
  start_at timestamptz,
  end_at timestamptz,
  location text,
  busy_status text not null default 'busy' check (busy_status in ('free', 'busy', 'tentative', 'out_of_office')),
  status text not null default 'synced' check (status in ('proposed', 'synced', 'cancelled', 'error')),
  raw_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_event_id)
);

create table if not exists calendar_busy_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  calendar_source_id uuid references calendar_sources(id) on delete cascade,
  calendar_event_id uuid references calendar_events(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  busy_status text not null default 'busy',
  created_at timestamptz not null default now()
);

create table if not exists meeting_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  source_item_id uuid references source_items(id) on delete set null,
  proposed_action_id uuid references proposed_actions(id) on delete set null,
  title text not null,
  requester text,
  duration_minutes integer,
  earliest_at timestamptz,
  latest_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'options_proposed', 'completed', 'cancelled')),
  raw_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists meeting_options (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  meeting_request_id uuid references meeting_requests(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  score numeric,
  conflict_summary text,
  status text not null default 'proposed' check (status in ('proposed', 'selected', 'rejected', 'expired')),
  created_at timestamptz not null default now()
);

create table if not exists email_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  provider text not null default 'gmail',
  external_thread_id text not null,
  subject text,
  participants jsonb not null default '[]'::jsonb,
  last_message_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_thread_id)
);

create table if not exists email_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  email_thread_id uuid references email_threads(id) on delete cascade,
  source_item_id uuid references source_items(id) on delete set null,
  provider text not null default 'gmail',
  external_message_id text not null,
  from_email text,
  to_emails text[] not null default '{}',
  subject text,
  snippet text,
  received_at timestamptz,
  was_unread boolean,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider, external_message_id)
);

create table if not exists email_style_examples (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  email_message_id uuid references email_messages(id) on delete set null,
  summary text not null,
  style_json jsonb not null default '{}'::jsonb,
  status text not null default 'candidate' check (status in ('candidate', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists email_style_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  profile_json jsonb not null default '{}'::jsonb,
  status text not null default 'inactive' check (status in ('inactive', 'active')),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists spam_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  source_item_id uuid references source_items(id) on delete set null,
  email_message_id uuid references email_messages(id) on delete set null,
  reason_summary text not null,
  confidence numeric not null default 0 check (confidence >= 0 and confidence <= 1),
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected', 'Completed', 'Error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists slack_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  source_item_id uuid references source_items(id) on delete set null,
  channel_id text,
  channel_name text,
  user_external_id text,
  message_ts text,
  text text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (channel_id, message_ts)
);

create table if not exists daily_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  review_date date not null,
  review_type text not null check (review_type in ('morning', 'evening')),
  summary text not null,
  raw_json jsonb not null default '{}'::jsonb,
  notion_page_id text,
  created_at timestamptz not null default now(),
  unique (user_id, review_date, review_type)
);

create table if not exists weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  week_start date not null,
  summary text not null,
  raw_json jsonb not null default '{}'::jsonb,
  notion_page_id text,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create table if not exists monthly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  month_start date not null,
  summary text not null,
  raw_json jsonb not null default '{}'::jsonb,
  notion_page_id text,
  created_at timestamptz not null default now(),
  unique (user_id, month_start)
);

create table if not exists memory_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  proposed_action_id uuid references proposed_actions(id) on delete set null,
  source_item_id uuid references source_items(id) on delete set null,
  text text not null,
  category text not null default 'other' check (category in (
    'scheduling_preference',
    'communication_style',
    'project_preference',
    'personal_preference',
    'dislike',
    'goal',
    'recurring_obligation',
    'relationship_context',
    'productivity_pattern',
    'work_preference',
    'other'
  )),
  confidence numeric not null default 0 check (confidence >= 0 and confidence <= 1),
  status text not null default 'Pending' check (status in ('Pending', 'Active', 'Rejected', 'Expired')),
  sensitivity text not null default 'normal' check (sensitivity in ('normal', 'private', 'work', 'health_future', 'finance_future', 'other')),
  approved_at timestamptz,
  expires_at timestamptz,
  reason_to_remember text,
  notion_page_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists memory_embeddings (
  id uuid primary key default gen_random_uuid(),
  memory_fact_id uuid references memory_facts(id) on delete cascade,
  embedding vector(1536),
  model text,
  created_at timestamptz not null default now()
);

create table if not exists memory_review_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  memory_fact_id uuid references memory_facts(id) on delete cascade,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists job_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  job_name text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'error', 'skipped')),
  idempotency_key text not null,
  retry_count integer not null default 0,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  unique (idempotency_key)
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  idempotency_key text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists error_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  source text not null,
  entity_type text,
  entity_id uuid,
  message text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_source_items_created_at on source_items(created_at desc);
create index if not exists idx_source_items_source_type on source_items(source_type);
create index if not exists idx_proposed_actions_status on proposed_actions(status);
create index if not exists idx_proposed_actions_action_type on proposed_actions(action_type);
create index if not exists idx_proposed_actions_created_at on proposed_actions(created_at desc);
create index if not exists idx_tasks_status_due_at on tasks(status, due_at);
create index if not exists idx_projects_status on projects(status);
create index if not exists idx_calendar_events_start_at on calendar_events(start_at);
create index if not exists idx_calendar_busy_blocks_range on calendar_busy_blocks(start_at, end_at);
create index if not exists idx_memory_facts_status on memory_facts(status);
create index if not exists idx_job_runs_status on job_runs(status);
create index if not exists idx_audit_log_created_at on audit_log(created_at desc);

alter table users enable row level security;
alter table user_settings enable row level security;
alter table integration_accounts enable row level security;
alter table source_items enable row level security;
alter table source_item_attachments enable row level security;
alter table proposed_actions enable row level security;
alter table approval_decisions enable row level security;
alter table projects enable row level security;
alter table project_updates enable row level security;
alter table goals enable row level security;
alter table tasks enable row level security;
alter table reminders enable row level security;
alter table calendar_sources enable row level security;
alter table calendar_events enable row level security;
alter table calendar_busy_blocks enable row level security;
alter table meeting_requests enable row level security;
alter table meeting_options enable row level security;
alter table email_threads enable row level security;
alter table email_messages enable row level security;
alter table email_style_examples enable row level security;
alter table email_style_profile enable row level security;
alter table spam_candidates enable row level security;
alter table slack_messages enable row level security;
alter table daily_reviews enable row level security;
alter table weekly_reviews enable row level security;
alter table monthly_reviews enable row level security;
alter table memory_facts enable row level security;
alter table memory_embeddings enable row level security;
alter table memory_review_queue enable row level security;
alter table job_runs enable row level security;
alter table audit_log enable row level security;
alter table error_log enable row level security;

-- Phase 1 reads and writes through server-side routes using the service-role key.
-- No browser table policies are created yet; the app must not expose the service-role key client-side.
