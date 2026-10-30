"use client";

import Link from "next/link";
import { Home, Car, Smartphone, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";

const VERTICALS = [
  {
    id: "property",
    label: "Property",
    description: "Homes, land & commercial — rent or buy",
    href: "/search",
    icon: Home,
    accent: "from-navy/90 to-navy/70",
    alwaysOn: true,
  },
  {
    id: "vehicle",
    label: "Vehicles",
    description: "Cars, SUVs, trucks & more",
    href: "/vehicles",
    icon: Car,
    accent: "from-navy/85 to-[#0a2d6b]/90",
    flag: "vehicle_marketplace" as const,
  },
  {
    id: "electronics",
    label: "Electronics",
    description: "Phones, laptops, appliances & power",
    href: "/electronics",
    icon: Smartphone,
    accent: "from-violet-900/90 to-navy/80",
    flag: "electronics_marketplace" as const,
  },
] as const;

export function HomeThreeVerticalHero({ className }: { className?: string }) {
  const visible = VERTICALS.filter((v) => {
    if ("alwaysOn" in v && v.alwaysOn) return true;
    if ("flag" in v && v.flag) return isLaunchFeatureVisible(v.flag);
    return true;
  });

  return (
    <section
      aria-label="Shop property, vehicles, and electronics"
      className={cn("mx-auto w-full max-w-7xl px-3 lg:px-6 xl:px-8", className)}
    >
      <div className="mb-3 border-l-[3px] border-gold pl-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
          Nigeria&apos;s trusted marketplace
        </p>
        <h2 className="text-lg font-bold text-foreground lg:text-xl">
          Property · Vehicles · Electronics
        </h2>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {visible.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className="pressable group relative flex min-h-[140px] overflow-hidden yike-marketplace-tile sm:flex-col"
              >
                <div
                  className={cn(
                    "relative flex h-24 w-full shrink-0 items-end p-3 sm:h-28 bg-gradient-to-br",
                    item.accent,
                  )}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-gold backdrop-blur-sm">
                    <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                  </span>
                </div>
                <div className="flex flex-1 items-center justify-between gap-2 p-4">
                  <div className="min-w-0">
                    <p className="text-base font-black text-navy group-hover:text-navy">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted line-clamp-2">{item.description}</p>
                  </div>
                  <ChevronRight
                    className="h-5 w-5 shrink-0 text-gold-dark transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
