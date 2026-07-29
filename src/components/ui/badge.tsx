"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  BadgeCheck,
  Shield,
  ShieldCheck,
  Star,
  Sparkles,
  Crown,
  Tag,
  CircleOff,
  TrendingUp,
} from "lucide-react";
import type { SellerType } from "@/lib/profile-display";

const VERIFIED_TIP = "Verified identity or business information.";

function VerifiedTip({ open }: { open: boolean }) {
  return (
    <span
      role="tooltip"
      className={cn(
        "pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 w-max max-w-[220px] -translate-x-1/2 rounded-lg bg-navy px-2.5 py-1.5 text-[10px] font-medium leading-snug text-white shadow-lg",
        open ? "block" : "hidden md:group-hover:block"
      )}
    >
      {VERIFIED_TIP}
    </span>
  );
}

export function VerifiedBadge({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500 font-bold text-white shadow-sm",
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
          className
        )}
        aria-label={`Verified. ${VERIFIED_TIP}`}
      >
        <BadgeCheck className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} strokeWidth={2.5} />
        Verified
      </button>
      <VerifiedTip open={open} />
    </span>
  );
}

export function FeaturedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold px-2 py-0.5 text-[10px] font-bold tracking-wide text-navy shadow-sm",
        className
      )}
    >
      <Star className="h-2.5 w-2.5 fill-navy/80 text-navy" strokeWidth={2} />
      Featured
    </span>
  );
}

export function PremiumBadge({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-600 font-bold text-white shadow-sm",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <Crown className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} strokeWidth={2.5} />
      Premium
    </span>
  );
}

export function NegotiableBadge({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/15 font-bold text-orange-700 dark:text-orange-300",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <Tag className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} strokeWidth={2.5} />
      Negotiable
    </span>
  );
}

export function SoldBadge({
  className,
  size = "sm",
  label = "Sold",
}: {
  className?: string;
  size?: "sm" | "md";
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-slate-400/30 bg-slate-500/15 font-bold text-slate-700 dark:text-slate-300",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <CircleOff className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} strokeWidth={2.5} />
      {label}
    </span>
  );
}

export function YikeVerifiedBadge({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-navy/90 font-bold text-emerald-300 backdrop-blur-sm",
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
          className
        )}
        aria-label={`Yike Verified. ${VERIFIED_TIP}`}
      >
        <ShieldCheck
          className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")}
          strokeWidth={2.5}
        />
        Yike Verified
      </button>
      <VerifiedTip open={open} />
    </span>
  );
}

export function ResponsiveBadge({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 font-semibold text-emerald-800 dark:text-emerald-300",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <Sparkles className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      Responsive
    </span>
  );
}

export function DeveloperBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-navy/20 bg-navy/5 px-2 py-0.5 text-[10px] font-semibold text-navy dark:text-white",
        className
      )}
    >
      Developer
    </span>
  );
}

export function AgencyBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-navy/20 bg-navy/5 px-2 py-0.5 text-[10px] font-semibold text-navy dark:text-white",
        className
      )}
    >
      Agency
    </span>
  );
}

export function SellerTypeBadge({
  type,
  prefix,
  className,
  size = "md",
}: {
  type: SellerType;
  prefix?: "listed_by" | "none";
  className?: string;
  size?: "sm" | "md";
}) {
  const labels: Record<SellerType, { listed_by: string; plain: string }> = {
    individual: { listed_by: "Listed by Individual", plain: "Individual" },
    agent: { listed_by: "Listed by Agent", plain: "Agent" },
    landlord: { listed_by: "Listed by Landlord", plain: "Landlord" },
    company: { listed_by: "Listed by Company", plain: "Company" },
    developer: { listed_by: "Listed by Developer", plain: "Developer" },
  };
  const label = prefix === "listed_by" ? labels[type].listed_by : labels[type].plain;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-navy/15 bg-navy/5 font-semibold text-navy dark:text-white",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      {label}
    </span>
  );
}

export function SafetyBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-navy/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm",
        className
      )}
    >
      <Shield className="h-3 w-3 text-gold" />
      Yike Safe
    </span>
  );
}

export function TrustPill({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-elevated/90 px-2 py-0.5 text-[10px] font-semibold text-navy backdrop-blur-md",
        className
      )}
    >
      <Sparkles className="h-3 w-3 text-gold" />
      Trusted agent
    </span>
  );
}

export function NewListingBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700 dark:text-sky-300",
        className
      )}
    >
      New
    </span>
  );
}

export function TrendingBadge({
  className,
  label = "Trending",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-orange-500/25 bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-700 dark:text-orange-300",
        className
      )}
    >
      <TrendingUp className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}

export function PopularAreaBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-navy/10 px-2 py-0.5 text-[10px] font-bold text-navy dark:text-gold",
        className
      )}
    >
      Popular area
    </span>
  );
}

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const normalized = String(status || "").toLowerCase();

  let style = "bg-slate-100 text-slate-800 border border-slate-300 font-bold";
  let label = status;

  if (
    normalized === "pending" ||
    normalized === "pending_review" ||
    normalized === "pending_verification" ||
    normalized === "under_review"
  ) {
    style = "bg-amber-100 text-amber-900 border border-amber-300 font-bold";
    label = "Verification Pending";
  } else if (
    normalized === "verified" ||
    normalized === "approved" ||
    normalized === "active" ||
    normalized === "verified_agent" ||
    normalized === "verified_company"
  ) {
    style = "bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold";
    label = "Verified";
  } else if (
    normalized === "rejected" ||
    normalized === "unsuccessful" ||
    normalized === "failed" ||
    normalized === "suspended"
  ) {
    style = "bg-rose-100 text-rose-900 border border-rose-300 font-bold";
    label = "Verification Unsuccessful";
  } else if (normalized === "not_started" || normalized === "unverified") {
    style = "bg-slate-100 text-slate-800 border border-slate-300 font-bold";
    label = "Not Verified";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold tracking-tight shadow-2xs",
        style,
        className
      )}
    >
      {label}
    </span>
  );
}
