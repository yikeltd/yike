import { TRENDING_CITIES } from "@/constants/trendingCities";
import { POPULAR_AREAS } from "@/constants/popularAreas";
import { toSlug } from "@/lib/location-slugs";

export type BlogCategory =
  | "city-rental-guide"
  | "neighborhood-guide"
  | "property-type-guide"
  | "scam-prevention"
  | "student-housing"
  | "shortlet-guide"
  | "shop-office-guide"
  | "moving-inspection"
  | "agent-verification"
  | "rent-price-guide";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  city?: string;
  neighborhood?: string;
  propertyType?: string;
  sections: { heading: string; body: string }[];
  faqs: { q: string; a: string }[];
  relatedLinks: { label: string; href: string }[];
  createdAt: string;
  updatedAt: string;
};

const CATEGORY_LABELS: Record<BlogCategory, string> = {
  "city-rental-guide": "City rental guides",
  "neighborhood-guide": "Neighborhood guides",
  "property-type-guide": "Property type guides",
  "scam-prevention": "Scam prevention",
  "student-housing": "Student housing",
  "shortlet-guide": "Shortlet guides",
  "shop-office-guide": "Shop & office rentals",
  "moving-inspection": "Moving & inspection",
  "agent-verification": "Agent verification",
  "rent-price-guide": "Rent price guides",
};

export function getBlogCategoryLabel(cat: BlogCategory) {
  return CATEGORY_LABELS[cat];
}

function cityTemplates(city: string, slug: string): BlogPost[] {
  const base = "2026-06-05";
  const houses = `/houses/${slug}`;
  return [
    {
      slug: `best-areas-to-rent-in-${slug}`,
      title: `Best Areas to Rent in ${city} (Honest Guide)`,
      excerpt: `Where to look for affordable and verified rentals in ${city} — without agent drama.`,
      category: "city-rental-guide",
      city,
      sections: [
        {
          heading: `Why ${city} is tricky for renters`,
          body: `${city} has pockets that suit students, families, traders and professionals differently. The biggest mistake is paying from WhatsApp photos alone. Start with two or three neighborhoods that match your commute and budget, then inspect in person.`,
        },
        {
          heading: "Areas to explore first",
          body: `Use Yike neighborhood pages to compare live listings. Filter by property type — self contain, mini flat or shop space — and contact agents with Verified badges when possible.`,
        },
        {
          heading: "Before you pay",
          body: "Meet at the property, confirm who owns or manages it, and agree on rent, caution and agency fee in writing. Yike does not collect rent — you pay the agent or landlord directly after you are satisfied.",
        },
      ],
      faqs: [
        {
          q: `Is ${city} expensive to rent in?`,
          a: "It varies by neighborhood. Compare multiple areas on Yike before deciding.",
        },
      ],
      relatedLinks: [
        { label: `Browse ${city} listings`, href: houses },
        { label: "Safety tips", href: "/safety" },
        { label: "Request a property", href: "/request-property" },
      ],
      createdAt: base,
      updatedAt: base,
    },
    {
      slug: `how-to-avoid-fake-agents-in-${slug}`,
      title: `How to Avoid Fake Agents in ${city}`,
      excerpt: `Red flags, inspection rules and WhatsApp scams to watch for in ${city}.`,
      category: "scam-prevention",
      city,
      sections: [
        {
          heading: "Common scams",
          body: "Fake agents reuse photos, demand inspection fees before showing the unit, or pressure you to pay to 'hold' a property. If the price is far below market, verify twice.",
        },
        {
          heading: "What Yike does",
          body: "We identity-check many agents and label verified listings where applicable. You can report suspicious posts. We do not claim every listing is scam-free — your inspection still matters.",
        },
      ],
      faqs: [],
      relatedLinks: [
        { label: "Verify as agent", href: "/verify-agent" },
        { label: houses, href: houses },
      ],
      createdAt: base,
      updatedAt: base,
    },
    {
      slug: `cost-of-self-contain-in-${slug}`,
      title: `What a Self Contain Costs in ${city}`,
      excerpt: `Realistic rent expectations for self contains in ${city}.`,
      category: "rent-price-guide",
      city,
      sections: [
        {
          heading: "Price drivers",
          body: "Road access, water, security and proximity to markets or campuses move self contain rent more than finishing alone. Always ask if rent is yearly or monthly.",
        },
      ],
      faqs: [],
      relatedLinks: [{ label: `Self contain in ${city}`, href: `${houses}/${toSlug(POPULAR_AREAS.find((a) => toSlug(a.city) === slug)?.area ?? "central")}/self-contain` }],
      createdAt: base,
      updatedAt: base,
    },
    {
      slug: `student-housing-guide-${slug}`,
      title: `Student Housing Guide for ${city}`,
      excerpt: `Lodges, hostels and shared flats for students in ${city}.`,
      category: "student-housing",
      city,
      sections: [
        {
          heading: "Start early",
          body: "Session resumption weeks are peak season. Compare distance to campus, power backup and bathroom sharing before paying.",
        },
      ],
      faqs: [],
      relatedLinks: [{ label: houses, href: houses }],
      createdAt: base,
      updatedAt: base,
    },
    {
      slug: `shortlet-guide-${slug}`,
      title: `Shortlet Apartments in ${city}: What to Know`,
      excerpt: `Nightly stays, serviced flats and inspection tips in ${city}.`,
      category: "shortlet-guide",
      city,
      sections: [
        {
          heading: "Shortlet vs yearly rent",
          body: "Shortlets include housekeeping and utilities in many cases — confirm check-in time, WiFi and generator policy upfront.",
        },
      ],
      faqs: [],
      relatedLinks: [{ label: "Browse shortlets", href: `/search?city=${encodeURIComponent(city)}&type=shortlet` }],
      createdAt: base,
      updatedAt: base,
    },
  ];
}

