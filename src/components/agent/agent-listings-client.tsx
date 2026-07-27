"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ListingPromotion, Property } from "@/types/database";
import { StatusBadge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import {
  canMarkAvailableAgain,
  isListingArchivedHidden,
  isListingExpired,
  isListingPubliclyActive,
  isListingRented,
  isListingSold,
  isListingUnderReview,
} from "@/lib/listing-lifecycle";
import { listingPath } from "@/lib/marketplace/listing-path";
import { normalizeAssetType } from "@/lib/marketplace/listings";
import {
  clearListingDraft,
  draftDisplayLabel,
  draftThumbUrl,
  loadListingDraft,
  type ListingDraft,
} from "@/lib/listing-draft";
import {
  clearVehicleDraft,
  loadVehicleDraft,
  vehicleDraftLabel,
  type VehicleDraft,
} from "@/lib/marketplace/vehicle-draft";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { cn } from "@/lib/utils";
import { PromoteListingModal } from "@/components/agent/promote-listing-modal";
import { isBoostedActive, isFeaturedActive } from "@/lib/agent-tiers";

type Tab = "all" | "active" | "pending" | "expired" | "sold" | "archived";

function matchesTab(p: Property, tab: Tab): boolean {
  if (tab === "all") return true;
  if (tab === "active") return isListingPubliclyActive(p);
  if (tab === "pending") return isListingUnderReview(p);
  if (tab === "expired") {
    return (
      !isListingSold(p) &&
      !isListingRented(p) &&
      !isListingArchivedHidden(p) &&
      (isListingExpired(p) || !!p.expired_at)
    );
  }
  if (tab === "sold") return isListingSold(p) || isListingRented(p);
  if (tab === "archived") return isListingArchivedHidden(p);
  return true;
}

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
  const [vehicleDraft, setVehicleDraft] = useState<VehicleDraft | null>(null);
  const [promoteListing, setPromoteListing] = useState<Property | null>(null);
  const vehiclesOn = isLaunchFeatureVisible("vehicle_marketplace");

  useEffect(() => {
    setLocalDraft(loadListingDraft(agentId));
    setVehicleDraft(loadVehicleDraft(agentId));
  }, [agentId]);

  const counts = useMemo(() => {
    const base: Record<Tab, number> = {
      all: listings.length,
      active: 0,
      pending: 0,
      expired: 0,
      sold: 0,
      archived: 0,
    };
    for (const p of listings) {
      if (matchesTab(p, "active")) base.active += 1;
      if (matchesTab(p, "pending")) base.pending += 1;
      if (matchesTab(p, "expired")) base.expired += 1;
      if (matchesTab(p, "sold")) base.sold += 1;
      if (matchesTab(p, "archived")) base.archived += 1;
    }
    return base;
  }, [listings]);

  const filtered = useMemo(
    () => listings.filter((p) => matchesTab(p, tab)),
    [listings, tab],
  );

  async function runAction(id: string, action: string, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
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
    { id: "pending", label: "Pending" },
    { id: "expired", label: "Expired" },
    { id: "sold", label: "Sold" },
    { id: "archived", label: "Archived" },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 pb-14 pt-5 sm:px-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-dark">
            Seller
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy">My listings</h1>
        </div>
        <Link
          href="/agent/listings/choose"
          className="pressable inline-flex h-10 items-center rounded-full bg-navy px-4 text-sm font-bold text-gold shadow-[0_4px_14px_rgba(3,27,78,0.25)]"
        >
          + New listing
        </Link>
      </div>

      <nav
        className="hide-scrollbar flex gap-1.5 overflow-x-auto rounded-2xl border border-navy/[0.06] bg-white p-1.5 shadow-[0_4px_16px_-12px_rgba(3,27,78,0.14)]"
        aria-label="Filter listings"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "pressable shrink-0 rounded-full px-3 py-2 text-xs font-bold transition-all duration-200",
              tab === t.id
                ? "bg-navy text-gold shadow-[0_2px_10px_rgba(3,27,78,0.2)]"
                : "text-navy/45 hover:text-navy",
            )}
          >
            {t.label}
            <span
              className={cn(
                "ml-1 tabular-nums",
                tab === t.id ? "text-gold/80" : "text-navy/35",
              )}
            >
              ({counts[t.id]})
            </span>
          </button>
        ))}
      </nav>

      {tab === "all" && vehicleDraft && vehiclesOn ? (
        <div className="card-shadow rounded-xl border border-navy/15 bg-navy/5 p-3">
          <p className="font-medium line-clamp-1">{vehicleDraftLabel(vehicleDraft)}</p>
          <p className="text-sm text-muted">Vehicle draft — not submitted</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/agent/listings/new/vehicle"
              className="rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-navy"
            >
              Continue vehicle draft
            </Link>
            <button
              type="button"
              onClick={() => {
                clearVehicleDraft(agentId);
                setVehicleDraft(null);
              }}
              className="rounded-lg bg-surface px-3 py-1.5 text-xs font-bold text-danger"
            >
              Delete draft
            </button>
          </div>
        </div>
      ) : null}

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
            const isVehicle = normalizeAssetType(p.asset_type) === "VEHICLE";
            const previewHref = listingPath(p);
            const canRestore = canMarkAvailableAgain(p);
            const showMarkSold =
              p.status === "approved" &&
              !expired &&
              !isListingSold(p) &&
              !isListingRented(p) &&
              (isVehicle || p.listing_type === "sale");
            const showMarkRented =
              !isVehicle &&
              p.status === "approved" &&
              !expired &&
              !isListingSold(p) &&
              !isListingRented(p) &&
              (p.listing_type === "rent" ||
                p.listing_type === "lease" ||
                p.listing_type === "shortlet");

            return (
              <li
                key={p.id}
                className="card-shadow rounded-xl border border-border p-3"
              >
                <Link href={previewHref} className="flex gap-3 pressable">
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
                    <p className="font-medium line-clamp-1">{p.title}</p>
                    <p className="text-sm text-muted">
                      {formatPrice(Number(p.price), p.payment_period, p.listing_type)}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-navy/8 px-2 py-0.5 text-[10px] font-bold uppercase text-navy">
                        {isVehicle ? "Vehicle" : "Property"}
                      </span>
                      <StatusBadge status={p.status} />
                      {isListingSold(p) ? (
                        <span className="text-[10px] font-bold text-navy/70">Sold</span>
                      ) : isListingRented(p) ? (
                        <span className="text-[10px] font-bold text-navy/70">Rented</span>
                      ) : expired ? (
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
                </Link>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={previewHref}
                    className="rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-gold"
                  >
                    Preview
                  </Link>
                  <Link
                    href={`/agent/listings/${p.id}/edit`}
                    className="rounded-lg bg-surface px-3 py-1.5 text-xs font-bold text-navy"
                  >
                    Edit
                  </Link>
                  {featuredListingsEnabled && p.status === "approved" && !expired && (
                    <ActionBtn
                      disabled={busyId === p.id}
                      onClick={() => setPromoteListing(p)}
                      label={isFeaturedActive(p) ? "Featured" : "Promote"}
                      primary={!isFeaturedActive(p)}
                    />
                  )}
                  {showMarkRented ? (
                    <ActionBtn
                      disabled={busyId === p.id}
                      onClick={() =>
                        void runAction(
                          p.id,
                          "mark_rented",
                          "Mark as Rented? This listing will disappear from the public marketplace.",
                        )
                      }
                      label="Mark Rented"
                    />
                  ) : null}
                  {showMarkSold ? (
                    <ActionBtn
                      disabled={busyId === p.id}
                      onClick={() =>
                        void runAction(
                          p.id,
                          "mark_sold",
                          "Mark as Sold? This listing will disappear from the public marketplace.",
                        )
                      }
                      label="Mark Sold"
                    />
                  ) : null}
                  {canRestore ? (
                    <ActionBtn
                      disabled={busyId === p.id}
                      onClick={() =>
                        void runAction(
                          p.id,
                          "reactivate",
                          expired
                            ? "Renew this listing? It will go back for review before appearing publicly."
                            : "Make available again? It will go back for review before appearing publicly.",
                        )
                      }
                      label={expired ? "Renew" : "Available Again"}
                      primary
                    />
                  ) : null}
                  {p.status !== "archived" &&
                  !isListingSold(p) &&
                  !isListingUnderReview(p) ? (
                    <ActionBtn
                      disabled={busyId === p.id}
                      onClick={() =>
                        void runAction(
                          p.id,
                          "archive",
                          "Archive this listing? Buyers will no longer see it.",
                        )
                      }
                      label="Archive"
                    />
                  ) : null}
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
        primary ? "bg-gold text-navy" : "bg-surface text-navy",
      )}
    >
      {label}
    </button>
  );
}
