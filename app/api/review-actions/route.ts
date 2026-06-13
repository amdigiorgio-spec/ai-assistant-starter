import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { makeIdempotencyKey } from "@/lib/idempotency";

type DecisionPayload = {
  proposed_action_id?: string;
  decision?: "Approved" | "Rejected" | "Needs Clarification";
  decision_note?: string;
};

type EditPayload = {
  proposed_action_id?: string;
  title?: string;
  description?: string | null;
};

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

  if (decisionError) return NextResponse.json({ ok: false, error: decisionError.message }, { status: 500 });

  const { error: updateError } = await supabase
    .from("proposed_actions")
    .update({ status: decision, updated_at: new Date().toISOString() })
    .eq("id", actionId);

  if (updateError) return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });

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

  if (!actionId || !title) {
    return NextResponse.json({ ok: false, error: "Missing proposed action or title" }, { status: 400 });
  }

  const { error } = await supabase
    .from("proposed_actions")
    .update({
      title,
      description: payload.description ?? null,
      updated_at: new Date().toISOString()
    })
    .eq("id", actionId);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  await supabase.from("audit_log").insert({
    entity_type: "proposed_action",
    entity_id: actionId,
    action: "review.edit",
    idempotency_key: makeIdempotencyKey(["review", "edit", actionId, title, new Date().toISOString()]),
    details: {
      auth_user_id: user.authUserId,
      email: user.email,
      title,
      description: payload.description ?? null
    }
  });

  return NextResponse.json({ ok: true });
}
