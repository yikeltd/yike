"use client";

import type { RecommendedListing } from "@/types/recommendations";
import { Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";

export function PersonalizedFeedSimulator() {
  const recommendations: RecommendedListing[] = [
    {
      id: "rec_1",
      title: "5 Bedroom Luxury Smart Villa + Swimming Pool",
      category: "property",
      location: "Ikoyi, Lagos",
      price: "₦320,000,000",
      matchScore: 96,
      matchReason: "High Vector Match (0.96) · Matches Lekki & Ikoyi Villa Preference",
      trustScore: 98,
      itemSimilarity: 0.96,
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "rec_2",
      title: "2023 Range Rover Autobiography (Foreign Used)",
      category: "vehicle",
      location: "Victoria Island, Lagos",
      price: "₦165,000,000",
      matchScore: 92,
      matchReason: "High Vector Match (0.92) · Matches Luxury SUV Preference",
      trustScore: 95,
      itemSimilarity: 0.92,
      image: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80",
    },
  ];

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            AI Personalized &quot;Recommended For You&quot; Feed
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Surfaces personalized marketplace items powered by collaborative filtering and item-to-item vector distance.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          <span>RANKING MODEL: HYBRID COLLABORATIVE + TRUST BOOST</span>
        </div>
      </div>

      {/* RECOMMENDATIONS FEED GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-gold/20 text-navy dark:text-gold px-2.5 py-0.5 text-[9px] font-black uppercase flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-gold" />
                  {rec.matchScore}% AI Match Score
                </span>
                <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[9px] font-mono font-black">
                  Trust Score: {rec.trustScore}/100
                </span>
              </div>

              <h3 className="font-black text-sm text-navy dark:text-white leading-snug">{rec.title}</h3>

              <div className="flex items-center justify-between font-mono text-xs">
                <span className="font-black text-gold">{rec.price}</span>
                <span className="text-navy/60 dark:text-white/60 text-[11px]">{rec.location}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-1">
              <span className="text-[9px] font-black text-navy/40 dark:text-white/40 uppercase">Recommendation Rationale:</span>
              <p className="text-[10px] text-navy/70 dark:text-white/70 font-mono font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                {rec.matchReason}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
