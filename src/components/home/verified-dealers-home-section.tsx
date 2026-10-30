"use client";

import {
  DealerDiscoveryRow,
} from "@/components/marketplace/experience";
import type { DiscoveryDealerCard } from "@/lib/home/discovery-from-pool";
import {
  VERIFIED_DEALERS_HOME_SUBTITLE,
  VERIFIED_DEALERS_HOME_TITLE,
  resolveVerifiedDealersForHome,
} from "@/lib/home/verified-dealers-section";

type Props = {
  liveDealers: DiscoveryDealerCard[];
  showingSampleListingsFixture?: boolean;
  showingDemoFixtures?: boolean;
  className?: string;
  /** Desktop grid vs mobile scroll — same component, responsive layout inside row. */
  variant?: "default" | "desktop";
};

export function VerifiedDealersHomeSection({
  liveDealers,
  showingSampleListingsFixture = false,
  showingDemoFixtures = false,
  className,
  variant = "default",
}: Props) {
  const dealers = resolveVerifiedDealersForHome({
    liveDealers,
    showingSampleListingsFixture,
    showingDemoFixtures,
  });

  return (
    <DealerDiscoveryRow
      dealers={dealers}
      title={VERIFIED_DEALERS_HOME_TITLE}
      subtitle={VERIFIED_DEALERS_HOME_SUBTITLE}
      className={className}
      layout={variant === "desktop" ? "desktop-grid" : "scroll"}
      data-testid="home-verified-dealers-section"
    />
  );
}
