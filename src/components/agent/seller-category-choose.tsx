"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Car, Home, Smartphone, ChevronLeft, ArrowRight } from "lucide-react";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { detectMarketplaceCategory } from "@/lib/listing-engine/intelligence";
import { cn } from "@/lib/utils";

const cards = [
  {
    id: "property",
    label: "Property",
    tagline: "Rent · Buy · Shortlet",
    href: "/agent/listings/new/property",
    icon: Home,
    visible: () => true,
  },
  {
    id: "vehicle",
    label: "Vehicles",
    tagline: "Cars · Trucks · Equipment",
    href: "/agent/listings/new/vehicle",
    icon: Car,
    visible: () => isLaunchFeatureVisible("vehicle_marketplace"),
  },
  {
    id: "electronics",
    label: "Electronics",
    tagline: "Phones · Laptops · Power",
    href: "/agent/listings/new/electronics",
    icon: Smartphone,
    visible: () => isLaunchFeatureVisible("electronics_marketplace"),
  },
] as const;

const HINT_ROUTES: Record<string, string> = {
  property: "/agent/listings/new/property",
  vehicle: "/agent/listings/new/vehicle",
  electronics: "/agent/listings/new/electronics",
};

export function SellerCategoryChoose({
  statusNote,
  verified,
}: {
  statusNote?: string | null;
  verified?: boolean;
}) {
  const router = useRouter();
  const visible = cards.filter((c) => c.visible());
  const [hint, setHint] = useState("");

  const categoryHint = useMemo(() => detectMarketplaceCategory(hint), [hint]);
  const suggestedHref =
    categoryHint?.confidence === "high" && categoryHint.categoryId
      ? HINT_ROUTES[categoryHint.categoryId]
      : null;

  function goWithHint(href: string) {
    if (hint.trim()) {
      router.push(`${href}?hint=${encodeURIComponent(hint.trim())}`);
      return;
    }
    router.push(href);
  }

  return (
    <main className="yike-browse-canvas min-h-[100dvh] pb-16">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-navy/10 bg-white/95 px-3 py-3 backdrop-blur-md">
        <Link
          href="/agent/listings"
          className="pressable flex h-10 w-10 items-center justify-center rounded-full bg-navy/5"
          aria-label="Back to my listings"
        >
          <ChevronLeft className="h-5 w-5 text-navy" />
        </Link>
        <h1 className="text-base font-bold text-navy">Sell on Yike</h1>
      </header>

      <div className="mx-auto max-w-lg px-4 py-5 space-y-5">
        {statusNote ? (
          <p className="rounded-xl border border-gold/30 bg-gold/10 px-3 py-2 text-sm font-medium text-navy">
            {statusNote}
            {verified ? null : " You can still create listings; publishing may wait until verification completes."}
          </p>
        ) : null}

        <div className="yike-panel p-4">
          <label htmlFor="sell-hint" className="text-sm font-bold text-navy">
            What are you selling?
          </label>
          <textarea
            id="sell-hint"
            rows={2}
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Describe it — we can route you to the right form"
            className="yike-field-control yike-focus mt-2 w-full resize-none px-3 py-2.5 text-sm text-navy"
          />
          {suggestedHref ? (
            <button
              type="button"
              onClick={() => goWithHint(suggestedHref)}
              className="pressable mt-3 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-navy text-sm font-bold text-gold"
            >
              Continue with {categoryHint!.categoryId}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>

        <ul className="space-y-2.5">
          {visible.map((card) => {
            const Icon = card.icon;
            return (
              <li key={card.id}>
                <button
                  type="button"
                  onClick={() => goWithHint(card.href)}
                  className={cn(
                    "pressable yike-marketplace-tile flex w-full items-center gap-4 p-4 text-left",
                  )}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy text-gold">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold text-navy">{card.label}</span>
                    <span className="block text-xs text-navy/60">{card.tagline}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-navy/35" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
