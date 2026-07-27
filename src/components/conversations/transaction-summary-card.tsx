"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, MapPin, PhoneCall, Shield, Tag } from "lucide-react";
import type { ConversationWorkspace } from "@/lib/conversations/types";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATE_STYLE_MAP: Record<string, string> = {
  NEW: "bg-blue-500/10 text-blue-700 border-blue-200",
  ACTIVE: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  NEGOTIATING: "bg-gold/20 text-gold-dark border-gold/40 font-bold",
  VIEWING_SCHEDULED: "bg-navy/10 text-navy border-navy/20 font-bold",
  LIVE_WALKTHROUGH_COMPLETED: "bg-purple-500/10 text-purple-700 border-purple-200",
  INSPECTION_REQUESTED: "bg-amber-500/10 text-amber-800 border-amber-300 font-bold",
  INSPECTION_IN_PROGRESS: "bg-amber-500/15 text-amber-900 border-amber-400 font-bold",
  INSPECTION_COMPLETED: "bg-emerald-500/15 text-emerald-800 border-emerald-300 font-bold",
  OFFER_MADE: "bg-gold/30 text-navy border-gold/50 font-black",
  OFFER_ACCEPTED: "bg-emerald-600 text-white font-black",
  DEAL_COMPLETED: "bg-emerald-600 text-white font-black",
  DEAL_CANCELLED: "bg-danger/10 text-danger border-danger/20",
  ARCHIVED: "bg-navy/5 text-navy/40 border-navy/10",
};

export function TransactionSummaryCard({
  workspace,
  onOpenConnect,
  onToggleTrustPanel,
}: {
  workspace: ConversationWorkspace;
  onOpenConnect: () => void;
  onToggleTrustPanel: () => void;
}) {
  const listing = workspace.listing;
  const seller = workspace.seller;
  const stateBadgeClass = STATE_STYLE_MAP[workspace.status] || "bg-navy/10 text-navy";

  return (
    <div className="overflow-hidden rounded-3xl border border-navy/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Listing & Seller Specs */}
        <div className="flex items-start gap-4">
          <Link
            href={`/properties/${listing.slug}`}
            className="group relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl border border-navy/10 bg-navy/5"
          >
            {listing.imageUrl ? (
              <Image
                src={listing.imageUrl}
                alt={listing.title}
                fill
                className="object-cover transition-transform duration-200 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-bold text-navy/30 text-xs">
                Yike
              </div>
            )}
          </Link>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider",
                  stateBadgeClass
                )}
              >
                {workspace.status.replace(/_/g, " ")}
              </span>
              <button
                type="button"
                onClick={onToggleTrustPanel}
                className="flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-bold text-navy transition-all hover:bg-gold/30"
              >
                <Shield className="h-3 w-3 text-gold-dark" />
                <span>Trust Score: {seller.trustScore}/100</span>
              </button>
              <Link
                href={`/trust/${encodeURIComponent(seller.id)}`}
                target="_blank"
                className="rounded-full bg-navy/10 px-2 py-0.5 text-[10px] font-bold text-navy hover:bg-navy/20"
              >
                Yike Passport ↗
              </Link>
            </div>

            <h1 className="mt-1 text-base font-bold tracking-tight text-navy sm:text-lg">
              <Link href={`/properties/${listing.slug}`} className="hover:underline">
                {listing.title}
              </Link>
            </h1>

            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-navy/70">
              <span className="font-extrabold text-navy">
                {formatPrice(listing.price, "total", "rent")}
              </span>
              <span className="flex items-center gap-1 font-medium">
                <MapPin className="h-3.5 w-3.5 text-navy/40" />
                {listing.locationLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions & Status Badge */}
        <div className="flex items-center justify-between gap-3 border-t border-navy/10 pt-3 lg:border-t-0 lg:pt-0">
          <div className="flex items-center gap-2">
            {seller.badges.map((b) => (
              <span
                key={b.name}
                className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700"
              >
                ✓ {b.label}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenConnect}
              className="pressable flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs font-bold text-navy shadow-sm transition-all hover:bg-gold-light"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span>Connect</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
