"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TrustQualityBatchButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function runBatch() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/trust/recalculate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Batch failed");
        return;
      }
      setMessage(
        `Updated ${data.listingsUpdated} listings · ${data.duplicatesFlagged} duplicate flags · ${data.agentsUpdated} agents`
      );
      router.refresh();
    } catch {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => void runBatch()}
        disabled={loading}
        className="rounded-xl bg-navy px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        {loading ? "Running…" : "Recalculate trust & quality"}
      </button>
      {message && <p className="text-sm text-muted">{message}</p>}
    </div>
  );
}

export function ListingModerationActions({
  listingId,
  status,
}: {
  listingId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function moderate(action: string) {
    setLoading(action);
    try {
      const note =
        action === "request_edits"
          ? window.prompt("Note for agent (optional)") ?? undefined
          : undefined;
      const res = await fetch(`/api/admin/listings/${listingId}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Action failed");
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "approved" && (
        <button
          type="button"
          disabled={!!loading}
          onClick={() => void moderate("approve")}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
        >
          Approve
        </button>
      )}
      {status !== "flagged" && (
        <button
          type="button"
          disabled={!!loading}
          onClick={() => void moderate("flag")}
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white"
        >
          Flag
        </button>
      )}
      {status !== "hidden" && (
        <button
          type="button"
          disabled={!!loading}
          onClick={() => void moderate("hide")}
          className="rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-white"
        >
          Hide
        </button>
      )}
      {status !== "rejected" && (
        <button
          type="button"
          disabled={!!loading}
          onClick={() => void moderate("reject")}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700"
        >
          Reject
        </button>
      )}
    </div>
  );
}

export function DuplicateScanButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function scan() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/listings/scan-duplicates", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Scan failed");
        return;
      }
      alert(`Flagged ${data.duplicatesFlagged} listing pairs`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void scan()}
      disabled={loading}
      className="rounded-xl border border-navy/20 px-4 py-2 text-sm font-bold text-navy"
    >
      {loading ? "Scanning…" : "Run duplicate scan"}
    </button>
  );
}
