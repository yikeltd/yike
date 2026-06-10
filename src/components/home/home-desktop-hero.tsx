"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Headphones,
  Award,
  Shield,
} from "lucide-react";
import { BrowseListingsBlock } from "@/components/search/browse-listings-block";
import type { BrowseSearchPayload } from "@/components/search/browse-listings-block";
import { ListPropertyButton } from "@/components/auth/list-property-button";
import { HomeDesktopTrustedAgentsCard } from "@/components/home/home-desktop-trusted-agents-card";
import type { HeroTrustedAgentsConfig } from "@/lib/home/hero-trusted-agents";
import { cn } from "@/lib/utils";

const DESKTOP_HERO_IMAGE = "/images/hero/yike-city-hero.webp";

const TRUST_ITEMS = [
  {
    icon: Shield,
    title: "Verified & trusted",
    description: "Listings go through our trust process.",
  },
  {
    icon: ShieldCheck,
    title: "Smart search",
    description: "Better filters that save time.",
  },
  {
    icon: Headphones,
    title: "Expert support",
    description: "Real people. Fast responses.",
  },
  {
    icon: Award,
    title: "WhatsApp-first",
    description: "Contact agents the Nigerian way.",
  },
] as const;

type HomeDesktopHeroProps = {
  browseInitial: {
    dealKey: string;
    state: string;
    city: string;
    area: string;
    propertyType: string;
    budgetValue: string;
  };
  trustedAgents: HeroTrustedAgentsConfig;
  onSearch: (payload: BrowseSearchPayload) => void;
  className?: string;
};

export function HomeDesktopHero({
  browseInitial,
  trustedAgents,
  onSearch,
  className,
}: HomeDesktopHeroProps) {
  return (
    <section className={cn("full-bleed px-6 pb-2 pt-4 xl:px-8", className)}>
      <div className="mx-auto max-w-7xl">
        <div className="home-desktop-hero-panel relative min-h-[28rem] overflow-visible rounded-[2rem] shadow-[0_32px_80px_-24px_rgba(2,20,51,0.55)] xl:min-h-[30rem]">
          <div className="absolute inset-0 overflow-hidden rounded-[2rem]" aria-hidden>
            <div className="absolute inset-0 bg-navy" />
            <Image
              src={DESKTOP_HERO_IMAGE}
              alt=""
              fill
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
                Nigeria&apos;s Trusted Property Marketplace
              </span>

              <h1 className="mt-5 max-w-2xl font-serif text-4xl font-bold leading-[1.06] tracking-tight text-white xl:text-[3.35rem]">
                Find. Rent. Buy.
                <br />
                All on <span className="text-gold">Yike.</span>
              </h1>

              <p className="mt-4 max-w-lg text-base leading-relaxed text-white/80 xl:text-lg">
                Nigeria&apos;s property marketplace — rent, buy, land and shops.
                Browse free, contact agents on WhatsApp, email sign-in only.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="#home-desktop-search"
                  className="pressable group inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-gold px-6 text-sm font-bold text-navy shadow-[0_8px_28px_rgba(228,181,71,0.35)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Find a Property
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2.5}
                  />
                </Link>
                <ListPropertyButton className="pressable inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/24 bg-transparent px-6 text-sm font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/[0.06]">
                  List a Property
                </ListPropertyButton>
              </div>
            </div>

            <HomeDesktopTrustedAgentsCard config={trustedAgents} className="mt-1" />
          </div>

          <div
            id="home-desktop-search"
            className="absolute inset-x-6 bottom-0 translate-y-1/2 xl:inset-x-10"
          >
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
              onSearch={onSearch}
            />
          </div>
        </div>

        <ul className="home-desktop-trust-strip mx-auto mt-[7.25rem] grid max-w-5xl gap-4 px-4 pb-2 sm:grid-cols-2 xl:grid-cols-4">
          {TRUST_ITEMS.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/12 text-gold-dark">
                <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-bold text-foreground">{title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  {description}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
