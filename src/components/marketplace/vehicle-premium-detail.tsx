import Image from "next/image";
import Link from "next/link";
import {
  Car,
  CircleDot,
  Cog,
  Fuel,
  Gauge,
  MapPin,
  Palette,
  Settings2,
  ShieldCheck,
  BadgeCheck,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AdPlacement, Property } from "@/types/database";
import { vehicleCategoryLabel } from "@/lib/marketplace/vehicle-specs";
import { ContactButtons } from "@/components/property/contact-buttons";
import { ReportListingForm } from "@/components/property/report-form";
import { ShareButton } from "@/components/property/listing-share-menu";
import { ListingSaveButton } from "@/components/marketplace/listing-save-button";
import { VehicleDetailHero } from "@/components/marketplace/vehicle-detail-hero";
import { VehicleCard } from "@/components/marketplace/vehicle-card";
import { MarketplaceSafetyTipsLink } from "@/components/marketplace/safety-notice";
import { DetailPromotionZone } from "@/components/ads/detail-promotion-zone";
import { DetailRecentlyViewed } from "@/components/marketplace/detail-recently-viewed";
import type { ListingBadgeKind } from "@/lib/design/listing-badges";
import {
  TrustModule,
  CollapsibleSpecs,
  type TrustBadgeKind,
} from "@/components/marketplace/experience";
import { cn } from "@/lib/utils";

type AgentInfo = {
  id: string;
  full_name?: string | null;
  whatsapp?: string | null;
  phone?: string | null;
  account_type?: string | null;
  company_name?: string | null;
  avatar_url?: string | null;
  verification_status?: string | null;
  verified_badge?: boolean | null;
  is_verified_agent?: boolean | null;
  created_at?: string | null;
};

function conditionLabel(value?: string | null): string | null {
  if (!value) return null;
  const v = value.toLowerCase().replace(/_/g, " ");
  if (v.includes("foreign") || v === "tokunbo") return "Foreign used";
  if (v.includes("nigeria") || v === "local") return "Nigerian used";
  if (v.includes("new") || v === "brand new") return "Brand new";
  return value.replace(/_/g, " ");
}

function titleCase(value?: string | null): string | null {
  if (!value) return null;
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function QuickChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-navy/8 bg-navy/[0.03] px-2.5 py-1 text-[11px] font-semibold text-navy/70">
      {children}
    </span>
  );
}

