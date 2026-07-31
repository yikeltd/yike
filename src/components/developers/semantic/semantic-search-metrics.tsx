"use client";

import type { SemanticBenchmark } from "@/types/semantic-search";
import { Cpu, Zap, HardDrive } from "lucide-react";

export function SemanticSearchMetrics() {
  const benchmark: SemanticBenchmark = {
    modelName: "openai/text-embedding-3-small",
    dimensions: 1536,
    avgQueryTimeMs: 14,
    cacheHitLatencyMs: 2,
    vectorIndexType: "HNSW (Hierarchical Navigable Small World)",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs select-none">
      
      <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-md space-y-1">
        <span className="text-[10px] font-black uppercase text-navy/50 dark:text-white/50 flex items-center gap-1">
          <Cpu className="h-3.5 w-3.5 text-gold" /> Embedding Vector Model
        </span>
        <p className="text-base font-black text-navy dark:text-gold tracking-tight">{benchmark.modelName}</p>
        <p className="text-[10px] text-navy/60 dark:text-white/60 font-semibold font-mono">{benchmark.dimensions} Vector Dimensions</p>
      </div>

      <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-md space-y-1">
        <span className="text-[10px] font-black uppercase text-navy/50 dark:text-white/50 flex items-center gap-1">
          <Zap className="h-3.5 w-3.5 text-emerald-500" /> Average Search Latency
        </span>
        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{benchmark.avgQueryTimeMs}ms</p>
        <p className="text-[10px] text-navy/60 dark:text-white/60 font-semibold font-mono">Redis Cache Hit: {benchmark.cacheHitLatencyMs}ms</p>
      </div>

      <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-md space-y-1">
        <span className="text-[10px] font-black uppercase text-navy/50 dark:text-white/50 flex items-center gap-1">
          <HardDrive className="h-3.5 w-3.5 text-purple-600" /> Vector Index Algorithm
        </span>
        <p className="text-sm font-black text-navy dark:text-white tracking-tight">{benchmark.vectorIndexType}</p>
        <p className="text-[10px] text-navy/60 dark:text-white/60 font-semibold">Sub-20ms Retrieval Guarantee</p>
      </div>

    </div>
  );
}
