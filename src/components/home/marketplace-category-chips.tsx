"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { CATEGORY_CHIP_ASSETS } from "@/lib/home/category-chip-assets";
import {
  homeCategoryQueryValue,
  parseHomeCategory,
  type HomeMarketplaceCategory,
} from "@/lib/home/marketplace-category";
import { trackEvent } from "@/lib/analytics";

type BannerDef = {
  id: HomeMarketplaceCategory;
  label: string;
  subtitle: string;
  hrefFallback: string;
  image: (typeof CATEGORY_CHIP_ASSETS)[keyof typeof CATEGORY_CHIP_ASSETS];
};

const BANNERS: BannerDef[] = [
  {
    id: "vehicle",
    label: "Vehicles",
    subtitle: "Cars · SUVs · Trucks",
    hrefFallback: "/vehicles",
    image: CATEGORY_CHIP_ASSETS.vehicle,
  },
  {
    id: "property",
    label: "Properties",
    subtitle: "Homes · Land · Commercial",
    hrefFallback: "/search",
    image: CATEGORY_CHIP_ASSETS.property,
  },
];

/**
 * Premium category banners — image-first navigation covers.
 * Not listing cards. Compact (~80px), soft gold active accent.
 */
export function MarketplaceCategoryChips({
  className,
  /** When true, switch home `?category=` instead of leaving `/`. */
  homeMode = true,
}: {
  className?: string;
  homeMode?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const vehiclesOn = isLaunchFeatureVisible("vehicle_marketplace");

  const active: HomeMarketplaceCategory =
    pathname === "/"
      ? parseHomeCategory(searchParams.get("category"))
      : pathname.startsWith("/vehicles")
        ? "vehicle"
        : "property";

  const visible = BANNERS.filter((b) => b.id !== "vehicle" || vehiclesOn);

  function select(next: HomeMarketplaceCategory, fallbackHref: string) {
    trackEvent("search", {
      placement: "home_category_chip",
      listing_type: next,
    });

    if (homeMode && pathname === "/") {
      if (!vehiclesOn && next === "vehicle") return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("category", homeCategoryQueryValue(next));
      if (next === "vehicle") {
        ["type", "hub", "property_type", "min", "max", "area"].forEach((k) =>
          params.delete(k),
        );
      }
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
      return;
    }

    startTransition(() => {
      router.push(fallbackHref);
    });
  }

  if (visible.length === 0) return null;

  return (
    <div
      role="tablist"
      aria-label="Marketplace category"
      className={cn("grid grid-cols-2 gap-2.5", className)}
    >
      {visible.map((banner) => {
        const selected = active === banner.id;
        return (
          <button
            key={banner.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => select(banner.id, banner.hrefFallback)}
            className={cn(
              "pressable group relative h-[80px] overflow-hidden rounded-2xl text-left transition-all duration-200",
              "shadow-[0_4px_18px_rgba(3,27,78,0.1)]",
              selected
                ? "ring-2 ring-gold/65 shadow-[0_6px_20px_rgba(228,181,71,0.22)]"
                : "ring-1 ring-navy/[0.06] hover:ring-navy/12",
            )}
          >
            <Image
              src={banner.image.src}
              alt=""
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(max-width: 480px) 50vw, 200px"
              priority
            />
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/35 to-navy/10"
            />
            <span className="absolute inset-x-0 bottom-0 px-3 pb-2.5 pt-6">
              <span className="block text-[15px] font-bold leading-tight tracking-tight text-white">
                {banner.label}
              </span>
              <span className="mt-0.5 block text-[11px] font-medium leading-tight text-white/70">
                {banner.subtitle}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
