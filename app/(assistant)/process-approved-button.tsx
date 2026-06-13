"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProcessResponse = {
  ok: boolean;
  processed_count?: number;
  results?: Array<{ id: string; status: string; error?: string }>;
  error?: string;
};

export function ProcessApprovedButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function processApproved() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/process-approved", { method: "POST" });
      const payload = (await response.json()) as ProcessResponse;
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Processing failed.");

      const failures = payload.results?.filter((result) => result.status === "Error") ?? [];
      if (failures.length > 0) {
        setMessage(`Processed ${payload.processed_count ?? 0}; ${failures.length} need attention.`);
      } else {
        setMessage(`Processed ${payload.processed_count ?? 0} approved item${payload.processed_count === 1 ? "" : "s"}.`);
      }

      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="process-panel">
      <button type="button" onClick={processApproved} disabled={loading}>
        {loading ? "Processing..." : "Process approved"}
      </button>
      {message && <p className="form-message">{message}</p>}
    </div>
  );
}
