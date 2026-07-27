"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  Award,
  Building2,
  CheckCircle2,
  Clock,
  Info,
  ShieldCheck,
  Star,
  UserCheck,
  X,
  Zap,
} from "lucide-react";
import type { TrustAuditReport, TrustIdentity } from "@/lib/identity/types";
import { cn } from "@/lib/utils";

const BADGE_ICONS = {
  UserCheck,
  Building2,
  Zap,
  Award,
  ShieldCheck,
};

const TRUST_LEVEL_COLORS = {
  bronze: "bg-amber-700/10 text-amber-800 border-amber-300",
  silver: "bg-slate-500/10 text-slate-700 border-slate-300",
  gold: "bg-gold/20 text-gold-dark border-gold/40 font-bold",
  platinum: "bg-purple-500/15 text-purple-900 border-purple-300 font-extrabold",
};

export function TrustProfileClient({ passport }: { passport: TrustIdentity }) {
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditReport, setAuditReport] = useState<TrustAuditReport | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);

  async function handleOpenAudit() {
    setAuditModalOpen(true);
    if (!auditReport) {
      setLoadingAudit(true);
      try {
        const res = await fetch(`/api/trust/audit/${encodeURIComponent(passport.userId)}`);
        const data = (await res.json()) as { report?: TrustAuditReport };
        if (data.report) setAuditReport(data.report);
      } catch {
        // Ignore transient error
      } finally {
        setLoadingAudit(false);
      }
    }
  }

  const levelBadgeClass = TRUST_LEVEL_COLORS[passport.trustLevel] || "bg-navy/10 text-navy";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header Card: Yike Passport Overview */}
      <div className="overflow-hidden rounded-3xl border border-navy/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-gold/40 bg-navy/5 shadow-md">
              {passport.avatarUrl ? (
                <Image src={passport.avatarUrl} alt={passport.fullName} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-bold text-navy/40 text-lg">
                  {passport.fullName.charAt(0)}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-gold px-2.5 py-0.5 text-[10px] font-bold text-navy uppercase tracking-wider">
                  Yike Passport
                </span>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wider",
                    levelBadgeClass
                  )}
                >
                  {passport.trustLevel} Level
                </span>
              </div>

              <h1 className="mt-1 text-xl font-bold text-navy sm:text-2xl">{passport.fullName}</h1>
              <p className="text-xs font-semibold text-navy/60">
                {passport.profileType.toUpperCase()} · Member since {passport.memberSince}
              </p>
            </div>
          </div>

          {/* Trust Score Gauge Card */}
          <div className="flex flex-col items-end justify-center rounded-2xl border border-gold/30 bg-gold/10 p-4 text-right">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-5 w-5 text-gold-dark" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-navy/70">Trust Score</span>
            </div>
            <p className="mt-1 text-3xl font-black text-navy">{passport.trustScore} / 100</p>

            <button
              type="button"
              onClick={() => void handleOpenAudit()}
              className="mt-2 flex items-center gap-1 text-[11px] font-bold text-navy underline hover:text-gold-dark"
            >
              <Info className="h-3 w-3" /> Audit Breakdown
            </button>
          </div>
        </div>
      </div>

      {/* Verified Credentials Grid */}
      <div className="rounded-3xl border border-navy/10 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-navy">Verified Credentials & Audit History</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {passport.verifications.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-2xl border border-navy/10 bg-surface p-3.5"
            >
              <div>
                <p className="text-xs font-bold text-navy uppercase">{v.verificationType.replace(/_/g, " ")}</p>
                <p className="text-[10px] text-navy/60">
                  {v.verifiedAt ? `Verified ${new Date(v.verifiedAt).toLocaleDateString()}` : "Pending"}
                </p>
              </div>
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                  v.status === "verified" ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-800"
                )}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {v.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Awarded Badges */}
      <div className="rounded-3xl border border-navy/10 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-navy">Platform Badges & Certifications</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {passport.badges.map((b) => {
            const Icon = BADGE_ICONS[b.iconName as keyof typeof BADGE_ICONS] || ShieldCheck;
            return (
              <div
                key={b.id}
                className="flex items-start gap-3 rounded-2xl border border-navy/10 bg-surface p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-gold-dark">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-navy">{b.label}</p>
                  <p className="text-[11px] text-navy/70 leading-snug">{b.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reputation Performance Metrics */}
      <div className="rounded-3xl border border-navy/10 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-navy">Marketplace Performance Metrics</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl bg-surface p-4 text-center">
            <p className="text-[10px] font-bold uppercase text-navy/60">Completed Deals</p>
            <p className="mt-1 text-2xl font-black text-navy">{passport.reputation.completedDeals}</p>
          </div>
          <div className="rounded-2xl bg-surface p-4 text-center">
            <p className="text-[10px] font-bold uppercase text-navy/60">Avg Response Time</p>
            <p className="mt-1 text-2xl font-black text-navy">{passport.reputation.averageResponseTimeMinutes}m</p>
          </div>
          <div className="rounded-2xl bg-surface p-4 text-center">
            <p className="text-[10px] font-bold uppercase text-navy/60">Response Rate</p>
            <p className="mt-1 text-2xl font-black text-emerald-700">{passport.reputation.responseRatePercentage}%</p>
          </div>
          <div className="rounded-2xl bg-surface p-4 text-center">
            <p className="text-[10px] font-bold uppercase text-navy/60">Review Rating</p>
            <p className="mt-1 text-2xl font-black text-navy flex items-center justify-center gap-1">
              <Star className="h-5 w-5 fill-gold text-gold" /> {passport.reputation.averageRating.toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Trust Audit Modal */}
      {auditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-navy/10 bg-white p-6 shadow-2xl transition-all"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-navy/10 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-gold-dark" />
                <div>
                  <h3 className="text-base font-bold text-navy">Trust Score Audit Report</h3>
                  <p className="text-xs text-navy/60">Algorithm Breakdown & Signal Weights</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAuditModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-navy/5 text-navy/60 hover:bg-navy/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingAudit || !auditReport ? (
              <div className="p-8 text-center text-xs font-medium text-navy/60">Calculating audit report…</div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-gold/30 bg-gold/10 p-3.5 text-xs text-navy">
                  <p className="font-bold">Recommendation:</p>
                  <p className="mt-0.5 text-navy/80">{auditReport.recommendation}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-navy/60">Score Signal Audit</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {auditReport.breakdown.signals.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-xl bg-surface p-2.5 text-xs">
                        <div>
                          <p className="font-bold text-navy">{s.label}</p>
                          <p className="text-[10px] text-navy/60">{s.description}</p>
                        </div>
                        <span className="font-black text-navy">
                          {s.pointsEarned} / {s.maxPoints} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
