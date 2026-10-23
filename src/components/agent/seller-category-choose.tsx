"use client";

import Link from "next/link";
import { Car, Home, Smartphone, ChevronLeft } from "lucide-react";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { cn } from "@/lib/utils";

const cards = [
  {
    id: "property",
    label: "Property",
    description: "Homes, land, rentals & commercial",
    href: "/agent/listings/property",
    icon: Home,
    visible: () => true,
  },
  {
    id: "vehicle",
    label: "Vehicles",
    description: "Cars, SUVs, bikes & trucks",
    href: "/agent/listings/vehicle",
    icon: Car,
    visible: () => isLaunchFeatureVisible("vehicle_marketplace"),
  },
  {
    id: "electronics",
    label: "Electronics",
    description: "Phones, laptops, appliances & power",
    href: "/agent/listings/new/electronics",
    icon: Smartphone,
    visible: () => isLaunchFeatureVisible("electronics_marketplace"),
  },
] as const;

export function SellerCategoryChoose() {
  const visible = cards.filter((c) => c.visible());

  return (
    <main className="min-h-[100dvh] bg-surface pb-16">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-navy/10 bg-white/95 px-3 py-3 backdrop-blur-md">
        <Link
          href="/agent/listings"
          className="pressable flex h-10 w-10 items-center justify-center rounded-full bg-navy/5"
          aria-label="Back to my listings"
        >
          <ChevronLeft className="h-5 w-5 text-navy" />
        </Link>
        <h1 className="text-base font-bold text-navy">What are you selling?</h1>
      </header>

      <div className="mx-auto max-w-lg px-4 py-6">
        <p className="mb-4 text-sm text-navy/70">
          Choose a category. You can have up to three active listings across property, vehicles, and
          electronics combined.
        </p>
        <ul className="space-y-3">
          {visible.map((card) => {
            const Icon = card.icon;
            return (
              <li key={card.id}>
                <Link
                  href={card.href}
                  className={cn(
                    "pressable flex items-center gap-4 rounded-2xl border border-navy/10 bg-white p-4 shadow-sm",
                    "transition-shadow hover:shadow-md",
                  )}
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy text-gold">
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold text-navy">{card.label}</span>
                    <span className="block text-sm text-navy/65">{card.description}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
