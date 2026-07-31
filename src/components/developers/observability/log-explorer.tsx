"use client";

import { useState } from "react";
import type { LogEntry, LogLevel } from "@/types/observability";
import { Terminal, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogExplorer() {
  const [selectedLevel, setSelectedLevel] = useState<"ALL" | LogLevel>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const logs: LogEntry[] = [
    {
      id: "log_101",
      timestamp: "2026-07-31T02:44:00.180Z",
      level: "INFO",
      service: "EscrowService",
      requestId: "req_01J8K8X7E6W102",
      message: "Escrow milestone funded successfully for deal ESC_9814. Amount: ₦18,500,000 NGN.",
    },
    {
      id: "log_102",
      timestamp: "2026-07-31T02:43:12.450Z",
      level: "WARN",
      service: "RateLimiter",
      requestId: "req_01J8K8X7E99182",
      message: "API key yike_live_8492... approached 80% rate limit threshold (800 / 1000 req/min).",
    },
    {
      id: "log_103",
      timestamp: "2026-07-31T02:40:05.110Z",
      level: "INFO",
      service: "TrustPassportEngine",
      requestId: "req_01J8K8X7E10294",
      message: "Trust Passport score recalculated for USR_8810: Score upgraded from 88 to 95.",
    },
    {
      id: "log_104",
      timestamp: "2026-07-31T02:35:40.900Z",
      level: "ERROR",
      service: "WebhookDispatcher",
      requestId: "req_01J8K8X7E44019",
      message: "Webhook POST endpoint https://api.merchant-firm.com/webhooks returned HTTP 504 Gateway Timeout. Scheduled retry #1 in 5s.",
    },
  ];

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = selectedLevel === "ALL" || log.level === selectedLevel;
    const matchesQuery =
      searchQuery === "" ||
      log.requestId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.service.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesQuery;
  });

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-[#031B4E] text-white p-6 shadow-2xl space-y-4 text-xs select-none">
      
      {/* HEADER & FILTERS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-gold" />
          <h2 className="text-sm font-black uppercase tracking-wider text-gold">
            Centralized Platform Log Explorer
          </h2>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center gap-2 font-bold">
          {/* LEVEL BUTTONS */}
          {(["ALL", "INFO", "WARN", "ERROR", "CRITICAL"] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setSelectedLevel(lvl)}
              className={cn(
                "px-2.5 py-1 rounded-xl text-[10px] uppercase transition-all",
                selectedLevel === lvl
                  ? "bg-gold text-navy font-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              {lvl}
            </button>
          ))}

          {/* SEARCH INPUT */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-white/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="pl-7 pr-3 py-1 rounded-xl bg-black/40 border border-white/10 font-mono text-[11px] text-emerald-400 placeholder:text-white/40 focus:outline-none focus:border-gold"
            />
          </div>
        </div>
      </div>

      {/* LOG MESSAGES DISPLAY */}
      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="p-3.5 rounded-2xl bg-black/50 border border-white/10 font-mono text-[11px] space-y-1"
          >
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded font-black text-[9px]",
                    log.level === "ERROR" || log.level === "CRITICAL"
                      ? "bg-rose-500/20 text-rose-400"
                      : log.level === "WARN"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-emerald-500/20 text-emerald-400"
                  )}
                >
                  {log.level}
                </span>
                <span className="font-bold text-gold">[{log.service}]</span>
              </div>
              <span className="text-white/50">{log.timestamp}</span>
            </div>

            <p className="text-white/90 leading-relaxed">{log.message}</p>
            <p className="text-[10px] text-white/50">Request ID: {log.requestId}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
