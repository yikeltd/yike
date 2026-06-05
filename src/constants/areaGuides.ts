import type { AreaProfile } from "@/constants/areaProfiles";
import { getAreaProfiles } from "@/constants/areaProfiles";

export type AreaGuide = {
  vibe: string;
  highlights: string[];
  typicalRent?: string;
  tips: string[];
};

const GUIDES: Record<string, AreaGuide> = {
  "aba::ogbor hill": {
    vibe: "Quiet residential hill close to Abia Poly — popular with families and professionals.",
    highlights: ["Gated streets", "Near Abia Poly", "Good road network"],
    typicalRent: "₦280k – ₦1.2m/yr",
    tips: [
      "Ask about borehole vs water board supply.",
      "Most flats are yearly rent with 10% agency fee.",
    ],
  },
  "lagos::lekki": {
    vibe: "Premium Lekki corridor — estates, terraces, and serviced apartments.",
    highlights: ["Estate security", "Tarred roads", "Schools & malls nearby"],
    typicalRent: "₦2.5m – ₦12m/yr",
    tips: [
      "Confirm service charge and diesel/generator arrangements.",
      "Traffic to VI can be heavy — visit at peak hours.",
    ],
  },
  "lagos::yaba": {
    vibe: "Student and young-professional hub near UNILAG and YABATECH.",
    highlights: ["Campus proximity", "Strong transport links", "Affordable options"],
    typicalRent: "₦350k – ₦1.8m/yr",
    tips: [
      "Self contains are most common for students.",
      "Inspect prepaid meter readings before paying.",
    ],
  },
  "abuja::wuse 2": {
    vibe: "Central Abuja — restaurants, offices, and mid-to-high rent flats.",
    highlights: ["Walkable amenities", "Strong security presence", "Corporate tenants"],
    typicalRent: "₦1.5m – ₦6m/yr",
    tips: [
      "Parking can be limited in older blocks.",
      "Verify agent identity before inspection fees.",
    ],
  },
  "abuja::gwarinpa": {
    vibe: "Family-friendly estate district with schools and markets.",
    highlights: ["Wide roads", "Mixed income housing", "Popular with civil servants"],
    typicalRent: "₦800k – ₦3.5m/yr",
    tips: ["Estate dues vary — ask upfront.", "Borehole backup is common."],
  },
  "enugu::new haven": {
    vibe: "Established Enugu neighbourhood with shops and calm streets.",
    highlights: ["Near Shoprite", "Duplexes & flats", "Good for families"],
    typicalRent: "₦600k – ₦2.5m/yr",
    tips: ["GRA alternatives may be pricier but quieter."],
  },
  "owerri::ikenegbu": {
    vibe: "Central Owerri — shortlets, flats, and nightlife nearby.",
    highlights: ["Shortlet friendly", "Walkable", "Hospital & banks close"],
    typicalRent: "₦350k – ₦1.5m/yr",
    tips: ["Shortlets often include WiFi and housekeeping."],
  },
  "port harcourt::gra": {
    vibe: "PH GRA — quiet, leafy, favoured by expats and senior staff.",
    highlights: ["Low crime perception", "Spacious compounds", "Generator essential"],
    typicalRent: "₦1.2m – ₦4m/yr",
    tips: ["Confirm flood history during rainy season."],
  },
};

const PROFILE_COPY: Record<AreaProfile, string> = {
  luxury: "Premium neighbourhood — higher rent, stronger security, estate living.",
  mid_income: "Balanced area — mix of flats and family homes at moderate rent.",
  affordable: "Budget-friendly — popular with first-time renters and workers.",
  student: "Student zone — self contains and lodges near campus.",
  commercial: "Business district — shops, offices, and high foot traffic.",
};

export function getAreaGuide(city: string, area: string): AreaGuide | null {
  const key = `${city.toLowerCase()}::${area.toLowerCase()}`;
  const custom = GUIDES[key];
  if (custom) return custom;

  const profiles = getAreaProfiles(city, area);
  if (profiles.length === 0) return null;

  const primary = profiles[0];
  return {
    vibe: PROFILE_COPY[primary],
    highlights: profiles.map((p) => PROFILE_COPY[p]),
    tips: [
      "Use WhatsApp to confirm total move-in cost before paying.",
      "Never pay inspection fees to unverified agents.",
    ],
  };
}
