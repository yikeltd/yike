"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  Lock,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Server,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminOperationsDashboard() {
  const kpis = [
    { label: "Total Published Listings", value: "3,482", sub: "2,140 Houses · 1,342 Vehicles", icon: Building2, color: "bg-blue-500/10 text-blue-600" },
    { label: "Active Escrow Custody", value: "₦642.8M", sub: "28 Active Deal Workspaces", icon: Lock, color: "bg-emerald-500/10 text-emerald-600" },
    { label: "Pending Verifications", value: "14 Queue", sub: "8 NIN · 6 CAC Registrations", icon: ShieldCheck, color: "bg-amber-500/10 text-amber-600" },
    { label: "Active Disputes / Frozen", value: "2 Open", sub: "Under Escrow Officer Audit", icon: AlertTriangle, color: "bg-rose-500/10 text-rose-600" },
  ];

  const systemHealth = [
    { service: "Supabase Database & Auth", status: "Operational", ping: "24ms", ok: true },
    { service: "Paystack Payment Gateway", status: "Operational", ping: "85ms", ok: true },
    { service: "SafeHaven Escrow Vault", status: "Operational", ping: "110ms", ok: true },
    { service: "Sendchamp OTP & Notification Gateway", status: "Operational", ping: "45ms", ok: true },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white pb-20 select-none">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-navy/10 dark:border-white/10 bg-[#031B4E] px-6 py-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-gold text-navy font-black">
            <Activity className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider text-gold">
              YIKE EXECUTIVE OPERATIONS COMMAND CENTER
            </h1>
            <p className="text-[11px] font-semibold text-white/70">
              Platform Health, Verification Queue & Escrow Operations v1.8
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold">
          <Link href="/lex/auth/moderation-console" className="rounded-2xl bg-white/10 px-3.5 py-1.5 text-white hover:bg-white/20">
            Moderation Console
          </Link>
          <Link href="/lex/auth/verification-ops" className="rounded-2xl bg-white/10 px-3.5 py-1.5 text-white hover:bg-white/20">
            Verification Queue
          </Link>
          <Link href="/lex/auth/escrow-control" className="rounded-2xl bg-gold text-navy px-3.5 py-1.5 font-black hover:bg-gold-light">
            Escrow Control
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        
        {/* KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy shadow-md space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-navy/50 dark:text-white/50">
                    {kpi.label}
                  </span>
                  <span className={cn("p-2.5 rounded-2xl", kpi.color)}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="text-2xl font-black text-navy dark:text-white tracking-tight">
                  {kpi.value}
                </p>
                <p className="text-[11px] font-semibold text-navy/60 dark:text-white/60">
                  {kpi.sub}
                </p>
              </div>
            );
          })}
        </div>

        {/* OPERATIONS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: SYSTEM HEALTH */}
          <div className="lg:col-span-6 rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-4 text-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-navy/70 dark:text-white/70 flex items-center gap-1.5">
              <Server className="h-4 w-4 text-gold" />
              Dependency Infrastructure & API Latency Health
            </h3>

            <div className="space-y-2.5">
              {systemHealth.map((sh, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-navy dark:text-white">{sh.service}</span>
                  </div>
                  <div className="flex items-center gap-3 font-semibold text-[11px]">
                    <span className="text-navy/50 dark:text-white/50">{sh.ping}</span>
                    <span className="rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-black">
                      {sh.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: QUICK NAVIGATION LINKS */}
          <div className="lg:col-span-6 rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-4 text-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-navy/70 dark:text-white/70 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-gold" />
              Enterprise Administration Desks
            </h3>

            <div className="grid grid-cols-2 gap-3 font-extrabold">
              <Link
                href="/lex/auth/moderation-console"
                className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:border-gold transition-all block space-y-1"
              >
                <span className="text-navy dark:text-white block">Content Moderation</span>
                <span className="text-[10px] text-navy/50 dark:text-white/50 block font-normal">Flagged listings & fraud</span>
              </Link>

              <Link
                href="/lex/auth/verification-ops"
                className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:border-gold transition-all block space-y-1"
              >
                <span className="text-navy dark:text-white block">Merchant Verifications</span>
                <span className="text-[10px] text-navy/50 dark:text-white/50 block font-normal">NIN & CAC review queue</span>
              </Link>

              <Link
                href="/lex/auth/escrow-control"
                className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:border-gold transition-all block space-y-1"
              >
                <span className="text-navy dark:text-white block">Escrow Officer Hub</span>
                <span className="text-[10px] text-navy/50 dark:text-white/50 block font-normal">Milestones & dispute freezes</span>
              </Link>

              <Link
                href="/lex/auth/audit-trail"
                className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:border-gold transition-all block space-y-1"
              >
                <span className="text-navy dark:text-white block">System Audit Logs</span>
                <span className="text-[10px] text-navy/50 dark:text-white/50 block font-normal">Staff action audit trail</span>
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
