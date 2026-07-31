"use client";

import { X, ShieldCheck, Award, CheckCircle2, AlertTriangle, FileCheck, Building2, UserCheck, Zap, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

export function TrustScoreExplanationModal({
  score = 95,
  level = "platinum",
  onClose,
}: {
  score?: number;
  level?: "platinum" | "gold" | "silver" | "bronze";
  onClose: () => void;
}) {
  const signalWeights = [
    { label: "Government NIN Verification", points: "30 Pts", icon: UserCheck, desc: "Verified against National Identity Registry (NIN)", active: true },
    { label: "CAC Business Registration", points: "20 Pts", icon: Building2, desc: "Active business status registered with CAC Nigeria", active: true },
    { label: "Phone & Email Verification", points: "10 Pts", icon: FileCheck, desc: "Active OTP verified phone number and work email", active: true },
    { label: "Completed Deals Volume", points: "15 Pts", icon: Award, desc: "5+ verified transactions completed on Yike Escrow", active: true },
    { label: "Response Speed & Rate", points: "10 Pts", icon: Zap, desc: "<30 min response time & >90% inquiry response rate", active: true },
    { label: "Ratings & Review Quality", points: "15 Pts", icon: ShieldCheck, desc: "4.5+ star rating average across verified buyers", active: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 p-3 sm:p-6 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white dark:bg-navy text-navy dark:text-white shadow-2xl border border-navy/10 dark:border-white/10 animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 px-5 py-4 bg-[#031B4E] text-white">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-gold" />
            <div>
              <h2 className="text-base font-black">Yike Trust Score Engine</h2>
              <p className="text-[10px] font-semibold text-white/70">
                Transparent 0–100 Reputation Algorithm
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* SCORE GAUGE BANNER */}
        <div className="p-5 bg-gradient-to-br from-[#031B4E] to-navy-light text-white flex items-center justify-between border-b border-gold/20">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gold">
              Current Trust Tier
            </span>
            <h3 className="text-xl font-black capitalize text-white mt-0.5">
              {level} Merchant Tier
            </h3>
            <p className="text-[11px] text-white/70 mt-0.5">
              Top 5% verified seller posture on Yike
            </p>
          </div>

          <div className="flex flex-col items-center justify-center h-16 w-16 rounded-2xl bg-gold text-navy font-black shadow-lg">
            <span className="text-xl leading-none">{score}</span>
            <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-80">/ 100</span>
          </div>
        </div>

        {/* SIGNAL WEIGHTS LIST */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-navy/60 dark:text-white/60">
            How Your Score is Calculated
          </h4>

          <div className="space-y-2 text-xs">
            {signalWeights.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 shrink-0 mt-0.5">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-black text-navy dark:text-white truncate">
                        {s.label}
                      </p>
                      <p className="text-[10px] text-navy/60 dark:text-white/60 mt-0.5 leading-tight">
                        {s.desc}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-gold/20 text-navy dark:text-gold px-2.5 py-0.5 text-[10px] font-black shrink-0">
                    +{s.points}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl bg-slate-100 dark:bg-white/5 p-3 text-[11px] text-navy/70 dark:text-white/70 space-y-1">
            <p className="font-black text-navy dark:text-white flex items-center gap-1">
              <Scale className="h-3.5 w-3.5 text-gold" />
              Dispute Penalties:
            </p>
            <p>
              Every unresolved buyer dispute or listing misrepresentation deducts -15 points from merchant trust score.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-navy-light">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-[#031B4E] dark:bg-gold py-3 text-xs font-black text-white dark:text-navy hover:bg-navy/90"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
