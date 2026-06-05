import { cn } from "@/lib/utils";
import { BadgeCheck, Shield, Star, Sparkles } from "lucide-react";

export function VerifiedBadge({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-gold font-bold text-navy shadow-glow-gold",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <BadgeCheck className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} strokeWidth={2.5} />
      Verified
    </span>
  );
}

export function FeaturedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-navy/90 px-2 py-0.5 text-[10px] font-bold text-gold backdrop-blur-sm",
        className
      )}
    >
      <Star className="h-3 w-3 fill-gold" />
      Featured
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

export function TrendingBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-700 dark:text-orange-300",
        className
      )}
    >
      <Sparkles className="h-3 w-3" />
      Trending
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
    pending: "bg-gold/20 text-gold-dark",
    approved: "bg-gold/30 text-navy font-bold",
    rejected: "bg-red-500/15 text-red-600",
    rented: "bg-surface text-muted",
    hidden: "bg-surface text-muted",
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