function viralPosts(): BlogPost[] {
  const base = "2026-06-05";
  return [
    {
      slug: "what-500k-rent-can-get-you-in-aba",
      title: "What ₦500k Rent Can Get You in Aba",
      excerpt: "A realistic look at self contains and mini flats at this budget.",
      category: "rent-price-guide",
      city: "Aba",
      sections: [
        {
          heading: "At ₦500k yearly",
          body: "In areas like Ogbor Hill or World Bank you may find entry self contains or older mini flats — often with shared water or generator arrangements. Ariaria and market-adjacent streets can be cheaper but noisier.",
        },
      ],
      faqs: [],
      relatedLinks: [{ label: "Aba listings", href: "/houses/aba" }],
      createdAt: base,
      updatedAt: base,
    },
    {
      slug: "before-you-pay-rent-in-lagos-read-this",
      title: "Before You Pay Rent in Lagos, Read This",
      excerpt: "Inspection checklist for Lagos renters.",
      category: "moving-inspection",
      city: "Lagos",
      sections: [
        {
          heading: "The Lagos inspection list",
          body: "Confirm the exact unit (not a model flat), prepaid meter balance, who pays for diesel, and whether service charge is separate. Visit during rain if possible to check leaks.",
        },
      ],
      faqs: [],
      relatedLinks: [{ label: "Lagos houses", href: "/houses/lagos" }, { label: "Safety", href: "/safety" }],
      createdAt: base,
      updatedAt: base,
    },
    {
      slug: "10-red-flags-before-paying-for-an-apartment",
      title: "10 Red Flags Before Paying for an Apartment",
      excerpt: "Scam signals every Nigerian renter should know.",
      category: "scam-prevention",
      sections: [
        {
          heading: "Walk away if…",
          body: "The agent refuses a physical viewing, demands full rent before keys, uses only stock photos, or cannot explain who the landlord is. Report the listing on Yike if something feels wrong.",
        },
      ],
      faqs: [],
      relatedLinks: [{ label: "Safety tips", href: "/safety" }],
      createdAt: base,
      updatedAt: base,
    },
    {
      slug: "how-to-know-if-a-nigerian-agent-is-real",
      title: "How to Know If a Nigerian Agent Is Real",
      excerpt: "Verification, office checks and WhatsApp behaviour.",
      category: "agent-verification",
      sections: [
        {
          heading: "Verification helps — but is not enough",
          body: "Yike verifies many agents with identity checks. Still meet at the property, ask for agency affiliation, and avoid paying into personal accounts without a clear receipt.",
        },
      ],
      faqs: [],
      relatedLinks: [{ label: "Verify as agent", href: "/verify-agent" }],
      createdAt: base,
      updatedAt: base,
    },
    {
      slug: "cheapest-places-to-rent-in-aba",
      title: "Cheapest Places to Rent in Aba (2026 Guide)",
      excerpt: "Budget-friendly neighborhoods for self contains and mini flats in Aba.",
      category: "rent-price-guide",
      city: "Aba",
      sections: [
        {
          heading: "Where rent tends to be lower",
          body: "Areas farther from major markets often have cheaper self contains — but check road access and security. Compare Ogbor Hill, World Bank, Osisioma and Ariaria-adjacent streets on Yike before committing.",
        },
      ],
      faqs: [
        {
          q: "Can I find self contain under ₦300k in Aba?",
          a: "Yes in some areas, but inspect for water, power and road access before paying.",
        },
      ],
      relatedLinks: [{ label: "Aba listings", href: "/houses/aba" }],
      createdAt: base,
      updatedAt: base,
    },
    {
      slug: "best-areas-to-live-in-enugu",
      title: "Best Areas to Live in Enugu",
      excerpt: "Family-friendly and student-friendly neighborhoods compared.",
      category: "city-rental-guide",
      city: "Enugu",
      sections: [
        {
          heading: "Top areas to start your search",
          body: "Independence Layout, GRA, Trans Ekulu and New Haven attract professionals and families. Students often look near UNN and IMT — compare commute and rent on Yike neighborhood pages.",
        },
      ],
      faqs: [],
      relatedLinks: [{ label: "Enugu houses", href: "/houses/enugu" }],
      createdAt: base,
      updatedAt: base,
    },
    {
      slug: "cost-of-renting-in-lekki",
      title: "Cost of Renting in Lekki: What to Budget",
      excerpt: "Realistic yearly and monthly rent ranges for Lekki apartments.",
      category: "rent-price-guide",
      city: "Lagos",
      sections: [
        {
          heading: "Lekki rent is not one price",
          body: "Chevron, Ikate, Agungi and Abraham Adesanya differ sharply. Service charge, diesel and agency fees add up — always confirm totals before transfer.",
        },
      ],
      faqs: [],
      relatedLinks: [{ label: "Lagos listings", href: "/houses/lagos" }],
      createdAt: base,
      updatedAt: base,
    },
    {
      slug: "apartment-hunting-tips-in-nigeria",
      title: "Apartment Hunting Tips in Nigeria",
      excerpt: "A practical checklist for first-time and experienced renters.",
      category: "moving-inspection",
      sections: [
        {
          heading: "Search smarter",
          body: "Save listings on Yike, shortlist three areas, then book physical inspections the same week. Never pay from photos alone — especially on WhatsApp.",
        },
      ],
      faqs: [],
      relatedLinks: [
        { label: "Browse Nigeria", href: "/search" },
        { label: "Safety tips", href: "/safety" },
      ],
      createdAt: base,
      updatedAt: base,
    },
    {
      slug: "shop-space-in-ariaria-what-business-owners-should-know",
      title: "Shop Space in Ariaria: What Business Owners Should Know",
      excerpt: "Renting commercial space near Aba's biggest market.",
      category: "shop-office-guide",
      city: "Aba",
      neighborhood: "Ariaria",
      sections: [
        {
          heading: "Market-adjacent rent",
          body: "Foot traffic is high but noise and security vary by row. Confirm lock-up hours, levy and who handles repairs before signing.",
        },
      ],
      faqs: [],
      relatedLinks: [{ label: "Ariaria listings", href: "/houses/aba/ariaria/shop-space" }],
      createdAt: base,
      updatedAt: base,
    },
  ];
}

