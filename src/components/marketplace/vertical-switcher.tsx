"use client";

import Link from "next/link";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";

/** Vehicles / Property switcher for marketplace discovery surfaces (Vehicles primary). */
export function MarketplaceVerticalSwitcher({
  active,
}: {
  active: "property" | "vehicle";
}) {
  const vehiclesOn = isLaunchFeatureVisible("vehicle_marketplace");

  return (
    <div className="inline-flex rounded-full border border-navy/12 bg-white p-1 text-sm font-semibold">
      {vehiclesOn ? (
        <Link
          href="/vehicles"
          className={
            active === "vehicle"
              ? "rounded-full bg-navy px-4 py-1.5 text-white"
              : "rounded-full px-4 py-1.5 text-navy/60"
          }
        >
          Vehicles
        </Link>
      ) : null}
      <Link
        href="/search"
        className={
          active === "property"
            ? "rounded-full bg-navy px-4 py-1.5 text-white"
            : "rounded-full px-4 py-1.5 text-navy/60"
        }
      >
        Property
      </Link>
    </div>
  );
}
