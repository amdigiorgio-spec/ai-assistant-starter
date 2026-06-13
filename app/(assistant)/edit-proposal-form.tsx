"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function EditProposalForm({
  actionId,
  initialActionType,
  initialTitle,
  initialDescription,
  initialPriority,
  initialDueAt,
  initialStartAt,
  initialEndAt
}: {
  actionId: string;
  initialActionType: string;
  initialTitle: string;
  initialDescription: string | null;
  initialPriority: string | null;
  initialDueAt: string | null;
  initialStartAt: string | null;
  initialEndAt: string | null;
}) {
  const router = useRouter();
  const [actionType, setActionType] = useState(initialActionType);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [priority, setPriority] = useState(initialPriority ?? "none");
  const [dueAt, setDueAt] = useState(initialDueAt ?? "");
  const [startAt, setStartAt] = useState(initialStartAt ?? "");
  const [endAt, setEndAt] = useState(initialEndAt ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/review-actions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposed_action_id: actionId,
          action_type: actionType,
          title,
          description,
          priority,
          due_at: dueAt || null,
          start_at: startAt || null,
          end_at: endAt || null
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not save changes.");
      setMessage("Saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <details className="edit-panel">
      <summary>Edit proposal</summary>
      <form onSubmit={submit}>
        <label htmlFor={`action-type-${actionId}`}>Action type</label>
        <select id={`action-type-${actionId}`} value={actionType} onChange={(event) => setActionType(event.target.value)}>
          <option value="task">Task</option>
          <option value="project_update">Project update</option>
          <option value="calendar_event">Calendar event</option>
          <option value="meeting_options">Meeting options</option>
          <option value="reminder">Reminder</option>
          <option value="goal">Goal</option>
          <option value="memory">Memory</option>
          <option value="journal_entry">Journal entry</option>
          <option value="spam_candidate">Spam candidate</option>
          <option value="email_style_example">Email style example</option>
        </select>
        <label htmlFor={`title-${actionId}`}>Title</label>
        <input id={`title-${actionId}`} value={title} onChange={(event) => setTitle(event.target.value)} />
        <label htmlFor={`description-${actionId}`}>Description</label>
        <textarea
          id={`description-${actionId}`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <div className="row">
          <div>
            <label htmlFor={`priority-${actionId}`}>Priority</label>
            <select id={`priority-${actionId}`} value={priority} onChange={(event) => setPriority(event.target.value)}>
              <option value="none">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label htmlFor={`due-${actionId}`}>Due / remind at</label>
            <input id={`due-${actionId}`} value={dueAt} onChange={(event) => setDueAt(event.target.value)} placeholder="YYYY-MM-DD or ISO time" />
          </div>
        </div>
        <div className="row">
          <div>
            <label htmlFor={`start-${actionId}`}>Start</label>
            <input id={`start-${actionId}`} value={startAt} onChange={(event) => setStartAt(event.target.value)} placeholder="Optional ISO time" />
          </div>
          <div>
            <label htmlFor={`end-${actionId}`}>End</label>
            <input id={`end-${actionId}`} value={endAt} onChange={(event) => setEndAt(event.target.value)} placeholder="Optional ISO time" />
          </div>
        </div>
        <button type="submit" disabled={loading || title.trim().length === 0}>
          {loading ? "Saving..." : "Save edits"}
        </button>
        {message && <p className="form-message">{message}</p>}
      </form>
    </details>
  );
}
