import { makeIdempotencyKey } from "./idempotency";

export type ApprovedAction = {
  id: string;
  action_type: string;
  title: string;
  description: string | null;
  priority: string | null;
  due_at: string | null;
  start_at: string | null;
  end_at: string | null;
  confidence: number;
  source_item_id: string | null;
  raw_json: Record<string, unknown> | null;
};

export type DomainWrite =
  | { table: "tasks"; row: Record<string, unknown>; onConflict: "idempotency_key" }
  | { table: "goals"; row: Record<string, unknown>; onConflict: "idempotency_key" }
  | { table: "reminders"; row: Record<string, unknown>; onConflict: "idempotency_key" }
  | { table: "project_updates"; row: Record<string, unknown>; onConflict: "idempotency_key" }
  | { table: "memory_facts"; row: Record<string, unknown>; onConflict: "idempotency_key" };

function textFromPayload(payload: Record<string, unknown> | null, key: string): string | null {
  const value = payload?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function numberFromPayload(payload: Record<string, unknown> | null, key: string): number | null {
  const value = payload?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function statusForApprovedTask(action: ApprovedAction, now = new Date()): "today" | "this_week" | "overdue" | "backlog" {
  if (!action.due_at) return "backlog";

  const due = new Date(action.due_at);
  if (Number.isNaN(due.getTime())) return "backlog";

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfToday);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  if (due < startOfToday) return "overdue";
  if (due < endOfWeek) return "today";
  return "this_week";
}

export function buildApprovedActionWrite(action: ApprovedAction): DomainWrite {
  const payload = action.raw_json ?? {};
  const baseKey = ["approved_action", action.action_type, action.id];

  if (action.action_type === "task") {
    return {
      table: "tasks",
      onConflict: "idempotency_key",
      row: {
        proposed_action_id: action.id,
        source_item_id: action.source_item_id,
        title: action.title,
        description: action.description,
        status: statusForApprovedTask(action),
        priority: action.priority,
        due_at: action.due_at,
        idempotency_key: makeIdempotencyKey(baseKey)
      }
    };
  }

  if (action.action_type === "goal") {
    return {
      table: "goals",
      onConflict: "idempotency_key",
      row: {
        title: action.title,
        description: action.description,
        status: "active",
        time_horizon: textFromPayload(payload, "time_horizon") ?? "unknown",
        next_action: textFromPayload(payload, "next_action"),
        idempotency_key: makeIdempotencyKey(baseKey)
      }
    };
  }

  if (action.action_type === "reminder") {
    return {
      table: "reminders",
      onConflict: "idempotency_key",
      row: {
        proposed_action_id: action.id,
        source_item_id: action.source_item_id,
        title: action.title,
        description: action.description,
        remind_at: action.due_at,
        status: "pending",
        idempotency_key: makeIdempotencyKey(baseKey)
      }
    };
  }

  if (action.action_type === "project_update") {
    return {
      table: "project_updates",
      onConflict: "idempotency_key",
      row: {
        source_item_id: action.source_item_id,
        proposed_action_id: action.id,
        update_text: action.description ?? action.title,
        status: "noted",
        idempotency_key: makeIdempotencyKey(baseKey)
      }
    };
  }

  if (action.action_type === "memory") {
    return {
      table: "memory_facts",
      onConflict: "idempotency_key",
      row: {
        proposed_action_id: action.id,
        source_item_id: action.source_item_id,
        text: textFromPayload(payload, "memory_text") ?? action.title,
        category: textFromPayload(payload, "category") ?? "other",
        sensitivity: textFromPayload(payload, "sensitivity") ?? "normal",
        reason_to_remember: textFromPayload(payload, "reason_to_remember") ?? action.description,
        status: "Pending",
        confidence: numberFromPayload(payload, "confidence") ?? action.confidence,
        expires_at: textFromPayload(payload, "expires_at") ?? action.due_at,
        idempotency_key: makeIdempotencyKey(baseKey)
      }
    };
  }

  throw new Error(`Processor for action_type=${action.action_type} is not implemented yet.`);
}
