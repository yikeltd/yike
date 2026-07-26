/**
 * Launch-validation catalog expansion for demo marketplace seed.
 * Generates realistic Nigerian listings with stable UUIDs (idempotent upserts).
 * All rows are tagged is_demo / is_sample by the parent seed script.
 *
 * Does NOT write to any database by itself.
 */

export type GenSeller = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  kind: "private" | "verified" | "dealer" | "agency";
  account_type: "individual" | "dealer" | "agency";
  agent_type: "independent" | "agency" | "landlord" | null;
  verification_status: "not_started" | "approved";
  verified_badge: boolean;
  is_verified_agent: boolean;
  trust_score: number;
};

export type GenProperty = {
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

export type GenVehicle = {
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

const CITIES: Array<{
  state: string;
  city: string;
  areas: string[];
  lat: number;
  lng: number;
}> = [
  { state: "Lagos", city: "Lagos", areas: ["Ikeja", "Lekki", "Yaba", "Surulere", "Ajah", "Ikorodu"], lat: 6.5244, lng: 3.3792 },
  { state: "FCT", city: "Abuja", areas: ["Wuse II", "Gwarinpa", "Maitama", "Kubwa", "Asokoro"], lat: 9.0765, lng: 7.3986 },
  { state: "Rivers", city: "Port Harcourt", areas: ["GRA", "Rumuokoro", "Trans Amadi", "Ada George"], lat: 4.8156, lng: 7.0498 },
  { state: "Enugu", city: "Enugu", areas: ["Independence Layout", "New Haven", "Trans Ekulu", "GRA"], lat: 6.4584, lng: 7.5464 },
  { state: "Oyo", city: "Ibadan", areas: ["Bodija", "Ring Road", "Challenge", "UI Axis"], lat: 7.3775, lng: 3.947 },
  { state: "Edo", city: "Benin City", areas: ["GRA", "Sapele Road", "Ugbowo", "Airport Road"], lat: 6.335, lng: 5.6037 },
  { state: "Imo", city: "Owerri", areas: ["New Owerri", "World Bank", "Ikenegbu", "Orji"], lat: 5.484, lng: 7.035 },
  { state: "Akwa Ibom", city: "Uyo", areas: ["Shelter Afrique", "Ewet Housing", "Aka Offot"], lat: 5.0377, lng: 7.9128 },
  { state: "Delta", city: "Asaba", areas: ["Okpanam Road", "DBS Road", "Summit"], lat: 6.2059, lng: 6.6959 },
  { state: "Abia", city: "Aba", areas: ["Osisioma", "Aba Town", "Ogbor Hill"], lat: 5.1125, lng: 7.3492 },
  { state: "Kaduna", city: "Kaduna", areas: ["Barnawa", "Ungwan Rimi", "Kawo"], lat: 10.51, lng: 7.4167 },
  { state: "Kano", city: "Kano", areas: ["Nassarawa", "Hotoro", "Zoo Road"], lat: 12.0022, lng: 8.592 },
  { state: "Plateau", city: "Jos", areas: ["Rayfield", "Terminus", "Rukuba Road"], lat: 9.8965, lng: 8.8583 },
];

const PROPERTY_SPECS: Array<{
  property_type: string;
  label: string;
  beds: number[];
  listing_types: Array<"rent" | "sale" | "lease">;
  priceRentYearly: [number, number];
  priceSale: [number, number];
  size: [number, number];
}> = [
  { property_type: "mini_flat", label: "Mini flat", beds: [1], listing_types: ["rent"], priceRentYearly: [350_000, 900_000], priceSale: [8_000_000, 18_000_000], size: [35, 55] },
  { property_type: "flat_2", label: "2-bedroom flat", beds: [2], listing_types: ["rent", "sale"], priceRentYearly: [800_000, 2_500_000], priceSale: [18_000_000, 45_000_000], size: [70, 110] },
  { property_type: "flat_3", label: "3-bedroom apartment", beds: [3], listing_types: ["rent", "sale"], priceRentYearly: [1_500_000, 4_500_000], priceSale: [35_000_000, 85_000_000], size: [110, 170] },
  { property_type: "terrace_duplex", label: "Terrace duplex", beds: [3, 4], listing_types: ["rent", "sale"], priceRentYearly: [2_500_000, 6_000_000], priceSale: [45_000_000, 120_000_000], size: [180, 260] },
  { property_type: "detached_duplex", label: "Detached duplex", beds: [4, 5], listing_types: ["sale", "rent"], priceRentYearly: [4_000_000, 12_000_000], priceSale: [55_000_000, 220_000_000], size: [220, 380] },
  { property_type: "bungalow", label: "Bungalow", beds: [3, 4], listing_types: ["rent", "sale"], priceRentYearly: [2_000_000, 7_000_000], priceSale: [40_000_000, 150_000_000], size: [160, 280] },
  { property_type: "shop", label: "Shop unit", beds: [0], listing_types: ["rent", "lease"], priceRentYearly: [1_200_000, 8_000_000], priceSale: [15_000_000, 60_000_000], size: [25, 80] },
  { property_type: "office", label: "Office suite", beds: [0], listing_types: ["rent", "lease"], priceRentYearly: [2_000_000, 15_000_000], priceSale: [40_000_000, 200_000_000], size: [60, 250] },
  { property_type: "warehouse", label: "Warehouse", beds: [0], listing_types: ["rent", "lease", "sale"], priceRentYearly: [3_000_000, 18_000_000], priceSale: [50_000_000, 250_000_000], size: [300, 1200] },
  { property_type: "land_residential", label: "Residential land", beds: [0], listing_types: ["sale"], priceRentYearly: [0, 0], priceSale: [4_000_000, 45_000_000], size: [300, 1000] },
  { property_type: "commercial", label: "Commercial property", beds: [0], listing_types: ["sale", "lease"], priceRentYearly: [5_000_000, 25_000_000], priceSale: [80_000_000, 400_000_000], size: [200, 800] },
];

const VEHICLE_SPECS: Array<{
  make: string;
  models: Array<{ model: string; category: GenVehicle["auto_category"]; body: string; years: number[] }>;
}> = [
  { make: "Toyota", models: [
    { model: "Camry", category: "car", body: "sedan", years: [2014, 2016, 2018, 2020, 2022] },
    { model: "Corolla", category: "car", body: "sedan", years: [2013, 2015, 2017, 2019, 2021] },
    { model: "Highlander", category: "suv", body: "suv", years: [2015, 2017, 2019, 2021] },
    { model: "Hilux", category: "truck", body: "pickup", years: [2014, 2016, 2018, 2020, 2022] },
    { model: "Prado", category: "suv", body: "suv", years: [2012, 2015, 2018, 2020] },
  ]},
  { make: "Lexus", models: [
    { model: "RX 350", category: "suv", body: "suv", years: [2014, 2016, 2018, 2020] },
    { model: "ES 350", category: "car", body: "sedan", years: [2015, 2017, 2019, 2021] },
    { model: "GX 460", category: "suv", body: "suv", years: [2013, 2016, 2019] },
  ]},
  { make: "Honda", models: [
    { model: "Accord", category: "car", body: "sedan", years: [2014, 2016, 2018, 2020] },
    { model: "CR-V", category: "suv", body: "suv", years: [2015, 2017, 2019, 2021] },
    { model: "Pilot", category: "suv", body: "suv", years: [2014, 2017, 2020] },
  ]},
  { make: "Mercedes-Benz", models: [
    { model: "C300", category: "car", body: "sedan", years: [2015, 2017, 2019, 2021] },
    { model: "GLE 350", category: "suv", body: "suv", years: [2016, 2018, 2020] },
    { model: "E350", category: "car", body: "sedan", years: [2014, 2017, 2019] },
  ]},
  { make: "BMW", models: [
    { model: "320i", category: "car", body: "sedan", years: [2015, 2017, 2019] },
    { model: "X5", category: "suv", body: "suv", years: [2014, 2016, 2018, 2020] },
  ]},
  { make: "Ford", models: [
    { model: "Ranger", category: "truck", body: "pickup", years: [2015, 2017, 2019, 2021] },
    { model: "Explorer", category: "suv", body: "suv", years: [2014, 2016, 2018] },
  ]},
  { make: "Kia", models: [
    { model: "Sportage", category: "suv", body: "suv", years: [2016, 2018, 2020, 2022] },
    { model: "Rio", category: "car", body: "sedan", years: [2015, 2017, 2019] },
  ]},
  { make: "Hyundai", models: [
    { model: "Tucson", category: "suv", body: "suv", years: [2016, 2018, 2020] },
    { model: "Elantra", category: "car", body: "sedan", years: [2015, 2017, 2019, 2021] },
  ]},
  { make: "Nissan", models: [
    { model: "Pathfinder", category: "suv", body: "suv", years: [2014, 2016, 2018] },
    { model: "Altima", category: "car", body: "sedan", years: [2015, 2017, 2019] },
  ]},
  { make: "Peugeot", models: [
    { model: "508", category: "car", body: "sedan", years: [2016, 2018, 2020] },
    { model: "3008", category: "suv", body: "suv", years: [2017, 2019, 2021] },
  ]},
  { make: "Mitsubishi", models: [
    { model: "Pajero", category: "suv", body: "suv", years: [2013, 2015, 2017, 2019] },
    { model: "L200", category: "truck", body: "pickup", years: [2014, 2016, 2018, 2020] },
  ]},
];

function padId(n: number): string {
  return String(n).padStart(12, "0");
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length]!;
}

function lerp(min: number, max: number, t: number): number {
  return Math.round(min + (max - min) * t);
}

function hash01(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const AMENITY_POOLS = [
  ["parking", "security", "water"],
  ["parking", "generator", "security", "water"],
  ["parking", "fitted_kitchen", "generator", "security"],
  ["parking", "bq", "security", "water", "generator"],
  ["parking", "fibre", "security", "generator"],
  ["surveyed", "dry_land"],
  ["parking", "power", "security"],
];

/** Extra demo sellers for vendor diversity (IDs 5–12). */
export function buildExtraSellers(): GenSeller[] {
  const agencies = [
    "Horizon Homes NG",
    "Palmview Realty",
    "CityGate Properties",
    "Eastern Nest Agency",
  ];
  const dealers = ["AutoHub Lagos", "Capital Motors Abuja", "Riverine Autos PH", "Savanna Cars Kano"];
  const sellers: GenSeller[] = [];
  for (let i = 0; i < 4; i++) {
    sellers.push({
      id: `d1000001-0000-4000-8000-${padId(5 + i)}`,
      email: `demo.agency${i + 2}@yike.demo`,
      full_name: agencies[i]!,
      phone: `080311100${String(5 + i).padStart(2, "0")}`,
      kind: "agency",
      account_type: "agency",
      agent_type: "agency",
      verification_status: "approved",
      verified_badge: true,
      is_verified_agent: true,
      trust_score: 90 + i,
    });
  }
  for (let i = 0; i < 4; i++) {
    sellers.push({
      id: `d1000001-0000-4000-8000-${padId(9 + i)}`,
      email: `demo.dealer${i + 2}@yike.demo`,
      full_name: dealers[i]!,
      phone: `080311100${String(9 + i).padStart(2, "0")}`,
      kind: "dealer",
      account_type: "dealer",
      agent_type: "agency",
      verification_status: "approved",
      verified_badge: true,
      is_verified_agent: true,
      trust_score: 88 + i,
    });
  }
  return sellers;
}

/**
 * Generate additional properties (IDs starting at 100).
 * Target ~280 to reach ~300 with handcrafted 18.
 */
export function buildGeneratedProperties(sellerIds: string[], count = 282): GenProperty[] {
  const out: GenProperty[] = [];
  for (let i = 0; i < count; i++) {
    const n = 100 + i;
    const city = pick(CITIES, i);
    const area = pick(city.areas, i * 3);
    const spec = pick(PROPERTY_SPECS, i);
    const listingType = pick(spec.listing_types, i);
    const beds = pick(spec.beds, i);
    const t = hash01(n * 17);
    const isSale = listingType === "sale";
    const price = isSale
      ? lerp(spec.priceSale[0], spec.priceSale[1], t)
      : lerp(spec.priceRentYearly[0] || 1_000_000, spec.priceRentYearly[1] || 5_000_000, t);
    const tier: GenProperty["tier"] =
      price > (isSale ? 100_000_000 : 5_000_000)
        ? "premium"
        : price < (isSale ? 25_000_000 : 1_200_000)
          ? "budget"
          : "standard";
    const sellerId = pick(sellerIds, i + (tier === "premium" ? 1 : 0));
    const baths = beds === 0 ? (spec.property_type === "warehouse" ? 2 : 1) : beds;
    const size = lerp(spec.size[0], spec.size[1], hash01(n * 9));
    const title =
      beds > 0
        ? `${spec.label} in ${area}, ${city.city}`
        : `${spec.label} — ${area}, ${city.city}`;
    const intent =
      listingType === "rent" || listingType === "lease"
        ? listingType === "lease"
          ? "available on lease"
          : "available for rent"
        : "offered for sale";
    const description =
      `${spec.label} ${intent} in ${area}, ${city.city}. ` +
      (beds > 0
        ? `${beds} bedroom${beds > 1 ? "s" : ""}, ${baths} bath, about ${size} sqm. `
        : `About ${size} sqm of usable space. `) +
      `Located near ${area} landmarks with straightforward access roads. ` +
      `Suitable for ${tier === "budget" ? "value-conscious buyers and renters" : tier === "premium" ? "executives and families seeking premium finishes" : "professionals and growing households"}. ` +
      `Inspection available by appointment through Yike.`;

    out.push({
      id: `d2000001-0000-4000-8000-${padId(n)}`,
      sellerId,
      title,
      description,
      listing_type: listingType,
      property_type: spec.property_type,
      bedrooms: beds,
      bathrooms: baths,
      toilets: baths + (beds > 2 ? 1 : 0),
      price,
      payment_period: isSale ? "total" : "yearly",
      state: city.state,
      city: city.city,
      area,
      address_hint: `${area} corridor`,
      landmark: `Near ${area} junction`,
      parking: beds === 0 ? (spec.property_type === "warehouse" ? 6 : 1) : Math.min(4, Math.max(1, beds - 1)),
      size_sqm: size,
      lat: city.lat + (hash01(n) - 0.5) * 0.04,
      lng: city.lng + (hash01(n * 3) - 0.5) * 0.04,
      amenities: pick(AMENITY_POOLS, i),
      tier,
      boosted: i % 11 === 0,
      images: PROPERTY_PHOTOS.slice(i % 6, (i % 6) + 4).concat(
        PROPERTY_PHOTOS.slice(0, Math.max(0, 4 - (PROPERTY_PHOTOS.length - (i % 6)))),
      ).slice(0, 4),
    });
  }
  return out;
}

/**
 * Generate additional vehicles (IDs starting at 100).
 * Target ~120 to reach ~134 with handcrafted 14.
 */
export function buildGeneratedVehicles(sellerIds: string[], count = 120): GenVehicle[] {
  const dealerIds = sellerIds.filter((_, idx) => idx % 2 === 1);
  const pool = dealerIds.length ? dealerIds : sellerIds;
  const colors = ["Black", "White", "Silver", "Grey", "Blue", "Red", "Brown"];
  const fuels = ["petrol", "diesel", "hybrid"];
  const transmissions = ["automatic", "manual"];
  const out: GenVehicle[] = [];
  let i = 0;
  while (out.length < count) {
    const brand = pick(VEHICLE_SPECS, i);
    const model = pick(brand.models, i * 2);
    const year = pick(model.years, i);
    const n = 100 + out.length;
    const city = pick(CITIES, i + 2);
    const t = hash01(n * 13);
    const base =
      model.category === "suv"
        ? 8_000_000
        : model.category === "truck"
          ? 12_000_000
          : 5_000_000;
    const price = lerp(base, base * (year >= 2019 ? 4.5 : 2.8), t);
    const mileage = lerp(18_000, 140_000, 1 - (year - 2012) / 12);
    const transmission = pick(transmissions, i);
    const fuel = model.category === "truck" ? "diesel" : pick(fuels, i);
    const sellerId = pick(pool, i);
    const title = `${year} ${brand.make} ${model.model} — ${city.city}`;
    const description =
      `${year} ${brand.make} ${model.model} in ${pick(colors, i).toLowerCase()}, ` +
      `${transmission} transmission, ${fuel}. About ${mileage.toLocaleString()} km on the odometer. ` +
      `Available in ${city.city} for inspection. Clean interior, sound engine, and Nigerian-used history available on request. ` +
      `Contact via Yike to schedule a viewing.`;

    out.push({
      id: `d3000001-0000-4000-8000-${padId(n)}`,
      sellerId,
      title,
      description,
      price,
      state: city.state,
      city: city.city,
      area: pick(city.areas, i),
      auto_category: model.category,
      make: brand.make,
      model: model.model,
      year,
      trim: year >= 2019 ? "Premium" : "Standard",
      transmission,
      fuel_type: fuel,
      mileage,
      vehicle_condition: year >= 2019 ? "foreign_used" : "nigerian_used",
      vin: `YKDEM${String(n).padStart(11, "0")}`,
      exterior_color: pick(colors, i),
      interior_color: pick(["Black", "Beige", "Grey"], i),
      body_type: model.body,
      drivetrain: model.category === "suv" || model.category === "truck" ? "4WD" : "FWD",
      engine: fuel === "diesel" ? "2.8L" : "2.5L",
      registration_status: "valid",
      boosted: out.length % 13 === 0,
      images: VEHICLE_PHOTOS.slice(i % 5, (i % 5) + 4).concat(VEHICLE_PHOTOS.slice(0, 2)).slice(0, 4),
    });
    i++;
  }
  return out;
}

export function summarizeCatalog(properties: GenProperty[], vehicles: GenVehicle[]) {
  const byCity: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const p of properties) {
    byCity[p.city] = (byCity[p.city] ?? 0) + 1;
    byType[p.property_type] = (byType[p.property_type] ?? 0) + 1;
  }
  const byMake: Record<string, number> = {};
  for (const v of vehicles) {
    byMake[v.make] = (byMake[v.make] ?? 0) + 1;
  }
  return { byCity, byType, byMake, propertyCount: properties.length, vehicleCount: vehicles.length };
}
