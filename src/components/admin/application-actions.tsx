"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApplicationStatus } from "@/lib/careers/constants";
import { cn } from "@/lib/utils";

const STATUS_ACTIONS: { status: ApplicationStatus; label: string; style: string }[] = [
  { status: "shortlisted", label: "Shortlist", style: "bg-gold text-navy font-bold" },
  { status: "review", label: "Review", style: "bg-surface text-navy" },
  { status: "interview", label: "Interview", style: "bg-navy text-white" },
  { status: "approved", label: "Approve", style: "bg-emerald-600 text-white" },
  { status: "rejected", label: "Reject", style: "bg-red-50 text-red-700" },
  { status: "archived", label: "Archive", style: "bg-surface text-muted" },
];

export function ApplicationActions({
  applicationId,
  compact,
}: {
  applicationId: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function update(status: ApplicationStatus) {
    setBusy(status);
    await fetch("/api/admin/careers/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: applicationId,
        status,
        note: note.trim() || undefined,
        markViewed: true,
      }),
    });
    setBusy(null);
    setNote("");
    router.refresh();
  }

  return (
    <div className={cn("space-y-2", compact && "space-y-1")}>
      <div className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3")}>
        {STATUS_ACTIONS.map((a) => (
          <button
            key={a.status}
            type="button"
            disabled={!!busy}
            onClick={() => void update(a.status)}
            className={cn(
              "pressable rounded-xl px-3 py-2 text-xs disabled:opacity-60",
              a.style
            )}
          >
            {busy === a.status ? "…" : a.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add note (optional)"
          className="flex-1 rounded-xl border border-navy/10 px-3 py-2 text-xs"
        />
      </div>
    </div>
  );
}
