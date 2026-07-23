/**
 * Idempotent sample marketplace inventory seed.
 *
 * Safety:
 *   - Refuses production project `hlpojfurfldvcxfxhveg` unless ALLOW_PRODUCTION_SEED=1
 *   - Tags every row with attributes.is_sample + attributes.is_demo + seed_namespace
 *   - Public titles have NO [DEMO] prefix (admin UI shows "Sample Listing")
 *   - Upserts by stable demo UUIDs only (never overwrites non-demo listings)
 *   - Demo media uses Unsplash placeholders (not scraped copyrighted assets)
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/seed-demo-marketplace.ts --dry-run
 *   SUPABASE_URL=https://gyxemepnrkwxocgzfbeo.supabase.co \
 *     SUPABASE_SERVICE_ROLE_KEY=... \
 *     npx tsx scripts/seed-demo-marketplace.ts
 *
 * Production launch inventory (founder must confirm):
 *   ALLOW_PRODUCTION_SEED=1 npx tsx --env-file=.env.local scripts/seed-demo-marketplace.ts
 *
 * Flags:
 *   --dry-run         Print plan + safety checks; no writes
 *   --validate-only   Run discovery validation queries only (no upsert)
 *   --purge-demo      Delete demo-namespace rows (stable IDs / is_demo flag) then exit
 *
 * Docs: docs/engineering/DEMO_MARKETPLACE_SEED.md
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const PRODUCTION_REF = "hlpojfurfldvcxfxhveg";
const SEED_NAMESPACE = "yike-demo-marketplace-v1";
/** @deprecated kept for purge of legacy rows that still carry the prefix */
const DEMO_PREFIX = "[DEMO]";
const DEMO_PASSWORD = "YikeDemoSeed2026!";

function publicSampleTitle(title: string): string {
  return title.replace(/^\[DEMO\]\s*/i, "").trim();
}

type SellerKind = "private" | "verified" | "dealer" | "agency";

type DemoSeller = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  kind: SellerKind;
  account_type: "individual" | "dealer" | "agency";
  agent_type: "independent" | "agency" | "landlord" | null;
  verification_status: "not_started" | "approved";
  verified_badge: boolean;
  is_verified_agent: boolean;
  trust_score: number;
};

type DemoMedia = {
  id: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
  is_cover: boolean;
};

type DemoProperty = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  listing_type: "rent" | "sale" | "lease";
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  toilets: number;
  price: number;
  payment_period: "yearly" | "monthly" | "total";
  state: string;
  city: string;
  area: string;
  address_hint: string;
  landmark: string;
  parking: number;
  size_sqm: number;
  lat: number;
  lng: number;
  amenities: string[];
  tier: "premium" | "standard" | "budget";
  boosted: boolean;
  images: string[];
};

type DemoVehicle = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  state: string;
  city: string;
  area: string;
  auto_category: "car" | "suv" | "truck" | "van" | "motorcycle" | "commercial";
  make: string;
  model: string;
  year: number;
  trim: string;
  transmission: string;
  fuel_type: string;
  mileage: number;
  vehicle_condition: string;
  vin: string;
  exterior_color: string;
  interior_color: string;
  body_type: string;
  drivetrain: string;
  engine: string;
  registration_status: string;
  boosted: boolean;
  images: string[];
};

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

/** Stable demo UUIDs — never collide with random user-generated rows */
const SELLERS: DemoSeller[] = [
  {
    id: "d1000001-0000-4000-8000-000000000001",
    email: "demo.private@yike.demo",
    full_name: "Demo Private Seller",
    phone: "08031110001",
    kind: "private",
    account_type: "individual",
    agent_type: "independent",
    verification_status: "not_started",
    verified_badge: false,
    is_verified_agent: false,
    trust_score: 72,
  },
  {
    id: "d1000001-0000-4000-8000-000000000002",
    email: "demo.verified@yike.demo",
    full_name: "Demo Verified Seller",
    phone: "08031110002",
    kind: "verified",
    account_type: "individual",
    agent_type: "independent",
    verification_status: "approved",
    verified_badge: true,
    is_verified_agent: true,
    trust_score: 96,
  },
  {
    id: "d1000001-0000-4000-8000-000000000003",
    email: "demo.dealer@yike.demo",
    full_name: "Demo Auto Dealer NG",
    phone: "08031110003",
    kind: "dealer",
    account_type: "dealer",
    agent_type: "agency",
    verification_status: "approved",
    verified_badge: true,
    is_verified_agent: true,
    trust_score: 94,
  },
  {
    id: "d1000001-0000-4000-8000-000000000004",
    email: "demo.agency@yike.demo",
    full_name: "Demo Homes Agency",
    phone: "08031110004",
    kind: "agency",
    account_type: "agency",
    agent_type: "agency",
    verification_status: "approved",
    verified_badge: true,
    is_verified_agent: true,
    trust_score: 98,
  },
];

