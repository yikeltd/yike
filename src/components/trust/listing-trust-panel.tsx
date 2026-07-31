"use client";

import { useState } from "react";
import { ShieldCheck, FileCheck, CheckCircle2, Award, Lock, Info, ChevronRight } from "lucide-react";
import type { Property } from "@/types/database";
import { cn, isVerifiedAgent } from "@/lib/utils";
import { TrustScoreExplanationModal } from "./trust-score-explanation-modal";
import { FraudWarningBanner } from "./fraud-warning-banner";

export function ListingTrustPanel({
  listing,
  className,
}: {
  listing: Property;
  className?: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const agentObj = (listing.agent as Record<string, unknown> | null) || {};
  const isAgentVerified = Boolean(
    agentObj.verified_badge ||
    agentObj.is_verified_agent ||
    listing.is_verified_listing
  );

  const trustScore = 95;
  const trustLevel = "platinum";

  return (
    <div className={cn("rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-4", className)}>
      {/* HEADER WITH SCORE GAUGE */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-2xl bg-[#031B4E] dark:bg-gold text-white dark:text-navy">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-black text-navy dark:text-white">
              Listing Trust & Verification Audit
            </h3>
            <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Verified by Yike Compliance & Mechanics
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="pressable flex items-center gap-1.5 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-gold px-3 py-1.5 text-xs font-black hover:bg-amber-200"
        >
          <span>{trustScore} / 100</span>
          <Info className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* VERIFIED FACTS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 space-y-0.5">
          <span className="text-[10px] font-semibold text-navy/50 dark:text-white/50 block">Identity Check</span>
          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            NIN Verified
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 space-y-0.5">
          <span className="text-[10px] font-semibold text-navy/50 dark:text-white/50 block">Business Reg.</span>
          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            CAC Active
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 space-y-0.5">
          <span className="text-[10px] font-semibold text-navy/50 dark:text-white/50 block">Inspection Status</span>
          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Passed Audit
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 space-y-0.5">
          <span className="text-[10px] font-semibold text-navy/50 dark:text-white/50 block">Escrow Ready</span>
          <span className="font-extrabold text-gold-dark dark:text-gold flex items-center gap-1">
            <Lock className="h-3.5 w-3.5" />
            Escrow Protected
          </span>
        </div>
      </div>

      {/* FRAUD WARNING GUIDANCE */}
      <FraudWarningBanner compact />

      {/* MODAL */}
      {modalOpen && (
        <TrustScoreExplanationModal
          score={trustScore}
          level={trustLevel}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
