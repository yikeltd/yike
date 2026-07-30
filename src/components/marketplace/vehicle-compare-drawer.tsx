"use client";

import { useState } from "react";
import Image from "next/image";
import { Scale, X, ChevronUp, Trash2 } from "lucide-react";
import type { Property } from "@/types/database";
import { CompareVehiclesModal } from "./compare-vehicles-modal";

export function VehicleCompareDrawer({
  selectedVehicles,
  onRemove,
  onClear,
}: {
  selectedVehicles: Property[];
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  if (selectedVehicles.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-3 inset-x-3 z-40 mx-auto max-w-xl rounded-3xl bg-[#031B4E] text-white p-3.5 shadow-2xl border border-gold/40 backdrop-blur-md animate-in slide-in-from-bottom-6 duration-200">
        <div className="flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gold text-navy font-black">
              <Scale className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black text-white truncate">
                Compare Vehicles ({selectedVehicles.length}/4)
              </p>
              <div className="flex items-center gap-1 mt-0.5 overflow-hidden">
                {selectedVehicles.map((v) => (
                  <span
                    key={v.id}
                    className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold text-white/90 truncate"
                  >
                    <span className="truncate max-w-[70px]">{v.title}</span>
                    <button
                      type="button"
                      onClick={() => onRemove(v.id)}
                      className="hover:text-gold"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClear}
              className="p-2 text-white/60 hover:text-white"
              title="Clear all"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="pressable flex items-center gap-1 rounded-2xl bg-gold px-4 py-2.5 text-xs font-black text-navy hover:bg-gold-light shadow-md"
            >
              <span>Compare Now</span>
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>
      </div>

      {modalOpen && (
        <CompareVehiclesModal
          vehicles={selectedVehicles}
          onRemove={onRemove}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
