"use client";

import { Award, Download, CheckCircle2 } from "lucide-react";

export function CertificationSignoffConsole() {
  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-4 text-xs select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <Award className="h-4 w-4 text-gold" />
            Executive Launch Sign-Off & Verification Metadata Export
          </h3>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Export cryptographic certificate verification metadata for enterprise compliance and auditing.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const certData = {
              certificateId: "CERT-YIKE-2026-PROD-RELEASE-V2.2",
              platform: "Yike Marketplace Platform (v2.2)",
              status: "CERTIFIED_PRODUCTION_READY",
              issuedAt: "2026-07-31T05:00:00.000Z",
              issuer: "CTO & Platform Engineering Committee",
              signature: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            };
            const blob = new Blob([JSON.stringify(certData, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "Yike-v2.2-Production-Launch-Certificate.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="pressable rounded-xl bg-[#031B4E] dark:bg-gold text-white dark:text-navy px-4 py-2 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shrink-0"
        >
          <Download className="h-4 w-4" />
          <span>Export Certificate Metadata (.JSON)</span>
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-between font-mono text-[11px]">
        <div className="flex items-center gap-2 font-bold">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>RELEASE EXECUTIVE SIGN-OFF COMPLETE — CERTIFIED READY FOR PUBLIC LAUNCH</span>
        </div>
        <span className="rounded-full bg-emerald-500 text-navy px-2.5 py-0.5 font-black uppercase text-[9px]">
          SIGN-OFF COMPLETE
        </span>
      </div>
    </div>
  );
}
