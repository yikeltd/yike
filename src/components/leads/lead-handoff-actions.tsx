"use client";

import { useState } from "react";
import { MessageCircle, Shield } from "lucide-react";
import { buildHandoffSummary } from "@/lib/leads/message";
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
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-white p-5 shadow-float">
        <p className="text-xs font-bold uppercase tracking-wide text-gold-dark">
          Property found
        </p>
        <h1 className="mt-2 text-xl font-bold text-navy">{summary.title}</h1>
        <p className="mt-1 text-sm text-muted">📍 {summary.location}</p>
        <p className="mt-2 text-lg font-bold text-navy">{summary.priceLabel}</p>
        <p className="mt-3 font-mono text-xs text-muted">
          Reference: {summary.reference}
        </p>
      </div>

      <div className="flex gap-2 rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2.5 text-xs leading-snug text-amber-900">
        <Shield className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Never pay inspection or caution fees before seeing a property
          physically.
        </p>
      </div>

      <button
        type="button"
        onClick={() => void chatAgent()}
        disabled={loading}
        className="pressable flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-4 text-base font-bold text-navy shadow-glow-gold disabled:opacity-70"
      >
        <MessageCircle className="h-5 w-5" />
        {loading ? "Opening WhatsApp…" : "Chat Agent"}
      </button>

      <p className="text-center text-[11px] text-muted">Powered by Yike.ng</p>
    </div>
  );
}
