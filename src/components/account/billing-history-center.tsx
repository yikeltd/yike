"use client";

import Link from "next/link";
import { CreditCard, Download } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export function BillingHistoryCenter() {
  const invoices = [
    { id: "INV_9041", date: "Jul 28, 2026", description: "Pro Merchant Monthly Subscription", amount: 25000, vat: 1875, total: 26875, status: "Paid", channel: "Paystack Card" },
    { id: "INV_8810", date: "Jul 15, 2026", description: "7-Day Featured Listing Boost (#P1)", amount: 5000, vat: 375, total: 5375, status: "Paid", channel: "SafeHaven Transfer" },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white py-8 px-4 sm:px-6 select-none">
      <div className="mx-auto max-w-4xl space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-navy/10 dark:border-white/10 pb-4">
          <div>
            <h1 className="text-xl font-black text-navy dark:text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gold" />
              Billing & Tax Invoice Center
            </h1>
            <p className="text-xs text-navy/60 dark:text-white/60 mt-0.5">
              Manage your merchant subscriptions, view receipts, and download tax invoices (7.5% VAT).
            </p>
          </div>

          <Link href="/pricing/plans" className="rounded-2xl bg-gold text-navy px-4 py-2 text-xs font-black hover:bg-gold-light">
            Manage Subscription
          </Link>
        </div>

        {/* INVOICE LIST */}
        <div className="space-y-3 text-xs">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="p-4 rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy shadow-md flex items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 text-[9px] font-black uppercase">
                    {inv.status}
                  </span>
                  <span className="font-black text-navy dark:text-white truncate">{inv.description}</span>
                </div>
                <p className="text-[10px] text-navy/50 dark:text-white/50">
                  {inv.id} · {inv.date} · via {inv.channel}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="font-black text-navy dark:text-white text-sm">{formatPrice(inv.total)}</p>
                  <p className="text-[9px] text-navy/50 dark:text-white/50">Incl. 7.5% VAT ({formatPrice(inv.vat)})</p>
                </div>

                <button
                  type="button"
                  className="p-2.5 rounded-2xl bg-slate-100 dark:bg-white/10 text-navy dark:text-white hover:bg-slate-200 font-bold flex items-center gap-1"
                  title="Download Invoice"
                >
                  <Download className="h-4 w-4 text-gold" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
