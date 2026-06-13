"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewButtons({ actionId, status }: { actionId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (status === "Completed" || status === "Rejected" || status === "Error") {
    return <p className="review-complete">No review actions available for {status.toLowerCase()} items.</p>;
  }

  async function decide(decision: "Approved" | "Rejected" | "Needs Clarification") {
    setLoading(decision);
    setError(null);

    try {
      const response = await fetch("/api/review-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposed_action_id: actionId, decision })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Decision failed.");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="review-actions">
      <button type="button" onClick={() => decide("Approved")} disabled={loading !== null}>
        {loading === "Approved" ? "Approving..." : "Approve"}
      </button>
      <button className="secondary-button" type="button" onClick={() => decide("Rejected")} disabled={loading !== null}>
        Reject
      </button>
      <button
        className="secondary-button"
        type="button"
        onClick={() => decide("Needs Clarification")}
        disabled={loading !== null}
      >
        Clarify
      </button>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
