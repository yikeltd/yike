"use client";

import { useState } from "react";
import { X, ShieldAlert, CheckCircle2, Send } from "lucide-react";

export function EscrowDisputeModal({
  dealId,
  title,
  onClose,
}: {
  dealId: string;
  title: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("failed_inspection");
  const [description, setDescription] = useState("");
  const [refundRequested, setRefundRequested] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 p-3 sm:p-6 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white dark:bg-navy text-navy dark:text-white shadow-2xl border border-navy/10 dark:border-white/10 animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 px-5 py-4 bg-[#031B4E] text-white">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-gold" />
            <h2 className="text-base font-black">Escrow Dispute & Cancellation</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* BODY */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-200 dark:border-amber-900/50 space-y-0.5">
              <span className="text-[10px] font-black uppercase text-amber-900 dark:text-gold block">
                Active Deal Reference #{dealId}
              </span>
              <p className="font-extrabold text-navy dark:text-white line-clamp-1">{title}</p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-navy/70 dark:text-white/70 block mb-1">
                Primary Reason for Dispute / Cancellation
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-navy-light px-3 py-2.5 text-xs font-bold text-navy dark:text-white focus:ring-2 focus:ring-gold"
              >
                <option value="failed_inspection">Physical inspection failed / undisclosed damage</option>
                <option value="title_discrepancy">Title document discrepancy or ownership issue</option>
                <option value="seller_unresponsive">Seller unresponsive / failed delivery deadline</option>
                <option value="misrepresentation">Listing details misrepresented</option>
                <option value="mutual_cancellation">Mutual buyer & seller cancellation agreement</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-navy/70 dark:text-white/70 block mb-1">
                Detailed Explanation & Evidence Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what occurred during physical inspection or document review..."
                className="w-full rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-navy-light p-3 text-xs font-bold text-navy dark:text-white focus:ring-2 focus:ring-gold"
                required
              />
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-white/5 p-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-navy dark:text-white block">Request Full Escrow Refund</span>
                <span className="text-[10px] text-navy/60 dark:text-white/60">Refund deposit back to your original bank account</span>
              </div>
              <input
                type="checkbox"
                checked={refundRequested}
                onChange={(e) => setRefundRequested(e.target.checked)}
                className="h-4 w-4 accent-gold"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !description}
              className="pressable w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-600 text-white py-3.5 text-xs font-black hover:bg-rose-700 disabled:opacity-50 shadow-md"
            >
              <Send className="h-4 w-4" />
              <span>{submitting ? "SUBMITTING DISPUTE..." : "SUBMIT DISPUTE TO ESCROW TEAM"}</span>
            </button>
          </form>
        ) : (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
            <h3 className="text-base font-black text-navy dark:text-white">
              Dispute Case Logged #{dealId}
            </h3>
            <p className="text-xs text-navy/70 dark:text-white/70 max-w-xs mx-auto leading-relaxed">
              Your dispute ticket has been assigned to Yike Resolution Desk. Escrow payout is frozen until our compliance team reviews evidence with both parties.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="pressable px-6 py-2.5 rounded-2xl bg-[#031B4E] dark:bg-gold text-xs font-black text-white dark:text-navy hover:bg-navy/90"
            >
              Back to Escrow Workspace
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
