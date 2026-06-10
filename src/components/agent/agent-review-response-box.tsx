"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { REVIEW_REQUEST_LABELS } from "@/lib/review-memory";
import type { ReviewRequestType } from "@/lib/review-memory/constants";

type ReviewRequest = {
  id: string;
  request_type: ReviewRequestType;
  message: string;
  status: string;
  created_at: string;
};

export function AgentReviewResponseBox({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [responseText, setResponseText] = useState("");
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/agent/listings/${listingId}/review-response`);
    if (!res.ok) return;
    const data = (await res.json()) as { requests: ReviewRequest[] };
    const open = data.requests.filter((r) => r.status === "open");
    setRequests(open);
    if (open[0] && !activeRequestId) setActiveRequestId(open[0].id);
  }, [listingId, activeRequestId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (requests.length === 0) return null;

  const active = requests.find((r) => r.id === activeRequestId) ?? requests[0];

  async function submit() {
    if (!active || !responseText.trim()) return;
    setBusy(true);
    setMessage("");
    const res = await fetch(`/api/agent/listings/${listingId}/review-response`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId: active.id,
        responseText: responseText.trim(),
      }),
    });
    const body = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMessage(body.error ?? "Could not send response");
      return;
    }
    setMessage("Response sent — thank you. We will review shortly.");
    setResponseText("");
    router.refresh();
    void load();
  }

  return (
    <div className="rounded-xl border border-gold/40 bg-gold/5 p-4">
      <h3 className="text-sm font-bold text-navy">Update requested</h3>

      {requests.length > 1 && (
        <select
          value={active?.id}
          onChange={(e) => setActiveRequestId(e.target.value)}
          className="mt-3 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
        >
          {requests.map((r) => (
            <option key={r.id} value={r.id}>
              {REVIEW_REQUEST_LABELS[r.request_type]}
            </option>
          ))}
        </select>
      )}

      {active && (
        <p className="mt-3 rounded-lg bg-white p-3 text-sm text-muted">
          <span className="font-semibold text-navy">
            {REVIEW_REQUEST_LABELS[active.request_type]}:
          </span>{" "}
          {active.message}
        </p>
      )}

      <textarea
        value={responseText}
        onChange={(e) => setResponseText(e.target.value)}
        placeholder="Explain pricing, fees, location, or upload notes here…"
        rows={4}
        className="mt-3 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
      />

      <button
        type="button"
        disabled={busy || !responseText.trim()}
        onClick={() => void submit()}
        className="mt-3 w-full rounded-xl bg-navy py-3 text-sm font-bold text-gold disabled:opacity-50"
      >
        {busy ? "Sending…" : "Send response"}
      </button>

      {message && <p className="mt-2 text-xs text-muted">{message}</p>}
    </div>
  );
}
