"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LeadDealStatus, TransactionStage } from "@/types/database";

const STATUSES: LeadDealStatus[] = [
  "new",
  "contacted",
  "qualified",
  "inspection_requested",
  "negotiation",
  "closed_won",
  "closed_lost",
  "spam",
];

const STAGES: TransactionStage[] = [
  "inquiry",
  "inspection",
  "offer",
  "due_diligence",
  "agreement",
  "payment",
  "closed",
];

export function AdminLeadDealControls({
  leadId,
  leadStatus,
  transactionStage,
}: {
  leadId: string;
  leadStatus?: string;
  transactionStage?: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(leadStatus ?? "new");
  const [stage, setStage] = useState(transactionStage ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await fetch(`/api/admin/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead_status: status,
        transaction_stage: stage || null,
      }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as LeadDealStatus)}
        className="max-w-[8rem] rounded border border-border px-1 py-0.5 text-xs"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace("_", " ")}
          </option>
        ))}
      </select>
      <select
        value={stage}
        onChange={(e) => setStage(e.target.value)}
        className="max-w-[8rem] rounded border border-border px-1 py-0.5 text-xs"
      >
        <option value="">Stage —</option>
        {STAGES.map((s) => (
          <option key={s} value={s}>
            {s.replace("_", " ")}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={busy}
        onClick={() => void save()}
        className="rounded bg-navy px-2 py-0.5 text-[10px] font-bold text-gold"
      >
        {busy ? "…" : "Save"}
      </button>
    </div>
  );
}
