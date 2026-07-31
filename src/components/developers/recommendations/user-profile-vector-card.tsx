"use client";

import type { UserProfileVector } from "@/types/recommendations";
import { User, ShieldCheck, Target, DollarSign } from "lucide-react";

export function UserProfileVectorCard() {
  const profile: UserProfileVector = {
    userId: "USR_8810_LEKKI",
    personaName: "Lekki & Ikoyi Real Estate & Luxury SUV Investor",
    preferredCategories: ["Luxury Residential Duplexes", "Foreign Used Luxury SUVs"],
    targetLocations: ["Lekki Phase 1", "Ikoyi", "Victoria Island"],
    budgetRange: "₦150,000,000 – ₦350,000,000",
    trustScoreRequirement: 90,
    embeddingVectorId: "vec_usr_8810_1536d",
  };

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-4 text-xs select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <User className="h-4 w-4 text-gold" />
            User Preference Behavioral Profile & Embedding Vector
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Implicit behavioral vector representation capturing search history, saved items, and budget constraints.
          </p>
        </div>

        <span className="rounded-full bg-gold/20 text-navy dark:text-gold px-2.5 py-0.5 text-[9px] font-black uppercase font-mono">
          {profile.embeddingVectorId}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
          <span className="text-[10px] font-black text-navy/40 dark:text-white/40 uppercase block">Persona Category</span>
          <p className="font-black text-navy dark:text-white text-xs">{profile.personaName}</p>
          <p className="text-[10px] text-gold font-mono">{profile.preferredCategories.join(" · ")}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
          <span className="text-[10px] font-black text-navy/40 dark:text-white/40 uppercase block">Target Locations & Budget</span>
          <p className="font-bold text-navy dark:text-white text-xs flex items-center gap-1">
            <Target className="h-3.5 w-3.5 text-emerald-500" />
            {profile.targetLocations.join(", ")}
          </p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center gap-0.5">
            <DollarSign className="h-3 w-3" />
            {profile.budgetRange}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
          <span className="text-[10px] font-black text-navy/40 dark:text-white/40 uppercase block">Trust Score Filter</span>
          <p className="font-black text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" />
            Minimum {profile.trustScoreRequirement}+ Trust Passport Score
          </p>
          <p className="text-[10px] text-navy/60 dark:text-white/60">Applies 1.25x Trust Rank Multiplier</p>
        </div>
      </div>
    </div>
  );
}
