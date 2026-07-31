"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, ChevronLeft } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";

export function ListingPromotionsEngine() {
  const [selectedBoost, setSelectedBoost] = useState<"featured" | "spotlight" | "hero">("featured");

  const boosts = [
    {
      id: "featured",
      name: "7-Day Featured Badge",
      price: 5000,
      badge: "5x Impressions",
      description: "Highlights your listing in yellow gold border across search results and category hubs for 7 days.",
      href: "/payments/checkout?boost=featured&amount=5000",
    },
    {
      id: "spotlight",
      name: "14-Day Top Search Spotlight",
      price: 12000,
      badge: "10x Inquiries",
      description: "Pins your listing to position #1 in search results for your city and category for 14 days.",
      href: "/payments/checkout?boost=spotlight&amount=12000",
    },
    {
      id: "hero",
      name: "30-Day Homepage Hero Banner",
      price: 35000,
      badge: "25x Buyer Reach",
      description: "Displays your property or vehicle in the primary Yike homepage carousel for 30 days.",
      href: "/payments/checkout?boost=hero&amount=35000",
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white pb-20 select-none">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-navy/10 dark:border-white/10 bg-[#031B4E] px-6 py-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <Link href="/seller/listings" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider text-gold flex items-center gap-2">
              <Zap className="h-5 w-5 text-gold" />
              LISTING PROMOTIONS & BOOST ENGINE
            </h1>
            <p className="text-[11px] font-semibold text-white/70">
              Amplify Buyer Visibility & Multiply WhatsApp Lead Velocity
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6 space-y-6 text-xs">
        
        {/* SELECT LISTING TO BOOST */}
        <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white">
            1. Select Listing to Boost
          </h2>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-3">
            <div>
              <span className="rounded-md bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 text-[9px] font-black uppercase">
                Active Listing
              </span>
              <h3 className="font-black text-navy dark:text-white text-sm mt-1">
                5 Bedroom Fully Detached Duplex with Swimming Pool
              </h3>
              <p className="text-[10px] text-navy/50 dark:text-white/50">Lekki Phase 1, Lagos · ₦350,000,000</p>
            </div>

            <button type="button" className="text-gold font-bold hover:underline shrink-0">
              Change
            </button>
          </div>
        </div>

        {/* CHOOSE BOOST PACKAGE */}
        <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white">
            2. Choose Boost Level
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {boosts.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBoost(b.id as "featured" | "spotlight" | "hero")}
                className={cn(
                  "cursor-pointer p-4 rounded-2xl border transition-all space-y-3 flex flex-col justify-between",
                  selectedBoost === b.id
                    ? "border-gold bg-gold/10 text-navy dark:text-white shadow-md font-bold"
                    : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-emerald-500 text-white px-2 py-0.5 text-[9px] font-black uppercase">
                      {b.badge}
                    </span>
                    <span className="font-black text-gold-dark dark:text-gold text-sm">{formatPrice(b.price)}</span>
                  </div>

                  <h3 className="font-black text-sm">{b.name}</h3>
                  <p className="text-[11px] text-navy/70 dark:text-white/70 leading-relaxed">{b.description}</p>
                </div>

                <Link
                  href={b.href}
                  className="pressable w-full py-2.5 rounded-xl bg-[#031B4E] dark:bg-gold text-white dark:text-navy text-center font-black uppercase tracking-wider block"
                >
                  Activate Boost
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
