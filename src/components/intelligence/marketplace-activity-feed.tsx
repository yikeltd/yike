"use client";

import Link from "next/link";
import { Activity, Lock, ShieldCheck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function MarketplaceActivityFeed({
  className,
}: {
  className?: string;
}) {
  const events = [
    { title: "Escrow Milestone 1 Funded", detail: "10% deposit locked for 2022 Toyota Camry SE (#ESC_9814)", time: "12m ago", icon: Lock, link: "/escrow/ESC_9814" },
    { title: "NIN Identity Verified", detail: "Chief Stankings Properties NIN verified against National Registry", time: "1h ago", icon: ShieldCheck, link: "/trust" },
    { title: "Physical Inspection Passed", detail: "150-Point mechanic audit completed for 2022 Toyota Camry SE", time: "3h ago", icon: CheckCircle2, link: "/escrow/ESC_9814" },
  ];

  return (
    <div className={cn("rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-4 text-xs select-none", className)}>
      <h3 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-1.5">
        <Activity className="h-4 w-4 text-gold" />
        Live Marketplace Activity Feed
      </h3>

      <div className="space-y-2.5">
        {events.map((evt, idx) => {
          const Icon = evt.icon;
          return (
            <Link
              key={idx}
              href={evt.link}
              className="block p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:border-gold transition-all space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-navy dark:text-white flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-gold" />
                  {evt.title}
                </span>
                <span className="text-[9px] font-semibold text-navy/50 dark:text-white/50">{evt.time}</span>
              </div>
              <p className="text-[10px] text-navy/70 dark:text-white/70 line-clamp-1">{evt.detail}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