const PROPERTIES: DemoProperty[] = [
  {
    id: "d2000001-0000-4000-8000-000000000001",
    sellerId: SELLERS[3].id,
    title: "Serviced 3-bed apartment — Independence Layout",
    description:
      "Bright 3-bedroom apartment in Independence Layout with standby generator, borehole, and gated security. Ideal for professionals who want quiet Enugu living near major banks and schools.",
    listing_type: "rent",
    property_type: "flat_3",
    bedrooms: 3,
    bathrooms: 3,
    toilets: 3,
    price: 2_400_000,
    payment_period: "yearly",
    state: "Enugu",
    city: "Enugu",
    area: "Independence Layout",
    address_hint: "Near Polo Park corridor",
    landmark: "Close to Shoprite Polo",
    parking: 2,
    size_sqm: 145,
    lat: 6.4413,
    lng: 7.4985,
    amenities: ["parking", "generator", "security", "water"],
    tier: "premium",
    boosted: true,
    images: PROPERTY_PHOTOS.slice(0, 4),
  },
  {
    id: "d2000001-0000-4000-8000-000000000002",
    sellerId: SELLERS[0].id,
    title: "Budget mini flat — Osisioma Aba",
    description:
      "Clean mini flat in Osisioma with prepaid meter and shared compound parking. Good starter home for young workers commuting into Aba mainland.",
    listing_type: "rent",
    property_type: "mini_flat",
    bedrooms: 1,
    bathrooms: 1,
    toilets: 1,
    price: 450_000,
    payment_period: "yearly",
    state: "Abia",
    city: "Aba",
    area: "Osisioma",
    address_hint: "Off Port Harcourt Road",
    landmark: "Near Ariaria axis",
    parking: 1,
    size_sqm: 48,
    lat: 5.1125,
    lng: 7.3492,
    amenities: ["parking", "prepaid_meter"],
    tier: "budget",
    boosted: false,
    images: PROPERTY_PHOTOS.slice(1, 4),
  },
  {
    id: "d2000001-0000-4000-8000-000000000003",
    sellerId: SELLERS[1].id,
    title: "4-bed detached duplex — World Bank Umuahia",
    description:
      "Family detached duplex with spacious compound, BQ, and tiled floors. Quiet World Bank estate street with reliable access roads.",
    listing_type: "sale",
    property_type: "detached_duplex",
    bedrooms: 4,
    bathrooms: 4,
    toilets: 5,
    price: 48_000_000,
    payment_period: "total",
    state: "Abia",
    city: "Umuahia",
    area: "World Bank",
    address_hint: "World Bank Housing Estate",
    landmark: "Near government layout gate",
    parking: 3,
    size_sqm: 280,
    lat: 5.5263,
    lng: 7.4892,
    amenities: ["parking", "bq", "security", "generator"],
    tier: "premium",
    boosted: true,
    images: PROPERTY_PHOTOS.slice(2, 6),
  },
  {
    id: "d2000001-0000-4000-8000-000000000004",
    sellerId: SELLERS[3].id,
    title: "Terrace duplex for rent — New Owerri",
    description:
      "Modern terrace duplex in New Owerri with fitted kitchen, ensuite rooms, and estate security. Perfect for families relocating to Imo.",
    listing_type: "rent",
    property_type: "terrace_duplex",
    bedrooms: 4,
    bathrooms: 4,
    toilets: 4,
    price: 3_200_000,
    payment_period: "yearly",
    state: "Imo",
    city: "Owerri",
    area: "New Owerri",
    address_hint: "Near Concord Hotel axis",
    landmark: "Close to Imo State Secretariat",
    parking: 2,
    size_sqm: 210,
    lat: 5.484,
    lng: 7.035,
    amenities: ["parking", "security", "fitted_kitchen", "generator"],
    tier: "premium",
    boosted: false,
    images: PROPERTY_PHOTOS.slice(3, 7),
  },
  {
    id: "d2000001-0000-4000-8000-000000000005",
    sellerId: SELLERS[1].id,
    title: "3-bed bungalow — GRA Port Harcourt",
    description:
      "Well-kept bungalow in PH GRA with large sitting room, water treatment, and enclosed parking. Suitable for expatriate or executive family.",
    listing_type: "rent",
    property_type: "bungalow",
    bedrooms: 3,
    bathrooms: 3,
    toilets: 3,
    price: 4_500_000,
    payment_period: "yearly",
    state: "Rivers",
    city: "Port Harcourt",
    area: "GRA",
    address_hint: "Old GRA",
    landmark: "Near Hotel Presidential",
    parking: 2,
    size_sqm: 190,
    lat: 4.8156,
    lng: 7.0498,
    amenities: ["parking", "water", "security", "generator"],
    tier: "premium",
    boosted: true,
    images: PROPERTY_PHOTOS.slice(4, 8),
  },
  {
    id: "d2000001-0000-4000-8000-000000000006",
    sellerId: SELLERS[3].id,
    title: "Corner shop unit — Wuse II Abuja",
    description:
      "Ground-floor corner shop with street frontage and customer parking bay. Strong foot traffic for retail, pharmacy, or boutique.",
    listing_type: "rent",
    property_type: "shop",
    bedrooms: 0,
    bathrooms: 1,
    toilets: 1,
    price: 6_000_000,
    payment_period: "yearly",
    state: "FCT",
    city: "Abuja",
    area: "Wuse II",
    address_hint: "Along Ademola Adetokunbo",
    landmark: "Near Wuse Market",
    parking: 1,
    size_sqm: 55,
    lat: 9.0765,
    lng: 7.4805,
    amenities: ["parking", "security", "power"],
    tier: "standard",
    boosted: false,
    images: PROPERTY_PHOTOS.slice(5, 8),
  },
  {
    id: "d2000001-0000-4000-8000-000000000007",
    sellerId: SELLERS[0].id,
    title: "Furnished office suite — Ikeja Lagos",
    description:
      "Ready-to-use office suite in Ikeja with partitioned rooms, waiting area, and estate parking. Fibre internet ready for SMEs.",
    listing_type: "rent",
    property_type: "office",
    bedrooms: 0,
    bathrooms: 2,
    toilets: 2,
    price: 5_500_000,
    payment_period: "yearly",
    state: "Lagos",
    city: "Lagos",
    area: "Ikeja",
    address_hint: "Allen Avenue corridor",
    landmark: "Near Computer Village",
    parking: 3,
    size_sqm: 120,
    lat: 6.6018,
    lng: 3.3515,
    amenities: ["parking", "security", "fibre", "generator"],
    tier: "standard",
    boosted: false,
    images: PROPERTY_PHOTOS.slice(6, 9),
  },
  {
    id: "d2000001-0000-4000-8000-000000000008",
    sellerId: SELLERS[1].id,
    title: "5-bed duplex sale — GRA Benin City",
    description:
      "Spacious duplex in Benin GRA with dual living rooms, BQ, and ample parking. Title documents available for serious buyers.",
    listing_type: "sale",
    property_type: "duplex",
    bedrooms: 5,
    bathrooms: 5,
    toilets: 6,
    price: 65_000_000,
    payment_period: "total",
    state: "Edo",
    city: "Benin City",
    area: "GRA",
    address_hint: "GRA Extension",
    landmark: "Near Ring Road",
    parking: 4,
    size_sqm: 320,
    lat: 6.335,
    lng: 5.6037,
    amenities: ["parking", "bq", "security", "water"],
    tier: "premium",
    boosted: false,
    images: PROPERTY_PHOTOS.slice(0, 5),
  },
  {
    id: "d2000001-0000-4000-8000-000000000009",
    sellerId: SELLERS[3].id,
    title: "Residential land — Shelter Afrique Uyo",
    description:
      "500 sqm dry residential plot in Shelter Afrique with survey and good drainage. Ready for duplex or bungalow development.",
    listing_type: "sale",
    property_type: "land_residential",
    bedrooms: 0,
    bathrooms: 0,
    toilets: 0,
    price: 12_500_000,
    payment_period: "total",
    state: "Akwa Ibom",
    city: "Uyo",
    area: "Shelter Afrique",
    address_hint: "Shelter Afrique Layout",
    landmark: "Near Ibom Tropicana axis",
    parking: 0,
    size_sqm: 500,
    lat: 5.0377,
    lng: 7.9128,
    amenities: ["surveyed", "dry_land"],
    tier: "standard",
    boosted: false,
    images: PROPERTY_PHOTOS.slice(7, 10),
  },
  {
    id: "d2000001-0000-4000-8000-00000000000a",
    sellerId: SELLERS[0].id,
    title: "Commercial plaza bay — Asaba core",
    description:
      "Single bay in a busy Asaba commercial plaza with high daily traffic. Suitable for fashion, gadgets, or services.",
    listing_type: "rent",
    property_type: "plaza",
    bedrooms: 0,
    bathrooms: 1,
    toilets: 1,
    price: 1_800_000,
    payment_period: "yearly",
    state: "Delta",
    city: "Asaba",
    area: "Nnebisi Road",
    address_hint: "Central Asaba",
    landmark: "Near Onitsha bridge approach",
    parking: 1,
    size_sqm: 40,
    lat: 6.2059,
    lng: 6.6959,
    amenities: ["parking", "security", "power"],
    tier: "budget",
    boosted: false,
    images: PROPERTY_PHOTOS.slice(8, 10).concat(PROPERTY_PHOTOS[0]),
  },
];

