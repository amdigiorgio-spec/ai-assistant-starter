"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function EditProposalForm({
  actionId,
  initialTitle,
  initialDescription
}: {
  actionId: string;
  initialTitle: string;
  initialDescription: string | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
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
          title,
          description
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
        <label htmlFor={`title-${actionId}`}>Title</label>
        <input id={`title-${actionId}`} value={title} onChange={(event) => setTitle(event.target.value)} />
        <label htmlFor={`description-${actionId}`}>Description</label>
        <textarea
          id={`description-${actionId}`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <button type="submit" disabled={loading || title.trim().length === 0}>
          {loading ? "Saving..." : "Save edits"}
        </button>
        {message && <p className="form-message">{message}</p>}
      </form>
    </details>
  );
}
