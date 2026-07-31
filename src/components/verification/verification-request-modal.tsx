"use client";

import { useState } from "react";
import { X, ShieldCheck, UserCheck, Building2, MapPin, Upload, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerificationRequestModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [ninNumber, setNinNumber] = useState("");
  const [cacNumber, setCacNumber] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setStep(4);
    }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 p-3 sm:p-6 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white dark:bg-navy text-navy dark:text-white shadow-2xl border border-navy/10 dark:border-white/10 animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 px-5 py-4 bg-[#031B4E] text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gold" />
            <h2 className="text-base font-black">Request Merchant Verification</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* STEP PROGRESS TRACKER */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-navy-light border-b border-slate-100 dark:border-white/10 text-xs font-bold">
          <div className={cn("flex items-center gap-1", step >= 1 && "text-gold-dark dark:text-gold")}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-white dark:text-navy text-[10px]">1</span>
            <span>NIN</span>
          </div>
          <div className={cn("flex items-center gap-1", step >= 2 && "text-gold-dark dark:text-gold")}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-white dark:text-navy text-[10px]">2</span>
            <span>CAC</span>
          </div>
          <div className={cn("flex items-center gap-1", step >= 3 && "text-gold-dark dark:text-gold")}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-white dark:text-navy text-[10px]">3</span>
            <span>Address</span>
          </div>
        </div>

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          
          {step === 1 && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-navy dark:text-white flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-gold" />
                Step 1: National Identity Verification (NIN)
              </h3>
              <p className="text-[11px] text-navy/60 dark:text-white/60">
                Provide your 11-digit NIN number for instant identity verification against the National Identity Registry.
              </p>
              <div>
                <label className="text-[10px] font-bold block mb-1">11-Digit NIN Number</label>
                <input
                  type="text"
                  maxLength={11}
                  value={ninNumber}
                  onChange={(e) => setNinNumber(e.target.value)}
                  placeholder="e.g. 12345678901"
                  className="w-full rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-navy-light px-3 py-2.5 text-xs font-bold text-navy dark:text-white focus:ring-2 focus:ring-gold"
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={ninNumber.length < 11}
                className="pressable w-full rounded-2xl bg-[#031B4E] dark:bg-gold py-3 text-xs font-black text-white dark:text-navy hover:bg-navy/90 disabled:opacity-50"
              >
                Continue to CAC Business Step
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-navy dark:text-white flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-gold" />
                Step 2: CAC Business Registration
              </h3>
              <p className="text-[11px] text-navy/60 dark:text-white/60">
                Provide your Corporate Affairs Commission (CAC) RC or BN registration number.
              </p>
              <div>
                <label className="text-[10px] font-bold block mb-1">CAC RC / BN Number</label>
                <input
                  type="text"
                  value={cacNumber}
                  onChange={(e) => setCacNumber(e.target.value)}
                  placeholder="e.g. RC-1849204"
                  className="w-full rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-navy-light px-3 py-2.5 text-xs font-bold text-navy dark:text-white focus:ring-2 focus:ring-gold"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 rounded-2xl border border-slate-200 dark:border-white/20 py-3 text-xs font-bold text-navy dark:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!cacNumber}
                  className="pressable flex-1 rounded-2xl bg-[#031B4E] dark:bg-gold py-3 text-xs font-black text-white dark:text-navy hover:bg-navy/90 disabled:opacity-50"
                >
                  Continue to Address Step
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-navy dark:text-white flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gold" />
                Step 3: Physical Showroom / Office Proof
              </h3>
              <p className="text-[11px] text-navy/60 dark:text-white/60">
                Provide your office or showroom address for physical field verifier audit.
              </p>
              <div>
                <label className="text-[10px] font-bold block mb-1">Physical Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Plot 12 Admiralty Way, Lekki Phase 1, Lagos"
                  className="w-full rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-navy-light p-3 text-xs font-bold text-navy dark:text-white focus:ring-2 focus:ring-gold"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 rounded-2xl border border-slate-200 dark:border-white/20 py-3 text-xs font-bold text-navy dark:text-white"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting || !address}
                  className="pressable flex-1 rounded-2xl bg-[#031B4E] dark:bg-gold py-3 text-xs font-black text-white dark:text-navy hover:bg-navy/90 disabled:opacity-50"
                >
                  {submitting ? "SUBMITTING..." : "SUBMIT AUDIT REQUEST"}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
              <h3 className="text-base font-black text-navy dark:text-white">
                Verification Request Submitted!
              </h3>
              <p className="text-xs text-navy/70 dark:text-white/70 max-w-xs mx-auto">
                Your NIN identity, CAC business record, and address have been queued for Yike Compliance verification. Status updates will appear on your Trust Passport within 24 hours.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="pressable px-6 py-2.5 rounded-2xl bg-[#031B4E] dark:bg-gold text-xs font-black text-white dark:text-navy hover:bg-navy/90"
              >
                Done
              </button>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}
