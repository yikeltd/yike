/**
 * Local UI-only demo inventory for founder visual review.
 *
 * - Never writes to Supabase
 * - Only activates in non-production when live rails are empty
 * - Titles prefixed with [DEMO]; ids start with `demo-` (see isDemoProperty)
 * - Shapes mirror scripts/seed-demo-marketplace.ts
 */

import type { Profile, Property } from "@/types/database";
import { isProductionEnv } from "@/lib/env";
import { isBoostedActive, isFeaturedActive } from "@/lib/agent-tiers";

const DEMO_PREFIX = "[DEMO]";
const SEED_NAMESPACE = "yike-demo-marketplace-v1";

const unsplash = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?w=1200&q=80&auto=format&fit=crop&crop=entropy`;

const PROPERTY_PHOTOS = [
  unsplash("photo-1560448204-e02f11c3d0e2"),
  unsplash("photo-1522708323590-d24dbb6b0267"),
  unsplash("photo-1600596542815-ffad4c1539a9"),
  unsplash("photo-1502672260266-1c1ef2d93688"),
  unsplash("photo-1600585154340-be6161a56a0c"),
  unsplash("photo-1605276374101-de9d87824847"),
  unsplash("photo-1600607687939-ce8a6c25118c"),
  unsplash("photo-1600566753190-17f0baa5a365"),
  unsplash("photo-1570129477492-45c003edd2be"),
  unsplash("photo-1564013799919-ab600027ffc6"),
];

const VEHICLE_PHOTOS = [
  unsplash("photo-1492144534655-ae79c964c9d7"),
  unsplash("photo-1503376780353-7e6692767b70"),
  unsplash("photo-1552519507-da3b142c6e3d"),
  unsplash("photo-1549317661-bd32c8ce0db2"),
  unsplash("photo-1519641471654-76ce0107ad1b"),
  unsplash("photo-1606664515524-ed2f786a0bd6"),
  unsplash("photo-1617814076367-b759c7d7e738"),
  unsplash("photo-1618843479313-40f8afb4b4d8"),
  unsplash("photo-1558981806-ec527fa84c39"),
  unsplash("photo-1601584115197-04ecc0da31d7"),
];

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

function withDemoTitle(title: string): string {
  return title.startsWith(DEMO_PREFIX) ? title : `${DEMO_PREFIX} ${title}`;
}

function demoAgent(
  partial: Pick<Profile, "id" | "full_name" | "phone" | "agent_type"> &
    Partial<Profile>,
): Profile {
  return {
    username: null,
    email: null,
    phone_verified: true,
    email_verified: true,
    whatsapp: partial.phone,
    avatar_url: null,
    role: "agent_verified",
    verification_status: partial.verification_status ?? "approved",
    verified_badge: partial.verified_badge ?? true,
    listing_limit: null,
    ranking_score: 100,
    is_banned: false,
    plan: "free",
    plan_expires_at: null,
    trust_score: partial.trust_score ?? 90,
    is_verified_agent: partial.is_verified_agent ?? true,
    created_at: "2026-01-01",
    ...partial,
  };
}

const AGENTS = [
  demoAgent({
    id: "demo-agent-private",
    full_name: "Demo Private Seller",
    phone: "08031110001",
    agent_type: "independent",
    verification_status: "not_started",
    verified_badge: false,
    is_verified_agent: false,
    trust_score: 72,
  }),
  demoAgent({
    id: "demo-agent-verified",
    full_name: "Demo Verified Seller",
    phone: "08031110002",
    agent_type: "independent",
    trust_score: 96,
  }),
  demoAgent({
    id: "demo-agent-dealer",
    full_name: "Demo Auto Dealer NG",
    phone: "08031110003",
    agent_type: "agency",
    trust_score: 94,
  }),
  demoAgent({
    id: "demo-agent-agency",
    full_name: "Demo Homes Agency",
    phone: "08031110004",
    agent_type: "agency",
    trust_score: 98,
  }),
];

type PropSeed = {
  id: string;
  agent: number;
  title: string;
  description: string;
  listing_type: Property["listing_type"];
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  price: number;
  payment_period: Property["payment_period"];
  state: string;
  city: string;
  area: string;
  landmark: string;
  boosted: boolean;
  photos: string[];
  daysAgo: number;
};

type VehSeed = {
  id: string;
  agent: number;
  title: string;
  description: string;
  price: number;
  state: string;
  city: string;
  area: string;
  auto_category: string;
  make: string;
  model: string;
  year: number;
  transmission: string;
  fuel_type: string;
  mileage: number;
  vehicle_condition: string;
  boosted: boolean;
  photos: string[];
  daysAgo: number;
};

const PROPERTY_SEEDS: PropSeed[] = [
  {
    id: "demo-mp-prop-01",
    agent: 3,
    title: "Serviced 3-bed apartment — Independence Layout",
    description:
      "Bright 3-bedroom apartment in Independence Layout with standby generator, borehole, and gated security.",
    listing_type: "rent",
    property_type: "flat_3",
    bedrooms: 3,
    bathrooms: 3,
    price: 2_400_000,
    payment_period: "yearly",
    state: "Enugu",
    city: "Enugu",
    area: "Independence Layout",
    landmark: "Close to Shoprite Polo",
    boosted: true,
    photos: PROPERTY_PHOTOS.slice(0, 4),
    daysAgo: 1,
  },
  {
    id: "demo-mp-prop-02",
    agent: 0,
    title: "Budget mini flat — Osisioma Aba",
    description:
      "Clean mini flat in Osisioma with prepaid meter and shared compound parking.",
    listing_type: "rent",
    property_type: "mini_flat",
    bedrooms: 1,
    bathrooms: 1,
    price: 450_000,
    payment_period: "yearly",
    state: "Abia",
    city: "Aba",
    area: "Osisioma",
    landmark: "Near Ariaria axis",
    boosted: false,
    photos: PROPERTY_PHOTOS.slice(1, 4),
    daysAgo: 2,
  },
  {
    id: "demo-mp-prop-yola-01",
    agent: 1,
    title: "3-bed bungalow — Jimeta Yola",
    description:
      "Family bungalow in Jimeta with borehole, tiled floors, and fenced compound.",
    listing_type: "rent",
    property_type: "bungalow",
    bedrooms: 3,
    bathrooms: 2,
    price: 900_000,
    payment_period: "yearly",
    state: "Adamawa",
    city: "Yola",
    area: "Jimeta",
    landmark: "Near Modern Market",
    boosted: true,
    photos: PROPERTY_PHOTOS.slice(2, 5),
    daysAgo: 1,
  },
  {
    id: "demo-mp-prop-yola-02",
    agent: 0,
    title: "Self contain — Dougirei Yola",
    description: "Neat self contain close to campus road. Prepaid meter.",
    listing_type: "rent",
    property_type: "self_contain",
    bedrooms: 1,
    bathrooms: 1,
    price: 280_000,
    payment_period: "yearly",
    state: "Adamawa",
    city: "Yola",
    area: "Dougirei",
    landmark: "Near ATBU axis",
    boosted: false,
    photos: PROPERTY_PHOTOS.slice(3, 5),
    daysAgo: 3,
  },
  {
    id: "demo-mp-prop-03",
    agent: 1,
    title: "4-bed detached duplex — World Bank Umuahia",
    description:
      "Family detached duplex with spacious compound, BQ, and tiled floors.",
    listing_type: "sale",
    property_type: "detached_duplex",
    bedrooms: 4,
    bathrooms: 4,
    price: 48_000_000,
    payment_period: "total",
    state: "Abia",
    city: "Umuahia",
    area: "World Bank",
    landmark: "Near government layout gate",
    boosted: true,
    photos: PROPERTY_PHOTOS.slice(2, 6),
    daysAgo: 3,
  },
  {
    id: "demo-mp-prop-04",
    agent: 3,
    title: "Terrace duplex for rent — New Owerri",
    description:
      "Modern terrace duplex in New Owerri with fitted kitchen and estate security.",
    listing_type: "rent",
    property_type: "terrace_duplex",
    bedrooms: 4,
    bathrooms: 4,
    price: 3_200_000,
    payment_period: "yearly",
    state: "Imo",
    city: "Owerri",
    area: "New Owerri",
    landmark: "Close to Imo State Secretariat",
    boosted: false,
    photos: PROPERTY_PHOTOS.slice(3, 7),
    daysAgo: 4,
  },
  {
    id: "demo-mp-prop-05",
    agent: 1,
    title: "3-bed bungalow — GRA Port Harcourt",
    description:
      "Well-kept bungalow in PH GRA with large sitting room and enclosed parking.",
    listing_type: "rent",
    property_type: "bungalow",
    bedrooms: 3,
    bathrooms: 3,
    price: 4_500_000,
    payment_period: "yearly",
    state: "Rivers",
    city: "Port Harcourt",
    area: "GRA",
    landmark: "Near Hotel Presidential",
    boosted: true,
    photos: PROPERTY_PHOTOS.slice(4, 8),
    daysAgo: 5,
  },
  {
    id: "demo-mp-prop-06",
    agent: 3,
    title: "Corner shop unit — Wuse II Abuja",
    description:
      "Ground-floor corner shop with street frontage and customer parking bay.",
    listing_type: "rent",
    property_type: "shop",
    bedrooms: 0,
    bathrooms: 1,
    price: 6_000_000,
    payment_period: "yearly",
    state: "FCT",
    city: "Abuja",
    area: "Wuse II",
    landmark: "Near Wuse Market",
    boosted: false,
    photos: PROPERTY_PHOTOS.slice(5, 8),
    daysAgo: 6,
  },
  {
    id: "demo-mp-prop-07",
    agent: 0,
    title: "Furnished office suite — Ikeja Lagos",
    description:
      "Ready-to-use office suite in Ikeja with partitioned rooms and estate parking.",
    listing_type: "rent",
    property_type: "office",
    bedrooms: 0,
    bathrooms: 2,
    price: 5_500_000,
    payment_period: "yearly",
    state: "Lagos",
    city: "Lagos",
    area: "Ikeja",
    landmark: "Near Computer Village",
    boosted: false,
    photos: PROPERTY_PHOTOS.slice(6, 9),
    daysAgo: 7,
  },
  {
    id: "demo-mp-prop-08",
    agent: 1,
    title: "5-bed duplex sale — GRA Benin City",
    description:
      "Spacious duplex in Benin GRA with dual living rooms, BQ, and ample parking.",
    listing_type: "sale",
    property_type: "duplex",
    bedrooms: 5,
    bathrooms: 5,
    price: 65_000_000,
    payment_period: "total",
    state: "Edo",
    city: "Benin City",
    area: "GRA",
    landmark: "Near Ring Road",
    boosted: false,
    photos: PROPERTY_PHOTOS.slice(0, 5),
    daysAgo: 8,
  },
];

const VEHICLE_SEEDS: VehSeed[] = [
  {
    id: "demo-mp-veh-01",
    agent: 2,
    title: "Toyota Camry 2018 — low mileage sedan",
    description:
      "Foreign-used Camry with clean interior, chilled AC, and service history.",
    price: 14_800_000,
    state: "Lagos",
    city: "Lagos",
    area: "Ikeja",
    auto_category: "car",
    make: "Toyota",
    model: "Camry",
    year: 2018,
    transmission: "automatic",
    fuel_type: "petrol",
    mileage: 68_400,
    vehicle_condition: "foreign_used",
    boosted: true,
    photos: VEHICLE_PHOTOS.slice(0, 4),
    daysAgo: 1,
  },
  {
    id: "demo-mp-veh-02",
    agent: 2,
    title: "Honda CR-V 2019 — family SUV",
    description:
      "Spacious CR-V with panoramic view and reverse camera. Perfect Abuja family SUV.",
    price: 18_500_000,
    state: "FCT",
    city: "Abuja",
    area: "Wuse",
    auto_category: "suv",
    make: "Honda",
    model: "CR-V",
    year: 2019,
    transmission: "automatic",
    fuel_type: "petrol",
    mileage: 54_200,
    vehicle_condition: "foreign_used",
    boosted: true,
    photos: VEHICLE_PHOTOS.slice(1, 5),
    daysAgo: 2,
  },
  {
    id: "demo-mp-veh-03",
    agent: 1,
    title: "Lexus RX 350 2017 — premium SUV",
    description:
      "Quiet Lexus RX with leather seats. Dealer-inspected; Port Harcourt viewing.",
    price: 22_900_000,
    state: "Rivers",
    city: "Port Harcourt",
    area: "GRA",
    auto_category: "suv",
    make: "Lexus",
    model: "RX 350",
    year: 2017,
    transmission: "automatic",
    fuel_type: "petrol",
    mileage: 79_800,
    vehicle_condition: "foreign_used",
    boosted: true,
    photos: VEHICLE_PHOTOS.slice(2, 6),
    daysAgo: 3,
  },
  {
    id: "demo-mp-veh-04",
    agent: 2,
    title: "Mercedes-Benz C300 2016 — executive sedan",
    description:
      "Sharp C-Class with panoramic roof and AMG styling pack.",
    price: 16_200_000,
    state: "Enugu",
    city: "Enugu",
    area: "New Haven",
    auto_category: "car",
    make: "Mercedes-Benz",
    model: "C300",
    year: 2016,
    transmission: "automatic",
    fuel_type: "petrol",
    mileage: 91_000,
    vehicle_condition: "nigerian_used",
    boosted: false,
    photos: VEHICLE_PHOTOS.slice(3, 6),
    daysAgo: 4,
  },
  {
    id: "demo-mp-veh-05",
    agent: 0,
    title: "Hyundai Elantra 2020 — efficient sedan",
    description:
      "Fuel-efficient Elantra with touchscreen and reverse sensors.",
    price: 9_750_000,
    state: "Imo",
    city: "Owerri",
    area: "World Bank",
    auto_category: "car",
    make: "Hyundai",
    model: "Elantra",
    year: 2020,
    transmission: "automatic",
    fuel_type: "petrol",
    mileage: 41_500,
    vehicle_condition: "nigerian_used",
    boosted: false,
    photos: VEHICLE_PHOTOS.slice(4, 7),
    daysAgo: 5,
  },
  {
    id: "demo-mp-veh-06",
    agent: 2,
    title: "Kia Sportage 2018 — compact SUV",
    description: "Compact Sportage with panoramic roof and diesel economy.",
    price: 12_400_000,
    state: "Akwa Ibom",
    city: "Uyo",
    area: "Shelter Afrique",
    auto_category: "suv",
    make: "Kia",
    model: "Sportage",
    year: 2018,
    transmission: "automatic",
    fuel_type: "diesel",
    mileage: 72_300,
    vehicle_condition: "foreign_used",
    boosted: false,
    photos: VEHICLE_PHOTOS.slice(5, 8),
    daysAgo: 6,
  },
  {
    id: "demo-mp-veh-07",
    agent: 2,
    title: "Ford Ranger 2019 — double cab pickup",
    description: "Work-ready Ranger with 4WD and strong towing capacity.",
    price: 19_800_000,
    state: "Delta",
    city: "Asaba",
    area: "Okpanam",
    auto_category: "truck",
    make: "Ford",
    model: "Ranger",
    year: 2019,
    transmission: "automatic",
    fuel_type: "diesel",
    mileage: 86_100,
    vehicle_condition: "nigerian_used",
    boosted: false,
    photos: VEHICLE_PHOTOS.slice(9, 10).concat(VEHICLE_PHOTOS.slice(0, 2)),
    daysAgo: 7,
  },
  {
    id: "demo-mp-veh-08",
    agent: 1,
    title: "Nissan Urvan 2015 — 15-seater bus",
    description: "High-roof Urvan for staff shuttle or small transport business.",
    price: 8_900_000,
    state: "Abia",
    city: "Aba",
    area: "Aba North",
    auto_category: "van",
    make: "Nissan",
    model: "Urvan",
    year: 2015,
    transmission: "manual",
    fuel_type: "petrol",
    mileage: 148_000,
    vehicle_condition: "nigerian_used",
    boosted: false,
    photos: VEHICLE_PHOTOS.slice(6, 9),
    daysAgo: 8,
  },
];

function baseListingFields(opts: {
  id: string;
  agent: Profile;
  title: string;
  description: string;
  price: number;
  state: string;
  city: string;
  area: string;
  landmark?: string;
  media_urls: string[];
  boosted: boolean;
  daysAgo: number;
}): Pick<
  Property,
  | "id"
  | "agent_id"
  | "slug"
  | "slug_locked"
  | "seo_title"
  | "seo_description"
  | "title"
  | "description"
  | "price"
  | "state"
  | "city"
  | "area"
  | "address_hint"
  | "landmark"
  | "media_urls"
  | "video_url"
  | "status"
  | "is_featured"
  | "featured_until"
  | "is_boosted"
  | "boosted_until"
  | "boost_score"
  | "sponsored_status"
  | "is_verified_listing"
  | "views_count"
  | "contact_clicks"
  | "expires_at"
  | "created_at"
  | "updated_at"
  | "attributes"
  | "agent"
> {
  const boostUntil = opts.boosted ? daysFromNow(21) : null;
  return {
    id: opts.id,
    agent_id: opts.agent.id,
    slug: null,
    slug_locked: false,
    seo_title: null,
    seo_description: null,
    title: withDemoTitle(opts.title),
    description: opts.description,
    price: opts.price,
    state: opts.state,
    city: opts.city,
    area: opts.area,
    address_hint: null,
    landmark: opts.landmark ?? null,
    media_urls: opts.media_urls,
    video_url: null,
    status: "approved",
    is_featured: opts.boosted,
    featured_until: boostUntil,
    is_boosted: opts.boosted,
    boosted_until: boostUntil,
    boost_score: opts.boosted ? 50 : 0,
    sponsored_status: opts.boosted ? "boosted" : "none",
    is_verified_listing: Boolean(opts.agent.verified_badge),
    views_count: 40 + opts.daysAgo * 3,
    contact_clicks: 4 + opts.daysAgo,
    expires_at: daysFromNow(60),
    created_at: daysAgo(opts.daysAgo + 1),
    updated_at: daysAgo(opts.daysAgo),
    attributes: {
      is_demo: true,
      seed_namespace: SEED_NAMESPACE,
      ui_fixture: true,
    },
    agent: opts.agent,
  };
}

function toProperty(s: PropSeed): Property {
  const agent = AGENTS[s.agent] ?? AGENTS[0];
  return {
    ...baseListingFields({
      id: s.id,
      agent,
      title: s.title,
      description: s.description,
      price: s.price,
      state: s.state,
      city: s.city,
      area: s.area,
      landmark: s.landmark,
      media_urls: s.photos,
      boosted: s.boosted,
      daysAgo: s.daysAgo,
    }),
    asset_type: "PROPERTY",
    listing_type: s.listing_type,
    property_type: s.property_type,
    bedrooms: s.bedrooms,
    bathrooms: s.bathrooms,
    toilets: s.bathrooms,
    payment_period: s.payment_period,
    extras: { amenities: ["parking", "security", "generator"] },
  };
}

function toVehicle(s: VehSeed): Property {
  const agent = AGENTS[s.agent] ?? AGENTS[0];
  return {
    ...baseListingFields({
      id: s.id,
      agent,
      title: s.title,
      description: s.description,
      price: s.price,
      state: s.state,
      city: s.city,
      area: s.area,
      media_urls: s.photos,
      boosted: s.boosted,
      daysAgo: s.daysAgo,
    }),
    asset_type: "VEHICLE",
    listing_type: "sale",
    property_type: null,
    bedrooms: 0,
    bathrooms: 0,
    toilets: 0,
    payment_period: "total",
    auto_category: s.auto_category,
    make: s.make,
    model: s.model,
    year: s.year,
    transmission: s.transmission,
    fuel_type: s.fuel_type,
    mileage: s.mileage,
    vehicle_condition: s.vehicle_condition,
  };
}

/** Full property demo set (UI-only). */
export const DEMO_UI_PROPERTIES: Property[] = PROPERTY_SEEDS.map(toProperty);

/** Full vehicle demo set (UI-only). */
export const DEMO_UI_VEHICLES: Property[] = VEHICLE_SEEDS.map(toVehicle);

/**
 * Demo UI fixtures + banners — development only.
 * Hidden when: production env, NODE_ENV !== development, or YIKE_DISABLE_DEMO_UI=1.
 */
export function canUseDevDemoUiFixtures(): boolean {
  if (process.env.YIKE_DISABLE_DEMO_UI === "1") return false;
  if (isProductionEnv()) return false;
  if (process.env.NODE_ENV !== "development") return false;
  return true;
}

/**
 * When live inventory is empty in development, return demo cards.
 * Never mixes into a non-empty live result; never runs in production.
 */
export function withEmptyInventoryDemoFixtures(
  live: Property[],
  kind: "property" | "vehicle",
  limit = 12,
): { items: Property[]; isDemo: boolean } {
  if (live.length > 0) {
    return { items: live.slice(0, limit), isDemo: false };
  }
  if (!canUseDevDemoUiFixtures()) {
    return { items: [], isDemo: false };
  }
  const source = kind === "vehicle" ? DEMO_UI_VEHICLES : DEMO_UI_PROPERTIES;
  return { items: source.slice(0, limit), isDemo: true };
}

export function demoBoostedRail(
  items: Property[],
  limit = 6,
): Property[] {
  const boosted = items.filter(
    (p) => isBoostedActive(p) || isFeaturedActive(p),
  );
  if (boosted.length > 0) return boosted.slice(0, limit);
  return items.slice(0, limit);
}

/** @deprecated alias — Featured rail */
export const demoFeaturedRail = demoBoostedRail;

export function demoRecentRail(items: Property[], limit = 6): Property[] {
  return [...items]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, limit);
}

export function demoLuxuryRail(
  items: Property[],
  limit = 6,
): Property[] {
  return [...items]
    .sort((a, b) => Number(b.price) - Number(a.price))
    .slice(0, limit);
}

export function demoNearYouRail(items: Property[], limit = 6): Property[] {
  return demoRecentRail(items, limit);
}

export function demoLowMileageRail(items: Property[], limit = 6): Property[] {
  const withMileage = items.filter((p) => p.mileage != null);
  if (withMileage.length > 0) {
    return [...withMileage]
      .sort((a, b) => Number(a.mileage) - Number(b.mileage))
      .slice(0, limit);
  }
  return demoRecentRail(items, limit);
}

/**
 * Prefer demo fixtures matching preferred city/state; expand honestly when thin.
 * Clears DEMO visibility when local geo inventory exists in the fixture pool.
 */
export function filterDemoByLocation(
  items: Property[],
  preferred?: { city?: string; state?: string } | null,
  limit = 12,
): { items: Property[]; matchedLocally: boolean } {
  const city = preferred?.city?.trim().toLowerCase() || "";
  const state = preferred?.state?.trim().toLowerCase() || "";
  if (!city && !state) {
    return { items: items.slice(0, limit), matchedLocally: false };
  }

  if (city) {
    const sameCity = items.filter((p) => p.city?.toLowerCase() === city);
    if (sameCity.length > 0) {
      return { items: sameCity.slice(0, limit), matchedLocally: true };
    }
  }
  if (state) {
    const sameState = items.filter((p) => p.state?.toLowerCase() === state);
    if (sameState.length > 0) {
      return { items: sameState.slice(0, limit), matchedLocally: Boolean(city) };
    }
  }
  return { items: items.slice(0, limit), matchedLocally: false };
}
