"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { CATEGORY_CHIP_ASSETS } from "@/lib/home/category-chip-assets";
import { CategoryGatewayCard } from "@/components/marketplace/category-gateway-card";
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
 * Reuses CategoryGatewayCard (same language as seller choose).
 */
export function MarketplaceCategoryChips({
  className,
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
          <CategoryGatewayCard
            key={banner.id}
            label={banner.label}
            subtitle={banner.subtitle}
            imageSrc={banner.image.src}
            selected={selected}
            size="compact"
            priority
            role="tab"
            aria-selected={selected}
            onClick={() => select(banner.id, banner.hrefFallback)}
          />
        );
      })}
    </div>
  );
}
