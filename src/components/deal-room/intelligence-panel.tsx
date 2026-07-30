"use client";

import type { IntelligenceRequestAggregate } from "@/lib/deal-room/intelligence/types";
import {
  Sparkles,
  Brain,
  ShieldAlert,
  CheckCircle2,
  Zap,
  Bot,
} from "lucide-react";

type Props = {
  requests: IntelligenceRequestAggregate[];
  onRequestAnalysis?: (capability: "summarization" | "risk_assessment" | "vision_analysis") => void;
};

export function IntelligencePanel({ requests, onRequestAnalysis }: Props) {
  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-xl select-none space-y-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase text-[#031B4E]">
                Enterprise Intelligence Center
              </h3>
              <span className="rounded-full bg-indigo-100 text-indigo-800 px-2 py-0.5 text-[10px] font-black uppercase">
                Gemini 1.5 Pro Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Provider-Agnostic AI Reasoning & Risk Engine
            </p>
          </div>
        </div>

        {/* ACTION TRIGGERS */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onRequestAnalysis?.("summarization")}
            className="pressable flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#031B4E] hover:bg-slate-200 min-h-[36px]"
          >
            <Brain className="h-3.5 w-3.5" />
            <span>Summarize</span>
          </button>

          <button
            type="button"
            onClick={() => onRequestAnalysis?.("risk_assessment")}
            className="pressable flex items-center gap-1 rounded-xl bg-[#031B4E] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#07142B] min-h-[36px]"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Assess Risk</span>
          </button>
        </div>
      </div>

      {/* RECENT ANALYSES LIST */}
      {requests.length === 0 ? (
        <div className="py-10 text-center space-y-2">
          <Bot className="mx-auto h-8 w-8 text-slate-400" />
          <h4 className="text-xs font-extrabold text-[#031B4E]">No AI Insights Generated Yet</h4>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Click &quot;Summarize&quot; or &quot;Assess Risk&quot; to dispatch an AI reasoning request to the Intelligence Engine.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-indigo-600 px-2 py-0.5 text-[9px] font-black text-white uppercase">
                    {req.capability.replace("_", " ")}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    Provider: {req.output?.modelName || req.providerId}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <Zap className="h-3 w-3 text-amber-500" />
                  <span>{req.output?.executionTimeMs || 380}ms</span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {req.output?.confidenceScore || 95}% Confidence
                  </span>
                </div>
              </div>

              {/* SUMMARY OUTPUT */}
              <p className="text-xs font-medium text-slate-800 leading-relaxed">
                {req.output?.summary}
              </p>

              {/* RECOMMENDATIONS */}
              {req.output?.recommendations && req.output.recommendations.length > 0 && (
                <div className="space-y-1.5 border-t border-slate-200/80 pt-2">
                  <span className="text-[10px] font-black uppercase text-slate-400">AI Recommendations</span>
                  <div className="space-y-1">
                    {req.output.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-bold text-[#031B4E]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
