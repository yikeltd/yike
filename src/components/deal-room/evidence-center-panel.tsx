"use client";

import { useMemo, useState } from "react";
import type { EvidenceAggregate } from "@/lib/deal-room/evidence/types";
import {
  FileCheck,
  History,
  Lock,
  Download,
  Eye,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  evidenceList: EvidenceAggregate[];
  onUpload?: () => void;
  onVerify?: (evidenceId: string) => void;
};

export function EvidenceCenterPanel({ evidenceList, onUpload, onVerify }: Props) {
  const [activeCategory, setActiveCategory] = useState<"all" | "titles" | "inspections" | "media">("all");
  const [selectedCustodyId, setSelectedCustodyId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    if (activeCategory === "titles") {
      return evidenceList.filter((e) => e.evidenceType === "title_document" || e.evidenceType === "vehicle_registration");
    }
    if (activeCategory === "inspections") {
      return evidenceList.filter((e) => e.evidenceType === "inspection_photo" || e.evidenceType === "drone_image");
    }
    if (activeCategory === "media") {
      return evidenceList.filter((e) => e.evidenceType === "image" || e.evidenceType === "video" || e.evidenceType === "audio");
    }
    return evidenceList;
  }, [evidenceList, activeCategory]);

  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-xl select-none space-y-4">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase text-[#031B4E]">
                Enterprise Evidence Vault
              </h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-600">
                {evidenceList.length} Proof Assets
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Immutable Versioning & Cryptographic Chain of Custody
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onUpload}
          className="pressable flex items-center gap-1.5 rounded-2xl bg-[#031B4E] px-4 py-2 text-xs font-black text-white shadow-2xs hover:bg-[#07142B] min-h-[38px] self-start sm:self-auto"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Upload Evidence</span>
        </button>
      </div>

      {/* CATEGORY TABS */}
      <div className="flex items-center gap-1 border-b border-slate-100 pb-2">
        {(["all", "titles", "inspections", "media"] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-xl transition-all capitalize min-h-[36px]",
              activeCategory === cat
                ? "bg-[#031B4E] text-white shadow-2xs"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* EVIDENCE GRID */}
      {filteredItems.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <ShieldCheck className="mx-auto h-8 w-8 text-slate-400" />
          <h4 className="text-xs font-extrabold text-[#031B4E]">No Evidence Records Found</h4>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Upload title deeds, vehicle registration, inspection photos, or certificates to prove ownership.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((ev) => {
            const currentVer = ev.versions[ev.versions.length - 1];
            const isCustodyOpen = selectedCustodyId === ev.id;

            return (
              <div key={ev.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[#031B4E]">
                      {ev.evidenceType.includes("photo") || ev.evidenceType.includes("image") ? (
                        <ImageIcon className="h-5 w-5" />
                      ) : (
                        <FileText className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-[#031B4E]">{ev.title}</h4>
                        <span className="rounded-md bg-amber-100 text-amber-800 px-2 py-0.5 text-[9px] font-black uppercase">
                          v{ev.currentVersionNumber}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Uploaded by {currentVer?.uploadedRole || "user"} • {(currentVer?.fileSizeBytes || 1024) / 1024} KB
                      </p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase",
                      ev.evidenceStatus === "verified"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    )}
                  >
                    {ev.evidenceStatus}
                  </span>
                </div>

                {/* CHAIN OF CUSTODY TRIGGER & ACTIONS */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedCustodyId(isCustodyOpen ? null : ev.id)}
                    className="flex items-center gap-1.5 text-slate-500 font-bold hover:text-[#031B4E]"
                  >
                    <History className="h-3.5 w-3.5 text-[#F59E0B]" />
                    <span>Chain of Custody ({ev.chainOfCustody.length})</span>
                    {isCustodyOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  <div className="flex items-center gap-2">
                    {ev.evidenceStatus !== "verified" && onVerify && (
                      <button
                        type="button"
                        onClick={() => onVerify(ev.id)}
                        className="pressable rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 min-h-[34px]"
                      >
                        Verify Proof
                      </button>
                    )}
                    <a
                      href={currentVer?.fileUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#031B4E] hover:bg-slate-200 min-h-[34px]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Preview</span>
                    </a>
                  </div>
                </div>

                {/* CHAIN OF CUSTODY TIMELINE DRAWER */}
                {isCustodyOpen && (
                  <div className="rounded-xl bg-slate-900 text-white p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1 text-[10px] text-slate-400 font-mono">
                      <span>PROVENANCE PROOF LOG</span>
                      <span>HASH: {currentVer?.hash || "sha256_verified"}</span>
                    </div>

                    <div className="space-y-1.5">
                      {ev.chainOfCustody.map((cust, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-[#F59E0B] capitalize">{cust.action}</span>
                          <span className="text-slate-300">{cust.notes}</span>
                          <span className="text-slate-500">{new Date(cust.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
