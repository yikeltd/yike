import { nigeriaLocations } from "@/constants/nigeriaLocations";
import type { ListingType, PaymentPeriod } from "@/types/database";

export type GeneratedSeed = {
  id: string;
  state: string;
  city: string;
  area: string;
  title: string;
  description: string;
  listing_type: ListingType;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  price: number;
  payment_period: PaymentPeriod;
  featured?: boolean;
  verified?: boolean;
  landmark?: string;
  photo: number;
  agent: number;
};

const STATE_PRICE_TIER: Record<string, number> = {
  Lagos: 3.2,
  FCT: 2.6,
  Rivers: 1.35,
  Enugu: 1.1,
  Abia: 0.85,
  Imo: 0.9,
  Delta: 0.95,
  Anambra: 0.88,
  Edo: 0.92,
  "Cross River": 0.88,
  "Akwa Ibom": 0.9,
  Oyo: 0.82,
  Ogun: 0.78,
  Kwara: 0.72,
  Kaduna: 0.85,
  Kano: 0.8,
  Plateau: 0.88,
  Ondo: 0.75,
};

type Template = {
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  listing_type: ListingType;
  payment_period: PaymentPeriod;
  label: string;
  basePrice: number;
};

const TEMPLATES: Template[] = [
  {
    property_type: "self_contain",
    bedrooms: 1,
    bathrooms: 1,
    listing_type: "rent",
    payment_period: "yearly",
    label: "Self contain",
    basePrice: 320_000,
  },
  {
    property_type: "mini_flat",
    bedrooms: 1,
    bathrooms: 1,
    listing_type: "rent",
    payment_period: "yearly",
    label: "Mini flat",
    basePrice: 420_000,
  },
  {
    property_type: "room",
    bedrooms: 1,
    bathrooms: 1,
    listing_type: "rent",
    payment_period: "yearly",
    label: "Room and parlour",
    basePrice: 280_000,
  },
  {
    property_type: "flat",
    bedrooms: 2,
    bathrooms: 2,
    listing_type: "rent",
    payment_period: "yearly",
    label: "2-bed flat",
    basePrice: 750_000,
  },
  {
    property_type: "flat",
    bedrooms: 3,
    bathrooms: 2,
    listing_type: "rent",
    payment_period: "yearly",
    label: "3-bed flat",
    basePrice: 950_000,
  },
  {
    property_type: "duplex",
    bedrooms: 4,
    bathrooms: 3,
    listing_type: "rent",
    payment_period: "yearly",
    label: "4-bed duplex",
    basePrice: 1_800_000,
  },
  {
    property_type: "bungalow",
    bedrooms: 3,
    bathrooms: 2,
    listing_type: "rent",
    payment_period: "yearly",
    label: "3-bed bungalow",
    basePrice: 850_000,
  },
  {
    property_type: "flat",
    bedrooms: 2,
    bathrooms: 2,
    listing_type: "shortlet",
    payment_period: "daily",
    label: "Serviced shortlet",
    basePrice: 28_000,
  },
  {
    property_type: "self_contain",
    bedrooms: 1,
    bathrooms: 1,
    listing_type: "rent",
    payment_period: "yearly",
    label: "Student self contain",
    basePrice: 220_000,
  },
  {
    property_type: "shop",
    bedrooms: 0,
    bathrooms: 1,
    listing_type: "rent",
    payment_period: "yearly",
    label: "Shop space",
    basePrice: 550_000,
  },
];

const DESCRIPTIONS = [
  "Neat finish, tiled floors, prepaid meter and borehole water. Quiet compound with friendly neighbours.",
  "POP ceiling, fitted kitchen cabinets, security gate. Tarred access road, steady light area.",
  "Ideal for working professionals. Fenced compound, own bathroom, close to main road and shops.",
  "Family-friendly layout with parking space. Agent available for same-day viewing on WhatsApp.",
  "Freshly painted, ensuite bathroom, wardrobe space. Walking distance to bus stops.",
  "Secure estate with uniformed security. Good for long-term rent — agreement fee applies.",
];

const LANDMARKS = [
  "Near main market",
  "Close to bus stop",
  "Walking distance to schools",
  "5 mins from polytechnic",
  "Near hospital",
  "Close to shopping plaza",
];

function roundPrice(n: number): number {
  if (n >= 1_000_000) return Math.round(n / 50_000) * 50_000;
  if (n >= 100_000) return Math.round(n / 10_000) * 10_000;
  return Math.round(n / 5_000) * 5_000;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Expand manual seeds to target count using nationwide location data. */
export function generateSupplementalSeeds(
  existingKeys: Set<string>,
  startId: number,
  targetTotal: number
): GeneratedSeed[] {
  const out: GeneratedSeed[] = [];
  let id = startId;

  for (const [state, { cities }] of Object.entries(nigeriaLocations)) {
    const tier = STATE_PRICE_TIER[state] ?? 0.8;

    for (const [city, areas] of Object.entries(cities)) {
      const areaPool = areas.length > 0 ? areas : [city];
      const picks = areaPool.slice(0, Math.min(areaPool.length, 5));

      for (const area of picks) {
        for (let t = 0; t < TEMPLATES.length && id <= targetTotal; t++) {
          const tmpl = TEMPLATES[t]!;
          const key = `${city}|${area}|${tmpl.property_type}|${tmpl.bedrooms}|${tmpl.listing_type}`;
          if (existingKeys.has(key)) continue;
          existingKeys.add(key);

          const h = hash(key);
          const price = roundPrice(
            tmpl.basePrice * tier * (0.88 + (h % 25) / 100)
          );
          const desc = DESCRIPTIONS[h % DESCRIPTIONS.length]!;
          const landmark = LANDMARKS[(h >> 3) % LANDMARKS.length];

          out.push({
            id: `demo-${id}`,
            state,
            city,
            area,
            title: `${tmpl.label} — ${area}`,
            description: `${desc} Located in ${area}, ${city}. Chat on WhatsApp to schedule inspection.`,
            listing_type: tmpl.listing_type,
            property_type: tmpl.property_type,
            bedrooms: tmpl.bedrooms,
            bathrooms: tmpl.bathrooms,
            price,
            payment_period: tmpl.payment_period,
            verified: h % 4 === 0,
            featured: h % 17 === 0,
            landmark,
            photo: (h + t) % 24,
            agent: h % 12,
          });
          id++;
          if (id > targetTotal) break;
        }
        if (id > targetTotal) break;
      }
      if (id > targetTotal) break;
    }
    if (id > targetTotal) break;
  }

  return out;
}
