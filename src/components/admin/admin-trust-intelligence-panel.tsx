"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePinGate } from "@/components/admin/pin-confirm-modal";
import { TRUST_LEVEL_LABELS } from "@/lib/trust/score-engine/constants";
import { cn } from "@/lib/utils";

type ScoreRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  label?: string;
  trust_score: number;
  risk_score: number;
  confidence_score: number;
  trust_level: string;
  event_count: number;
  score_frozen: boolean;
  escalated: boolean;
  last_calculated_at: string | null;
};

type EventRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  event_type: string;
  score_delta: number;
  risk_delta: number;
  reason: string;
  created_at: string;
};

const LEVEL_STYLE: Record<string, string> = {
  critical_risk: "bg-red-200 text-red-900",
  high_risk: "bg-red-100 text-red-800",
  elevated_risk: "bg-orange-100 text-orange-900",
  neutral: "bg-surface text-muted",
  trusted: "bg-emerald-100 text-emerald-900",
  highly_trusted: "bg-emerald-200 text-emerald-950",
  elite: "bg-gold/30 text-navy",
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "high_risk", label: "High risk" },
  { id: "low_confidence", label: "Low confidence" },
  { id: "highly_trusted", label: "Highly trusted" },
  { id: "escalated", label: "Escalated" },
  { id: "frozen", label: "Frozen" },
] as const;

export function AdminTrustIntelligencePanel() {
  const { requirePin, pinModal } = usePinGate();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ScoreRow | null>(null);
  const [detailEvents, setDetailEvents] = useState<EventRow[]>([]);
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/trust/scores?filter=${filter}`);
    const data = (await res.json()) as {
      scores?: ScoreRow[];
      recentEvents?: EventRow[];
      summary?: Record<string, number>;
    };
    setScores(data.scores ?? []);
    setEvents(data.recentEvents ?? []);
    setSummary(data.summary ?? null);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadDetail(row: ScoreRow) {
    setSelected(row);
    const res = await fetch(
      `/api/admin/trust/scores/${row.entity_type}/${row.entity_id}`
    );
    const data = (await res.json()) as { events?: EventRow[] };
    setDetailEvents(data.events ?? []);
  }

  async function action(
    row: ScoreRow,
    actionName: string,
    extra?: Record<string, unknown>
  ) {
    setMessage("");
    await requirePin(async () => {
      const res = await fetch(
        `/api/admin/trust/scores/${row.entity_type}/${row.entity_id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: actionName, adminNotes: notes || undefined, ...extra }),
        }
      );
      const data = (await res.json()) as { error?: string };
      setMessage(res.ok ? "Updated" : data.error ?? "Failed");
      await load();
      if (selected?.entity_id === row.entity_id) await loadDetail(row);
    });
  }

  return (
    <div className="space-y-4">
      {pinModal}
      <p className="text-xs text-muted">
        Internal only — trust scores never appear on public pages. All changes are audited.
      </p>

      {summary && (
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-surface px-3 py-1 font-semibold">
            Showing {summary.total}
          </span>
          <span className="rounded-full bg-red-50 px-3 py-1 font-semibold text-red-800">
            High risk: {summary.highRisk}
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-800">
            Trusted: {summary.trusted}
          </span>
          <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-900">
            Low confidence: {summary.lowConfidence}
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold",
              filter === f.id ? "bg-gold text-navy" : "bg-surface text-muted"
            )}
          >
            {f.label}
          </button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          {loading ? (
            <div className="skeleton h-32 rounded-xl" />
          ) : scores.length === 0 ? (
            <p className="text-sm text-muted">
              No trust scores yet. Run trust recalculation from Operations.
            </p>
          ) : (
            scores.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => void loadDetail(row)}
                className={cn(
                  "w-full rounded-xl border bg-white p-3 text-left text-sm transition-colors",
                  selected?.id === row.id ? "border-gold ring-1 ring-gold/40" : "border-navy/8"
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-navy">{row.label ?? row.entity_id.slice(0, 8)}</span>
                  <span className="text-[10px] uppercase text-muted">{row.entity_type}</span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                      LEVEL_STYLE[row.trust_level] ?? "bg-surface"
                    )}
                  >
                    {TRUST_LEVEL_LABELS[row.trust_level as keyof typeof TRUST_LEVEL_LABELS] ?? row.trust_level}
                  </span>
                  {row.escalated && (
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-800">
                      Escalated
                    </span>
                  )}
                  {row.score_frozen && (
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                      Frozen
                    </span>
                  )}
                </div>
                <div className="mt-1 flex gap-4 text-xs text-muted tabular-nums">
                  <span>Trust {Number(row.trust_score).toFixed(0)}</span>
                  <span>Risk {Number(row.risk_score).toFixed(0)}</span>
                  <span>Conf {Number(row.confidence_score).toFixed(0)}</span>
                  <span>{row.event_count} events</span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="rounded-xl border border-navy/10 bg-white p-4">
          {selected ? (
            <div className="space-y-3">
              <h3 className="font-bold text-navy">{selected.label}</h3>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal note (optional)"
                className="text-sm"
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => action(selected, "recalculate")}>
                  Recalculate
                </Button>
                <Button size="sm" variant="ghost" onClick={() => action(selected, "mark_trusted")}>
                  Mark trusted
                </Button>
                <Button size="sm" variant="ghost" onClick={() => action(selected, "escalate")}>
                  Escalate
                </Button>
                <Button size="sm" variant="ghost" onClick={() => action(selected, "freeze")}>
                  Freeze
                </Button>
                <Button size="sm" variant="ghost" onClick={() => action(selected, "reset")}>
                  Reset
                </Button>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-muted">Recent events</p>
                <ul className="max-h-64 space-y-2 overflow-y-auto text-xs">
                  {detailEvents.map((e) => (
                    <li key={e.id} className="rounded-lg bg-surface px-2 py-1.5">
                      <span className="font-semibold text-navy">{e.event_type}</span>
                      <span className="text-muted">
                        {" "}
                        ({e.score_delta >= 0 ? "+" : ""}
                        {e.score_delta} trust)
                      </span>
                      <p className="text-muted">{e.reason}</p>
                    </li>
                  ))}
                  {!detailEvents.length && (
                    <li className="text-muted">No events recorded yet.</li>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">Select an entity to view events and actions.</p>
          )}
          {message && <p className="mt-2 text-sm text-muted">{message}</p>}
        </div>
      </div>

      {events.length > 0 && (
        <div className="rounded-xl border border-navy/10 bg-white p-4">
          <p className="mb-2 text-xs font-bold uppercase text-muted">Platform-wide recent events</p>
          <ul className="space-y-1 text-xs text-muted">
            {events.slice(0, 8).map((e) => (
              <li key={e.id}>
                <span className="font-semibold text-navy">{e.event_type}</span> — {e.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
