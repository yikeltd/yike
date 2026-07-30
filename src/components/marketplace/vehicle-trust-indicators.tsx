"use client";

import { useState } from "react";
import { ShieldCheck, FileCheck, CheckCircle2, SearchCheck, Lock, Info, X, Award, Wrench, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Property } from "@/types/database";

export type VehicleTrustIndicatorType =
  | "vin"
  | "inspection"
  | "accident_free"
  | "dealer"
  | "escrow";

export interface VehicleTrustIndicatorItem {
  id: VehicleTrustIndicatorType;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof ShieldCheck;
  badgeClass: string;
  active: boolean;
}

export function getVehicleTrustIndicators(vehicle: Property | {
  is_verified_listing?: boolean;
  agent?: unknown;
  extras?: Record<string, unknown> | null;
}): VehicleTrustIndicatorItem[] {
  const agentObj = (vehicle.agent as Record<string, unknown> | null) || {};
  const isDealerVerified = Boolean(
    agentObj.verified_badge ||
    agentObj.is_verified_agent ||
    agentObj.account_type === "dealer"
  );
  const isVehicleVerified = Boolean(vehicle.is_verified_listing);
  const extras = (vehicle.extras as Record<string, unknown> | null) || {};
  const vinVerified = Boolean(extras.vin_verified || isVehicleVerified);
  const inspected = Boolean(extras.inspection_passed || isVehicleVerified);

  return [
    {
      id: "vin",
      label: "VIN & Title Verified",
      shortLabel: "VIN Verified",
      description:
        "Chassis VIN has been cross-checked against custom import databases to confirm clean title & zero theft alerts.",
      icon: ShieldCheck,
      badgeClass: "bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
      active: vinVerified,
    },
    {
      id: "inspection",
      label: "150-Point Inspection Passed",
      shortLabel: "150-Point Inspected",
      description:
        "Engine compression, transmission shift, suspension, OBD2 diagnostic scan, and A/C cooling verified by Yike Auto Mechanics.",
      icon: CheckCircle2,
      badgeClass: "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
      active: inspected,
    },
    {
      id: "accident_free",
      label: "Accident & Flood Free",
      shortLabel: "Flood & Crash Free",
      description:
        "Exterior panels, chassis frame, and undercarriage inspected for zero structural crash or saltwater flood damage.",
      icon: ShieldAlert,
      badgeClass: "bg-purple-50 text-purple-900 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
      active: isVehicleVerified,
    },
    {
      id: "dealer",
      label: "Verified Auto Showroom",
      shortLabel: "Verified Dealer",
      description:
        "Listing seller is a registered auto dealership with physical showroom premises verified by Yike Compliance.",
      icon: Award,
      badgeClass: "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-gold dark:border-amber-800",
      active: isDealerVerified,
    },
    {
      id: "escrow",
      label: "Yike Auto Escrow Ready",
      shortLabel: "Escrow Ready",
      description:
        "Your purchase deposit is held securely until you inspect the vehicle, verify ownership papers, and sign the bill of sale.",
      icon: Lock,
      badgeClass: "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-gold dark:border-amber-700",
      active: true,
    },
  ];
}

export function VehicleTrustIndicators({
  vehicle,
  className,
}: {
  vehicle: Property | {
    is_verified_listing?: boolean;
    agent?: unknown;
    extras?: Record<string, unknown> | null;
  };
  className?: string;
}) {
  const indicators = getVehicleTrustIndicators(vehicle);
  const activeIndicators = indicators.filter((i) => i.active);
  const [selected, setSelected] = useState<VehicleTrustIndicatorItem | null>(null);

  if (activeIndicators.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-wider text-navy/70 dark:text-white/70">
          Automotive Trust & Verification
        </h4>
        <span className="text-[10px] font-semibold text-navy/40 dark:text-white/40">
          Tap badge for report
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {activeIndicators.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className={cn(
                "group pressable inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all shadow-xs hover:scale-[1.02] active:scale-95",
                item.badgeClass
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{item.shortLabel}</span>
              <Info className="h-3 w-3 opacity-60 group-hover:opacity-100" />
            </button>
          );
        })}
      </div>

      {/* DETAIL MODAL / BOTTOM SHEET */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-navy p-6 shadow-2xl space-y-4 border border-navy/10 dark:border-white/10 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={cn("p-2 rounded-2xl border", selected.badgeClass)}>
                  <selected.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-navy dark:text-white">
                    {selected.label}
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    Verified Inspection Active
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-navy dark:text-white hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs leading-relaxed text-navy/80 dark:text-white/80">
              {selected.description}
            </p>

            <div className="rounded-2xl bg-slate-50 dark:bg-white/5 p-3 text-[11px] font-medium text-navy/70 dark:text-white/70 space-y-1">
              <p className="font-bold text-navy dark:text-white">Yike Auto Assurance Guarantee:</p>
              <p>
                Every automotive verification check protects buyers against stolen vehicles, hidden flood damage, tampered odometers, and fraudulent car listings across Nigeria.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="w-full rounded-2xl bg-[#031B4E] py-3 text-xs font-black text-white hover:bg-navy/90"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
