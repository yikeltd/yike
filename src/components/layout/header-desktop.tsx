"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { brand } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";
import { AuthHeaderAccount } from "@/components/auth/auth-header-account";
import { ListPropertyButton } from "@/components/auth/list-property-button";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";

/** Marketplace nav — Sell lives as CTA (right), not in this list. */
const marketplaceNav = [
  { href: "/buy", label: "Buy" },
  { href: "/rent", label: "Rent" },
  { href: "/vehicles", label: "Vehicles", vehiclesOnly: true },
  { href: "/land", label: "Land" },
  { href: "/safety", label: "Safety" },
] as const;

export function HeaderDesktop({ className }: { className?: string }) {
  const pathname = usePathname();
  const vehiclesOn = isLaunchFeatureVisible("vehicle_marketplace");

  return (
    <header
      className={cn(
        "sticky top-0 z-50 hidden border-b border-surface/80 bg-white/95 backdrop-blur-md lg:block",
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-6 xl:gap-4 xl:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image
            src={brand.logoSm}
            alt="Yike"
            width={40}
            height={40}
            className="rounded-lg"
            priority
          />
          <span className="text-xl font-bold tracking-tight text-foreground">
            {brand.name}
          </span>
        </Link>

        <nav className="flex items-center gap-5 xl:gap-6" aria-label="Primary">
          {marketplaceNav.map((l) => {
            if ("vehiclesOnly" in l && l.vehiclesOnly && !vehiclesOn) {
              return null;
            }
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "text-sm transition-colors hover:text-gold-dark",
                  pathname === l.href || pathname.startsWith(`${l.href}/`)
                    ? "font-semibold text-navy"
                    : "font-medium text-muted hover:text-foreground",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <AuthHeaderAccount variant="desktop" />
          <ListPropertyButton className="pressable inline-flex min-h-[40px] items-center justify-center rounded-xl bg-gold px-4 text-sm font-bold uppercase tracking-wide text-navy shadow-sm transition-transform hover:brightness-105 active:scale-[0.98]">
            Sell
          </ListPropertyButton>
        </div>
      </div>
    </header>
  );
}
