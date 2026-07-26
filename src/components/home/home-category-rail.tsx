"use client";

import Link from "next/link";
import {
  Building2,
  Car,
  Briefcase,
  Wrench,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { cn } from "@/lib/utils";

type CategoryTone = "live" | "soon";

type CategoryItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: typeof Building2;
  tone: CategoryTone;
  badge?: string;
  prominence: "primary" | "secondary";
};

function buildCategories(): CategoryItem[] {
  const vehiclesOn = isLaunchFeatureVisible("vehicle_marketplace");

  const property: CategoryItem = {
    id: "property",
    label: "Property",
    description: "Homes, land & shops",
    href: "/search",
    icon: Building2,
    tone: "live",
    prominence: "primary",
  };

  const vehicles: CategoryItem = {
    id: "vehicles",
    label: "Vehicles",
    description: vehiclesOn ? "Cars, SUVs & more" : "Coming soon",
    href: vehiclesOn ? "/vehicles" : "#",
    icon: Car,
    tone: vehiclesOn ? "live" : "soon",
    badge: vehiclesOn ? undefined : "Soon",
    prominence: "primary",
  };

  return [
    ...(vehiclesOn ? [vehicles, property] : [property, vehicles]),
    {
      id: "jobs",
      label: "Jobs",
      description: "Careers at Yike",
      href: "/careers",
      icon: Briefcase,
      tone: "soon",
      badge: "Careers",
      prominence: "secondary",
    },
    {
      id: "services",
      label: "Services",
      description: "Home help — soon",
      href: "#",
      icon: Wrench,
      tone: "soon",
      badge: "Soon",
      prominence: "secondary",
    },
    {
      id: "electronics",
      label: "Electronics",
      description: "Phones & gadgets",
      href: "#",
      icon: Sparkles,
      tone: "soon",
      badge: "Soon",
      prominence: "secondary",
    },
  ];
}

/** Vehicles-first + Property peer entry points + future-ready category chips. */
export function HomeCategoryRail({
  variant = "default",
  className,
}: {
  variant?: "default" | "hero" | "compact";
  className?: string;
}) {
  const categories = buildCategories();
  const primary = categories.filter((c) => c.prominence === "primary");
  const secondary = categories.filter((c) => c.prominence === "secondary");
  const onHero = variant === "hero";
  const compact = variant === "compact";

  return (
    <nav
      aria-label="Marketplace categories"
      className={cn(
        onHero ? "mt-4" : compact ? "" : "mx-auto max-w-7xl px-3 lg:px-6 xl:px-8",
        className
      )}
    >
      {!onHero && !compact ? (
        <div className="mb-3 border-l-[3px] border-gold pl-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
            Shop by category
          </p>
          <h2 className="text-lg font-bold text-foreground lg:text-xl">
            Vehicles &amp; Property on Yike
          </h2>
        </div>
      ) : null}

      <ul
        className={cn(
          "grid gap-2",
          onHero || compact
            ? "grid-cols-2"
            : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4"
        )}
      >
        {primary.map((item) => {
          const Icon = item.icon;
          const disabled = item.tone === "soon" && item.href === "#";
          const cardClass = cn(
            "pressable group relative flex items-center gap-3 rounded-2xl border p-3 text-left transition-all",
            onHero
              ? "border-white/18 bg-white/10 backdrop-blur-sm hover:bg-white/16"
              : "border-navy/10 bg-white shadow-sm ring-1 ring-black/[0.03] hover:border-gold/40 hover:shadow-md",
            disabled && "cursor-default opacity-90"
          );

          const body = (
            <>
              <span
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                  onHero ? "bg-gold/20 text-gold" : "bg-navy/[0.06] text-navy"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-bold",
                    onHero ? "text-white" : "text-navy"
                  )}
                >
                  {item.label}
                  {item.badge ? (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                        onHero
                          ? "bg-white/15 text-white/80"
                          : "bg-navy/8 text-navy/55"
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    "mt-0.5 block text-xs",
                    onHero ? "text-white/70" : "text-muted"
                  )}
                >
                  {item.description}
                </span>
              </span>
              {!disabled ? (
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5",
                    onHero ? "text-gold" : "text-gold-dark"
                  )}
                  aria-hidden
                />
              ) : null}
            </>
          );

          return (
            <li key={item.id}>
              {disabled ? (
                <div className={cardClass} aria-disabled="true">
                  {body}
                </div>
              ) : (
                <Link href={item.href} className={cardClass}>
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      <ul
        className={cn(
          "mt-2 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          onHero && "px-0.5"
        )}
      >
        {secondary.map((item) => {
          const Icon = item.icon;
          const disabled = item.href === "#";
          const chipClass = cn(
            "pressable inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5",
            onHero
              ? "border-white/16 bg-white/8 text-white/85 hover:bg-white/14"
              : item.id === "jobs"
                ? "border-sky-200/80 bg-sky-50 text-sky-900/80 hover:border-sky-300"
                : item.id === "services"
                  ? "border-emerald-200/80 bg-emerald-50 text-emerald-900/80 hover:border-emerald-300"
                  : item.id === "electronics"
                    ? "border-violet-200/70 bg-violet-50 text-violet-900/80 hover:border-violet-300"
                    : "border-navy/10 bg-surface/80 text-navy/75 hover:border-gold/35 hover:text-navy",
            disabled && "cursor-default hover:translate-y-0"
          );

          const chipBody = (
            <>
              <Icon className="h-3.5 w-3.5 opacity-80" strokeWidth={2.25} aria-hidden />
              {item.label}
              {item.badge ? (
                <span className="text-[9px] font-bold uppercase tracking-wide opacity-70">
                  {item.badge}
                </span>
              ) : null}
            </>
          );

          return (
            <li key={item.id}>
              {disabled ? (
                <span className={chipClass} aria-disabled="true">
                  {chipBody}
                </span>
              ) : (
                <Link href={item.href} className={chipClass}>
                  {chipBody}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
