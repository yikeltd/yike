"use client";

import { useState } from "react";
import type { ExecutionAggregate } from "@/lib/deal-room/execution/types";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Building2,
  Car,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  execution: ExecutionAggregate;
  onItemCheck?: (category: string, itemId: string, result: "pass" | "fail" | "not_applicable") => void;
};

export function ExecutionCenterPanel({ execution, onItemCheck }: Props) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    execution.checklists[0]?.category || null
  );

  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-xl select-none space-y-4">
      {/* HEADER & PROGRESS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-[#F59E0B] border border-amber-200">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase text-[#031B4E]">
                Operational Execution Center
              </h3>
              <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-black uppercase">
                {execution.executionType.replace("_", " ")}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Field Worksheets, Checklists & Verifier Audits
            </p>
          </div>
        </div>

        {/* COMPLETION PERCENTAGE BAR */}
        <div className="w-full sm:w-48 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-extrabold text-[#031B4E]">
            <span>Execution Progress</span>
            <span>{execution.completionPercentage}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#031B4E] to-[#F59E0B] transition-all duration-300 rounded-full"
              style={{ width: `${execution.completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* ASSIGNED PERSONNEL BAR */}
      <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-bold">
          <UserCheck className="h-4 w-4 text-emerald-600" />
          <span>Personnel: {execution.assignees.length > 0 ? execution.assignees.map((a) => a.role).join(", ") : "Pending Assignment"}</span>
        </div>
        <span className="text-[10px] font-extrabold text-[#031B4E] bg-white px-2.5 py-1 rounded-xl border border-slate-200">
          Status: {execution.executionStatus.toUpperCase()}
        </span>
      </div>

      {/* CHECKLIST CATEGORIES */}
      <div className="space-y-3">
        {execution.checklists.map((group) => {
          const isOpen = expandedCategory === group.category;
          const passedCount = group.items.filter((i) => i.result === "pass").length;

          return (
            <div key={group.category} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setExpandedCategory(isOpen ? null : group.category)}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50/80 hover:bg-slate-100 transition-colors text-xs font-black text-[#031B4E]"
              >
                <div className="flex items-center gap-2">
                  <span>{group.category}</span>
                  <span className="text-[10px] font-bold text-slate-400">
                    ({passedCount} / {group.items.length} passed)
                  </span>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {isOpen && (
                <div className="p-3 divide-y divide-slate-100 space-y-2">
                  {group.items.map((item) => (
                    <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs">
                      <span className="font-medium text-slate-700">{item.label}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onItemCheck?.(group.category, item.id, "pass")}
                          className={cn(
                            "px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all min-h-[30px]",
                            item.result === "pass"
                              ? "bg-emerald-600 text-white shadow-2xs"
                              : "bg-slate-100 text-slate-600 hover:bg-emerald-50"
                          )}
                        >
                          Pass
                        </button>
                        <button
                          type="button"
                          onClick={() => onItemCheck?.(group.category, item.id, "fail")}
                          className={cn(
                            "px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all min-h-[30px]",
                            item.result === "fail"
                              ? "bg-red-600 text-white shadow-2xs"
                              : "bg-slate-100 text-slate-600 hover:bg-red-50"
                          )}
                        >
                          Fail
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
