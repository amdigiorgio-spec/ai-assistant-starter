import { z } from "zod";

export const SourceInputSchema = z.object({
  source_type: z
    .enum([
      "manual",
      "gmail",
      "forwarded_email",
      "slack",
      "google_calendar",
      "outlook_calendar",
      "calendar_request",
      "voice_memo_future",
      "journal_future",
      "health_future",
      "finance_future",
      "meal_tracker_future"
    ])
    .default("manual"),
  source_title: z.string().min(1).max(300).default("Untitled input"),
  sender: z.string().max(300).optional().nullable(),
  body_text: z.string().min(5).max(100_000),
  source_metadata: z.record(z.string(), z.unknown()).optional().default({})
});

const PrioritySchema = z.enum(["low", "medium", "high", "none"]);
const ConfidenceSchema = z.number().min(0).max(1);

export const ExtractedTaskSchema = z.object({
  title: z.string().describe("Short task name."),
  description: z.string().nullable().describe("Helpful context, source details, or next step."),
  due_date: z.string().nullable().describe("ISO date or datetime if explicitly present or strongly implied; otherwise null."),
  priority: PrioritySchema,
  project_or_goal: z.string().nullable(),
  confidence: ConfidenceSchema,
  needs_review: z.boolean()
});

export const ExtractedCalendarEventSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  start_datetime: z.string().nullable().describe("ISO datetime if known; otherwise null."),
  end_datetime: z.string().nullable().describe("ISO datetime if known; otherwise null."),
  location: z.string().nullable(),
  attendees: z.array(z.string()).default([]),
  confidence: ConfidenceSchema,
  needs_review: z.boolean()
});

export const ExtractedReminderSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  remind_at: z.string().nullable().describe("ISO datetime if known; otherwise null."),
  confidence: ConfidenceSchema,
  needs_review: z.boolean()
});

export const ExtractedJournalEntrySchema = z.object({
  title: z.string(),
  text: z.string(),
  mood: z.string().nullable(),
  tags: z.array(z.string()).default([]),
  confidence: ConfidenceSchema,
  needs_review: z.boolean()
});

export const ExtractedGoalSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  time_horizon: z.enum(["day", "week", "month", "quarter", "year", "unknown"]),
  next_action: z.string().nullable(),
  confidence: ConfidenceSchema,
  needs_review: z.boolean()
});

export const ExtractedMemorySchema = z.object({
  memory_text: z.string().describe("A stable preference, recurring pattern, or important fact worth remembering."),
  category: z.enum([
    "scheduling_preference",
    "communication_style",
    "project_preference",
    "personal_preference",
    "dislike",
    "goal",
    "recurring_obligation",
    "relationship_context",
    "productivity_pattern",
    "work_preference",
    "other"
  ]),
  sensitivity: z.enum(["normal", "private", "work", "health_future", "finance_future", "other"]).default("normal"),
  reason_to_remember: z.string(),
  expires_at: z.string().nullable().describe("ISO date if this memory should expire; otherwise null."),
  confidence: ConfidenceSchema,
  needs_review: z.boolean()
});

export const AssistantExtractionSchema = z.object({
  tasks: z.array(ExtractedTaskSchema).default([]),
  calendar_events: z.array(ExtractedCalendarEventSchema).default([]),
  reminders: z.array(ExtractedReminderSchema).default([]),
  journal_entries: z.array(ExtractedJournalEntrySchema).default([]),
  goals: z.array(ExtractedGoalSchema).default([]),
  memories: z.array(ExtractedMemorySchema).default([]),
  ignored_reason: z.string().nullable(),
  overall_confidence: ConfidenceSchema
});

export type SourceInput = z.infer<typeof SourceInputSchema>;
export type AssistantExtraction = z.infer<typeof AssistantExtractionSchema>;

export type ProposedActionRow = {
  id?: string;
  source_item_id: string | null;
  action_type: "task" | "calendar_event" | "reminder" | "journal_entry" | "goal" | "memory";
  title: string;
  description: string | null;
  status: "Pending" | "Approved" | "Rejected" | "Needs Clarification" | "Completed" | "Error";
  priority: "low" | "medium" | "high" | "none" | null;
  due_at: string | null;
  start_at: string | null;
  end_at: string | null;
  confidence: number;
  reason_summary: string | null;
  raw_json: Record<string, unknown>;
  idempotency_key: string;
};
