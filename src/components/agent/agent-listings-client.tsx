"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ListingPromotion, Property } from "@/types/database";
import { StatusBadge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { isListingExpired, isListingPubliclyActive } from "@/lib/listing-lifecycle";
import {
  clearListingDraft,
  draftDisplayLabel,
  draftThumbUrl,
  loadListingDraft,
  type ListingDraft,
} from "@/lib/listing-draft";
import { cn } from "@/lib/utils";
import { PromoteListingModal } from "@/components/agent/promote-listing-modal";
import { isBoostedActive, isFeaturedActive } from "@/lib/agent-tiers";

type Tab = "all" | "active" | "expired" | "closed" | "archived";

export function AgentListingsClient({
  agentId,
  listings,
  featuredByListing = {},
  boostByListing = {},
  featuredListingsEnabled = false,
  featuredPaymentsEnabled = false,
}: {
  agentId: string;
  listings: Property[];
  featuredByListing?: Record<string, ListingPromotion>;
  boostByListing?: Record<string, ListingPromotion>;
  featuredListingsEnabled?: boolean;
  featuredPaymentsEnabled?: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [localDraft, setLocalDraft] = useState<ListingDraft | null>(null);
  const [promoteListing, setPromoteListing] = useState<Property | null>(null);

  useEffect(() => {
    setLocalDraft(loadListingDraft(agentId));
  }, [agentId]);

  const filtered = useMemo(() => {
    return listings.filter((p) => {
      const expired = isListingExpired(p);
      const active = isListingPubliclyActive(p);
      const closed =
        p.status === "rented" ||
        p.availability_status === "sold" ||
        p.availability_status === "unavailable" ||
        p.availability_status === "rented";
      if (tab === "active") return active;
      if (tab === "expired") return expired || p.expired_at;
      if (tab === "closed") return closed;
      if (tab === "archived") return p.status === "archived";
      return true;
    });
  }, [listings, tab]);

  async function runAction(id: string, action: string) {
    setBusyId(id);
    const res = await fetch(`/api/agent/listings/${id}/lifecycle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusyId(null);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      alert(data.error ?? "Action failed");
      return;
    }
    router.refresh();
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "expired", label: "Expired" },
    { id: "closed", label: "Rented/Sold" },
    { id: "archived", label: "Archived" },
  ];

  return (
    <div className="space-y-4 px-3 pt-2 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My listings</h1>
        <Link href="/agent/listings/new" className="text-sm font-medium text-primary">
          + Add listing
        </Link>
      </div>

      <nav className="hide-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-navy/10 bg-white p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-xs font-bold",
              tab === t.id ? "bg-navy text-white" : "text-muted"
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "all" && localDraft ? (
        <div className="card-shadow rounded-xl border border-gold/30 bg-gold/5 p-3">
          <div className="flex gap-3">
            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
              {draftThumbUrl(localDraft) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draftThumbUrl(localDraft)!}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-muted">
                  Draft
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium line-clamp-1">{draftDisplayLabel(localDraft)}</p>
              <p className="text-sm text-muted">Not submitted yet</p>
              <div className="mt-1">
                <span className="inline-flex rounded-full bg-navy/10 px-2 py-0.5 text-[10px] font-bold text-navy">
                  Draft
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/agent/listings/new"
              className="rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-navy"
            >
              Continue draft
            </Link>
            <button
              type="button"
              onClick={() => {
                clearListingDraft();
                setLocalDraft(null);
              }}
              className="rounded-lg bg-surface px-3 py-1.5 text-xs font-bold text-danger"
            >
              Delete draft
            </button>
          </div>
        </div>
      ) : null}

      {filtered.length === 0 && !(tab === "all" && localDraft) ? (
        <p className="text-sm text-muted">No listings in this view.</p>
      ) : filtered.length > 0 ? (
        <ul className="space-y-3">
          {filtered.map((p) => {
            const expired = isListingExpired(p);
            const featuredPromo = featuredByListing[p.id];
            const boostPromo = boostByListing[p.id];
            const featuredActive = isFeaturedActive(p);
            const boostActive = isBoostedActive(p);
            const featuredExpired =
              (p.is_featured || featuredPromo?.status === "active") && !featuredActive;
            const boostExpired =
              (p.is_boosted || boostPromo?.status === "active") && !boostActive;
            const expiry = new Date(p.expires_at).toLocaleDateString("en-NG", {
              day: "numeric",
              month: "short",
            });
            return (
              <li
                key={p.id}
                className="card-shadow rounded-xl border border-border p-3"
              >
                <div className="flex gap-3">
                  <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    <Image
                      src={p.media_urls[0] ?? "/placeholder-property.svg"}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/agent/listings/${p.id}/edit`}
                      className="font-medium line-clamp-1 hover:underline"
                    >
                      {p.title}
                    </Link>
                    <p className="text-sm text-muted">
                      {formatPrice(Number(p.price), p.payment_period, p.listing_type)}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <StatusBadge status={p.status} />
                      {expired ? (
                        <span className="text-[10px] font-bold text-amber-700">Expired</span>
                      ) : (
                        <span className="text-[10px] text-muted">Expires {expiry}</span>
                      )}
                      {p.views_count > 0 && (
                        <span className="text-[10px] text-muted">{p.views_count} views</span>
                      )}
                      {featuredActive && p.featured_until ? (
                        <span className="text-[10px] font-semibold text-gold-dark">
                          Featured · Active until{" "}
                          {new Date(p.featured_until).toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      ) : null}
                      {featuredExpired ? (
                        <span className="text-[10px] font-semibold text-muted">
                          Promotion expired
                        </span>
                      ) : null}
                      {boostActive && p.boosted_until ? (
                        <span className="text-[10px] font-semibold text-navy/80">
                          Boost active · Expires{" "}
                          {new Date(p.boosted_until).toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      ) : null}
                      {boostExpired ? (
                        <span className="text-[10px] font-semibold text-muted">
                          Boost expired
                        </span>
                      ) : null}
                      {!featuredActive && featuredPromo?.status === "pending" ? (
                        <span className="text-[10px] font-semibold text-amber-700">
                          Featured payment pending
                        </span>
                      ) : null}
                      {!boostActive && boostPromo?.status === "pending" ? (
                        <span className="text-[10px] font-semibold text-amber-700">
                          Boost payment pending
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {featuredListingsEnabled && p.status === "approved" && !expired && (
                    <ActionBtn
                      disabled={busyId === p.id}
                      onClick={() => setPromoteListing(p)}
                      label={isFeaturedActive(p) ? "Featured" : "Promote listing"}
                      primary={!isFeaturedActive(p)}
                    />
                  )}
                  {p.status === "approved" && !expired && (
                    <>
                      <ActionBtn
                        disabled={busyId === p.id}
                        onClick={() => runAction(p.id, "mark_rented")}
                        label="Rented"
                      />
                      <ActionBtn
                        disabled={busyId === p.id}
                        onClick={() => runAction(p.id, "mark_sold")}
                        label="Sold"
                      />
                      <ActionBtn
                        disabled={busyId === p.id}
                        onClick={() => runAction(p.id, "mark_unavailable")}
                        label="Unavailable"
                      />
                    </>
                  )}
                  {(expired || p.expired_at) && p.status !== "rejected" && (
                    <ActionBtn
                      disabled={busyId === p.id}
                      onClick={() => runAction(p.id, "reactivate")}
                      label="Reactivate"
                      primary
                    />
                  )}
                  {p.status !== "archived" && (
                    <ActionBtn
                      disabled={busyId === p.id}
                      onClick={() => runAction(p.id, "archive")}
                      label="Archive"
                    />
                  )}
                  <Link
                    href={`/agent/listings/${p.id}/edit`}
                    className="rounded-lg bg-surface px-3 py-1.5 text-xs font-bold text-navy"
                  >
                    Edit
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {promoteListing ? (
        <PromoteListingModal
          listing={promoteListing}
          paymentsEnabled={featuredPaymentsEnabled}
          onClose={() => setPromoteListing(null)}
        />
      ) : null}
    </div>
  );
}

function ActionBtn({
  label,
  onClick,
  disabled,
  primary,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-50",
        primary ? "bg-gold text-navy" : "bg-surface text-navy"
      )}
    >
      {label}
    </button>
  );
}
