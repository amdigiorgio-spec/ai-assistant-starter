import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("approved action helper covers Phase 2 target domain tables", () => {
  const helper = read("lib/approved-actions.ts");

  for (const table of ["tasks", "goals", "reminders", "project_updates", "memory_facts"]) {
    assert.match(helper, new RegExp(`table: "${table}"`));
    assert.match(helper, /onConflict: "idempotency_key"/);
  }
});

test("approved memory stays pending until separately approved", () => {
  const helper = read("lib/approved-actions.ts");

  assert.match(helper, /action\.action_type === "memory"/);
  assert.match(helper, /status: "Pending"/);
  assert.doesNotMatch(helper, /status: "Active"/);
});

test("Phase 2 schema gives processed domains idempotency keys", () => {
  const schema = read("supabase/schema.sql");
  const repair = read("supabase/phase2-repair.sql");

  for (const table of ["tasks", "goals", "reminders", "project_updates", "memory_facts"]) {
    const tableStart = schema.indexOf(`create table if not exists ${table}`);
    assert.notEqual(tableStart, -1, `${table} should exist`);
    const nextTable = schema.indexOf("create table if not exists", tableStart + 1);
    const tableSql = schema.slice(tableStart, nextTable === -1 ? undefined : nextTable);
    assert.match(tableSql, /idempotency_key text/);
    assert.match(tableSql, /unique \(idempotency_key\)/);
    assert.match(repair, new RegExp(`alter table ${table}`));
  }
});

test("review UI supports richer edits and filters", () => {
  const editForm = read("app/(assistant)/edit-proposal-form.tsx");
  const inbox = read("app/(assistant)/inbox/page.tsx");

  for (const field of ["action_type", "priority", "due_at", "start_at", "end_at"]) {
    assert.match(editForm, new RegExp(field));
  }

  assert.match(inbox, /status=/);
  assert.match(inbox, /actionType=/);
  assert.match(inbox, /ProcessApprovedButton/);
});

test("Phase 2 polish shows reminders and formats object errors", () => {
  const appData = read("lib/app-data.ts");
  const today = read("app/(assistant)/today/page.tsx");
  const errors = read("lib/errors.ts");
  const reviewButtons = read("app/(assistant)/review-buttons.tsx");

  assert.match(appData, /ReminderSummary/);
  assert.match(today, /Reminders/);
  assert.match(errors, /record\.details/);
  assert.match(reviewButtons, /No review actions available/);
});

test("Phase 2 still does not add external integration routes", () => {
  const root = new URL("../", import.meta.url);
  const exists = (path) => existsSync(new URL(path, root));

  for (const path of ["app/api/slack/route.ts", "app/api/gmail/route.ts", "app/api/cron/route.ts"]) {
    assert.equal(exists(path), false, `${path} should not exist in Phase 2`);
  }
});
