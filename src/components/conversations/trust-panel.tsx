"use client";

import { AlertTriangle, CheckCircle2, ShieldCheck, X } from "lucide-react";
import type { TrustPanelData } from "@/lib/conversations/types";

export function TrustPanelModal({
  trustPanel,
  sellerName,
  open,
  onClose,
}: {
  trustPanel: TrustPanelData;
  sellerName: string;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl border border-navy/10 bg-white p-6 shadow-2xl transition-all"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-navy/10 pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-gold-dark" />
            <div>
              <h3 className="text-base font-bold text-navy">Yike Trust Panel</h3>
              <p className="text-xs text-navy/60 font-medium">Credibility audit for {sellerName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-navy/5 text-navy/60 hover:bg-navy/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Trust Score Card */}
          <div className="flex items-center justify-between rounded-2xl border border-gold/30 bg-gold/10 p-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-navy/60">Trust Score</p>
              <p className="text-2xl font-black text-navy">{trustPanel.trustScore} / 100</p>
            </div>
            <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
              High Safety Level
            </span>
          </div>

          {/* Verification Audit Badges */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy/60">Verification Credentials</h4>
            <div className="space-y-1.5 text-xs font-semibold text-navy">
              <div className="flex items-center justify-between rounded-xl bg-surface p-2.5">
                <span>Identity Verification (NIN Match)</span>
                <span className="flex items-center gap-1 font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Verified
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-surface p-2.5">
                <span>Business Registration (CAC Filing)</span>
                <span className="flex items-center gap-1 font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Verified
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-surface p-2.5">
                <span>50-Point Field Inspection</span>
                <span className="flex items-center gap-1 font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> {trustPanel.inspectionStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Safety Guidelines */}
          <div className="rounded-2xl border border-navy/10 bg-navy/5 p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-navy">
              <AlertTriangle className="h-4 w-4 text-gold-dark" />
              <span>Transaction Safety Rules</span>
            </div>
            <ul className="mt-2 space-y-1.5 text-xs text-navy/80">
              {trustPanel.safetyTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="font-bold text-gold-dark">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
