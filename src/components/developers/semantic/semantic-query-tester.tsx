"use client";

import { useState } from "react";
import type { ParsedIntent } from "@/types/semantic-search";
import { Sparkles, Search, ArrowRight } from "lucide-react";

export function SemanticQueryTester({ onQuerySubmit }: { onQuerySubmit: (intent: ParsedIntent) => void }) {
  const [query, setQuery] = useState("Luxury 4 bedroom duplex with swimming pool in Lekki Phase 1 under 300 million NGN");

  const sampleQueries = [
    "Luxury 4 bedroom duplex with swimming pool in Lekki Phase 1 under 300 million NGN",
    "Clean Tokunbo Lexus RX 350 under 25M NGN in Ikeja with low mileage",
    "Affordable 2 bedroom apartment for rent in Yaba Lagos under 3M NGN",
  ];

  function handleSubmit(qStr: string) {
    setQuery(qStr);

    const parsed: ParsedIntent = {
      rawQuery: qStr,
      category: qStr.toLowerCase().includes("lexus") || qStr.toLowerCase().includes("tokunbo") ? "vehicle" : "property",
      targetLocation: qStr.toLowerCase().includes("lekki") ? "Lekki Phase 1, Lagos" : qStr.toLowerCase().includes("ikeja") ? "Ikeja, Lagos" : "Yaba, Lagos",
      priceCap: qStr.toLowerCase().includes("300 million") ? "₦300,000,000" : qStr.toLowerCase().includes("25m") ? "₦25,000,000" : "₦3,000,000",
      keywordsExtracted: qStr.split(" ").filter((w) => w.length > 3),
      vectorDimensions: 1536,
      modelUsed: "text-embedding-3-small",
    };

    onQuerySubmit(parsed);
  }

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold animate-pulse" />
            Natural Language Query Intent Parser & Embedding Generator
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Test natural language prompts to parse intent attributes and generate 1536-dimensional vector embeddings.
          </p>
        </div>

        <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[9px] font-black uppercase">
          MODEL: TEXT-EMBEDDING-3-SMALL (1536D)
        </span>
      </div>

      {/* SAMPLE PROMPT SELECTOR */}
      <div className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-navy/50 dark:text-white/50 block">
          Preset Sample Prompts:
        </span>
        <div className="flex flex-wrap gap-2">
          {sampleQueries.map((sq, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSubmit(sq)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-gold/20 text-navy dark:text-white font-semibold text-[11px] transition-all border border-slate-200 dark:border-white/10 text-left"
            >
              &quot;{sq}&quot;
            </button>
          ))}
        </div>
      </div>

      {/* INPUT QUERY FORM */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-navy/40 dark:text-white/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe what you are looking for in plain English..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/30 font-semibold text-xs text-navy dark:text-white focus:outline-none focus:border-gold"
            />
          </div>

          <button
            type="button"
            onClick={() => handleSubmit(query)}
            className="pressable rounded-xl bg-[#031B4E] dark:bg-gold text-white dark:text-navy px-6 py-2.5 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shrink-0"
          >
            <span>Execute AI Search</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