export function VehiclePremiumDetail({
  vehicle,
  similar,
  priceLabel,
  shareUrl,
  location,
  verified,
  featuredActive,
  extraBadges,
  detailAd,
}: {
  vehicle: Property;
  similar: Property[];
  priceLabel: string;
  shareUrl: string;
  location: string;
  verified: boolean;
  featuredActive: boolean;
  extraBadges: ListingBadgeKind[];
  detailAd: AdPlacement | null;
}) {
  const agent = vehicle.agent as AgentInfo | undefined;
  const isDealer = agent?.account_type === "dealer";
  const sellerName = agent?.company_name || agent?.full_name || "Yike seller";
  const sellerVerified =
    Boolean(agent?.verified_badge) ||
    Boolean(agent?.is_verified_agent) ||
    agent?.verification_status === "approved" ||
    verified;

  const trustKinds: TrustBadgeKind[] = [];
  if (isDealer) trustKinds.push("verified_dealer");
  else if (sellerVerified) trustKinds.push("verified_seller");
  if (verified && !isDealer) trustKinds.push("verified_listing");
  trustKinds.push("media_protected");

  const quickChips = [
    vehicle.year ? String(vehicle.year) : null,
    titleCase(vehicle.fuel_type),
    titleCase(vehicle.transmission),
    vehicle.mileage != null
      ? `${Number(vehicle.mileage).toLocaleString()} km`
      : null,
    conditionLabel(vehicle.vehicle_condition),
    vehicle.exterior_color
      ? titleCase(vehicle.exterior_color)
      : null,
  ]
    .filter(Boolean)
    .slice(0, 6) as string[];

  /** Full specs exclude facts already shown as quick chips (one fact once). */
  const quickLabels = new Set(
    [
      vehicle.year != null ? "Year" : null,
      vehicle.transmission ? "Transmission" : null,
      vehicle.fuel_type ? "Fuel" : null,
      vehicle.mileage != null ? "Mileage" : null,
      conditionLabel(vehicle.vehicle_condition) ? "Condition" : null,
      vehicle.exterior_color ? "Exterior" : null,
    ].filter(Boolean) as string[],
  );

  const allSpecCards: Array<{ icon: LucideIcon; label: string; value: string }> =
    [
      vehicle.year != null
        ? { icon: Car, label: "Year", value: String(vehicle.year) }
        : null,
      vehicle.transmission
        ? {
            icon: Settings2,
            label: "Transmission",
            value: titleCase(vehicle.transmission)!,
          }
        : null,
      vehicle.fuel_type
        ? { icon: Fuel, label: "Fuel", value: titleCase(vehicle.fuel_type)! }
        : null,
      vehicle.mileage != null
        ? {
            icon: Gauge,
            label: "Mileage",
            value: `${Number(vehicle.mileage).toLocaleString()} km`,
          }
        : null,
      vehicle.engine
        ? { icon: Cog, label: "Engine", value: String(vehicle.engine) }
        : null,
      vehicle.drivetrain
        ? {
            icon: CircleDot,
            label: "Drive",
            value: titleCase(vehicle.drivetrain)!,
          }
        : null,
      vehicle.registration_status
        ? {
            icon: ShieldCheck,
            label: "Registration",
            value: titleCase(vehicle.registration_status)!,
          }
        : null,
      conditionLabel(vehicle.vehicle_condition)
        ? {
            icon: BadgeCheck,
            label: "Condition",
            value: conditionLabel(vehicle.vehicle_condition)!,
          }
        : null,
      vehicle.body_type
        ? { icon: Car, label: "Body Type", value: titleCase(vehicle.body_type)! }
        : null,
      vehicle.exterior_color
        ? {
            icon: Palette,
            label: "Exterior",
            value: titleCase(vehicle.exterior_color)!,
          }
        : null,
      vehicle.interior_color
        ? {
            icon: Palette,
            label: "Interior",
            value: titleCase(vehicle.interior_color)!,
          }
        : null,
      vehicle.make
        ? { icon: Car, label: "Make", value: String(vehicle.make) }
        : null,
      vehicle.model
        ? { icon: Car, label: "Model", value: String(vehicle.model) }
        : null,
      vehicle.trim
        ? { icon: Car, label: "Trim", value: String(vehicle.trim) }
        : null,
    ].filter(Boolean) as Array<{
      icon: LucideIcon;
      label: string;
      value: string;
    }>;

  const deepSpecCards = allSpecCards.filter((s) => !quickLabels.has(s.label));
  const specCardsForAccordion =
    deepSpecCards.length > 0 ? deepSpecCards : allSpecCards;

  const summaryCard = (
    <div className="rounded-[1.5rem] border border-navy/[0.07] bg-white/95 p-5 shadow-[0_20px_50px_-32px_rgba(3,27,78,0.5)] backdrop-blur-sm sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-navy/[0.05] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-navy/50">
          {vehicleCategoryLabel(vehicle.auto_category)}
        </span>
        {featuredActive ? (
          <span className="rounded-full bg-gold/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-navy">
            Featured
          </span>
        ) : null}
      </div>

      <p className="mt-5 text-[2.5rem] font-bold leading-none tracking-tight text-navy tabular-nums sm:text-[2.85rem]">
        {priceLabel}
      </p>
      <h1 className="mt-3 text-[1.25rem] font-bold leading-snug tracking-tight text-navy/95 sm:text-[1.45rem]">
        {vehicle.title}
      </h1>

      {location ? (
        <p className="mt-2.5 flex items-center gap-1.5 text-sm font-medium text-navy/50">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
          {location}
        </p>
      ) : null}

      <TrustModule kinds={trustKinds} className="mt-4" />

      {quickChips.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {quickChips.map((chip) => (
            <QuickChip key={chip}>{chip}</QuickChip>
          ))}
        </div>
      ) : null}

      <div className="mt-6 space-y-3 border-t border-navy/[0.06] pt-5">
        <div id="listing-primary-cta">
          {agent ? (
            <ContactButtons
              propertyId={vehicle.id}
              title={vehicle.title}
              area={vehicle.area || vehicle.city}
              city={vehicle.city}
              listingType={vehicle.listing_type || "sale"}
              propertyType={vehicle.auto_category}
              agentId={vehicle.agent_id}
              agentName={agent.full_name || "Seller"}
              price={Number(vehicle.price)}
              paymentPeriod={vehicle.payment_period || "total"}
              phone={agent.phone}
              whatsapp={agent.whatsapp}
            />
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ListingSaveButton
            listingId={vehicle.id}
            className="pressable inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-navy/10 bg-white text-sm font-semibold text-navy/80 transition hover:border-gold/40 hover:bg-gold/10"
          />
          <ShareButton
            title={vehicle.title}
            text={`${vehicle.title} on Yike`}
            url={shareUrl}
            listingId={vehicle.id}
            city={vehicle.city}
            listingType="sale"
            propertyType={vehicle.auto_category}
            variant="button"
          />
        </div>
        <details className="group">
          <summary className="cursor-pointer list-none text-center text-[11px] font-semibold text-navy/40 transition hover:text-navy/60 [&::-webkit-details-marker]:hidden">
            Report this listing
          </summary>
          <div className="mt-3 rounded-xl border border-navy/8 bg-navy/[0.02] p-3">
            <ReportListingForm propertyId={vehicle.id} />
          </div>
        </details>
      </div>
    </div>
  );

  return (
    <div className="bg-[linear-gradient(180deg,#e8ecf4_0%,#f4f6fa_22%,#f7f8fb_100%)]">
      <div className="mx-auto max-w-6xl pb-10 lg:px-6 lg:pb-14 lg:pt-6">
        <div className="flex items-center gap-2 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] lg:mb-4 lg:px-0 lg:pt-0">
          <Link
            href="/vehicles"
            className="pressable inline-flex h-9 items-center gap-1 rounded-full bg-white/90 px-3 text-xs font-bold text-navy shadow-float ring-1 ring-navy/8 backdrop-blur-sm lg:hidden"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Back
          </Link>
          <nav
            className="hidden text-sm text-navy/45 lg:block"
            aria-label="Breadcrumb"
          >
            <Link
              href="/vehicles"
              className="font-semibold text-navy/60 hover:text-navy"
            >
              Vehicles
            </Link>
            <span className="mx-1.5" aria-hidden>
              /
            </span>
            <span className="text-navy/80">
              {vehicleCategoryLabel(vehicle.auto_category)}
            </span>
          </nav>
        </div>

        <div className="grid gap-0 lg:grid-cols-12 lg:gap-8 lg:px-0 lg:items-start">
          <div className="lg:col-span-7">
            <VehicleDetailHero
              images={vehicle.media_urls ?? []}
              title={vehicle.title}
              badges={extraBadges}
              featured={featuredActive}
              verified={verified}
            />
          </div>
          <aside className="mt-4 px-3 lg:col-span-5 lg:mt-0 lg:px-0">
            <div className="lg:sticky lg:top-24">{summaryCard}</div>
          </aside>
        </div>

        <div className="mt-8 space-y-7 px-3 lg:mt-12 lg:space-y-10 lg:px-0">
          {agent ? (
            <section className="rounded-2xl border border-navy/[0.08] bg-white p-3.5 shadow-[0_10px_28px_-22px_rgba(3,27,78,0.35)] sm:p-4">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-navy/[0.06] ring-1 ring-navy/10 sm:h-14 sm:w-14 sm:rounded-2xl">
                  {agent.avatar_url ? (
                    <Image
                      src={agent.avatar_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm font-bold text-navy/45 sm:text-base">
                      {sellerName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-dark">
                    {isDealer ? "Dealer" : "Seller"}
                  </p>
                  <h2 className="truncate text-[15px] font-bold leading-snug text-navy sm:text-base">
                    {sellerName}
                  </h2>
                  <p className="mt-0.5 truncate text-[11px] text-navy/50">
                    {sellerVerified ? "Verified · " : null}
                    {agent.created_at
                      ? `On Yike since ${new Date(agent.created_at).toLocaleString("en-NG", {
                          month: "short",
                          year: "numeric",
                        })}`
                      : "Yike marketplace seller"}
                  </p>
                </div>
                <Link
                  href={`/agents/${agent.id}`}
                  className="pressable inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-navy px-3 text-xs font-bold text-white transition hover:bg-navy-light sm:h-10 sm:px-3.5 sm:text-sm"
                >
                  Showroom
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </section>
          ) : null}

          {vehicle.description ? (
            <section className="rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/[0.14] via-[#FFF8E8] to-white px-4 py-5 sm:px-6 sm:py-6">
              <div className="flex items-center gap-2">
                <span
                  className="h-5 w-1 shrink-0 rounded-full bg-gold"
                  aria-hidden
                />
                <h2 className="text-base font-bold tracking-tight text-navy sm:text-lg">
                  About this vehicle
                </h2>
              </div>
              <p className="mt-3 max-w-3xl whitespace-pre-wrap text-[15px] leading-7 text-navy/70 sm:leading-8">
                {vehicle.description}
              </p>
            </section>
          ) : null}

          <CollapsibleSpecs
            items={specCardsForAccordion}
            subtitle="Expand for the complete specification set"
          />

          {detailAd ? (
            <DetailPromotionZone placement="vehicle_detail" ad={detailAd} />
          ) : (
            <DetailRecentlyViewed excludeId={vehicle.id} />
          )}

          {similar.length > 0 ? (
            <section>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-navy">
                    Related vehicles
                  </h2>
                  <p className="mt-0.5 text-sm text-navy/45">
                    Similar options worth comparing
                  </p>
                </div>
                <Link
                  href="/vehicles"
                  className="shrink-0 text-sm font-bold text-gold-dark hover:underline"
                >
                  Browse all →
                </Link>
              </div>
              <ul
                className={cn(
                  "flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                  "sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4",
                )}
              >
                {similar.map((s) => (
                  <li
                    key={s.id}
                    className="min-w-[78%] snap-start sm:min-w-0"
                  >
                    <VehicleCard vehicle={s} variant="browse" />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="pb-2 text-center text-xs text-navy/40">
            <MarketplaceSafetyTipsLink />
          </p>
        </div>
      </div>
    </div>
  );
}
