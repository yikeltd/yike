"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, X, ChevronRight, ShieldCheck, RefreshCw, Car, Home } from "lucide-react";
import type { Property } from "@/types/database";
import { formatPrice, cn } from "@/lib/utils";
import { listingPath } from "@/lib/marketplace/listing-path";

export function MapSearchView({
  items,
  onCloseMap,
}: {
  items: Property[];
  onCloseMap: () => void;
}) {
  const [selectedItem, setSelectedItem] = useState<Property | null>(items[0] || null);
  const [searchingBounds, setSearchingBounds] = useState(false);

  function handleReSearchMap() {
    setSearchingBounds(true);
    setTimeout(() => setSearchingBounds(false), 800);
  }

  return (
    <div className="relative w-full h-[75vh] min-h-[450px] rounded-3xl overflow-hidden bg-slate-900 border border-navy/10 dark:border-white/10 shadow-2xl animate-in fade-in duration-200">
      
      {/* SIMULATED INTERACTIVE MAP CANVAS WITH NIGERIA COORDINATES */}
      <div className="absolute inset-0 bg-[#0a192f] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center">
        
        {/* MAP GRID OVERLAY & CENTROID ROADS */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        {/* MAP RE-SEARCH BUTTON AT TOP CENTER */}
        <div className="absolute top-4 z-20 inset-x-0 flex justify-center">
          <button
            type="button"
            onClick={handleReSearchMap}
            disabled={searchingBounds}
            className="pressable flex items-center gap-2 rounded-full bg-[#031B4E] dark:bg-gold px-4 py-2 text-xs font-black text-white dark:text-navy shadow-2xl border border-white/20 backdrop-blur-md hover:bg-navy/90"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", searchingBounds && "animate-spin")} />
            <span>{searchingBounds ? "Searching map area..." : "Search this area"}</span>
          </button>
        </div>

        {/* CLOSE MAP BUTTON AT TOP RIGHT */}
        <button
          type="button"
          onClick={onCloseMap}
          className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 dark:bg-navy/90 text-navy dark:text-white shadow-xl backdrop-blur-md hover:bg-white"
        >
          <X className="h-4 w-4" />
        </button>

        {/* PRICE PIN MARKERS ON MAP */}
        <div className="relative w-full h-full">
          {items.map((item, idx) => {
            const isSelected = selectedItem?.id === item.id;
            const priceLabel = formatPrice(Number(item.price));
            const isVehicle = Boolean(item.auto_category || item.make);

            // Calculate staggered pin coordinates across simulated Nigeria grid
            const topPct = 20 + ((idx * 17) % 65);
            const leftPct = 15 + ((idx * 23) % 70);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItem(item)}
                style={{ top: `${topPct}%`, left: `${leftPct}%` }}
                className={cn(
                  "absolute z-10 pressable transition-all duration-200 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 rounded-2xl px-2.5 py-1 text-xs font-black shadow-xl border",
                  isSelected
                    ? "bg-gold text-navy border-white scale-110 ring-4 ring-gold/40 z-30"
                    : "bg-[#031B4E] text-white border-white/20 hover:scale-105 hover:bg-navy-light"
                )}
              >
                {isVehicle ? <Car className="h-3 w-3 text-gold shrink-0" /> : <Home className="h-3 w-3 text-gold shrink-0" />}
                <span className="tabular-nums">{priceLabel}</span>
              </button>
            );
          })}
        </div>

        {/* POPUP PREVIEW CARD AT BOTTOM */}
        {selectedItem && (
          <div className="absolute bottom-4 inset-x-4 z-30 mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center gap-3 p-3 rounded-3xl bg-white dark:bg-navy text-navy dark:text-white shadow-2xl border border-navy/10 dark:border-white/10 backdrop-blur-md">
              <div className="relative aspect-[4/3] h-20 w-24 shrink-0 rounded-2xl overflow-hidden bg-slate-100 dark:bg-white/5">
                {selectedItem.media_urls?.[0] ? (
                  <Image src={selectedItem.media_urls[0]} alt={selectedItem.title} fill className="object-cover" />
                ) : null}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-gold-dark dark:text-gold tracking-tight">
                  {formatPrice(Number(selectedItem.price))}
                </p>
                <h4 className="text-xs font-bold text-navy dark:text-white truncate mt-0.5">
                  {selectedItem.title}
                </h4>
                <p className="text-[10px] font-semibold text-navy/60 dark:text-white/60 truncate mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-gold shrink-0" />
                  <span>{[selectedItem.area, selectedItem.city].filter(Boolean).join(", ")}</span>
                </p>
              </div>

              <Link
                href={listingPath(selectedItem)}
                className="pressable flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#031B4E] dark:bg-gold text-white dark:text-navy hover:opacity-90"
              >
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
