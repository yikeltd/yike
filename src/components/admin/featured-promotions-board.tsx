"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { ListingPromotion, ListingPromotionStatus } from "@/types/database";
import { promotionStatusLabel } from "@/lib/featured-promotions/service";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TABS: { id: ListingPromotionStatus | "all"; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "active", label: "Active" },
  { id: "expired", label: "Expired" },
  { id: "cancelled", label: "Cancelled" },
  { id: "all", label: "All" },
];

function statusTone(status: ListingPromotionStatus): string {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-800";
    case "pending":
    case "paid":
      return "bg-amber-50 text-amber-800";
    case "expired":
      return "bg-slate-100 text-slate-600";
    case "cancelled":
    case "failed":
      return "bg-red-50 text-red-700";
    default:
      return "bg-surface text-muted";
  }
}

export function FeaturedPromotionsBoard() {
  const [tab, setTab] = useState<ListingPromotionStatus | "all">("pending");
  const [promotions, setPromotions] = useState<ListingPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const qs = tab === "all" ? "" : `?status=${tab}`;
    const res = await fetch(`/api/admin/featured-promotions${qs}`);
    const data = (await res.json()) as { promotions?: ListingPromotion[]; error?: string };
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not load promotions");
      return;
    }
    setPromotions(data.promotions ?? []);
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(id: string, action: "activate" | "expire" | "cancel") {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/admin/featured-promotions/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusyId(null);
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Action failed");
      return;
    }
    void load();
  }

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-semibold",
              tab === t.id ? "bg-navy text-white" : "bg-surface text-muted"
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : promotions.length === 0 ? (
        <p className="text-sm text-muted">No promotions in this view.</p>
      ) : (
        <ul className="space-y-3">
          {promotions.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-border bg-white px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-navy">
                    {p.listing?.title ?? "Listing"}
                  </p>
                  <p className="text-sm text-muted">
                    {p.listing?.area}
                    {p.listing?.city ? ` · ${p.listing.city}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {p.user?.full_name ?? "Agent"} · {p.duration_days} days ·{" "}
                    {formatPrice(Number(p.amount), "total", "rent")}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-muted">
                    {p.promotion_reference}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-bold",
                    statusTone(p.status)
                  )}
                >
                  {promotionStatusLabel(p.status)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {p.listing?.id ? (
                  <Link
                    href={`/lex/auth/listings/${p.listing.id}`}
                    className="rounded-lg bg-surface px-3 py-1.5 text-xs font-bold text-navy"
                  >
                    View listing
                  </Link>
                ) : null}
                {(p.status === "pending" || p.status === "paid") && (
                  <>
                    <button
                      type="button"
                      disabled={busyId === p.id}
                      onClick={() => runAction(p.id, "activate")}
                      className="rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-navy disabled:opacity-50"
                    >
                      Activate
                    </button>
                    <button
                      type="button"
                      disabled={busyId === p.id}
                      onClick={() => runAction(p.id, "cancel")}
                      className="rounded-lg bg-surface px-3 py-1.5 text-xs font-bold text-danger disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {p.status === "active" && (
                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => runAction(p.id, "expire")}
                    className="rounded-lg bg-surface px-3 py-1.5 text-xs font-bold text-navy disabled:opacity-50"
                  >
                    Expire
                  </button>
                )}
              </div>

              {p.starts_at ? (
                <p className="mt-2 text-[11px] text-muted">
                  {p.starts_at.slice(0, 10)}
                  {p.expires_at ? ` → ${p.expires_at.slice(0, 10)}` : ""}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
