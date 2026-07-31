"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Lock,
  CheckCircle2,
  Clock,
  ChevronLeft,
  FileText,
  Download,
  MessageCircle,
  CreditCard,
  Send,
  ShieldAlert,
} from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import { EscrowDisputeModal } from "./escrow-dispute-modal";

export function EscrowWorkspaceExperience({
  dealId = "ESC_2026_9814",
  assetTitle = "2022 Toyota Camry SE (Foreign Used / Tokunbo)",
  assetType = "vehicle",
  price = 18500000,
  userRole = "buyer",
}: {
  dealId?: string;
  assetTitle?: string;
  assetType?: "property" | "vehicle" | "land";
  price?: number;
  userRole?: "buyer" | "seller" | "admin";
}) {
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatLogs, setChatLogs] = useState([
    { sender: "System", text: "Escrow deal initiated. 10% Commitment Deposit received via Paystack.", time: "10:15 AM" },
    { sender: "Chief Stankings Auto", text: "Vehicle is cleaned and ready for physical inspection at Lekki Phase 1 showroom.", time: "10:45 AM" },
    { sender: "Buyer", text: "Thank you. I will arrive with the Yike mechanic at 2:00 PM today.", time: "11:02 AM" },
  ]);

  const priceFormatted = formatPrice(price);
  const depositAmount = Math.round(price * 0.1);
  const inspectionReleaseAmount = Math.round(price * 0.4);
  const finalSettlementAmount = Math.round(price * 0.5);

  const timelineSteps = [
    { step: 1, title: "Offer Accepted", desc: "Terms & price agreed", done: true },
    { step: 2, title: "10% Escrow Funded", desc: formatPrice(depositAmount), done: true },
    { step: 3, title: "Physical Inspection", desc: "150-pt mechanic audit", active: true },
    { step: 4, title: "Title Audit", desc: "Customs & papers check", done: false },
    { step: 5, title: "Buyer Approval", desc: "Sign-off release", done: false },
    { step: 6, title: "Payout Settlement", desc: "Funds wired to seller", done: false },
    { step: 7, title: "Handover Complete", desc: "Keys & bill of sale", done: false },
  ];

  const documents = [
    { title: "Escrow Agreement Contract", type: "PDF", size: "1.2 MB", verified: true },
    { title: "Paystack Deposit Receipt", type: "PDF", size: "450 KB", verified: true },
    { title: "150-Point Mechanic Inspection Report", type: "PDF", size: "3.4 MB", verified: true },
    { title: "Customs Clearance & Title Certificate", type: "PDF", size: "2.1 MB", verified: true },
  ];

  function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setChatLogs((prev) => [
      ...prev,
      { sender: userRole === "buyer" ? "Buyer" : "Seller", text: chatMessage, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    ]);
    setChatMessage("");
  }

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white pb-20 select-none">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-navy/10 dark:border-white/10 bg-[#031B4E] px-4 py-3 text-white shadow-md">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>

        <h1 className="text-xs font-black uppercase tracking-wider text-gold flex items-center gap-1.5">
          <Lock className="h-4 w-4 text-gold" />
          YIKE ESCROW WORKSPACE #{dealId}
        </h1>

        <button
          type="button"
          onClick={() => setDisputeModalOpen(true)}
          className="flex items-center gap-1 rounded-full bg-rose-600/90 text-white px-3 py-1 text-[11px] font-extrabold hover:bg-rose-700"
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Dispute</span>
        </button>
      </header>

      <div className="mx-auto max-w-5xl px-3.5 pt-6 sm:px-6 space-y-6">
        
        {/* 1. DEAL SUMMARY CARD */}
        <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-[#031B4E] px-2 py-0.5 text-[10px] font-black uppercase text-gold">
                  {assetType} Escrow
                </span>
                <span className="flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  Active Workspace
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-navy dark:text-white leading-snug">
                {assetTitle}
              </h2>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-black uppercase tracking-wider text-navy/50 dark:text-white/50 block">
                Total Contract Price
              </span>
              <p className="text-2xl font-black text-gold-dark dark:text-gold tracking-tight">
                {priceFormatted}
              </p>
            </div>
          </div>

          {/* PARTICIPANTS STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-white/10 text-xs">
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
              <span className="text-[9px] font-bold text-navy/50 dark:text-white/50 block">Buyer</span>
              <span className="font-black text-navy dark:text-white truncate block mt-0.5">Chief Buyer (You)</span>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
              <span className="text-[9px] font-bold text-navy/50 dark:text-white/50 block">Seller / Dealer</span>
              <span className="font-black text-navy dark:text-white truncate block mt-0.5">Stankings Auto Ltd</span>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
              <span className="text-[9px] font-bold text-navy/50 dark:text-white/50 block">Escrow Officer</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 truncate block mt-0.5">Yike Custody Agent</span>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
              <span className="text-[9px] font-bold text-navy/50 dark:text-white/50 block">Field Verifier</span>
              <span className="font-black text-gold-dark dark:text-gold truncate block mt-0.5">Lagos Auto Inspector</span>
            </div>
          </div>
        </div>

        {/* 2. 7-STEP VISUAL MILESTONE PROGRESS TIMELINE */}
        <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-navy/70 dark:text-white/70 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-gold" />
            7-Step Transaction Milestone Progress
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 text-xs">
            {timelineSteps.map((s) => (
              <div
                key={s.step}
                className={cn(
                  "p-3 rounded-2xl border transition-all text-center space-y-1",
                  s.active
                    ? "bg-[#031B4E] dark:bg-gold text-white dark:text-navy border-[#031B4E] dark:border-gold shadow-md scale-102"
                    : s.done
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                    : "bg-slate-50 dark:bg-white/5 text-navy/40 dark:text-white/40 border-slate-200 dark:border-white/10"
                )}
              >
                <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-current text-[10px] font-black">
                  {s.done ? "✓" : s.step}
                </div>
                <p className="font-black text-[11px] line-clamp-1">{s.title}</p>
                <p className="text-[9px] opacity-75 truncate">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. STAGED MILESTONE PAYMENTS & DOCUMENT CENTER GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: STAGED PAYMENTS ENGINE */}
          <div className="lg:col-span-7 rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-navy/70 dark:text-white/70 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-gold" />
              Staged Escrow Milestone Funding
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold uppercase text-emerald-800 dark:text-emerald-400 block">Milestone 1 · 10% Deposit</span>
                  <p className="font-black text-navy dark:text-white text-sm mt-0.5">{formatPrice(depositAmount)}</p>
                </div>
                <span className="rounded-full bg-emerald-600 text-white px-3 py-1 text-[10px] font-extrabold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Funded & Locked
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold uppercase text-amber-900 dark:text-gold block">Milestone 2 · 40% Inspection Release</span>
                  <p className="font-black text-navy dark:text-white text-sm mt-0.5">{formatPrice(inspectionReleaseAmount)}</p>
                </div>
                <button
                  type="button"
                  className="pressable rounded-2xl bg-[#031B4E] dark:bg-gold px-3.5 py-1.5 text-[11px] font-black text-white dark:text-navy hover:opacity-90 shadow-sm"
                >
                  Fund Milestone 2
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold uppercase text-navy/50 dark:text-white/50 block">Milestone 3 · 50% Final Settlement</span>
                  <p className="font-black text-navy dark:text-white text-sm mt-0.5">{formatPrice(finalSettlementAmount)}</p>
                </div>
                <span className="text-[10px] font-semibold text-navy/40 dark:text-white/40">
                  Pending Inspection Approval
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: DOCUMENT CENTER */}
          <div className="lg:col-span-5 rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-navy/70 dark:text-white/70 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-gold" />
              Secure Document Center ({documents.length})
            </h3>

            <div className="space-y-2 text-xs">
              {documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
                >
                  <div className="min-w-0">
                    <p className="font-black text-navy dark:text-white truncate">{doc.title}</p>
                    <p className="text-[9px] text-navy/50 dark:text-white/50 mt-0.5">{doc.type} · {doc.size}</p>
                  </div>

                  <button
                    type="button"
                    className="p-2 rounded-xl bg-[#031B4E] dark:bg-gold text-white dark:text-navy hover:opacity-90 shrink-0"
                    title="Download document"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 4. CONTEXTUAL TRANSACTION CHAT LOG */}
        <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-navy/70 dark:text-white/70 flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4 text-gold" />
            Contextual Transaction Chat Log
          </h3>

          <div className="space-y-2.5 max-h-60 overflow-y-auto p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-xs">
            {chatLogs.map((c, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-navy/50 dark:text-white/50">
                  <span>{c.sender}</span>
                  <span>{c.time}</span>
                </div>
                <p className="p-2.5 rounded-xl bg-white dark:bg-navy text-navy dark:text-white border border-slate-100 dark:border-white/10">
                  {c.text}
                </p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="flex gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Send message to seller and escrow officer..."
              className="flex-1 rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-navy-light px-4 py-2.5 text-xs font-bold text-navy dark:text-white focus:ring-2 focus:ring-gold"
            />
            <button
              type="submit"
              disabled={!chatMessage.trim()}
              className="pressable px-4 py-2.5 rounded-2xl bg-[#031B4E] dark:bg-gold text-xs font-black text-white dark:text-navy hover:bg-navy/90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

      </div>

      {/* DISPUTE MODAL */}
      {disputeModalOpen && (
        <EscrowDisputeModal
          dealId={dealId}
          title={assetTitle}
          onClose={() => setDisputeModalOpen(false)}
        />
      )}
    </div>
  );
}