const VEHICLES: DemoVehicle[] = [
  {
    id: "d3000001-0000-4000-8000-000000000001",
    sellerId: SELLERS[2].id,
    title: "Toyota Camry 2018 — low mileage sedan",
    description:
      "Foreign-used Camry with clean interior, chilled AC, and service history. Registered in Lagos. Ideal daily executive ride.",
    price: 14_800_000,
    state: "Lagos",
    city: "Lagos",
    area: "Ikeja",
    auto_category: "car",
    make: "Toyota",
    model: "Camry",
    year: 2018,
    trim: "XLE",
    transmission: "automatic",
    fuel_type: "petrol",
    mileage: 68_400,
    vehicle_condition: "foreign_used",
    vin: "DEMOJTNB11HK0001",
    exterior_color: "Silver",
    interior_color: "Black",
    body_type: "sedan",
    drivetrain: "fwd",
    engine: "2.5L I4",
    registration_status: "registered",
    boosted: true,
    images: VEHICLE_PHOTOS.slice(0, 4),
  },
  {
    id: "d3000001-0000-4000-8000-000000000002",
    sellerId: SELLERS[2].id,
    title: "Honda CR-V 2019 — family SUV",
    description:
      "Spacious CR-V with panoramic view, reverse camera, and strong road presence. Perfect Abuja family SUV.",
    price: 18_500_000,
    state: "FCT",
    city: "Abuja",
    area: "Wuse",
    auto_category: "suv",
    make: "Honda",
    model: "CR-V",
    year: 2019,
    trim: "Touring",
    transmission: "automatic",
    fuel_type: "petrol",
    mileage: 54_200,
    vehicle_condition: "foreign_used",
    vin: "DEMO5J6RW2H00002",
    exterior_color: "White",
    interior_color: "Beige",
    body_type: "other",
    drivetrain: "awd",
    engine: "1.5L Turbo",
    registration_status: "registered",
    boosted: true,
    images: VEHICLE_PHOTOS.slice(1, 5),
  },
  {
    id: "d3000001-0000-4000-8000-000000000003",
    sellerId: SELLERS[1].id,
    title: "Lexus RX 350 2017 — premium SUV",
    description:
      "Quiet Lexus RX with leather seats and mark levinson audio. Dealer-inspected; available for Port Harcourt viewing.",
    price: 22_900_000,
    state: "Rivers",
    city: "Port Harcourt",
    area: "GRA",
    auto_category: "suv",
    make: "Lexus",
    model: "RX 350",
    year: 2017,
    trim: "F Sport",
    transmission: "automatic",
    fuel_type: "petrol",
    mileage: 79_800,
    vehicle_condition: "foreign_used",
    vin: "DEMO2T2BZ1BA0003",
    exterior_color: "Black",
    interior_color: "Red",
    body_type: "other",
    drivetrain: "awd",
    engine: "3.5L V6",
    registration_status: "registered",
    boosted: true,
    images: VEHICLE_PHOTOS.slice(2, 6),
  },
  {
    id: "d3000001-0000-4000-8000-000000000004",
    sellerId: SELLERS[2].id,
    title: "Mercedes-Benz C300 2016 — executive sedan",
    description:
      "Sharp C-Class with panoramic roof and AMG styling pack. Smooth highway manners for Enugu–Onitsha trips.",
    price: 16_200_000,
    state: "Enugu",
    city: "Enugu",
    area: "New Haven",
    auto_category: "car",
    make: "Mercedes-Benz",
    model: "C300",
    year: 2016,
    trim: "Sport",
    transmission: "automatic",
    fuel_type: "petrol",
    mileage: 91_000,
    vehicle_condition: "nigerian_used",
    vin: "DEMOWDDWF4KB0004",
    exterior_color: "Grey",
    interior_color: "Black",
    body_type: "sedan",
    drivetrain: "rwd",
    engine: "2.0L Turbo",
    registration_status: "registered",
    boosted: false,
    images: VEHICLE_PHOTOS.slice(3, 6),
  },
  {
    id: "d3000001-0000-4000-8000-000000000005",
    sellerId: SELLERS[0].id,
    title: "Hyundai Elantra 2020 — efficient sedan",
    description:
      "Fuel-efficient Elantra with touchscreen and reverse sensors. One careful owner; Owerri registered.",
    price: 9_750_000,
    state: "Imo",
    city: "Owerri",
    area: "World Bank",
    auto_category: "car",
    make: "Hyundai",
    model: "Elantra",
    year: 2020,
    trim: "SE",
    transmission: "automatic",
    fuel_type: "petrol",
    mileage: 41_500,
    vehicle_condition: "nigerian_used",
    vin: "DEMOKMHD84LF0005",
    exterior_color: "Blue",
    interior_color: "Grey",
    body_type: "sedan",
    drivetrain: "fwd",
    engine: "2.0L I4",
    registration_status: "registered",
    boosted: false,
    images: VEHICLE_PHOTOS.slice(4, 7),
  },
  {
    id: "d3000001-0000-4000-8000-000000000006",
    sellerId: SELLERS[2].id,
    title: "Kia Sportage 2018 — compact SUV",
    description:
      "Compact Sportage with panoramic roof and diesel economy. Great for city and inter-state runs from Uyo.",
    price: 12_400_000,
    state: "Akwa Ibom",
    city: "Uyo",
    area: "Shelter Afrique",
    auto_category: "suv",
    make: "Kia",
    model: "Sportage",
    year: 2018,
    trim: "EX",
    transmission: "automatic",
    fuel_type: "diesel",
    mileage: 72_300,
    vehicle_condition: "foreign_used",
    vin: "DEMOKNDPMCAC0006",
    exterior_color: "Red",
    interior_color: "Black",
    body_type: "other",
    drivetrain: "awd",
    engine: "2.0L Diesel",
    registration_status: "registered",
    boosted: false,
    images: VEHICLE_PHOTOS.slice(5, 8),
  },
  {
    id: "d3000001-0000-4000-8000-000000000007",
    sellerId: SELLERS[2].id,
    title: "Ford Ranger 2019 — double cab pickup",
    description:
      "Work-ready Ranger with 4WD, canopy, and strong towing capacity. Ideal for site and logistics use in Asaba.",
    price: 19_800_000,
    state: "Delta",
    city: "Asaba",
    area: "Okpanam",
    auto_category: "truck",
    make: "Ford",
    model: "Ranger",
    year: 2019,
    trim: "XLT",
    transmission: "automatic",
    fuel_type: "diesel",
    mileage: 86_100,
    vehicle_condition: "nigerian_used",
    vin: "DEMO1FTER4FH0007",
    exterior_color: "White",
    interior_color: "Grey",
    body_type: "pickup",
    drivetrain: "4wd",
    engine: "2.0L Bi-Turbo",
    registration_status: "registered",
    boosted: false,
    images: VEHICLE_PHOTOS.slice(9, 10).concat(VEHICLE_PHOTOS.slice(0, 2)),
  },
  {
    id: "d3000001-0000-4000-8000-000000000008",
    sellerId: SELLERS[1].id,
    title: "Nissan Urvan 2015 — 15-seater bus",
    description:
      "High-roof Urvan for staff shuttle or small transport business. Fresh tyres and recently serviced gearbox.",
    price: 8_900_000,
    state: "Abia",
    city: "Aba",
    area: "Aba North",
    auto_category: "van",
    make: "Nissan",
    model: "Urvan",
    year: 2015,
    trim: "High Roof",
    transmission: "manual",
    fuel_type: "petrol",
    mileage: 148_000,
    vehicle_condition: "nigerian_used",
    vin: "DEMOJN1TC24S0008",
    exterior_color: "White",
    interior_color: "Grey",
    body_type: "bus",
    drivetrain: "rwd",
    engine: "2.5L I4",
    registration_status: "registered",
    boosted: false,
    images: VEHICLE_PHOTOS.slice(6, 9),
  },
  {
    id: "d3000001-0000-4000-8000-000000000009",
    sellerId: SELLERS[0].id,
    title: "Bajaj Boxer 2022 — motorcycle",
    description:
      "Reliable Boxer for delivery and city runs. Low mileage, papers complete, available for Benin viewing.",
    price: 780_000,
    state: "Edo",
    city: "Benin City",
    area: "Ugbowo",
    auto_category: "motorcycle",
    make: "Bajaj",
    model: "Boxer",
    year: 2022,
    trim: "100cc",
    transmission: "manual",
    fuel_type: "petrol",
    mileage: 12_400,
    vehicle_condition: "nigerian_used",
    vin: "DEMOBAJAJBOX0009",
    exterior_color: "Black",
    interior_color: "N/A",
    body_type: "other",
    drivetrain: "rwd",
    engine: "100cc",
    registration_status: "registered",
    boosted: false,
    images: VEHICLE_PHOTOS.slice(8, 10).concat(VEHICLE_PHOTOS[1]),
  },
  {
    id: "d3000001-0000-4000-8000-00000000000a",
    sellerId: SELLERS[2].id,
    title: "Isuzu NPR 2014 — light truck",
    description:
      "NPR light truck for market distribution. Strong chassis, recent brake service, Umuahia papers ready.",
    price: 11_200_000,
    state: "Abia",
    city: "Umuahia",
    area: "World Bank",
    auto_category: "commercial",
    make: "Isuzu",
    model: "NPR",
    year: 2014,
    trim: "Cabin",
    transmission: "manual",
    fuel_type: "diesel",
    mileage: 210_000,
    vehicle_condition: "nigerian_used",
    vin: "DEMOJAANPR14A00A",
    exterior_color: "White",
    interior_color: "Grey",
    body_type: "other",
    drivetrain: "rwd",
    engine: "4.8L Diesel",
    registration_status: "registered",
    boosted: false,
    images: VEHICLE_PHOTOS.slice(9, 10).concat(VEHICLE_PHOTOS.slice(2, 4)),
  },
];

function projectRefFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    const m = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return m?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

function withDemoTitle(title: string): string {
  // Public titles stay clean; admin detects samples via attributes.is_sample
  return publicSampleTitle(title);
}

function mediaItems(images: string[], kind: "property" | "vehicle"): DemoMedia[] {
  return images.map((image_url, index) => ({
    id: `demo-media-${kind}-${index + 1}`,
    image_url,
    alt_text: `Sample ${kind} media ${index + 1}`,
    sort_order: index,
    is_cover: index === 0,
  }));
}

function boostFields(boosted: boolean) {
  if (!boosted) {
    return {
      is_boosted: false,
      boosted_until: null as string | null,
      boost_score: 0,
      sponsored_status: "none" as const,
      boost_level: 0,
      boost_priority: 0,
    };
  }
  return {
    is_boosted: true,
    boosted_until: daysFromNow(21),
    boost_score: 50,
    sponsored_status: "boosted" as const,
    boost_level: 1,
    boost_priority: 10,
  };
}

function propertyRow(p: DemoProperty) {
  const boost = boostFields(p.boosted);
  const media = mediaItems(p.images, "property");
  return {
    id: p.id,
    agent_id: p.sellerId,
    asset_type: "PROPERTY",
    title: withDemoTitle(p.title),
    description: p.description,
    listing_type: p.listing_type,
    property_type: p.property_type,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    toilets: p.toilets,
    price: p.price,
    payment_period: p.payment_period,
    state: p.state,
    city: p.city,
    area: p.area,
    address_hint: p.address_hint,
    landmark: p.landmark,
    media_urls: p.images,
    media_items: media,
    video_url: null,
    status: "approved",
    is_featured: p.boosted,
    featured_until: p.boosted ? daysFromNow(21) : null,
    is_verified_listing: p.sellerId !== SELLERS[0].id,
    views_count: 40 + Math.floor(Math.random() * 120),
    contact_clicks: 2 + Math.floor(Math.random() * 20),
    expires_at: daysFromNow(90),
    published_at: new Date().toISOString(),
    extras: {
      amenities: p.amenities,
      parking_spaces: p.parking,
      size_sqm: p.size_sqm,
    },
    attributes: {
      is_demo: true,
      is_sample: true,
      seed_namespace: SEED_NAMESPACE,
      demo_media: true,
      tier: p.tier,
      parking_spaces: p.parking,
      size_sqm: p.size_sqm,
      lat: p.lat,
      lng: p.lng,
      amenities: p.amenities,
    },
    ...boost,
  };
}

