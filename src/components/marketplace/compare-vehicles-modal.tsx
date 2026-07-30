"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Check, Gauge, Settings2, Fuel, ShieldCheck, Car, Calendar, Award } from "lucide-react";
import type { Property } from "@/types/database";
import { formatPrice } from "@/lib/utils";
import { listingPath } from "@/lib/marketplace/listing-path";

export function CompareVehiclesModal({
  vehicles,
  onRemove,
  onClose,
}: {
  vehicles: Property[];
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  if (vehicles.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 p-3 sm:p-6 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white dark:bg-navy text-navy dark:text-white shadow-2xl border border-navy/10 dark:border-white/10">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 px-5 py-4 bg-[#031B4E] text-white">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Car className="h-5 w-5 text-gold" />
              Side-by-Side Vehicle Comparison
            </h2>
            <p className="text-[11px] font-semibold text-white/70">
              Comparing {vehicles.length} vehicle{vehicles.length > 1 ? "s" : ""} on specs, condition & value
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* COMPARISON TABLE */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-6">
          <div className="grid min-w-[600px]" style={{ gridTemplateColumns: `140px repeat(${vehicles.length}, minmax(180px, 1fr))` }}>
            
            {/* ROW 0: PHOTO & TITLE */}
            <div className="p-3 font-black text-xs text-navy/50 dark:text-white/50 border-b border-slate-100 dark:border-white/10 flex items-end">
              Vehicle
            </div>
            {vehicles.map((v) => (
              <div key={v.id} className="p-3 border-b border-slate-100 dark:border-white/10 relative space-y-2">
                <button
                  type="button"
                  onClick={() => onRemove(v.id)}
                  className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-navy dark:text-white hover:bg-rose-100 hover:text-rose-600 z-10"
                  title="Remove from comparison"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  {v.media_urls?.[0] ? (
                    <Image src={v.media_urls[0]} alt={v.title} fill className="object-cover" />
                  ) : null}
                </div>
                <h3 className="text-xs font-black text-navy dark:text-white line-clamp-2">
                  {v.title}
                </h3>
                <p className="text-sm font-black text-gold-dark dark:text-gold">
                  {formatPrice(Number(v.price))}
                </p>
                <Link
                  href={listingPath(v)}
                  onClick={onClose}
                  className="pressable block text-center rounded-xl bg-[#031B4E] dark:bg-gold py-1.5 text-[11px] font-black text-white dark:text-navy hover:bg-navy/90"
                >
                  View Details
                </Link>
              </div>
            ))}

            {/* ROW 1: YEAR */}
            <div className="p-3 font-bold text-xs text-navy/50 dark:text-white/50 border-b border-slate-100 dark:border-white/10 flex items-center">
              Year
            </div>
            {vehicles.map((v) => (
              <div key={v.id} className="p-3 border-b border-slate-100 dark:border-white/10 font-black text-xs flex items-center">
                {v.year || "-"}
              </div>
            ))}

            {/* ROW 2: CONDITION */}
            <div className="p-3 font-bold text-xs text-navy/50 dark:text-white/50 border-b border-slate-100 dark:border-white/10 flex items-center">
              Condition
            </div>
            {vehicles.map((v) => (
              <div key={v.id} className="p-3 border-b border-slate-100 dark:border-white/10 font-bold text-xs capitalize flex items-center">
                {v.vehicle_condition ? v.vehicle_condition.replace(/_/g, " ") : "Foreign Used"}
              </div>
            ))}

            {/* ROW 3: MILEAGE */}
            <div className="p-3 font-bold text-xs text-navy/50 dark:text-white/50 border-b border-slate-100 dark:border-white/10 flex items-center">
              Mileage
            </div>
            {vehicles.map((v) => (
              <div key={v.id} className="p-3 border-b border-slate-100 dark:border-white/10 font-black text-xs flex items-center">
                {v.mileage != null ? `${Number(v.mileage).toLocaleString()} km` : "-"}
              </div>
            ))}

            {/* ROW 4: TRANSMISSION */}
            <div className="p-3 font-bold text-xs text-navy/50 dark:text-white/50 border-b border-slate-100 dark:border-white/10 flex items-center">
              Transmission
            </div>
            {vehicles.map((v) => (
              <div key={v.id} className="p-3 border-b border-slate-100 dark:border-white/10 font-bold text-xs capitalize flex items-center">
                {v.transmission || "Automatic"}
              </div>
            ))}

            {/* ROW 5: FUEL TYPE */}
            <div className="p-3 font-bold text-xs text-navy/50 dark:text-white/50 border-b border-slate-100 dark:border-white/10 flex items-center">
              Fuel Type
            </div>
            {vehicles.map((v) => (
              <div key={v.id} className="p-3 border-b border-slate-100 dark:border-white/10 font-bold text-xs capitalize flex items-center">
                {v.fuel_type || "Petrol"}
              </div>
            ))}

            {/* ROW 6: INSPECTION & VERIFICATION */}
            <div className="p-3 font-bold text-xs text-navy/50 dark:text-white/50 border-b border-slate-100 dark:border-white/10 flex items-center">
              Verification
            </div>
            {vehicles.map((v) => (
              <div key={v.id} className="p-3 border-b border-slate-100 dark:border-white/10 font-extrabold text-xs flex items-center">
                {v.is_verified_listing ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="h-4 w-4" />
                    Verified & Inspected
                  </span>
                ) : (
                  <span className="text-navy/50 dark:text-white/50">Standard Listing</span>
                )}
              </div>
            ))}

            {/* ROW 7: LOCATION */}
            <div className="p-3 font-bold text-xs text-navy/50 dark:text-white/50 flex items-center">
              Location
            </div>
            {vehicles.map((v) => (
              <div key={v.id} className="p-3 font-semibold text-xs flex items-center">
                {[v.area, v.city].filter(Boolean).join(", ") || "Nigeria"}
              </div>
            ))}

          </div>
        </div>
      </div>
    </div>
  );
}
