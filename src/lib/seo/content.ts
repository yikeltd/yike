import { getCityPersonality } from "@/constants/cityPersonalities";
import { getAreaGuide } from "@/constants/areaGuides";
import type { SeoPropertyType } from "@/constants/seoPropertyTypes";

export type SeoFaq = { q: string; a: string };

export function buildCityIntro(city: string, state: string): string[] {
  const p = getCityPersonality(city);
  return [
    `${city} is one of Nigeria's most active housing markets. Whether you are looking for a self contain, family flat, shop space or shortlet, ${city} offers options across many neighborhoods — but prices and quality vary sharply by area.`,
    `${p.rentalGuide}`,
    `On Yike, you browse listings from identity-checked agents and contact them directly on WhatsApp. We do not process rent or hold deposits — you inspect first, then pay when satisfied. Report suspicious listings if something looks off.`,
    `Use the sections below to explore popular neighborhoods in ${city}, compare property types, and read safety tips before you commit.`,
  ];
}

export function buildNeighborhoodIntro(
  city: string,
  neighborhood: string,
  state: string
): string[] {
  const guide = getAreaGuide(city, neighborhood);
  const p = getCityPersonality(city);
  const vibe = guide?.vibe ?? `${neighborhood} is a well-known area in ${city} with mixed residential and commercial options.`;
  const rent = guide?.typicalRent
    ? `Typical rent guidance: ${guide.typicalRent}.`
    : `Rent in ${neighborhood} depends on property type, road access and amenities — compare multiple listings before deciding.`;

  return [
    `${neighborhood} in ${city}, ${state} attracts renters who want ${guide?.highlights?.[0]?.toLowerCase() ?? "convenient access to daily needs"}. ${vibe}`,
    rent,
    `${p.rentalGuide}`,
    guide?.tips?.[0]
      ? `Local tip: ${guide.tips[0]}`
      : `Always meet agents at the actual property — not a random office — before paying inspection fees or rent.`,
    `Browse verified listings below or explore related property types and nearby areas.`,
  ];
}

export function buildPropertyTypeIntro(
  city: string,
  neighborhood: string,
  type: SeoPropertyType
): string[] {
  const guide = getAreaGuide(city, neighborhood);
  const rent = guide?.typicalRent
    ? `In ${neighborhood}, overall rent ranges around ${guide.typicalRent}; ${type.label.toLowerCase()} units often sit at the lower or mid end depending on finish and access road.`
    : `Compare at least three ${type.label.toLowerCase()} listings in ${neighborhood} before paying — photos can be outdated.`;

  const checks =
    type.group === "commercial"
      ? "Confirm shop frontage, customer parking, power supply and any market levy before signing."
      : type.group === "student"
        ? "Ask about distance to campus, shared kitchen/bathroom rules, and whether rent is per session or yearly."
        : "Check water source, prepaid meter, security, and who handles repairs before you pay caution deposit.";

  return [
    `Looking for a ${type.label.toLowerCase()} in ${neighborhood}, ${city}? Yike lists verified options you can compare by price, photos and agent contact — with WhatsApp as the primary channel.`,
    rent,
    checks,
    `Yike helps reduce fake listing risk through agent identity checks and user reports — but you should still inspect in person and verify documents. We do not guarantee every listing or process payments on your behalf.`,
  ];
}

export function buildCityFaqs(city: string): SeoFaq[] {
  const p = getCityPersonality(city);
  return [
    ...p.faqs,
    {
      q: `How do I find verified agents in ${city}?`,
      a: "Look for the Verified badge on listings and agent profiles. You can still inspect properties yourself before any payment.",
    },
    {
      q: `Can I list my property in ${city} for free?`,
      a: "Yes. Agents and landlords can list on Yike at no cost during launch. Listings are reviewed before going live.",
    },
    {
      q: "What if a listing looks fake?",
      a: "Use the report button on the listing page. Never pay large sums before a physical inspection.",
    },
  ];
}

export function buildNeighborhoodFaqs(
  city: string,
  neighborhood: string
): SeoFaq[] {
  return [
    {
      q: `Is ${neighborhood} a good area to rent in ${city}?`,
      a: "It depends on your budget and commute. Compare multiple listings, visit at different times of day, and read the area guide above.",
    },
    {
      q: `What rent should I expect in ${neighborhood}?`,
      a: "See typical rent guidance on this page if available. Always confirm the exact price, payment period and extra charges with the agent.",
    },
    {
      q: "Does Yike collect rent?",
      a: "No. Yike is a discovery platform. Rent and deposits are arranged directly between you and the agent or landlord.",
    },
  ];
}

export function buildPropertyTypeFaqs(
  city: string,
  neighborhood: string,
  type: SeoPropertyType
): SeoFaq[] {
  return [
    {
      q: `How much does a ${type.label.toLowerCase()} cost in ${neighborhood}?`,
      a: "Prices vary by condition, road access and amenities. Use the listings below as a live reference and negotiate after inspection.",
    },
    {
      q: `Are these ${type.pluralLabel.toLowerCase()} verified?`,
      a: "Some listings and agents carry verification badges. Always inspect in person — verification reduces risk but does not replace your own due diligence.",
    },
    {
      q: "Can I request a property if nothing matches?",
      a: "Yes. Use our Request a Property form and agents in your area can reach you on WhatsApp when there is a match.",
    },
  ];
}
