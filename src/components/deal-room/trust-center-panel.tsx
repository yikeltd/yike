"use client";

import { useMemo } from "react";
import type { TrustScoreBreakdown, VerificationAggregate } from "@/lib/deal-room/trust/types";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Building2,
  UserCheck,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  trustScore: TrustScoreBreakdown;
  verifications?: VerificationAggregate[];
};

export function TrustCenterPanel({ trustScore, verifications = [] }: Props) {
  const verifiedCount = useMemo(() => {
    return verifications.filter((v) => v.verificationStatus === "verified").length;
  }, [verifications]);

  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-xl select-none space-y-4">
      {/* HEADER & SCORE GAUGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase text-[#031B4E]">
                Transaction Trust Center
              </h3>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase",
                  trustScore.badgeLevel === "high_trust"
                    ? "bg-emerald-100 text-emerald-800"
                    : trustScore.badgeLevel === "verified"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-amber-100 text-amber-800"
                )}
              >
                {trustScore.badgeLevel.replace("_", " ")}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              KYC & Evidence Assurance Engine • {verifiedCount} Verified Badges
            </p>
          </div>
        </div>

        {/* RADIAL TRUST SCORE GAUGE */}
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200/80 self-start sm:self-auto">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#031B4E] text-[#F59E0B] text-xs font-black">
            {trustScore.overallScore}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Trust Score</span>
            <p className="text-xs font-black text-[#031B4E]">{trustScore.overallScore} / 100 Confidence</p>
          </div>
        </div>
      </div>

      {/* VERIFICATION CHECKLIST GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#031B4E]">
            <UserCheck className="h-4 w-4 text-emerald-600" />
            <span>Identity Verification</span>
          </div>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#031B4E]">
            <Building2 className="h-4 w-4 text-emerald-600" />
            <span>Business Registration</span>
          </div>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#031B4E]">
            <FileCheck className="h-4 w-4 text-amber-600" />
            <span>Title Verification</span>
          </div>
          <AlertCircle className="h-4 w-4 text-amber-500" />
        </div>
      </div>

      {/* VERIFICATION RECORDS */}
      {verifications.length > 0 && (
        <div className="space-y-2 pt-1">
          <h4 className="text-[10px] font-black uppercase text-slate-400">Verified Evidence Records</h4>
          <div className="space-y-1.5">
            {verifications.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="font-bold text-[#031B4E] uppercase">{v.verificationType}</span>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {v.confidenceScore}% Confidence Score
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
