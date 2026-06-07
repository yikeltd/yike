"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePinGate } from "@/components/admin/pin-confirm-modal";
import { cn } from "@/lib/utils";

type DriverRow = {
  id: string;
  driver_key: string;
  label: string;
  category: string;
  status: string;
  rejection_reason: string | null;
  evidence_requested: boolean;
};

const STATUS_STYLE: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-800",
  pending_review: "bg-amber-50 text-amber-900",
  rejected: "bg-red-50 text-red-800",
  requires_evidence: "bg-orange-50 text-orange-900",
};

export function AdminValueDriversPanel({ listingId }: { listingId: string }) {
  const { requirePin, pinModal } = usePinGate();
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/listings/${listingId}/value-drivers`);
    const data = (await res.json()) as {
      drivers?: DriverRow[];
      summary?: Record<string, unknown> | null;
    };
    setDrivers(data.drivers ?? []);
    setSummary(data.summary ?? null);
    setLoading(false);
  }, [listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function moderate(
    action: "approve_all" | "reject_all" | "moderate",
    extra?: { approveKeys?: string[]; rejectKeys?: string[]; requestEvidenceKeys?: string[] }
  ) {
    setBusy(true);
    setMessage("");
    const res = await fetch(`/api/admin/listings/${listingId}/value-drivers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        moderationNote: note.trim() || undefined,
        ...extra,
      }),
    });
    const data = (await res.json()) as { error?: string; drivers?: DriverRow[] };
    setBusy(false);
    if (!res.ok) {
      setMessage(data.error ?? "Could not update drivers");
      return;
    }
    setDrivers(data.drivers ?? []);
    setSelected(new Set());
    setMessage("Value drivers updated.");
    void load();
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="mt-3 skeleton h-24 w-full rounded-xl" />
      </section>
    );
  }

  if (drivers.length === 0) {
    return (
      <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-navy">Value drivers</h2>
        <p className="mt-2 text-sm text-muted">No value drivers submitted yet.</p>
      </section>
    );
  }

  const selectedKeys = [...selected];

  return (
    <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm space-y-4">
      {pinModal}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold text-navy">Value drivers</h2>
        {summary && (
          <span className="text-xs text-muted">
            Status: {String(summary.value_drivers_status ?? "—")} · Approved:{" "}
            {String(summary.approved_value_driver_count ?? 0)}
          </span>
        )}
      </div>

      <ul className="space-y-2">
        {drivers.map((d) => (
          <li
            key={d.id}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-navy/8 px-3 py-2"
          >
            <input
              type="checkbox"
              checked={selected.has(d.driver_key)}
              onChange={() => toggle(d.driver_key)}
              className="h-4 w-4 rounded border-navy/20"
            />
            <span className="flex-1 text-sm font-medium text-navy">{d.label}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                STATUS_STYLE[d.status] ?? "bg-surface text-muted"
              )}
            >
              {d.status.replace(/_/g, " ")}
            </span>
          </li>
        ))}
      </ul>

      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Moderation note (internal)"
        className="text-sm"
      />

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={busy}
          onClick={() => requirePin(() => moderate("approve_all"))}
        >
          Approve all
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => requirePin(() => moderate("reject_all"))}
        >
          Reject all
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={busy || selectedKeys.length === 0}
          onClick={() =>
            requirePin(() =>
              moderate("moderate", { approveKeys: selectedKeys })
            )
          }
        >
          Approve selected
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={busy || selectedKeys.length === 0}
          onClick={() =>
            requirePin(() =>
              moderate("moderate", { rejectKeys: selectedKeys })
            )
          }
        >
          Reject selected
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={busy || selectedKeys.length === 0}
          onClick={() =>
            requirePin(() =>
              moderate("moderate", { requestEvidenceKeys: selectedKeys })
            )
          }
        >
          Request evidence
        </Button>
      </div>

      {message && <p className="text-sm text-muted">{message}</p>}
    </section>
  );
}
