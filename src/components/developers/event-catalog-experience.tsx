"use client";

import { useState } from "react";
import { DeveloperSubnav } from "./developer-subnav";
import { Webhook, ShieldCheck, Zap, Copy, Check, Terminal, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type EventCategory = "all" | "listings" | "escrow" | "trust" | "billing";

export function EventCatalogExperience() {
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>("all");
  const [copiedEvent, setCopiedEvent] = useState<string | null>(null);

  const events = [
    {
      id: "EVT_1",
      event: "listing.created",
      category: "listings",
      description: "Fired immediately when a new property or vehicle listing is created or published by a merchant.",
      trigger: "Merchant submits listing form via web workspace or API POST /api/v1/listings.",
      payload: `{
  "event_id": "evt_9814019284",
  "event_type": "listing.created",
  "created_at": "2026-07-31T01:30:00Z",
  "data": {
    "id": "P_101",
    "title": "5 Bed Detached Duplex in Lekki Phase 1",
    "category": "property",
    "price": 350000000,
    "city": "Lagos",
    "verified": true
  }
}`,
    },
    {
      id: "EVT_2",
      event: "escrow.milestone_funded",
      category: "escrow",
      description: "Fired when a buyer deposits funds into milestone custody for a high-value property or vehicle transaction.",
      trigger: "Payment gateway verifies 100% transfer into Yike Safe Haven custody wallet.",
      payload: `{
  "event_id": "evt_1029481902",
  "event_type": "escrow.milestone_funded",
  "created_at": "2026-07-31T01:30:00Z",
  "data": {
    "deal_id": "ESC_9814",
    "buyer_name": "Emeka O.",
    "amount": 18500000,
    "currency": "NGN",
    "milestone_index": 3,
    "milestone_name": "Title Deed Transfer & Physical Key Handoff"
  }
}`,
    },
    {
      id: "EVT_3",
      event: "escrow.dispute_raised",
      category: "escrow",
      description: "Fired when either buyer or seller opens a dispute freeze on milestone custody funds.",
      trigger: "User clicks 'Raise Dispute' trigger in Escrow Workspace.",
      payload: `{
  "event_id": "evt_4491029481",
  "event_type": "escrow.dispute_raised",
  "created_at": "2026-07-31T01:30:00Z",
  "data": {
    "deal_id": "ESC_9814",
    "raised_by": "USR_9920",
    "reason": "Inspection discrepancy on vehicle transmission",
    "dispute_status": "PENDING_STAFF_REVIEW"
  }
}`,
    },
    {
      id: "EVT_4",
      event: "trust.score_updated",
      category: "trust",
      description: "Fired when a merchant's Trust Passport score or verification status changes.",
      trigger: "Field Verifier approves NIN/CAC/Physical inspection or audit system recalculates score.",
      payload: `{
  "event_id": "evt_7710294812",
  "event_type": "trust.score_updated",
  "created_at": "2026-07-31T01:30:00Z",
  "data": {
    "user_id": "USR_8810",
    "previous_score": 88,
    "new_score": 95,
    "trust_tier": "Gold Merchant Tier",
    "verified_badges": ["NIN", "CAC_BUSINESS", "FIELD_INSPECTED"]
  }
}`,
    },
    {
      id: "EVT_5",
      event: "billing.invoice_paid",
      category: "billing",
      description: "Fired when a merchant subscription plan or listing boost payment completes.",
      trigger: "Paystack/Korapay webhook confirms successful charge.",
      payload: `{
  "event_id": "evt_5581920491",
  "event_type": "billing.invoice_paid",
  "created_at": "2026-07-31T01:30:00Z",
  "data": {
    "invoice_id": "INV_2026_904",
    "amount": 25000,
    "vat_7_5": 1875,
    "total_paid": 26875,
    "plan": "Pro Merchant Tier"
  }
}`,
    },
  ];

  const filteredEvents = selectedCategory === "all"
    ? events
    : events.filter((e) => e.category === selectedCategory);

  function handleCopy(payload: string, eventName: string) {
    navigator.clipboard.writeText(payload);
    setCopiedEvent(eventName);
    setTimeout(() => setCopiedEvent(null), 2000);
  }

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white py-8 px-4 sm:px-6 select-none">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* HEADER & SUBNAV */}
        <div className="space-y-4">
          <DeveloperSubnav />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-navy dark:text-white flex items-center gap-2">
                <Webhook className="h-6 w-6 text-gold" />
                Webhook & Real-Time Event Catalog
              </h1>
              <p className="text-xs text-navy/60 dark:text-white/60 mt-1">
                Complete event reference detailing trigger conditions, JSON payload schemas, HMAC-SHA256 signatures, and delivery retry policies.
              </p>
            </div>
          </div>
        </div>

        {/* SECURITY & DELIVERY GUARANTEES CARD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-lg space-y-2">
            <h3 className="font-black text-sm text-navy dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              HMAC-SHA256 Signatures
            </h3>
            <p className="text-[11px] text-navy/70 dark:text-white/70 leading-relaxed">
              Every webhook HTTP POST header includes <code className="font-mono bg-black/10 px-1 rounded text-gold">X-Yike-Signature</code> calculated using your endpoint secret token (<code className="font-mono">whsec_...</code>).
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-lg space-y-2">
            <h3 className="font-black text-sm text-navy dark:text-white flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-blue-600" />
              4-Stage Exponential Retry
            </h3>
            <p className="text-[11px] text-navy/70 dark:text-white/70 leading-relaxed">
              Failed deliveries (non-2xx response) retry automatically on a 4-step backoff: 5s, 30s, 5m, and 1h before moving to dead-letter queue.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-lg space-y-2">
            <h3 className="font-black text-sm text-navy dark:text-white flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-purple-600" />
              Idempotency & Ordering
            </h3>
            <p className="text-[11px] text-navy/70 dark:text-white/70 leading-relaxed">
              Payloads carry unique <code className="font-mono bg-black/10 px-1 rounded text-gold">event_id</code> attributes to guarantee idempotent delivery handling across duplicate retry attempts.
            </p>
          </div>
        </div>

        {/* EVENT CATEGORY FILTER */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-bold">
          {(["all", "listings", "escrow", "trust", "billing"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-2xl capitalize transition-all shrink-0",
                selectedCategory === cat
                  ? "bg-[#031B4E] dark:bg-gold text-white dark:text-navy font-black shadow-md"
                  : "bg-white dark:bg-navy border border-slate-200 dark:border-white/10 text-navy/70 dark:text-white/70 hover:bg-slate-50"
              )}
            >
              {cat === "all" ? "All Platform Events" : cat}
            </button>
          ))}
        </div>

        {/* EVENT CATALOG LIST */}
        <div className="space-y-6">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-4 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-navy dark:text-gold">{evt.event}</span>
                  <span className="rounded-full bg-gold/20 text-navy dark:text-gold px-2.5 py-0.5 text-[9px] font-black uppercase">
                    {evt.category}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(evt.payload, evt.event)}
                  className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-white/10 text-navy dark:text-white text-[11px] font-bold flex items-center gap-1.5 hover:bg-slate-200"
                >
                  {copiedEvent === evt.event ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Copied Schema</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Payload JSON</span>
                    </>
                  )}
                </button>
              </div>

              <div>
                <p className="font-black text-sm text-navy dark:text-white">{evt.description}</p>
                <p className="text-[11px] text-navy/60 dark:text-white/60 mt-1">
                  <span className="font-bold text-gold">Trigger:</span> {evt.trigger}
                </p>
              </div>

              {/* JSON PAYLOAD DISPLAY */}
              <div className="p-4 rounded-2xl bg-[#031B4E] text-white border border-white/10 space-y-2">
                <span className="text-[10px] font-black uppercase text-gold flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5" />
                  JSON Payload Sample
                </span>
                <pre className="p-3 rounded-xl bg-black/50 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                  <code>{evt.payload}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
