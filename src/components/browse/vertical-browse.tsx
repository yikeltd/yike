"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import type { Property } from "@/types/database";
import { BrowseSlide } from "./browse-slide";

export function VerticalBrowse({ properties }: { properties: Property[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const i = Math.round(el.scrollTop / el.clientHeight);
      setIndex(i);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  if (properties.length === 0) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-bold text-navy">No homes to browse yet</p>
        <Link href="/search" className="text-sm font-bold text-gold-dark">
          Search nationwide →
        </Link>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full bg-navy-dark">
      <Link
        href="/"
        className="pressable absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-20 flex items-center gap-1.5 rounded-full bg-navy/80 px-3 py-2 text-xs font-bold text-white backdrop-blur-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>
      {properties.length > 1 && (
        <span className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-20 rounded-full bg-navy/80 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
          {index + 1} / {properties.length}
        </span>
      )}
      <div
        ref={scrollRef}
        className="hide-scrollbar h-[100dvh] snap-y snap-mandatory overflow-y-scroll overscroll-y-contain"
      >
        {properties.map((p, i) => (
          <BrowseSlide
            key={p.id}
            property={p}
            priority={i < 2}
            showSwipeHint={i === 0 && properties.length > 1}
          />
        ))}
      </div>
    </div>
  );
}
