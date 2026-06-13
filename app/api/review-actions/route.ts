import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { makeIdempotencyKey } from "@/lib/idempotency";
import { errorMessage } from "@/lib/errors";

type DecisionPayload = {
  proposed_action_id?: string;
  decision?: "Approved" | "Rejected" | "Needs Clarification";
  decision_note?: string;
};

type EditPayload = {
  proposed_action_id?: string;
  action_type?: string;
  title?: string;
  description?: string | null;
  priority?: string | null;
  due_at?: string | null;
  start_at?: string | null;
  end_at?: string | null;
};

const actionTypes = new Set([
  "task",
  "project_update",
  "calendar_event",
  "meeting_options",
  "reminder",
  "goal",
  "memory",
  "journal_entry",
  "spam_candidate",
  "email_style_example"
]);

const priorities = new Set(["low", "medium", "high", "none"]);

function cleanDate(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) throw new Error(`Invalid date: ${value}`);
  return new Date(parsed).toISOString();
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "Missing Supabase config" }, { status: 500 });

  const payload = (await request.json()) as DecisionPayload;
  const actionId = payload.proposed_action_id;
  const decision = payload.decision;

  if (!actionId || !decision) {
    return NextResponse.json({ ok: false, error: "Missing proposed action or decision" }, { status: 400 });
  }

  const { error: decisionError } = await supabase.from("approval_decisions").insert({
    proposed_action_id: actionId,
    decision,
    decision_note: payload.decision_note ?? null
  });

  if (decisionError) return NextResponse.json({ ok: false, error: errorMessage(decisionError) }, { status: 500 });

  const { error: updateError } = await supabase
    .from("proposed_actions")
    .update({ status: decision, updated_at: new Date().toISOString() })
    .eq("id", actionId);

  if (updateError) return NextResponse.json({ ok: false, error: errorMessage(updateError) }, { status: 500 });

  await supabase.from("audit_log").insert({
    entity_type: "proposed_action",
    entity_id: actionId,
    action: `review.${decision}`,
    idempotency_key: makeIdempotencyKey(["review", actionId, decision, new Date().toISOString()]),
    details: {
      auth_user_id: user.authUserId,
      email: user.email,
      decision_note: payload.decision_note ?? null
    }
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "Missing Supabase config" }, { status: 500 });

  const payload = (await request.json()) as EditPayload;
  const actionId = payload.proposed_action_id;
  const title = payload.title?.trim();
  const actionType = payload.action_type?.trim();
  const priority = payload.priority?.trim() || null;

  if (!actionId || !title) {
    return NextResponse.json({ ok: false, error: "Missing proposed action or title" }, { status: 400 });
  }

  if (actionType && !actionTypes.has(actionType)) {
    return NextResponse.json({ ok: false, error: "Invalid action type" }, { status: 400 });
  }

  if (priority && !priorities.has(priority)) {
    return NextResponse.json({ ok: false, error: "Invalid priority" }, { status: 400 });
  }

  let dueAt: string | null;
  let startAt: string | null;
  let endAt: string | null;

  try {
    dueAt = cleanDate(payload.due_at);
    startAt = cleanDate(payload.start_at);
    endAt = cleanDate(payload.end_at);
  } catch (error) {
    return NextResponse.json({ ok: false, error: errorMessage(error) }, { status: 400 });
  }

  const { error } = await supabase
    .from("proposed_actions")
    .update({
      action_type: actionType,
      title,
      description: payload.description ?? null,
      priority,
      due_at: dueAt,
      start_at: startAt,
      end_at: endAt,
      updated_at: new Date().toISOString()
    })
    .eq("id", actionId);

  if (error) return NextResponse.json({ ok: false, error: errorMessage(error) }, { status: 500 });

  await supabase.from("audit_log").insert({
    entity_type: "proposed_action",
    entity_id: actionId,
    action: "review.edit",
    idempotency_key: makeIdempotencyKey(["review", "edit", actionId, title, new Date().toISOString()]),
    details: {
      auth_user_id: user.authUserId,
      email: user.email,
      action_type: actionType,
      title,
      description: payload.description ?? null,
      priority,
      due_at: dueAt,
      start_at: startAt,
      end_at: endAt
    }
  });

  return NextResponse.json({ ok: true });
}
