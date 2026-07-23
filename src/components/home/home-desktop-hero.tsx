"use client";

import Image from "next/image";
import {
  ArrowRight,
  ShieldCheck,
  Car,
  Home,
} from "lucide-react";
import { BrowseListingsBlock } from "@/components/search/browse-listings-block";
import type { BrowseSearchPayload } from "@/components/search/browse-listings-block";
import { HomeDesktopTrustedAgentsCard } from "@/components/home/home-desktop-trusted-agents-card";
import { HomeDesktopVehicleSearch } from "@/components/home/home-desktop-vehicle-search";
import { MarketplaceCategoryToggle } from "@/components/home/marketplace-category-toggle";
import type { HeroTrustedAgentsConfig } from "@/lib/home/hero-trusted-agents";
import type { HomeMarketplaceCategory } from "@/lib/home/marketplace-category";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { cn } from "@/lib/utils";

const DESKTOP_HERO_IMAGE = "/images/hero/yike-city-hero.webp";

type HomeDesktopHeroProps = {
  category: HomeMarketplaceCategory;
  onCategoryChange: (category: HomeMarketplaceCategory) => void;
  browseInitial: {
    dealKey: string;
    state: string;
    city: string;
    area: string;
    propertyType: string;
    budgetValue: string;
  };
  trustedAgents: HeroTrustedAgentsConfig;
  onPropertySearch: (payload: BrowseSearchPayload) => void;
  onVehicleSearch: (payload: BrowseSearchPayload) => void;
  className?: string;
};

function scrollToDesktopSearch() {
  document
    .getElementById("home-desktop-search")
    ?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function HomeDesktopHero({
  category,
  onCategoryChange,
  browseInitial,
  trustedAgents,
  onPropertySearch,
  onVehicleSearch,
  className,
}: HomeDesktopHeroProps) {
  const vehiclesOn = isLaunchFeatureVisible("vehicle_marketplace");
  const isVehicle = vehiclesOn && category === "vehicle";

  function goFindProperties() {
    if (category !== "property") onCategoryChange("property");
    requestAnimationFrame(scrollToDesktopSearch);
  }

  function goBrowseVehicles() {
    if (category !== "vehicle") onCategoryChange("vehicle");
    requestAnimationFrame(scrollToDesktopSearch);
  }

  return (
    <section
      className={cn("full-bleed hidden px-6 pb-2 pt-4 lg:block xl:px-8", className)}
      aria-label="Desktop marketplace hero"
    >
      <div className="mx-auto max-w-7xl">
        <div className="home-desktop-hero-panel relative min-h-[28rem] overflow-visible rounded-[2rem] shadow-[0_32px_80px_-24px_rgba(2,20,51,0.55)] xl:min-h-[30rem]">
          <div className="absolute inset-0 overflow-hidden rounded-[2rem]" aria-hidden>
            <div className="absolute inset-0 bg-navy" />
            <Image
              src={DESKTOP_HERO_IMAGE}
              alt=""
              fill
              priority
              className="object-cover object-center"
              sizes="(min-width: 1280px) 1280px, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#021433]/88 via-[#031B4E]/45 to-[#031B4E]/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#021433]/55 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_88%_38%,rgba(228,181,71,0.1),transparent_65%)]" />
          </div>

          <div className="relative flex items-start justify-between gap-6 px-8 pb-36 pt-10 xl:gap-10 xl:px-12 xl:pb-40 xl:pt-12">
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                Nigeria&apos;s Trusted Marketplace
              </span>

              <h1 className="mt-5 max-w-2xl font-serif text-4xl font-bold leading-[1.08] tracking-tight text-white xl:mt-6 xl:text-[3.35rem] xl:leading-[1.06]">
                Find. Rent. Buy. Drive.
                <br />
                Everything on <span className="text-gold">Yike.</span>
              </h1>

              <p className="mt-4 max-w-lg text-base text-white/75 xl:mt-5 xl:text-lg">
                Search verified property and vehicles across Nigeria.
              </p>

              {vehiclesOn ? (
                <div className="mt-7 max-w-sm">
                  <MarketplaceCategoryToggle
                    category={category}
                    onChange={onCategoryChange}
                    tone="onDark"
                  />
                </div>
              ) : null}

              <div className={cn(vehiclesOn ? "mt-5" : "mt-7")}>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={goFindProperties}
                    className={cn(
                      "pressable group inline-flex min-h-[48px] items-center gap-2 rounded-2xl px-6 text-sm font-bold transition-all",
                      !isVehicle
                        ? "bg-gold text-navy shadow-[0_8px_28px_rgba(228,181,71,0.35)] hover:scale-[1.02] active:scale-[0.98]"
                        : "border border-white/24 bg-white/10 font-semibold text-white backdrop-blur-sm hover:border-white/40 hover:bg-white/[0.14]",
                    )}
                  >
                    <Home className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                    Find Properties
                    {!isVehicle ? (
                      <ArrowRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        strokeWidth={2.5}
                      />
                    ) : null}
                  </button>
                  {vehiclesOn ? (
                    <button
                      type="button"
                      onClick={goBrowseVehicles}
                      className={cn(
                        "pressable group inline-flex min-h-[48px] items-center gap-2 rounded-2xl px-6 text-sm transition-all",
                        isVehicle
                          ? "bg-gold font-bold text-navy shadow-[0_8px_28px_rgba(228,181,71,0.35)] hover:scale-[1.02] active:scale-[0.98]"
                          : "border border-white/24 bg-white/10 font-semibold text-white backdrop-blur-sm hover:border-white/40 hover:bg-white/[0.14]",
                      )}
                    >
                      <Car className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                      Browse Vehicles
                      {isVehicle ? (
                        <ArrowRight
                          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                          strokeWidth={2.5}
                        />
                      ) : null}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <HomeDesktopTrustedAgentsCard config={trustedAgents} className="mt-1" />
          </div>

          <div
            id="home-desktop-search"
            className="absolute inset-x-6 bottom-0 translate-y-1/2 xl:inset-x-10"
          >
            <div
              key={isVehicle ? "vehicle-panel" : "property-panel"}
              className="animate-fade-up"
            >
              {isVehicle ? (
                <HomeDesktopVehicleSearch
                  key={`vehicle-${browseInitial.state}-${browseInitial.city}`}
                  initial={{
                    state: browseInitial.state,
                    city: browseInitial.city,
                    budgetValue: browseInitial.budgetValue,
                  }}
                  onSearch={onVehicleSearch}
                />
              ) : (
                <BrowseListingsBlock
                  key={
                    "desktop-" +
                    browseInitial.dealKey +
                    browseInitial.city +
                    browseInitial.area +
                    browseInitial.propertyType +
                    browseInitial.budgetValue
                  }
                  variant="home-desktop-panel"
                  initial={browseInitial}
                  searchButtonLabel="Search Properties"
                  onSearch={onPropertySearch}
                />
              )}
            </div>
          </div>
        </div>

        {/* Spacer for floating search panel overhang */}
        <div className="h-[6.75rem]" aria-hidden />
      </div>
    </section>
  );
}
