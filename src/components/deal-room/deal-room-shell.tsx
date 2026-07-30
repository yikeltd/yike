"use client";

import { useMemo, useState } from "react";
import type { DealRoom, TimelineEvent } from "@/lib/deal-room/types";
import {
  ShieldCheck,
  FileText,
  Calendar,
  MessageSquare,
  DollarSign,
  Phone,
  Video,
  CheckCircle2,
  Lock,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  dealRoom: DealRoom;
  timelineEvents?: TimelineEvent[];
};

export function DealRoomShell({ dealRoom, timelineEvents = [] }: Props) {
  const [activeTab, setActiveTab] = useState<"timeline" | "documents" | "offers" | "inspections">("timeline");

  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: dealRoom.currency || "NGN",
      maximumFractionDigits: 0,
    }).format(dealRoom.listingPrice);
  }, [dealRoom.listingPrice, dealRoom.currency]);

  return (
    <div className="mx-auto w-full max-w-6xl rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden select-none">
      {/* HEADER BAR */}
      <header className="bg-[#031B4E] text-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-block rounded-full bg-[#E4B547]/20 px-2.5 py-0.5 text-[10px] font-black uppercase text-[#E4B547]">
              DEAL ROOM #{dealRoom.id.slice(-6)}
            </span>
            <span className="text-xs font-bold text-slate-300 capitalize">
              {dealRoom.listingType}
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-black">{dealRoom.listingTitle}</h2>
          <p className="text-sm font-extrabold text-[#E4B547]">{formattedPrice}</p>
        </div>

        {/* STATUS & CALL ACTION STUBS */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-3.5 py-2 text-xs font-bold text-slate-200 border border-white/15">
            <Clock className="h-4 w-4 text-[#E4B547]" />
            <span className="capitalize">{(dealRoom.workspaceStatus || dealRoom.status).replace("_", " ")}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled
              title="Voice Call (Phase 2 Integration)"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-slate-400 hover:bg-white/20 transition-colors opacity-60 cursor-not-allowed"
            >
              <Phone className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled
              title="Video Call (Phase 2 Integration)"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-slate-400 hover:bg-white/20 transition-colors opacity-60 cursor-not-allowed"
            >
              <Video className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <nav className="flex items-center gap-1 border-b border-slate-200 bg-slate-50/80 px-4 pt-2">
        <button
          type="button"
          onClick={() => setActiveTab("timeline")}
          className={cn(
            "flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all min-h-[44px]",
            activeTab === "timeline"
              ? "border-[#F59E0B] text-[#031B4E] bg-white rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-900"
          )}
        >
          <MessageSquare className="h-4 w-4 text-[#F59E0B]" />
          <span>Timeline & Chat</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("documents")}
          className={cn(
            "flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all min-h-[44px]",
            activeTab === "documents"
              ? "border-[#F59E0B] text-[#031B4E] bg-white rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-900"
          )}
        >
          <FileText className="h-4 w-4 text-[#F59E0B]" />
          <span>Document Vault</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("offers")}
          className={cn(
            "flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all min-h-[44px]",
            activeTab === "offers"
              ? "border-[#F59E0B] text-[#031B4E] bg-white rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-900"
          )}
        >
          <DollarSign className="h-4 w-4 text-[#F59E0B]" />
          <span>Offers</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("inspections")}
          className={cn(
            "flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all min-h-[44px]",
            activeTab === "inspections"
              ? "border-[#F59E0B] text-[#031B4E] bg-white rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-900"
          )}
        >
          <Calendar className="h-4 w-4 text-[#F59E0B]" />
          <span>Inspections</span>
        </button>
      </nav>

      {/* TAB CONTENT AREA */}
      <div className="p-6 min-h-[360px] bg-slate-50/30">
        {activeTab === "timeline" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xs md:text-sm font-black uppercase text-[#031B4E]">
                Transaction Event Stream
              </h3>
              <span className="text-xs font-bold text-slate-400">
                {timelineEvents.length} events logged
              </span>
            </div>

            {timelineEvents.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <ShieldCheck className="mx-auto h-8 w-8 text-[#F59E0B]" />
                <p className="text-xs font-extrabold text-[#031B4E]">
                  Deal Room Active & Secured
                </p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  All messages, offers, documents, and inspection milestones are encrypted and audited.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {timelineEvents.map((evt) => (
                  <div key={evt.id} className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#031B4E]">{evt.title}</span>
                      <span className="text-[10px] text-slate-400">{evt.createdAt}</span>
                    </div>
                    {evt.description && (
                      <p className="text-[11px] text-slate-500">{evt.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "documents" && (
          <div className="py-12 text-center space-y-2">
            <FileText className="mx-auto h-8 w-8 text-slate-400" />
            <h4 className="text-xs font-extrabold text-[#031B4E]">Document Vault Ready</h4>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Upload title documents, proof of ownership, inspection certificates, or invoices safely.
            </p>
          </div>
        )}

        {activeTab === "offers" && (
          <div className="py-12 text-center space-y-2">
            <DollarSign className="mx-auto h-8 w-8 text-slate-400" />
            <h4 className="text-xs font-extrabold text-[#031B4E]">Structured Negotiation Engine</h4>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Submit counter-offers, formal price requests, or binding agreements with audit history.
            </p>
          </div>
        )}

        {activeTab === "inspections" && (
          <div className="py-12 text-center space-y-2">
            <Calendar className="mx-auto h-8 w-8 text-slate-400" />
            <h4 className="text-xs font-extrabold text-[#031B4E]">Verified Field Inspection Workflow</h4>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Schedule Yike Field Verifiers, review inspection reports, and verify physical asset condition.
            </p>
          </div>
        )}
      </div>

      {/* FOOTER AUDIT BAR */}
      <footer className="bg-slate-100 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-[11px] font-bold text-slate-500">
        <div className="flex items-center gap-1.5 text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Audited Transaction Stream</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Lock className="h-3.5 w-3.5" />
          <span>256-Bit Encrypted Workspace</span>
        </div>
      </footer>
    </div>
  );
}
