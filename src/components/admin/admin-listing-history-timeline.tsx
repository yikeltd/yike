"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type TimelineRow = {
  id: string;
  eventType: string;
  label: string;
  detail: string | null;
  publicVisible: boolean;
  source: string | null;
  actorRole: string | null;
  internalNote: string | null;
  createdAt: string;
};

type Summary = {
  price_change_count: number;
  last_price_changed_at: string | null;
  reactivation_count: number;
  had_unavailable_state: boolean;
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "price", label: "Price" },
  { id: "status", label: "Status" },
  { id: "verification", label: "Verification" },
  { id: "moderation", label: "Moderation" },
  { id: "public", label: "Public" },
  { id: "internal", label: "Internal" },
] as const;

export function AdminListingHistoryTimeline({ listingId }: { listingId: string }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [events, setEvents] = useState<TimelineRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/admin/listings/${listingId}/history?filter=${filter}`
    );
    const data = (await res.json()) as {
      events?: TimelineRow[];
      summary?: Summary | null;
    };
    setEvents(data.events ?? []);
    setSummary(data.summary ?? null);
    setLoading(false);
  }, [listingId, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold text-navy">History & timeline</h2>
        {summary && (
          <p className="text-xs text-muted">
            {summary.price_change_count} price change
            {summary.price_change_count === 1 ? "" : "s"}
            {summary.reactivation_count > 0
              ? ` · ${summary.reactivation_count} reactivation${summary.reactivation_count === 1 ? "" : "s"}`
              : ""}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              filter === f.id
                ? "bg-navy text-white"
                : "bg-surface text-muted hover:text-navy"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted">No history events yet for this filter.</p>
      ) : (
        <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {events.map((e) => (
            <li
              key={e.id}
              className="rounded-xl border border-navy/8 bg-surface/40 px-3 py-2.5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-navy">{e.label}</p>
                  {e.detail && (
                    <p className="mt-0.5 text-xs text-muted">{e.detail}</p>
                  )}
                  {e.internalNote && (
                    <p className="mt-1 text-xs text-danger/80">{e.internalNote}</p>
                  )}
                </div>
                <time
                  className="shrink-0 text-[10px] text-muted"
                  dateTime={e.createdAt}
                >
                  {new Date(e.createdAt).toLocaleString()}
                </time>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {e.publicVisible && (
                  <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[10px] font-bold text-gold-dark">
                    Public
                  </span>
                )}
                {e.source && (
                  <span className="rounded bg-navy/5 px-1.5 py-0.5 text-[10px] text-muted">
                    {e.source}
                  </span>
                )}
                {e.actorRole && (
                  <span className="rounded bg-navy/5 px-1.5 py-0.5 text-[10px] text-muted">
                    {e.actorRole}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
