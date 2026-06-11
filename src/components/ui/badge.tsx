"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { BadgeCheck, Shield, ShieldCheck, Star, Sparkles } from "lucide-react";

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
          "inline-flex items-center gap-1 rounded-full bg-gold font-bold text-navy shadow-glow-gold",
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
        "inline-flex items-center gap-1 rounded-full border border-white/25 bg-navy/75 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white/95 backdrop-blur-sm",
        className
      )}
    >
      <Star className="h-2.5 w-2.5 fill-gold/90 text-gold/90" strokeWidth={2} />
      Featured
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
          "inline-flex items-center gap-1 rounded-full border border-gold/50 bg-navy/90 font-bold text-gold backdrop-blur-sm",
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

import type { SellerType } from "@/lib/profile-display";

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
        "inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300",
        className
      )}
    >
      New listing
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
        "inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-700 dark:text-orange-300",
        className
      )}
    >
      <Sparkles className="h-3 w-3" />
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
  const styles: Record<string, string> = {
    not_started: "bg-surface text-muted",
    pending: "bg-gold/20 text-gold-dark",
    approved: "bg-gold/30 text-navy font-bold",
    verified: "bg-gold/30 text-navy font-bold",
    rejected: "bg-red-500/15 text-red-600",
    rented: "bg-surface text-muted",
    hidden: "bg-surface text-muted",
    on_hold: "bg-amber-500/15 text-amber-800",
    pending_verification: "bg-gold/20 text-gold-dark",
    suspended: "bg-red-500/15 text-red-600",
    deleted: "bg-surface text-muted line-through",
    active: "bg-emerald-500/10 text-emerald-700",
    reinstated: "bg-emerald-500/10 text-emerald-700",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        styles[status] ?? "bg-surface text-muted",
        className
      )}
    >
      {status}
    </span>
  );
}
