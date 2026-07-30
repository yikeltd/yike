"use client";

import { useState } from "react";
import { ShieldCheck, FileCheck, CheckCircle2, SearchCheck, Lock, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type TrustIndicatorType =
  | "identity"
  | "property"
  | "documents"
  | "inspection"
  | "escrow";

export interface TrustIndicatorItem {
  id: TrustIndicatorType;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof ShieldCheck;
  badgeClass: string;
  active: boolean;
}

export function getPropertyTrustIndicators(listing: {
  is_verified_listing?: boolean;
  is_verified?: boolean;
  agent?: { is_verified?: boolean } | null;
  extras?: Record<string, unknown> | null;
}): TrustIndicatorItem[] {
  const isAgentVerified = Boolean(listing.agent?.is_verified);
  const isListingVerified = Boolean(
    listing.is_verified_listing || listing.is_verified
  );
  const extras = listing.extras || {};
  const isDocVerified = Boolean(extras.documents_verified || isListingVerified);
  const isInspected = Boolean(extras.inspection_completed || isListingVerified);

  return [
    {
      id: "identity",
      label: "Identity Verified Seller",
      shortLabel: "Seller Verified",
      description:
        "The seller or agent has submitted government ID and business credentials verified by Yike Compliance.",
      icon: ShieldCheck,
      badgeClass: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
      active: isAgentVerified || isListingVerified,
    },
    {
      id: "property",
      label: "Property Verified",
      shortLabel: "Property Verified",
      description:
        "This listing location, photos, and availability have been cross-checked by Yike field teams.",
      icon: CheckCircle2,
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
      active: isListingVerified,
    },
    {
      id: "documents",
      label: "Title & Documents Verified",
      shortLabel: "Docs Verified",
      description:
        "Land title (Governor's Consent, C of O, or Survey) has been reviewed for registration clarity.",
      icon: FileCheck,
      badgeClass: "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
      active: isDocVerified,
    },
    {
      id: "inspection",
      label: "Physical Inspection Completed",
      shortLabel: "Inspected",
      description:
        "An accredited Yike verifier conducted a physical walkthrough to confirm condition & amenities.",
      icon: SearchCheck,
      badgeClass: "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
      active: isInspected,
    },
    {
      id: "escrow",
      label: "Yike Escrow Available",
      shortLabel: "Escrow Ready",
      description:
        "Payment is held safely until lease agreement or title transfer documents are fully signed.",
      icon: Lock,
      badgeClass: "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-gold dark:border-amber-700",
      active: true,
    },
  ];
}

export function PropertyTrustIndicators({
  listing,
  className,
}: {
  listing: {
    is_verified_listing?: boolean;
    is_verified?: boolean;
    agent?: { is_verified?: boolean } | null;
    extras?: Record<string, unknown> | null;
  };
  className?: string;
}) {
  const indicators = getPropertyTrustIndicators(listing);
  const activeIndicators = indicators.filter((i) => i.active);
  const [selected, setSelected] = useState<TrustIndicatorItem | null>(null);

  if (activeIndicators.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-wider text-navy/70 dark:text-white/70">
          Trust & Verification Badges
        </h4>
        <span className="text-[10px] font-semibold text-navy/40 dark:text-white/40">
          Tap badge for details
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {activeIndicators.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className={cn(
                "group pressable inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all shadow-xs hover:scale-[1.02] active:scale-95",
                item.badgeClass
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{item.shortLabel}</span>
              <Info className="h-3 w-3 opacity-60 group-hover:opacity-100" />
            </button>
          );
        })}
      </div>

      {/* DETAIL MODAL / BOTTOM SHEET */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-navy p-6 shadow-2xl space-y-4 border border-navy/10 dark:border-white/10 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={cn("p-2 rounded-2xl border", selected.badgeClass)}>
                  <selected.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-navy dark:text-white">
                    {selected.label}
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    Verified Status Active
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-navy dark:text-white hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs leading-relaxed text-navy/80 dark:text-white/80">
              {selected.description}
            </p>

            <div className="rounded-2xl bg-slate-50 dark:bg-white/5 p-3 text-[11px] font-medium text-navy/70 dark:text-white/70 space-y-1">
              <p className="font-bold text-navy dark:text-white">Why Yike Trust Matters:</p>
              <p>
                Every verified badge on Yike represents an audited check designed to eliminate inspection scams, double-allocations, and fraudulent real estate ads across Nigeria.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="w-full rounded-2xl bg-[#031B4E] py-3 text-xs font-black text-white hover:bg-navy/90"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
