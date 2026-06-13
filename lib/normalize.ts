import { AssistantExtraction, ProposedActionRow, SourceInput } from "./schemas";
import { makeIdempotencyKey } from "./idempotency";

function cleanTitle(title: string, fallback: string) {
  const trimmed = title.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 200) : fallback;
}

export function toProposedActionRows(
  extraction: AssistantExtraction,
  sourceItemId: string | null,
  input: SourceInput
): ProposedActionRow[] {
  const rows: ProposedActionRow[] = [];

  for (const task of extraction.tasks) {
    rows.push({
      source_item_id: sourceItemId,
      action_type: "task",
      title: cleanTitle(task.title, "Untitled task"),
      description: task.description,
      status: task.needs_review ? "Needs Clarification" : "Pending",
      priority: task.priority,
      due_at: task.due_date,
      start_at: null,
      end_at: null,
      confidence: task.confidence,
      reason_summary: task.project_or_goal ? `Related to ${task.project_or_goal}` : "Extracted as a possible task.",
      raw_json: task,
      idempotency_key: makeIdempotencyKey(["proposed_action", sourceItemId, input.source_type, "task", task.title, task.due_date])
    });
  }

  for (const event of extraction.calendar_events) {
    rows.push({
      source_item_id: sourceItemId,
      action_type: "calendar_event",
      title: cleanTitle(event.title, "Untitled calendar event"),
      description: event.description,
      status: event.needs_review ? "Needs Clarification" : "Pending",
      priority: null,
      due_at: null,
      start_at: event.start_datetime,
      end_at: event.end_datetime,
      confidence: event.confidence,
      reason_summary: event.location ? `Location: ${event.location}` : "Extracted as a possible calendar event.",
      raw_json: event,
      idempotency_key: makeIdempotencyKey(["proposed_action", sourceItemId, input.source_type, "calendar_event", event.title, event.start_datetime])
    });
  }

  for (const reminder of extraction.reminders) {
    rows.push({
      source_item_id: sourceItemId,
      action_type: "reminder",
      title: cleanTitle(reminder.title, "Untitled reminder"),
      description: reminder.description,
      status: reminder.needs_review ? "Needs Clarification" : "Pending",
      priority: null,
      due_at: reminder.remind_at,
      start_at: null,
      end_at: null,
      confidence: reminder.confidence,
      reason_summary: "Extracted as a possible reminder.",
      raw_json: reminder,
      idempotency_key: makeIdempotencyKey(["proposed_action", sourceItemId, input.source_type, "reminder", reminder.title, reminder.remind_at])
    });
  }

  for (const journal of extraction.journal_entries) {
    rows.push({
      source_item_id: sourceItemId,
      action_type: "journal_entry",
      title: cleanTitle(journal.title, "Journal entry"),
      description: journal.text,
      status: journal.needs_review ? "Needs Clarification" : "Pending",
      priority: null,
      due_at: null,
      start_at: null,
      end_at: null,
      confidence: journal.confidence,
      reason_summary: journal.mood ? `Mood: ${journal.mood}` : "Extracted as a journal-like note.",
      raw_json: journal,
      idempotency_key: makeIdempotencyKey(["proposed_action", sourceItemId, input.source_type, "journal_entry", journal.title])
    });
  }

  for (const goal of extraction.goals) {
    rows.push({
      source_item_id: sourceItemId,
      action_type: "goal",
      title: cleanTitle(goal.title, "Untitled goal"),
      description: goal.description,
      status: goal.needs_review ? "Needs Clarification" : "Pending",
      priority: null,
      due_at: null,
      start_at: null,
      end_at: null,
      confidence: goal.confidence,
      reason_summary: goal.next_action ? `Next action: ${goal.next_action}` : `Horizon: ${goal.time_horizon}`,
      raw_json: goal,
      idempotency_key: makeIdempotencyKey(["proposed_action", sourceItemId, input.source_type, "goal", goal.title])
    });
  }

  for (const memory of extraction.memories) {
    rows.push({
      source_item_id: sourceItemId,
      action_type: "memory",
      title: cleanTitle(memory.memory_text, "Memory proposal"),
      description: memory.reason_to_remember,
      status: memory.needs_review ? "Needs Clarification" : "Pending",
      priority: null,
      due_at: memory.expires_at,
      start_at: null,
      end_at: null,
      confidence: memory.confidence,
      reason_summary: `Category: ${memory.category}`,
      raw_json: memory,
      idempotency_key: makeIdempotencyKey(["proposed_action", sourceItemId, input.source_type, "memory", memory.memory_text])
    });
  }

  return rows;
}
