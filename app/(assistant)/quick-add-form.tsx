"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function QuickAddForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [title, setTitle] = useState("Quick add");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_type: "manual",
          source_title: title,
          body_text: text,
          source_metadata: { entered_from: "phase_1_quick_add" }
        })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not extract actions.");

      setText("");
      setTitle("Quick add");
      setMessage(`Created ${payload.created_count} proposed action${payload.created_count === 1 ? "" : "s"}.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="quick-add" onSubmit={submit}>
      <div className="row compact">
        <div>
          <label htmlFor="quick-title">Title</label>
          <input id="quick-title" value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
      </div>
      <label htmlFor="quick-text">Quick add</label>
      <textarea
        id="quick-text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Add task call John tomorrow, remember I prefer mornings for deep work, or capture a project update."
      />
      <button type="submit" disabled={loading || text.trim().length < 5}>
        {loading ? "Extracting..." : "Create proposals"}
      </button>
      {message && <p className="form-message">{message}</p>}
    </form>
  );
}

