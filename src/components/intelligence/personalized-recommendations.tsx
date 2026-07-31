"use client";

import Image from "next/image";
import Link from "next/link";
import { Sparkles, Clock, ChevronRight } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";

export function PersonalizedRecommendations({
  className,
}: {
  className?: string;
}) {
  const lastViewed = {
    id: "last_1",
    title: "5 Bedroom Fully Detached Duplex with Swimming Pool",
    location: "Lekki Phase 1, Lagos",
    price: 350000000,
    category: "property",
    image: "/images/logo.webp",
  };

  const smartMatches = [
    { id: "M1", title: "Luxury 4 Bedroom Terrace House in Secured Estate", location: "Ikoyi, Lagos", price: 280000000, category: "property", badge: "98% Match", image: "/images/logo.webp" },
    { id: "M2", title: "2022 Toyota Camry SE (Tokunbo / Foreign Used)", location: "Lekki Showroom", price: 18500000, category: "vehicle", badge: "Hot Deal", image: "/images/logo.webp" },
  ];

  return (
    <div className={cn("space-y-4 select-none", className)}>
      
      {/* 1. CONTINUE WHERE YOU LEFT OFF BANNER */}
      <div className="rounded-3xl border border-[#031B4E]/20 dark:border-gold/30 bg-gradient-to-br from-[#031B4E] to-navy-light text-white p-4 shadow-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-12 w-14 shrink-0 overflow-hidden rounded-2xl bg-white/10 border border-gold/30">
            <Image src={lastViewed.image} alt={lastViewed.title} fill className="object-cover" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-gold text-[10px] font-black uppercase tracking-wider">
              <Clock className="h-3 w-3" />
              Continue Browsing
            </div>
            <h4 className="font-black text-white text-xs truncate mt-0.5">{lastViewed.title}</h4>
            <p className="text-[10px] text-white/70 truncate">{lastViewed.location} · {formatPrice(lastViewed.price)}</p>
          </div>
        </div>

        <Link
          href={`/properties/${lastViewed.id}`}
          className="pressable flex items-center gap-1 rounded-2xl bg-gold text-navy px-3 py-1.5 text-xs font-black shrink-0 hover:bg-gold-light"
        >
          <span>Resume</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* 2. SMART MATCH SUGGESTIONS */}
      <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-gold" />
            AI Smart Matches for You
          </h3>
          <span className="text-[10px] font-bold text-navy/50 dark:text-white/50">Based on search history</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {smartMatches.map((match) => (
            <Link
              key={match.id}
              href={match.category === "vehicle" ? `/vehicles/${match.id}` : `/properties/${match.id}`}
              className="group p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:border-gold transition-all flex items-center gap-3"
            >
              <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-200">
                <Image src={match.image} alt={match.title} fill className="object-cover group-hover:scale-105 transition-all" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 text-[9px] font-extrabold">
                    {match.badge}
                  </span>
                  <span className="font-black text-gold-dark dark:text-gold">{formatPrice(match.price)}</span>
                </div>
                <h4 className="font-black text-navy dark:text-white line-clamp-1 mt-1">{match.title}</h4>
                <p className="text-[10px] text-navy/50 dark:text-white/50 truncate mt-0.5">{match.location}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
