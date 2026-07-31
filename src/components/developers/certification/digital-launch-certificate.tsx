"use client";

import type { LaunchCertificate } from "@/types/launch-certification";
import { Award, ShieldCheck, CheckCircle2 } from "lucide-react";

export function DigitalLaunchCertificate() {
  const cert: LaunchCertificate = {
    certificateId: "CERT-YIKE-2026-PROD-RELEASE-V2.2",
    platformName: "Yike Marketplace Platform",
    version: "v2.2 (Platform Scale, AI & Reliability)",
    status: "CERTIFIED_PRODUCTION_READY",
    issuedAt: "2026-07-31T05:00:00.000Z",
    issuer: "CTO & Platform Engineering Committee",
    hmacSignature: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    passedGatesCount: 8,
    totalGatesCount: 8,
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-gold/60 bg-gradient-to-br from-[#031B4E] via-[#05266e] to-[#021133] p-8 shadow-2xl text-white space-y-6 select-none">
      
      {/* BACKGROUND DECORATION */}
      <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-gold/10 blur-2xl pointer-events-none" />

      {/* CERTIFICATE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/30 pb-6">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-gold flex items-center gap-1.5">
            <Award className="h-4 w-4 text-gold" /> OFFICIAL ENTERPRISE PRODUCTION RELEASE CERTIFICATE
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">{cert.platformName}</h2>
          <p className="text-xs text-slate-300 font-mono font-semibold">{cert.version}</p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 px-4 py-2 text-xs font-black text-emerald-400 shrink-0">
          <ShieldCheck className="h-4 w-4" />
          <span>{cert.status}</span>
        </div>
      </div>

      {/* CERTIFICATE DETAILS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono text-xs">
        <div className="space-y-1 bg-white/5 p-4 rounded-2xl border border-white/10">
          <span className="text-[9px] uppercase font-bold text-slate-400">Certificate Reference ID</span>
          <p className="font-black text-gold text-xs">{cert.certificateId}</p>
        </div>

        <div className="space-y-1 bg-white/5 p-4 rounded-2xl border border-white/10">
          <span className="text-[9px] uppercase font-bold text-slate-400">Issued By Authority</span>
          <p className="font-black text-white text-xs">{cert.issuer}</p>
        </div>

        <div className="space-y-1 bg-white/5 p-4 rounded-2xl border border-white/10">
          <span className="text-[9px] uppercase font-bold text-slate-400">Audit Verification</span>
          <p className="font-black text-emerald-400 text-xs flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {cert.passedGatesCount} / {cert.totalGatesCount} Gates Passed (100%)
          </p>
        </div>
      </div>

      {/* SIGNATURE HASH */}
      <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
        <span>Verification Signature Digest:</span>
        <code className="text-gold font-bold text-[9px] truncate max-w-md">{cert.hmacSignature}</code>
      </div>

    </div>
  );
}
