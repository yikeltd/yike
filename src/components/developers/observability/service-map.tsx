"use client";

import type { ServiceNode } from "@/types/observability";
import { Network } from "lucide-react";

export function ServiceMap() {
  const nodes: ServiceNode[] = [
    { id: "node_1", name: "Client Browser / Mobile App", serviceType: "frontend", latencyMs: 4, status: "operational", errorRate: "0.0%", dependencies: ["node_2"] },
    { id: "node_2", name: "Next.js App Router (Turbopack)", serviceType: "api", latencyMs: 12, status: "operational", errorRate: "0.02%", dependencies: ["node_3", "node_4", "node_5"] },
    { id: "node_3", name: "Supabase DB Cluster (PostgreSQL)", serviceType: "database", latencyMs: 18, status: "operational", errorRate: "0.01%", dependencies: [] },
    { id: "node_4", name: "Escrow Custody Engine (SafeHaven)", serviceType: "escrow", latencyMs: 32, status: "operational", errorRate: "0.00%", dependencies: ["node_5"] },
    { id: "node_5", name: "Multi-Provider Payment Gateway", serviceType: "payments", latencyMs: 19, status: "operational", errorRate: "0.04%", dependencies: ["node_6"] },
    { id: "node_6", name: "Real-Time Webhook Engine", serviceType: "webhooks", latencyMs: 15, status: "operational", errorRate: "0.00%", dependencies: [] },
  ];

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <Network className="h-4 w-4 text-emerald-500" />
            Interactive Service Dependency Map
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Topology mapping of service nodes, operational health, and latency propagation.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>ALL 6 SERVICE NODES HEALTHY</span>
        </div>
      </div>

      {/* TOPOLOGY NODES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3 shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-navy dark:text-gold text-xs">{node.name}</span>
              <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[9px] font-black uppercase">
                {node.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-navy/70 dark:text-white/70">
              <div>
                <span className="text-navy/40 dark:text-white/40 block">Latency</span>
                <span className="font-bold text-navy dark:text-white">{node.latencyMs}ms</span>
              </div>
              <div>
                <span className="text-navy/40 dark:text-white/40 block">Error Rate</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{node.errorRate}</span>
              </div>
            </div>

            {node.dependencies.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-white/10 text-[9px] font-semibold text-navy/60 dark:text-white/60 flex items-center gap-1">
                <span>Calls:</span>
                <span className="font-mono text-gold">{node.dependencies.join(", ")}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
