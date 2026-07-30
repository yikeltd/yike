"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { DynamicWatermark } from "@/components/ui/dynamic-watermark";

export function VehicleGalleryModal({
  photos,
  initialIndex = 0,
  title,
  onClose,
}: {
  photos: string[];
  initialIndex?: number;
  title?: string;
  onClose: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") {
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
        setZoomLevel(1);
      }
      if (e.key === "ArrowRight") {
        setActiveIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
        setZoomLevel(1);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [photos.length, onClose]);

  const currentPhoto =
    photos[activeIndex] ||
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&q=80&fit=crop";

  function handleZoomIn() {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  }

  function handleZoomOut() {
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  }

  function handleResetZoom() {
    setZoomLevel(1);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white animate-in fade-in duration-200 select-none">
      {/* TOP BAR */}
      <div className="flex items-center justify-between p-4 bg-black/60 backdrop-blur-md border-b border-white/10 z-10">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold tabular-nums">
            {activeIndex + 1} / {photos.length || 1}
          </span>
          {title && (
            <p className="text-xs font-semibold text-white/80 line-clamp-1 max-w-xs sm:max-w-md">
              {title}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-40 hover:bg-white/20"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-40 hover:bg-white/20"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          {zoomLevel > 1 && (
            <button
              type="button"
              onClick={handleResetZoom}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              title="Reset zoom"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 ml-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* MAIN VIEWPORT */}
      <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden">
        <div
          className="relative h-full w-full transition-transform duration-200 ease-out"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <Image
            src={currentPhoto}
            alt={title || `Photo ${activeIndex + 1}`}
            fill
            priority
            sizes="100vw"
            className="object-contain"
          />
          <DynamicWatermark className="opacity-[0.05]" />
        </div>

        {/* PREV / NEXT ARROWS */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => {
                setActiveIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
                setZoomLevel(1);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md border border-white/10 hover:bg-black/80 active:scale-95"
            >
              <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
                setZoomLevel(1);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md border border-white/10 hover:bg-black/80 active:scale-95"
            >
              <ChevronRight className="h-6 w-6 stroke-[2.5]" />
            </button>
          </>
        )}
      </div>

      {/* THUMBNAIL STRIP */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-4 bg-black/80 backdrop-blur-md border-t border-white/10 justify-center">
          {photos.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setActiveIndex(idx);
                setZoomLevel(1);
              }}
              className={cn(
                "relative h-14 w-18 shrink-0 overflow-hidden rounded-xl border-2 transition-all active:scale-95",
                activeIndex === idx
                  ? "border-[#E4B547] ring-2 ring-[#E4B547]/40 opacity-100 scale-105"
                  : "border-transparent opacity-50 hover:opacity-100"
              )}
            >
              <Image src={p} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
