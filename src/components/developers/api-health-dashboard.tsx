"use client";

import { DeveloperSubnav } from "./developer-subnav";
import { Activity, CheckCircle2, ShieldCheck, Clock, Calendar } from "lucide-react";

export function ApiHealthDashboard() {
  const services = [
    { name: "Marketplace & Listings API", status: "Operational", latency: "24ms", uptime: "99.99%" },
    { name: "Escrow & Custody Engine", status: "Operational", latency: "32ms", uptime: "100.0%" },
    { name: "Trust Passport & Verifications", status: "Operational", latency: "28ms", uptime: "99.97%" },
    { name: "Payments & Billing Infrastructure", status: "Operational", latency: "19ms", uptime: "99.98%" },
    { name: "Real-Time Webhook Engine", status: "Operational", latency: "15ms", uptime: "99.99%" },
  ];

  const maintenanceNotices = [
    {
      title: "Scheduled Database Index Maintenance",
      scheduledFor: "Aug 5, 2026 · 02:00 UTC - 02:30 UTC",
      impact: "Zero-Downtime Read Replica Rotation. API response latency may temporarily spike to ~45ms.",
    },
  ];

  const recentIncidents = [
    {
      date: "Jul 22, 2026",
      title: "Webhook Dispatch Delay (Resolved)",
      duration: "14 minutes",
      description: "Transient network congestion caused 120s latency spike on external webhook delivery retries. Resolved automatically via secondary failover queue.",
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white py-8 px-4 sm:px-6 select-none">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* HEADER & SUBNAV */}
        <div className="space-y-4">
          <DeveloperSubnav />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-navy dark:text-white flex items-center gap-2">
                <Activity className="h-6 w-6 text-emerald-500" />
                API Health & Operational Status
              </h1>
              <p className="text-xs text-navy/60 dark:text-white/60 mt-1">
                Real-time API service availability, response latency benchmarks, 90-day uptime metrics, and scheduled maintenance notices.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="h-4 w-4" />
              <span>ALL SYSTEMS OPERATIONAL (99.98% SLA)</span>
            </div>
          </div>
        </div>

        {/* CORE SERVICES STATUS LIST */}
        <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-4 text-xs">
          <h2 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-gold" />
            Core API Services Availability & Latency
          </h2>

          <div className="space-y-3">
            {services.map((svc, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-black text-sm text-navy dark:text-white">
                    <span>{svc.name}</span>
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-navy/50 dark:text-white/50 font-mono">
                    <span>Avg Latency: <strong className="text-gold">{svc.latency}</strong></span>
                    <span>·</span>
                    <span>90-Day Uptime: <strong className="text-emerald-500">{svc.uptime}</strong></span>
                  </div>
                </div>

                {/* 90-DAY UPTIME HEATMAP BAR */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: 30 }).map((_, bIdx) => (
                    <div
                      key={bIdx}
                      className="h-6 w-1.5 rounded-full bg-emerald-500 hover:opacity-80"
                      title="Day 100% Operational"
                    />
                  ))}
                  <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 ml-2">
                    Operational
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SCHEDULED MAINTENANCE & RECENT INCIDENTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          {/* SCHEDULED MAINTENANCE */}
          <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-lg space-y-3">
            <h3 className="font-black text-xs uppercase tracking-wider text-navy dark:text-white flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-blue-600" />
              Scheduled Maintenance Notices
            </h3>

            {maintenanceNotices.map((mn, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-900 dark:text-blue-200 space-y-1">
                <p className="font-black text-xs">{mn.title}</p>
                <p className="text-[10px] font-mono text-gold-dark dark:text-gold">{mn.scheduledFor}</p>
                <p className="text-[11px] opacity-90 leading-relaxed">{mn.impact}</p>
              </div>
            ))}
          </div>

          {/* RECENT INCIDENTS */}
          <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-lg space-y-3">
            <h3 className="font-black text-xs uppercase tracking-wider text-navy dark:text-white flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-purple-600" />
              Past 30-Day Incident History
            </h3>

            {recentIncidents.map((inc, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-black text-xs text-navy dark:text-white">{inc.title}</p>
                  <span className="text-[9px] font-mono text-navy/50 dark:text-white/50">{inc.date}</span>
                </div>
                <p className="text-[11px] text-navy/70 dark:text-white/70 leading-relaxed">{inc.description}</p>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
