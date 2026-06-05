export type CityPersonality = {
  vibe: string;
  headline: string;
  rentalGuide: string;
  faqs: { q: string; a: string }[];
};

const DEFAULT: CityPersonality = {
  vibe: "Active local market",
  headline: "Find verified homes from trusted agents",
  rentalGuide:
    "Always inspect in person before payment. Confirm ownership documents and meet agents at the property — not a random office.",
  faqs: [
    {
      q: "Is Yike an estate agent?",
      a: "No. Yike is a listing platform. You contact agents directly on WhatsApp.",
    },
    {
      q: "Do I pay through Yike?",
      a: "Not in this version. Rent and deposits are arranged directly with the agent or landlord.",
    },
  ],
};

export const CITY_PERSONALITIES: Record<string, CityPersonality> = {
  Lagos: {
    vibe: "Fast-paced · premium · high demand",
    headline: "Rentals, shortlets and sales across Lagos",
    rentalGuide:
      "Lagos prices vary sharply by axis — mainland vs island. Budget for agency fees, caution deposit and service charge. Inspect during daylight and verify the exact unit, not a showroom.",
    faqs: [
      {
        q: "How much is rent in Lekki vs Yaba?",
        a: "Island areas (Lekki, VI) run higher; mainland (Yaba, Surulere) is more affordable. Filter by area and budget on Yike.",
      },
      {
        q: "Are shortlets available?",
        a: "Yes — filter by Shortlet or browse shortlet hubs for nightly and weekly stays.",
      },
    ],
  },
  Aba: {
    vibe: "Commercial · affordable · busy",
    headline: "Affordable verified rentals in Aba",
    rentalGuide:
      "Aba is trade-heavy — shop-adjacent flats can be noisy. Ask about power, water and security. Ogbor Hill and Ariaria are popular starting points.",
    faqs: [
      {
        q: "Is Aba good for shop + flat combos?",
        a: "Yes. Filter commercial property types or search areas like Ariaria and Cemetery Market.",
      },
    ],
  },
  Enugu: {
    vibe: "Calm · student-friendly · growing",
    headline: "Student lodges and family homes in Enugu",
    rentalGuide:
      "Areas near UNN and ESUT see strong student demand. Confirm what's included — water, security, generator — before paying.",
    faqs: [
      {
        q: "Best areas for students?",
        a: "Try New Haven, Ogui and areas near campus. Use the student hub on Yike home.",
      },
    ],
  },
  Abuja: {
    vibe: "Structured · government · business",
    headline: "Homes in Nigeria's capital",
    rentalGuide:
      "Abuja rents are often quoted yearly. Gwarinpa, Wuse and Maitama differ widely in price — verify the exact district before transfer.",
    faqs: [
      {
        q: "Are Abuja rents yearly?",
        a: "Mostly yes. Check payment period on each listing.",
      },
    ],
  },
  "Port Harcourt": {
    vibe: "Oil-city · business · GRA premium",
    headline: "GRA, Woji and Port Harcourt rentals",
    rentalGuide:
      "GRA and Peter Odili areas command premium prices. Confirm flood history in rainy season for ground-floor units.",
    faqs: [
      {
        q: "Popular PH areas on Yike?",
        a: "GRA, Woji, Rumuola and Trans Amadi — browse area pages for live listings.",
      },
    ],
  },
  Owerri: {
    vibe: "Relaxed · shortlets · family homes",
    headline: "Shortlets and rentals in Owerri",
    rentalGuide:
      "Ikenegbu and New Owerri are common picks. Shortlets are popular for weekends — confirm check-in times upfront.",
    faqs: [],
  },
};

export function getCityPersonality(city: string): CityPersonality {
  return CITY_PERSONALITIES[city] ?? DEFAULT;
}
