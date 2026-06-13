-- Phase 2 repair script for databases that were created from partial Phase 1 SQL runs.
-- Safe to run more than once in Supabase SQL Editor.

alter table source_items
add column if not exists idempotency_key text;

update source_items
set idempotency_key = 'legacy-source-' || id::text
where idempotency_key is null;

alter table source_items
alter column idempotency_key set not null;

create unique index if not exists source_items_idempotency_key_idx
on source_items (idempotency_key);

alter table source_items
add column if not exists source_excerpt text;

alter table source_items
add column if not exists external_id text;

alter table source_items
add column if not exists external_thread_id text;

alter table proposed_actions
add column if not exists reason_summary text;

alter table proposed_actions
add column if not exists raw_json jsonb not null default '{}'::jsonb;

alter table proposed_actions
add column if not exists idempotency_key text;

update proposed_actions
set idempotency_key = 'legacy-action-' || id::text
where idempotency_key is null;

alter table proposed_actions
alter column idempotency_key set not null;

create unique index if not exists proposed_actions_idempotency_key_idx
on proposed_actions (idempotency_key);

alter table proposed_actions
add column if not exists notion_page_id text;

alter table proposed_actions
add column if not exists error text;

alter table proposed_actions
add column if not exists processed_at timestamptz;

alter table proposed_actions
add column if not exists updated_at timestamptz not null default now();

alter table tasks
add column if not exists idempotency_key text;

create unique index if not exists tasks_idempotency_key_idx
on tasks (idempotency_key);

alter table reminders
add column if not exists idempotency_key text;

create unique index if not exists reminders_idempotency_key_idx
on reminders (idempotency_key);

alter table goals
add column if not exists idempotency_key text;

create unique index if not exists goals_idempotency_key_idx
on goals (idempotency_key);

alter table project_updates
add column if not exists idempotency_key text;

create unique index if not exists project_updates_idempotency_key_idx
on project_updates (idempotency_key);

alter table memory_facts
add column if not exists idempotency_key text;

create unique index if not exists memory_facts_idempotency_key_idx
on memory_facts (idempotency_key);

notify pgrst, 'reload schema';
