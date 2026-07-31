"use client";

import type { SemanticQueryResult, ParsedIntent } from "@/types/semantic-search";
import { ShieldCheck, CheckCircle2 } from "lucide-react";

export function HybridSearchResults({ currentIntent }: { currentIntent?: ParsedIntent }) {
  const results: SemanticQueryResult[] = [
    {
      id: "res_1",
      title: "Ultra-Modern 4 Bedroom Detached Duplex + Swimming Pool",
      category: "property",
      location: "Lekki Phase 1, Lagos",
      price: "₦285,000,000",
      similarityScore: 0.94,
      bm25Score: 0.88,
      hybridScore: 0.92,
      matchReasons: ["Swimming Pool Match", "Location Match (Lekki Phase 1)", "Price < ₦300M"],
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "res_2",
      title: "Foreign Used 2021 Lexus RX 350 F-Sport (Tokunbo)",
      category: "vehicle",
      location: "Ikeja, Lagos",
      price: "₦23,800,000",
      similarityScore: 0.91,
      bm25Score: 0.86,
      hybridScore: 0.89,
      matchReasons: ["Tokunbo Certified", "Make: Lexus RX 350", "Price < ₦25M"],
      image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80",
    },
  ];

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Hybrid Vector (Dense) + BM25 (Sparse) Ranking Results
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Combines 1536d Cosine similarity vectors with keyword relevance scoring for high accuracy.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gold">
          <span>HYBRID RETRIEVAL LATENCY: 14ms (REDIS CACHED)</span>
        </div>
      </div>

      {/* PARSED INTENT BADGES */}
      {currentIntent && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2 font-mono text-[11px]">
          <span className="text-[9px] font-sans font-black text-navy/50 dark:text-white/50 uppercase">Extracted Intent Metadata</span>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg bg-gold/20 text-navy dark:text-gold px-2.5 py-1 font-bold">Category: {currentIntent.category}</span>
            <span className="rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 font-bold">Location: {currentIntent.targetLocation}</span>
            {currentIntent.priceCap && <span className="rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2.5 py-1 font-bold">Max Price: {currentIntent.priceCap}</span>}
          </div>
        </div>
      )}

      {/* RESULTS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((res) => (
          <div
            key={res.id}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[9px] font-black uppercase">
                  Cosine Similarity: {(res.similarityScore * 100).toFixed(1)}%
                </span>
                <span className="font-mono text-[10px] text-navy/50 dark:text-white/50">Hybrid Score: {res.hybridScore}</span>
              </div>

              <h3 className="font-black text-sm text-navy dark:text-white leading-snug">{res.title}</h3>
              
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="font-black text-gold">{res.price}</span>
                <span className="text-navy/60 dark:text-white/60 text-[11px]">{res.location}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-1">
              <span className="text-[9px] font-black text-navy/40 dark:text-white/40 uppercase">Matched Attributes:</span>
              <div className="flex flex-wrap gap-1">
                {res.matchReasons.map((m, mIdx) => (
                  <span key={mIdx} className="rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[9px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
