"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { usePinGate } from "@/components/admin/pin-confirm-modal";
import { useDestructiveAction } from "@/components/admin/destructive-action-modal";
import {
  REVIEW_QUEUE_LABELS,
  type ReviewQueueGroup,
} from "@/lib/review-memory";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Property, Profile } from "@/types/database";

type QueueListing = Property & {
  agent: Profile | null;
  review_scores?: { good?: string[]; attention?: string[] };
};

type QueueResponse = {
  listings: QueueListing[];
  total: number;
  groups: Record<string, number>;
  groupLabels: Record<string, string>;
};

export function AdminBulkReviewBoard() {
  const router = useRouter();
  const { requirePin, pinModal } = usePinGate();
  const { confirm, destructiveModal } = useDestructiveAction();
  const [group, setGroup] = useState<ReviewQueueGroup | "">("");
  const [data, setData] = useState<QueueResponse | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const qs = group ? `?group=${group}` : "";
    const res = await fetch(`/api/admin/listings/review-queue${qs}`);
    if (res.ok) setData((await res.json()) as QueueResponse);
  }, [group]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (!data) return;
    setSelected(new Set(data.listings.map((l) => l.id)));
  }

  async function bulk(action: string) {
    if (selected.size === 0) return;
    setBusy(action);
    setMessage("");
    const res = await fetch("/api/admin/listings/review-bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, listingIds: [...selected] }),
    });
    const body = (await res.json()) as { error?: string; succeeded?: number };
    setBusy(null);
    if (!res.ok) {
      setMessage(body.error ?? "Bulk action failed");
      return;
    }
    setMessage(`Updated ${body.succeeded ?? 0} listings`);
    setSelected(new Set());
    router.refresh();
    void load();
  }

  const groups = (Object.keys(REVIEW_QUEUE_LABELS) as ReviewQueueGroup[]).filter(
    (g) => (data?.groups[g] ?? 0) > 0 || group === g
  );

  return (
    <div className="space-y-4">
      <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setGroup("")}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-xs font-bold",
            !group ? "bg-gold text-navy" : "bg-white text-muted shadow-float"
          )}
        >
          All pending
        </button>
        {groups.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGroup(g)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-xs font-bold",
              group === g ? "bg-gold text-navy" : "bg-white text-muted shadow-float"
            )}
          >
            {REVIEW_QUEUE_LABELS[g]} ({data?.groups[g] ?? 0})
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={selectAll}
          className="text-xs font-bold text-gold-dark"
        >
          Select all
        </button>
        <span className="text-xs text-muted">{selected.size} selected</span>
        <button
          type="button"
          disabled={!selected.size || !!busy}
          onClick={() => requirePin(() => bulk("approve"))}
          className="pressable rounded-xl bg-gold px-3 py-2 text-xs font-bold text-navy"
        >
          Approve selected
        </button>
        <button
          type="button"
          disabled={!selected.size || !!busy}
          onClick={() => requirePin(() => bulk("request_update"))}
          className="pressable rounded-xl bg-navy/10 px-3 py-2 text-xs font-bold text-navy"
        >
          Request update
        </button>
        <button
          type="button"
          disabled={!selected.size || !!busy}
          onClick={() =>
            confirm({
              title: "Lower visibility for selected listings?",
              description: "Selected listings will be deprioritized in search and feeds.",
              actionType: "listing.review_bulk",
              bulkCount: selected.size,
              onConfirm: async () => {
                requirePin(() => bulk("lower_visibility"));
              },
            })
          }
          className="pressable rounded-xl bg-surface px-3 py-2 text-xs font-bold text-muted"
        >
          Lower visibility
        </button>
        <button
          type="button"
          disabled={!selected.size || !!busy}
          onClick={() =>
            confirm({
              title: "Hold selected listings?",
              description: "Held listings stay off the marketplace until reviewed again.",
              actionType: "listing.review_bulk",
              requireReason: true,
              bulkCount: selected.size,
              onConfirm: async () => {
                requirePin(() => bulk("hold"));
              },
            })
          }
          className="pressable rounded-xl bg-surface px-3 py-2 text-xs font-bold text-muted"
        >
          Hold selected
        </button>
      </div>

      {message && <p className="text-sm text-muted">{message}</p>}

      <div className="space-y-2">
        {(data?.listings ?? []).map((listing) => {
          const thumb = listing.media_urls[0];
          const scores = listing.review_scores as
            | { attention?: string[] }
            | undefined;
          return (
            <div
              key={listing.id}
              className="flex gap-3 rounded-2xl bg-white p-3 shadow-float"
            >
              <input
                type="checkbox"
                checked={selected.has(listing.id)}
                onChange={() => toggle(listing.id)}
                className="mt-2 h-4 w-4 accent-gold"
              />
              <Link
                href={`/lex/auth/listings/${listing.id}`}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface"
              >
                {thumb ? (
                  <Image src={thumb} alt="" fill className="object-cover" sizes="64px" unoptimized />
                ) : null}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Link
                    href={`/lex/auth/listings/${listing.id}`}
                    className="line-clamp-1 font-bold text-navy hover:text-gold-dark"
                  >
                    {listing.title}
                  </Link>
                  <span className="shrink-0 rounded-full bg-navy px-2 py-0.5 text-xs font-bold text-gold">
                    {listing.review_overall_score ?? "—"}/100
                  </span>
                </div>
                <p className="text-sm font-bold text-navy">
                  {formatPrice(
                    Number(listing.price),
                    listing.payment_period,
                    listing.listing_type
                  )}
                </p>
                <p className="text-xs text-muted">
                  {listing.area}, {listing.city} · {listing.agent?.full_name ?? "—"}
                </p>
                {scores?.attention?.[0] && (
                  <p className="mt-1 text-xs text-amber-800">• {scores.attention[0]}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {pinModal}
      {destructiveModal}
    </div>
  );
}