function vehicleRow(v: DemoVehicle) {
  const boost = boostFields(v.boosted);
  const media = mediaItems(v.images, "vehicle");
  return {
    id: v.id,
    agent_id: v.sellerId,
    asset_type: "VEHICLE",
    title: withDemoTitle(v.title),
    description: v.description,
    listing_type: "sale",
    property_type: null,
    bedrooms: 0,
    bathrooms: 0,
    toilets: 0,
    price: v.price,
    payment_period: "total",
    state: v.state,
    city: v.city,
    area: v.area,
    address_hint: null,
    landmark: null,
    media_urls: v.images,
    media_items: media,
    video_url: null,
    status: "approved",
    is_featured: v.boosted,
    featured_until: v.boosted ? daysFromNow(21) : null,
    is_verified_listing: v.sellerId !== SELLERS[0].id,
    views_count: 30 + Math.floor(Math.random() * 100),
    contact_clicks: 1 + Math.floor(Math.random() * 15),
    expires_at: daysFromNow(90),
    published_at: new Date().toISOString(),
    auto_category: v.auto_category,
    make: v.make,
    model: v.model,
    year: v.year,
    trim: v.trim,
    transmission: v.transmission,
    fuel_type: v.fuel_type,
    mileage: v.mileage,
    vehicle_condition: v.vehicle_condition,
    vin: v.vin,
    exterior_color: v.exterior_color,
    interior_color: v.interior_color,
    body_type: v.body_type,
    drivetrain: v.drivetrain,
    engine: v.engine,
    registration_status: v.registration_status,
    financing_available: false,
    attributes: {
      is_demo: true,
      is_sample: true,
      seed_namespace: SEED_NAMESPACE,
      demo_media: true,
      vertical: "vehicle",
      auto_category: v.auto_category,
    },
    extras: {},
    ...boost,
  };
}

