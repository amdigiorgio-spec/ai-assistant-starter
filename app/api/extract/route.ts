import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { extractActions } from "@/lib/openai-extract";
import { SourceInputSchema } from "@/lib/schemas";
import { toProposedActionRows } from "@/lib/normalize";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createProposedActionPage } from "@/lib/notion";
import { makeIdempotencyKey, sourceExcerpt } from "@/lib/idempotency";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const input = SourceInputSchema.parse({
      ...body,
      source_metadata: {
        ...(body.source_metadata ?? {}),
        current_date: new Date().toISOString().slice(0, 10)
      }
    });
    const supabase = getSupabaseAdmin();

    let sourceItemId: string | null = null;
    const sourceIdempotencyKey = makeIdempotencyKey([
      "source_item",
      input.source_type,
      input.source_title,
      input.sender ?? "",
      input.body_text
    ]);

    if (supabase) {
      const { data, error } = await supabase
        .from("source_items")
        .upsert({
          source_type: input.source_type,
          source_title: input.source_title,
          sender: input.sender ?? null,
          body_text: input.body_text,
          source_excerpt: sourceExcerpt(input.body_text),
          idempotency_key: sourceIdempotencyKey,
          raw_metadata: input.source_metadata ?? {}
        }, { onConflict: "idempotency_key" })
        .select("id")
        .single();

      if (error) throw new Error(`Supabase source_items upsert failed: ${error.message}`);
      sourceItemId = data.id;
    }

    const extraction = await extractActions(input);
    const rows = toProposedActionRows(extraction, sourceItemId, input);

    const created = [];

    for (const row of rows) {
      let actionId = row.id ?? row.idempotency_key;
      let notionPageId: string | null = null;

      if (supabase) {
        const { data, error } = await supabase
          .from("proposed_actions")
          .upsert({
            source_item_id: row.source_item_id,
            action_type: row.action_type,
            title: row.title,
            description: row.description,
            status: row.status,
            priority: row.priority,
            due_at: row.due_at,
            start_at: row.start_at,
            end_at: row.end_at,
            confidence: row.confidence,
            reason_summary: row.reason_summary,
            raw_json: row.raw_json,
            idempotency_key: row.idempotency_key
          }, { onConflict: "idempotency_key" })
          .select("id")
          .single();

        if (error) throw new Error(`Supabase proposed_actions upsert failed: ${error.message}`);
        actionId = data.id;
      }

      notionPageId = await createProposedActionPage({ row, actionId, input });

      if (supabase && notionPageId) {
        const { error } = await supabase
          .from("proposed_actions")
          .update({ notion_page_id: notionPageId })
          .eq("id", actionId);
        if (error) throw new Error(`Supabase notion_page_id update failed: ${error.message}`);
      }

      created.push({ actionId, notionPageId, actionType: row.action_type, title: row.title, status: row.status });
    }

    if (supabase && sourceItemId) {
      await supabase.from("source_items").update({ processed_at: new Date().toISOString() }).eq("id", sourceItemId);
    }

    return NextResponse.json({
      ok: true,
      source_item_id: sourceItemId,
      created_count: created.length,
      created,
      extraction
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