function neighborhoodPosts(): BlogPost[] {
  const base = "2026-06-05";
  const posts: BlogPost[] = [];
  for (const area of POPULAR_AREAS.slice(0, 60)) {
    const citySlug = toSlug(area.city);
    const areaSlug = toSlug(area.area);
    posts.push({
      slug: `renting-in-${areaSlug}-${citySlug}`,
      title: `Renting in ${area.area}, ${area.city}: Local Guide`,
      excerpt: `What to expect when house hunting in ${area.area}.`,
      category: "neighborhood-guide",
      city: area.city,
      neighborhood: area.area,
      sections: [
        {
          heading: `About ${area.area}`,
          body: `${area.area} is a popular search area in ${area.city}. Compare listings on Yike, inspect in person, and use WhatsApp to ask agents specific questions about access roads, water and security.`,
        },
      ],
      faqs: [],
      relatedLinks: [
        { label: `${area.area} listings`, href: `/houses/${citySlug}/${areaSlug}` },
      ],
      createdAt: base,
      updatedAt: base,
    });
  }
  return posts;
}

const ALL_POSTS: BlogPost[] = [
  ...viralPosts(),
  ...TRENDING_CITIES.flatMap((c) => cityTemplates(c.name, c.slug)),
  ...["kano", "kaduna", "calabar", "onitsha", "warri", "jos", "abeokuta"].flatMap(
    (slug) => cityTemplates(fromSlugName(slug), slug)
  ),
  ...neighborhoodPosts(),
];

function fromSlugName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const bySlug = new Map(ALL_POSTS.map((p) => [p.slug, p]));

export function getAllBlogSlugs(): string[] {
  return ALL_POSTS.map((p) => p.slug);
}

export function getBlogPost(slug: string): BlogPost | null {
  return bySlug.get(slug) ?? null;
}

export function getBlogPosts(limit = 24): BlogPost[] {
  return ALL_POSTS.slice(0, limit);
}

export function getRelatedBlogPosts(post: BlogPost, limit = 4): BlogPost[] {
  return ALL_POSTS.filter(
    (p) => p.slug !== post.slug && (p.city === post.city || p.category === post.category)
  ).slice(0, limit);
}