function resolveTarget() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const ref = projectRefFromUrl(url);
  return { url, key, ref };
}

function assertSafeTarget(ref: string | null, allowDryRunOnProd: boolean) {
  const allowProd = process.env.ALLOW_PRODUCTION_SEED === "1";
  console.log("\n=== Safety check ===");
  console.log(`Detected project ref: ${ref ?? "(none)"}`);
  console.log(`Production ref:       ${PRODUCTION_REF}`);
  console.log(`ALLOW_PRODUCTION_SEED:${allowProd ? "1" : "0 (default refuse)"}`);
  console.log(`Mode:                 ${allowDryRunOnProd ? "dry-run" : "write"}`);

  if (!ref) {
    throw new Error(
      "Could not parse Supabase project ref from SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL.",
    );
  }

  if (ref === PRODUCTION_REF && allowDryRunOnProd && !allowProd) {
    console.warn(
      "WARNING: .env points at production. Dry-run only — writes are blocked unless ALLOW_PRODUCTION_SEED=1.",
    );
    return;
  }

  if (ref === PRODUCTION_REF && !allowProd) {
    const msg = [
      "REFUSED: target is production (`hlpojfurfldvcxfxhveg`).",
      "Need an explicit local/dev target (sandbox `gyxemepnrkwxocgzfbeo` or local Supabase).",
      "Do not write listings to production.",
      "To override (not recommended): ALLOW_PRODUCTION_SEED=1",
    ].join(" ");
    throw new Error(msg);
  }

  if (ref === PRODUCTION_REF && allowProd) {
    console.warn(
      "WARNING: ALLOW_PRODUCTION_SEED=1 — writing demo rows to PRODUCTION.",
    );
  }
}

