"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LEAD_QUALITY_LABELS } from "@/lib/leads/operations-types";
import type { LeadQualityLabel } from "@/lib/leads/operations-types";

export function SupportLeadActions({
  leadId,
  archived,
  qualityLabel,
}: {
  leadId: string;
  archived: boolean;
  qualityLabel: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [label, setLabel] = useState(qualityLabel ?? "");

  async function patch(action: string, extra?: Record<string, unknown>) {
    setLoading(action);
    await fetch("/api/support/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: leadId, action, ...extra }),
    });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="rounded-lg border border-navy/15 px-2 py-1.5 text-xs"
      >
        <option value="">Quality label</option>
        {LEAD_QUALITY_LABELS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!label || loading === "quality"}
        onClick={() =>
          void patch("quality", { lead_quality_label: label as LeadQualityLabel })
        }
        className="rounded-lg border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy disabled:opacity-50"
      >
        Save label
      </button>
      <button
        type="button"
        disabled={loading === "assign"}
        onClick={() => void patch("assign")}
        className="rounded-lg border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy"
      >
        Assign to me
      </button>
      <button
        type="button"
        disabled={loading === "respond"}
        onClick={async () => {
          setLoading("respond");
          await fetch(`/api/support/leads/${leadId}/respond`, { method: "POST" });
          setLoading(null);
          router.refresh();
        }}
        className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-navy"
      >
        Mark responded
      </button>
      <button
        type="button"
        disabled={loading === "mark_spam"}
        onClick={() => void patch("mark_spam")}
        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
      >
        Mark spam
      </button>
      <button
        type="button"
        disabled={loading === "waive_charge"}
        onClick={() => void patch("waive_charge")}
        className="rounded-lg border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy"
      >
        Waive charge
      </button>
      {archived ? (
        <button
          type="button"
          disabled={loading === "unarchive"}
          onClick={() => void patch("unarchive")}
          className="rounded-lg border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy"
        >
          Restore
        </button>
      ) : (
        <button
          type="button"
          disabled={loading === "archive"}
          onClick={() => void patch("archive", { archive_reason: "resolved" })}
          className="rounded-lg border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy"
        >
          Archive
        </button>
      )}
    </div>
  );
}
