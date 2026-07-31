"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  PlusCircle,
  Edit,
  Trash2,
  TrendingUp,
  ChevronLeft,
} from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";

export function SellerListingsManager() {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "draft" | "archived">("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "property" | "vehicle">("all");

  const listings = [
    { id: "P1", title: "5 Bedroom Fully Detached Duplex with Swimming Pool", category: "property", price: 350000000, location: "Lekki Phase 1, Lagos", status: "active", views: 1420, leads: 48, image: "/images/logo.webp" },
    { id: "V1", title: "2022 Toyota Camry SE (Foreign Used Tokunbo)", category: "vehicle", price: 18500000, location: "Lekki Showroom, Lagos", status: "active", views: 980, leads: 32, image: "/images/logo.webp" },
    { id: "P2", title: "Luxury 4 Bedroom Terrace House in Secured Estate", category: "property", price: 280000000, location: "Ikoyi, Lagos", status: "active", views: 2100, leads: 62, image: "/images/logo.webp" },
    { id: "V2", title: "2021 Mercedes-Benz GLE 450 AMG 4Matic", category: "vehicle", price: 65000000, location: "Victoria Island, Lagos", status: "draft", views: 0, leads: 0, image: "/images/logo.webp" },
    { id: "P3", title: "Commercial Plot of Land (1,200 sqm)", category: "property", price: 450000000, location: "Victoria Island, Lagos", status: "archived", views: 3200, leads: 95, image: "/images/logo.webp" },
  ];

  const filtered = listings.filter((l) => {
    if (activeTab !== "all" && l.status !== activeTab) return false;
    if (categoryFilter !== "all" && l.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white pb-20 select-none">
      
      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-navy/10 dark:border-white/10 bg-[#031B4E] px-4 py-3 text-white shadow-md">
        <div className="flex items-center gap-2.5">
          <Link href="/seller" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xs font-black uppercase tracking-wider text-gold">
              INVENTORY LISTINGS MANAGER
            </h1>
            <p className="text-[10px] font-semibold text-white/70">
              Manage Active Properties & Vehicles
            </p>
          </div>
        </div>

        <Link
          href="/post-property"
          className="flex items-center gap-1 rounded-2xl bg-gold text-navy px-3.5 py-1.5 text-xs font-black shadow-md hover:bg-gold-light"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Listing</span>
        </Link>
      </header>

      <div className="mx-auto max-w-6xl px-3.5 pt-6 sm:px-6 space-y-6">
        
        {/* TABS & FILTERS BAR */}
        <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-4 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              {(["all", "active", "draft", "archived"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "rounded-2xl px-4 py-2 capitalize transition-all",
                    activeTab === tab
                      ? "bg-[#031B4E] dark:bg-gold text-white dark:text-navy font-black shadow-sm"
                      : "bg-slate-100 dark:bg-white/10 text-navy dark:text-white hover:bg-slate-200"
                  )}
                >
                  {tab} Listings
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[10px] font-bold text-navy/50 dark:text-white/50">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as "all" | "property" | "vehicle")}
                className="rounded-2xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-navy-light px-3 py-1.5 font-bold text-navy dark:text-white"
              >
                <option value="all">All Categories</option>
                <option value="property">Properties</option>
                <option value="vehicle">Vehicles</option>
              </select>
            </div>
          </div>
        </div>

        {/* LISTINGS GRID */}
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-4 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-white/5">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-[#031B4E] px-2 py-0.5 text-[9px] font-black uppercase text-gold">
                      {item.category}
                    </span>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[9px] font-extrabold capitalize",
                      item.status === "active" ? "bg-emerald-100 text-emerald-900" : "bg-slate-200 text-slate-700"
                    )}>
                      {item.status}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-navy dark:text-white text-sm line-clamp-1 mt-0.5">
                    {item.title}
                  </h3>
                  <p className="text-[10px] text-navy/60 dark:text-white/60">{item.location}</p>
                </div>
              </div>

              <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-white/10">
                <div className="text-left sm:text-right">
                  <span className="font-black text-gold-dark dark:text-gold text-sm block">
                    {formatPrice(item.price)}
                  </span>
                  <span className="text-[10px] font-semibold text-navy/50 dark:text-white/50">
                    {item.views} Views · {item.leads} Leads
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button type="button" className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200" title="Edit">
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-gold hover:bg-amber-200" title="Boost">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-300 hover:bg-rose-200" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