async function ensureSeller(admin: SupabaseClient, seller: DemoSeller) {
  const { data: existing } = await admin.auth.admin.getUserById(seller.id);
  if (!existing?.user) {
    const { error } = await admin.auth.admin.createUser({
      id: seller.id,
      email: seller.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: seller.full_name,
        phone: seller.phone,
        role: "agent",
        is_demo: true,
        seed_namespace: SEED_NAMESPACE,
      },
    });
    if (error && !/already|exists/i.test(error.message)) {
      throw new Error(`createUser ${seller.email}: ${error.message}`);
    }
  }

  const role =
    seller.verification_status === "approved"
      ? "agent_verified"
      : "agent_unverified";

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: seller.id,
      full_name: seller.full_name,
      email: seller.email,
      phone: seller.phone,
      whatsapp: seller.phone,
      role,
      account_type: seller.account_type,
      agent_type: seller.agent_type,
      verification_status: seller.verification_status,
      verified_badge: seller.verified_badge,
      is_verified_agent: seller.is_verified_agent,
      trust_score: seller.trust_score,
      phone_verified: true,
      email_verified: true,
    },
    { onConflict: "id" },
  );
  if (profileError) {
    throw new Error(`profile upsert ${seller.email}: ${profileError.message}`);
  }
}

async function upsertListings(admin: SupabaseClient) {
  const rows = [
    ...PROPERTIES.map(propertyRow),
    ...VEHICLES.map(vehicleRow),
  ];

  const { error } = await admin.from("properties").upsert(rows, {
    onConflict: "id",
  });
  if (error) throw new Error(`properties upsert: ${error.message}`);
  return rows.length;
}

async function purgeDemo(admin: SupabaseClient) {
  const ids = [
    ...PROPERTIES.map((p) => p.id),
    ...VEHICLES.map((v) => v.id),
  ];

  const { error: byIdError, count: byIdCount } = await admin
    .from("properties")
    .delete({ count: "exact" })
    .in("id", ids);
  if (byIdError) throw new Error(`purge by id: ${byIdError.message}`);

  const { error: flagError, count: flagCount } = await admin
    .from("properties")
    .delete({ count: "exact" })
    .contains("attributes", { is_demo: true, seed_namespace: SEED_NAMESPACE });
  if (flagError) {
    console.warn(`purge by attributes skipped: ${flagError.message}`);
  }

  console.log(
    `Purged demo listings: by_id=${byIdCount ?? 0}, by_flag=${flagCount ?? 0}`,
  );
}

type ValidationReport = {
  propertiesApproved: number;
  propertiesBoosted: number;
  vehiclesApproved: number;
  vehiclesBoosted: number;
  demoFlagged: number;
  sellersFound: number;
  samplePropertyCities: string[];
  sampleVehicleMakes: string[];
};

async function validateDiscovery(admin: SupabaseClient): Promise<ValidationReport> {
  const now = new Date().toISOString();
  const demoIds = [
    ...PROPERTIES.map((p) => p.id),
    ...VEHICLES.map((v) => v.id),
  ];

  const { data: props } = await admin
    .from("properties")
    .select("id, city, is_boosted, status, expires_at, asset_type, make, attributes")
    .in("id", demoIds)
    .eq("asset_type", "PROPERTY");

  const { data: vehicles } = await admin
    .from("properties")
    .select("id, city, is_boosted, status, expires_at, asset_type, make, attributes")
    .in("id", demoIds)
    .eq("asset_type", "VEHICLE");

  const { data: sellers } = await admin
    .from("profiles")
    .select("id, full_name, account_type, verification_status")
    .in(
      "id",
      SELLERS.map((s) => s.id),
    );

  const { count: demoFlagged } = await admin
    .from("properties")
    .select("id", { count: "exact", head: true })
    .contains("attributes", { is_demo: true, seed_namespace: SEED_NAMESPACE });

  const propertyRows = props ?? [];
  const vehicleRows = vehicles ?? [];
  const activeProps = propertyRows.filter(
    (r) => r.status === "approved" && r.expires_at > now,
  );
  const activeVehicles = vehicleRows.filter(
    (r) => r.status === "approved" && r.expires_at > now,
  );

  return {
    propertiesApproved: activeProps.length,
    propertiesBoosted: activeProps.filter((r) => r.is_boosted).length,
    vehiclesApproved: activeVehicles.length,
    vehiclesBoosted: activeVehicles.filter((r) => r.is_boosted).length,
    demoFlagged: demoFlagged ?? 0,
    sellersFound: sellers?.length ?? 0,
    samplePropertyCities: activeProps.map((r) => r.city),
    sampleVehicleMakes: activeVehicles.map((r) => r.make).filter(Boolean) as string[],
  };
}

