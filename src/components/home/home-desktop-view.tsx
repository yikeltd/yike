"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, MapPin, ChevronDown, Menu, Heart } from "lucide-react";
import type { Property } from "@/types/database";
import { formatPrice, cn } from "@/lib/utils";
import { VEHICLE_MAKE_TYPES } from "@/lib/marketplace/vehicle-makes";
import { isTrustVerified } from "@/lib/hub-filters";
import { listingPath } from "@/lib/marketplace/listing-path";
import { ListingSaveButton } from "@/components/marketplace/listing-save-button";
import { HeaderDesktop } from "@/components/layout/header-desktop";

type Props = {
  featuredItems: Property[];
  trendingItems: Property[];
  recentItems: Property[];
  luxuryItems: Property[];
  nationwideItems: Property[];
};

const VEHICLE_MAKES = Object.keys(VEHICLE_MAKE_TYPES);

const VEHICLE_CHIPS = ["All", "Cars", "SUVs", "Trucks"];
const PROPERTY_CHIPS = ["All", "Houses", "Apartments", "Land", "Commercial"];

export function HomeDesktopView({
  featuredItems,
  trendingItems,
  recentItems,
  luxuryItems,
  nationwideItems,
}: Props) {
  const router = useRouter();
  const [category, setCategory] = useState<"vehicle" | "property">("vehicle");
  const [selectedChip, setSelectedChip] = useState("All");

  // Filters State
  const [state, setState] = useState("");
  const [city, setCity] = useState("Wamako");
  const [make, setMake] = useState("");
  const [budget, setBudget] = useState("");

  const chips = category === "vehicle" ? VEHICLE_CHIPS : PROPERTY_CHIPS;

  function handleSearch() {
    const params = new URLSearchParams();
    if (category === "vehicle") {
      if (make) params.set("make", make);
      if (selectedChip !== "All") params.set("category", selectedChip.toLowerCase());
      if (state) params.set("state", state);
      if (city) params.set("city", city);
      router.push(params.toString() ? `/vehicles?${params.toString()}` : "/vehicles");
    } else {
      if (selectedChip !== "All") params.set("type", selectedChip.toLowerCase());
      if (state) params.set("state", state);
      if (city) params.set("city", city);
      router.push(params.toString() ? `/search?${params.toString()}` : "/search");
    }
  }

  function renderDesktopSection(title: string, href: string, items: Property[]) {
    const displayItems = items.slice(0, 4);

    return (
      <section className="space-y-4 pt-6">
        <div className="flex items-center justify-between border-l-4 border-gold pl-3">
          <h2 className="text-xl font-black tracking-tight text-navy">{title}</h2>
          <Link
            href={href}
            className="text-xs font-bold text-gold-dark hover:underline flex items-center gap-1"
          >
            <span>View all</span>
            <span>→</span>
          </Link>
        </div>

        {/* EXACTLY 4 LISTING CARDS PER ROW ON DESKTOP */}
        <div className="grid grid-cols-4 gap-6">
          {displayItems.map((item) => {
            const price = formatPrice(
              Number(item.price),
              item.payment_period,
              item.listing_type
            );
            const verified = isTrustVerified(item);
            const photo = item.media_urls?.[0] || "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80&fit=crop";

            return (
              <div
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-3xl bg-white border border-slate-200/80 shadow-md transition-all hover:shadow-xl hover:-translate-y-1"
              >
                {/* Hero Image */}
                <Link href={listingPath(item)} className="relative aspect-[4/3] w-full overflow-hidden bg-navy">
                  <Image
                    src={photo}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                    <span className="rounded-md bg-gold px-2 py-0.5 text-[10px] font-black uppercase text-navy shadow-xs">
                      Feat
                    </span>
                    {verified && (
                      <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white shadow-xs flex items-center gap-0.5">
                        ✓ Verified
                      </span>
                    )}
                  </div>

                  {/* Wishlist Heart Icon Top Right */}
                  <div className="absolute top-3 right-3 z-10">
                    <ListingSaveButton
                      listingId={item.id}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-navy backdrop-blur-md shadow-md hover:scale-110 transition-transform"
                    />
                  </div>
                </Link>

                {/* Content Details Below Image */}
                <div className="p-4 space-y-1 bg-white">
                  <p className="text-lg font-black text-navy tracking-tight">{price}</p>
                  <h3 className="text-xs font-bold text-navy/80 line-clamp-1 group-hover:text-gold-dark transition-colors">
                    {item.title}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <div className="hidden lg:block min-h-screen bg-[#f8fafc] text-navy pb-16">
      {/* 1. DEEP NAVY UNIFIED DESKTOP HEADER */}
      <HeaderDesktop />

      {/* 2. RESTORED FULL-WIDTH DESKTOP HERO BANNER */}
      <section className="px-8 pt-6">
        <div className="mx-auto max-w-7xl">
          <div className="relative w-full aspect-[2.8/1] overflow-hidden rounded-[2.5rem] bg-navy shadow-2xl">
            {/* Large Hero Background Image */}
            <Image
              src="/images/hero.webp"
              alt="Yike Desktop Hero"
              fill
              priority
              className="object-cover object-center brightness-[0.7]"
            />

            {/* Inner Dark Floating Overlay Card */}
            <div className="absolute inset-x-8 bottom-8 z-10 space-y-4">
              {/* Category Segmented Switch: VEHICLES vs PROPERTIES */}
              <div className="inline-flex rounded-full border border-white/20 bg-[#031B4E]/90 p-1 backdrop-blur-md shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setCategory("vehicle");
                    setSelectedChip("All");
                  }}
                  className={cn(
                    "px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all",
                    category === "vehicle"
                      ? "bg-gold text-navy shadow-md"
                      : "text-white hover:text-gold"
                  )}
                >
                  VEHICLES
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCategory("property");
                    setSelectedChip("All");
                  }}
                  className={cn(
                    "px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all",
                    category === "property"
                      ? "bg-gold text-navy shadow-md"
                      : "text-white hover:text-gold"
                  )}
                >
                  PROPERTIES
                </button>
              </div>

              {/* Filter Panel Card */}
              <div className="rounded-3xl border border-white/20 bg-[#031B4E]/90 p-4 backdrop-blur-md shadow-2xl space-y-3">


                {/* Filter Controls Row */}
                <div className="grid grid-cols-5 gap-3 items-center">
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="rounded-2xl border border-white/20 bg-white p-3 text-xs font-bold text-navy shadow-xs focus:ring-2 focus:ring-gold"
                  >
                    <option value="">Any state</option>
                    <option value="Lagos">Lagos</option>
                    <option value="Abuja">Abuja (FCT)</option>
                    <option value="Rivers">Rivers</option>
                    <option value="Sokoto">Sokoto</option>
                  </select>

                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="rounded-2xl border border-white/20 bg-white p-3 text-xs font-bold text-navy shadow-xs focus:ring-2 focus:ring-gold"
                  >
                    <option value="Wamako">Wamako</option>
                    <option value="Lekki">Lekki</option>
                    <option value="Ikeja">Ikeja</option>
                    <option value="Maitama">Maitama</option>
                  </select>

                  {category === "vehicle" ? (
                    <select
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      className="rounded-2xl border border-white/20 bg-white p-3 text-xs font-bold text-navy shadow-xs focus:ring-2 focus:ring-gold"
                    >
                      <option value="">Any make</option>
                      {VEHICLE_MAKES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      className="rounded-2xl border border-white/20 bg-white p-3 text-xs font-bold text-navy shadow-xs focus:ring-2 focus:ring-gold"
                    >
                      <option value="">Any type</option>
                      <option value="House">House</option>
                      <option value="Apartment">Apartment</option>
                      <option value="Land">Land</option>
                    </select>
                  )}

                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="rounded-2xl border border-white/20 bg-white p-3 text-xs font-bold text-navy shadow-xs focus:ring-2 focus:ring-gold"
                  >
                    <option value="">Any budget</option>
                    <option value="5m">Under ₦5M</option>
                    <option value="20m">Under ₦20M</option>
                    <option value="50m">Under ₦50M</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleSearch}
                    className="pressable flex h-11 w-11 items-center justify-center rounded-2xl bg-gold text-navy shadow-md hover:bg-gold-light transition-all font-black"
                    aria-label="Search"
                  >
                    <Search className="h-5 w-5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. RESTORED DESKTOP LISTING SECTIONS (4 CARDS PER ROW) */}
      <div className="mx-auto max-w-7xl px-8 space-y-6">
        {renderDesktopSection("Featured", "/search?featured=1", featuredItems)}
        {renderDesktopSection("Trending", "/search?trending=1", trendingItems)}
        {renderDesktopSection("Recently Added", "/search", recentItems)}
        {renderDesktopSection("Premium Picks", "/search?premium=1", luxuryItems)}
        {renderDesktopSection("All Listings", "/search", nationwideItems)}
      </div>
    </div>
  );
}
