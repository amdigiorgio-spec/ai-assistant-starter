import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { markNotionPageCompleted, markNotionPageError } from "@/lib/notion";
import { makeIdempotencyKey } from "@/lib/idempotency";
import { ApprovedAction, buildApprovedActionWrite } from "@/lib/approved-actions";
import { errorMessage } from "@/lib/errors";

// This is a deliberately conservative processor.
// It only processes rows that are already marked Approved in Supabase.
// In a later version, add Notion polling to sync Approved status from Notion back into Supabase.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Missing Supabase config" }, { status: 500 });
  }

  const { data: actions, error } = await supabase
    .from("proposed_actions")
    .select("*")
    .eq("status", "Approved")
    .is("processed_at", null)
    .limit(25);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const results = [];

  for (const action of actions ?? []) {
    try {
      const write = buildApprovedActionWrite(action as ApprovedAction);
      const { error: writeError } = await supabase
        .from(write.table)
        .upsert(write.row, { onConflict: write.onConflict });
      if (writeError) throw new Error(errorMessage(writeError));

      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("proposed_actions")
        .update({ status: "Completed", processed_at: now })
        .eq("id", action.id);
      if (updateError) throw new Error(errorMessage(updateError));

      await supabase.from("audit_log").insert({
        entity_type: "proposed_action",
        entity_id: action.id,
        action: "approved_action.completed",
        idempotency_key: makeIdempotencyKey(["approved_action.completed", action.id, now]),
        details: {
          action_type: action.action_type,
          auth_user_id: user.authUserId,
          email: user.email
        }
      });

      if (action.notion_page_id) await markNotionPageCompleted(action.notion_page_id);
      results.push({ id: action.id, status: "Completed" });
    } catch (err) {
      const message = errorMessage(err);
      await supabase.from("proposed_actions").update({ status: "Needs Clarification", error: message }).eq("id", action.id);
      if (action.notion_page_id) await markNotionPageError(action.notion_page_id, message);
      results.push({ id: action.id, status: "Error", error: message });
    }
  }

  return NextResponse.json({ ok: true, processed_count: results.length, results });
}
