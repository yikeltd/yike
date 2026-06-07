"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { buildHandoffSummary } from "@/lib/leads/message";
import { SAFETY_HANDOFF_LINE } from "@/lib/leads/safety";
import type { HandoffPayload } from "@/lib/leads/handoff";

export function LeadHandoffActions({ data }: { data: HandoffPayload }) {
  const [loading, setLoading] = useState(false);
  const summary = buildHandoffSummary({
    propertyTitle: data.title,
    area: data.area,
    city: data.city,
    price: data.price,
    paymentPeriod: data.paymentPeriod,
    listingType: data.listingType,
    bedrooms: data.bedrooms ?? undefined,
    propertyType: data.propertyType,
    yikeReference: data.yikeReference,
  });

  async function chatAgent() {
    setLoading(true);
    const res = await fetch("/api/leads/forward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ yikeReference: data.yikeReference }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok && body.redirectUrl) {
      window.open(body.redirectUrl as string, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-white p-5 shadow-float">
        <p className="text-sm font-bold text-navy">🏠 Property Found</p>
        <h1 className="mt-3 text-xl font-bold text-navy">{summary.title}</h1>
        <p className="mt-2 text-sm text-muted">📍 {summary.location}</p>
        <p className="mt-2 text-lg font-bold text-navy">💰 {summary.priceLabel}</p>
        <p className="mt-4 text-sm text-muted">
          Reference:
          <br />
          <span className="font-mono text-xs text-foreground">
            {summary.reference}
          </span>
        </p>
      </div>

      <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
        <p className="font-semibold">Safety tip</p>
        <p className="mt-1">{SAFETY_HANDOFF_LINE}</p>
      </div>

      <p className="text-center text-xs text-muted">
        👇 Continue to chat directly with the agent
      </p>

      <button
        type="button"
        onClick={() => void chatAgent()}
        disabled={loading}
        className="pressable flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-4 text-base font-bold text-navy shadow-glow-gold disabled:opacity-70"
      >
        <MessageCircle className="h-5 w-5" />
        {loading ? "Opening WhatsApp…" : "Chat Agent"}
      </button>

      <p className="text-center text-[11px] text-muted">Powered by Yike</p>
    </div>
  );
}