function printInventoryPlan() {
  console.log("\n=== Inventory plan ===");
  console.log(`Sellers: ${SELLERS.length}`);
  for (const s of SELLERS) {
    console.log(
      `  - ${s.kind}: ${s.full_name} (${s.account_type}, ${s.verification_status})`,
    );
  }
  console.log(
    `Properties: ${PROPERTIES.length} (boosted ${PROPERTIES.filter((p) => p.boosted).length})`,
  );
  for (const p of PROPERTIES) {
    console.log(
      `  - ${p.city} · ${p.listing_type}/${p.property_type} · ₦${p.price.toLocaleString()} · ${p.boosted ? "BOOSTED" : "standard"}`,
    );
  }
  console.log(
    `Vehicles: ${VEHICLES.length} (boosted ${VEHICLES.filter((v) => v.boosted).length})`,
  );
  for (const v of VEHICLES) {
    console.log(
      `  - ${v.make} ${v.model} ${v.year} · ${v.body_type}/${v.auto_category} · ₦${v.price.toLocaleString()} · ${v.boosted ? "BOOSTED" : "standard"}`,
    );
  }
}

function printValidation(report: ValidationReport) {
  console.log("\n=== Discovery validation ===");
  console.log(`Demo sellers found:     ${report.sellersFound}/${SELLERS.length}`);
  console.log(
    `Properties approved:    ${report.propertiesApproved}/${PROPERTIES.length}`,
  );
  console.log(
    `Properties boosted:     ${report.propertiesBoosted} (need ≥3)`,
  );
  console.log(
    `Vehicles approved:      ${report.vehiclesApproved}/${VEHICLES.length}`,
  );
  console.log(`Vehicles boosted:       ${report.vehiclesBoosted} (need ≥3)`);
  console.log(`Rows with is_demo flag: ${report.demoFlagged}`);
  console.log(`Property cities:        ${report.samplePropertyCities.join(", ")}`);
  console.log(`Vehicle makes:          ${report.sampleVehicleMakes.join(", ")}`);
}

async function main() {
  const dryRun = hasFlag("--dry-run");
  const validateOnly = hasFlag("--validate-only");
  const purge = hasFlag("--purge-demo");

  console.log("Yike demo marketplace seed");
  console.log(`Namespace: ${SEED_NAMESPACE}`);
  printInventoryPlan();

  const { url, key, ref } = resolveTarget();

  try {
    assertSafeTarget(ref, dryRun);
  } catch (err) {
    console.error(`\n${err instanceof Error ? err.message : String(err)}`);
    process.exit(2);
  }

  if (dryRun) {
    console.log("\nDry-run complete. No writes performed.");
    if (!url || !key) {
      console.log(
        "Note: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY not fully set in this shell.",
      );
    }
    if (ref === PRODUCTION_REF) {
      console.log(
        "This machine's .env points at production — seed writes will be refused until you retarget sandbox/local.",
      );
    }
    console.log(
      "To seed a safe DB: set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to sandbox/local, then re-run without --dry-run.",
    );
    return;
  }

  if (!url || !key) {
    console.error(
      "\nMissing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.",
    );
    console.error(
      "Point these at sandbox `gyxemepnrkwxocgzfbeo` or local Supabase — never production.",
    );
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (purge) {
    await purgeDemo(admin);
    return;
  }

  if (validateOnly) {
    const report = await validateDiscovery(admin);
    printValidation(report);
    return;
  }

  console.log("\nUpserting demo sellers…");
  for (const seller of SELLERS) {
    await ensureSeller(admin, seller);
    console.log(`  ✓ ${seller.full_name}`);
  }

  console.log("Upserting demo listings…");
  const count = await upsertListings(admin);
  console.log(`  ✓ ${count} listings upserted`);

  const report = await validateDiscovery(admin);
  printValidation(report);

  console.log("\nSeed complete.");
  console.log(`Project ref: ${ref}`);
  console.log(`Inserted/updated: demo-only stable IDs under ${SEED_NAMESPACE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
