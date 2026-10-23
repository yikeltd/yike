"use client";

import Link from "next/link";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";

export type MarketplaceVerticalSwitcherActive =
  | "property"
  | "vehicle"
  | "electronics";

/** Property / Vehicles / Electronics switcher for marketplace discovery. */
export function MarketplaceVerticalSwitcher({
  active,
}: {
  active: MarketplaceVerticalSwitcherActive;
}) {
  const vehiclesOn = isLaunchFeatureVisible("vehicle_marketplace");
  const electronicsOn = isLaunchFeatureVisible("electronics_marketplace");

  const linkClass = (on: boolean) =>
    on
      ? "rounded-full bg-navy px-3 py-1.5 text-white sm:px-4"
      : "rounded-full px-3 py-1.5 text-navy/60 sm:px-4";

  return (
    <div className="inline-flex max-w-full flex-wrap justify-center gap-0.5 rounded-full border border-navy/12 bg-white p-1 text-xs font-semibold sm:text-sm">
      <Link
        href="/search"
        className={linkClass(active === "property")}
      >
        Property
      </Link>
      {vehiclesOn ? (
        <Link href="/vehicles" className={linkClass(active === "vehicle")}>
          Vehicles
        </Link>
      ) : null}
      {electronicsOn ? (
        <Link href="/electronics" className={linkClass(active === "electronics")}>
          Electronics
        </Link>
      ) : null}
    </div>
  );
}
