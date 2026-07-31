"use client";

import { useState } from "react";
import type { CourtReadyPackage } from "@/types/evidence";
import { generateCourtReadyPackage } from "@/lib/evidence/vault-engine";
import { Award, Download, CheckCircle2, FileText } from "lucide-react";

export function CourtReadyPackageGeneratorCard() {
  const [pkg, setPkg] = useState<CourtReadyPackage | null>(null);

  const handleGeneratePackage = () => {
    const mockItems = [
      { id: "evd_901", passportId: "px_8819024_ng", partnerId: "ptr_901_ng", type: "photo" as const, title: "Structural Audit Photo", s3UriPrimary: "s3://yike-los-01/evd_901", s3UriBackup: "s3://yike-lhr-01/evd_901", sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", hashStatus: "VERIFIED_INTACT" as const, version: 1, createdAt: "2026-07-31" },
    ];
    const generated = generateCourtReadyPackage("px_8819024_ng", mockItems);
    setPkg(generated);
  };

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <Award className="h-4 w-4 text-gold" />
            Court-Ready Evidence Package & Chain of Custody Bundle
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Generates court-admissible legal packages with cryptographic SHA-256 manifests and partner signatures.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGeneratePackage}
          className="pressable rounded-xl bg-[#031B4E] dark:bg-gold text-white dark:text-navy px-4 py-2 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shrink-0"
        >
          <FileText className="h-4 w-4" />
          <span>Compile Court Bundle</span>
        </button>
      </div>

      {pkg && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-4 font-mono text-[11px]">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
            <span className="font-black text-xs text-navy dark:text-white">{pkg.packageId}</span>
            <span className="rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[9px] font-bold">
              LAWYER VERIFIED
            </span>
          </div>

          <div className="space-y-1 text-navy/70 dark:text-white/70">
            <p>Manifest Hash: <code className="font-bold text-gold">{pkg.manifestSha256}</code></p>
            <p>Generated At: {pkg.generatedAt}</p>
            <p>Total Included Evidence Items: {pkg.totalItems}</p>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-navy dark:text-white uppercase text-[10px]">Chain of Custody Audit Trail:</span>
            {pkg.chainOfCustody.map((step, idx) => (
              <p key={idx} className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-[10px]">
                <CheckCircle2 className="h-3 w-3 shrink-0" /> {step}
              </p>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${pkg.packageId}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="pressable rounded-xl bg-emerald-500 text-navy px-3.5 py-1.5 font-black text-[10px] uppercase flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Download Legal Manifest (.JSON)
          </button>
        </div>
      )}

    </div>
  );
}
