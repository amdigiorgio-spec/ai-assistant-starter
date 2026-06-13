import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Phase 1 schema includes required foundation tables", () => {
  const schema = read("supabase/schema.sql");
  const tables = [
    "users",
    "user_settings",
    "integration_accounts",
    "source_items",
    "source_item_attachments",
    "proposed_actions",
    "approval_decisions",
    "tasks",
    "projects",
    "project_updates",
    "goals",
    "reminders",
    "calendar_sources",
    "calendar_events",
    "calendar_busy_blocks",
    "meeting_requests",
    "meeting_options",
    "email_threads",
    "email_messages",
    "email_style_examples",
    "email_style_profile",
    "spam_candidates",
    "slack_messages",
    "daily_reviews",
    "weekly_reviews",
    "monthly_reviews",
    "memory_facts",
    "memory_embeddings",
    "memory_review_queue",
    "job_runs",
    "audit_log",
    "error_log"
  ];

  for (const table of tables) {
    assert.match(schema, new RegExp(`create table if not exists ${table}\\b`));
    assert.match(schema, new RegExp(`alter table ${table} enable row level security`));
  }
});

test("Phase 1 env example documents required single-user app variables", () => {
  const env = read(".env.example");
  const required = [
    "APP_BASE_URL",
    "TIMEZONE",
    "OPENAI_API_KEY",
    "OPENAI_MODEL",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  ];

  for (const name of required) {
    assert.match(env, new RegExp(`^${name}=`, "m"));
  }
});

test("Phase 1 app routes exist and Phase 2 integration routes do not", () => {
  const root = new URL("../", import.meta.url);
  const exists = (path) => existsSync(new URL(path, root));

  for (const path of [
    "app/(assistant)/today/page.tsx",
    "app/(assistant)/inbox/page.tsx",
    "app/(assistant)/projects/page.tsx",
    "app/(assistant)/tasks/page.tsx",
    "app/(assistant)/calendar/page.tsx",
    "app/(assistant)/memory/page.tsx",
    "app/(assistant)/email/page.tsx",
    "app/(assistant)/settings/page.tsx",
    "app/login/page.tsx",
    "app/api/review-actions/route.ts"
  ]) {
    assert.equal(exists(path), true, `${path} should exist`);
  }

  for (const path of ["app/api/slack/route.ts", "app/api/gmail/route.ts", "app/api/cron/route.ts"]) {
    assert.equal(exists(path), false, `${path} should not exist in Phase 1`);
  }
});
