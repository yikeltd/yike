"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANS_HREF = "/agent/plans";

export function PlansUpgradeCard({
  planLabel,
  className,
}: {
  planLabel?: string | null;
  className?: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(PLANS_HREF)}
      className={cn(
        "pressable flex h-full w-full items-center gap-3 rounded-2xl border border-border bg-elevated px-4 py-3.5 text-left shadow-float",
        className
      )}
    >
      <Sparkles className="h-5 w-5 shrink-0 text-gold-dark" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-navy">Plans & upgrades</p>
        <p className="mt-0.5 text-xs text-muted">More listings, analytics, branding</p>
        {planLabel ? (
          <p className="mt-1 text-[11px] font-semibold text-gold-dark">Current: {planLabel}</p>
        ) : (
          <p className="mt-1 text-[11px] font-semibold text-navy/70">Free plan · upgrade anytime</p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
    </button>
  );
}
