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
      "Confirm agent identity and fee breakdown before you pay.",
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
  // Aba — South-East hub
  "aba::world bank": {
    vibe: "Busy Aba corridor — young professionals and traders on main road access.",
    highlights: ["Affordable self contains", "Strong transport", "Near commercial zones"],
    typicalRent: "₦250k – ₦650k/yr",
    tips: ["Traffic peaks around market hours — visit twice if possible."],
  },
  "aba::ariaria": {
    vibe: "Market-adjacent living — popular with traders and budget renters.",
    highlights: ["Close to Ariaria Market", "Mixed housing stock", "Walkable shops"],
    typicalRent: "₦200k – ₦550k/yr",
    tips: ["Ask about compound security and water source (borehole vs tanker)."],
  },
  "aba::umungasi": {
    vibe: "Dense residential — face-me-I-face-you and mini flats for workers.",
    highlights: ["Very affordable", "Near inner-city routes", "Active community"],
    typicalRent: "₦150k – ₦400k/yr",
    tips: ["Inspect shared kitchen and toilet arrangements before paying."],
  },
  "aba::osisioma": {
    vibe: "Suburban Aba — bungalows and family compounds away from market noise.",
    highlights: ["Wider streets", "Family homes", "Growing estates"],
    typicalRent: "₦400k – ₦900k/yr",
    tips: ["Confirm distance to your workplace — okada fares add up."],
  },
  "aba::faulks road": {
    vibe: "Central Aba street — room-and-parlour and mini flats for singles.",
    highlights: ["Central location", "Budget options", "Good for first renters"],
    typicalRent: "₦220k – ₦500k/yr",
    tips: ["Verify agent has keys to the actual unit, not a similar one."],
  },
  // Enugu — coal city
  "enugu::gra": {
    vibe: "Enugu GRA — quiet, leafy, preferred by executives and families.",
    highlights: ["Wide roads", "Duplexes & detached homes", "Strong security culture"],
    typicalRent: "₦1.2m – ₦5m/yr",
    tips: ["Sale listings are common here — confirm if rent or purchase."],
  },
  "enugu::trans ekulu": {
    vibe: "Residential Enugu — self contains and flats on tarred streets.",
    highlights: ["Steady power pockets", "Mixed income", "Near amenities"],
    typicalRent: "₦350k – ₦900k/yr",
    tips: ["Check prepaid meter balance with the landlord present."],
  },
  "enugu::independence layout": {
    vibe: "Established layout near UNN corridor — students and young families.",
    highlights: ["Campus proximity", "Serviced flats", "Good road network"],
    typicalRent: "₦500k – ₦1.5m/yr",
    tips: ["Student season affects availability — search early before resumption."],
  },
  "enugu::abakpa": {
    vibe: "Affordable Enugu belt — popular with workers and first-time renters.",
    highlights: ["Budget flats", "Market access", "Growing development"],
    typicalRent: "₦250k – ₦700k/yr",
    tips: ["Hilly streets — confirm water pressure on upper floors."],
  },
  "enugu::uwani": {
    vibe: "Traditional Enugu neighbourhood — mixed old and new builds.",
    highlights: ["Central", "Affordable options", "Local markets nearby"],
    typicalRent: "₦300k – ₦800k/yr",
    tips: ["Parking is tight on older streets — ask before bringing a car."],
  },
  // Owerri — Imo capital
  "owerri::nekede": {
    vibe: "Student belt near FUTO — lodges and self contains dominate.",
    highlights: ["Campus walkable", "Student pricing", "Active rental market"],
    typicalRent: "₦180k – ₦450k/yr",
    tips: ["Confirm if rent is per student or per room in shared flats."],
  },
  "owerri::aladinma": {
    vibe: "Middle-class Owerri — flats and duplexes for families and professionals.",
    highlights: ["Tarred roads", "POP finishes common", "Near town centre"],
    typicalRent: "₦500k – ₦1.2m/yr",
    tips: ["Many agents charge 10% — factor into move-in total."],
  },
  // Lagos extensions
  "lagos::chevron": {
    vibe: "Lekki-adjacent premium — estates and serviced flats.",
    highlights: ["Estate security", "New builds", "Lekki-Epe access"],
    typicalRent: "₦2m – ₦8m/yr",
    tips: ["Confirm ferry or bus commute if you work on the Island."],
  },
  "lagos::surulere": {
    vibe: "Classic Lagos mainland — flats near stadium, markets, and offices.",
    highlights: ["Strong transport", "Mixed rent bands", "Established neighbourhood"],
    typicalRent: "₦800k – ₦2.5m/yr",
    tips: ["Parking varies by street — visit at night to check noise."],
  },
  "lagos::ikeja": {
    vibe: "Airport city hub — GRA pockets and affordable inner streets.",
    highlights: ["Corporate proximity", "Good buses & BRT", "Mixed stock"],
    typicalRent: "₦600k – ₦2.2m/yr",
    tips: ["GRA streets are quieter but pricier than inner Ikeja."],
  },
  "lagos::ajah": {
    vibe: "Lekki corridor growth zone — new estates toward Sangotedo.",
    highlights: ["New developments", "Estate living", "Longer commutes"],
    typicalRent: "₦1.2m – ₦4m/yr",
    tips: ["Traffic on Lekki-Epe express is heavy — test your commute."],
  },
  "lagos::gbagada": {
    vibe: "Mainland bridge access — popular with island workers.",
    highlights: ["Third Mainland access", "Mid rent", "Family flats"],
    typicalRent: "₦500k – ₦1.8m/yr",
    tips: ["Some streets flood in heavy rain — ask tenants."],
  },
  // Abuja extensions
  "abuja::maitama": {
    vibe: "Diplomatic Abuja — premium flats and detached homes.",
    highlights: ["Top security", "Embassy proximity", "High rent band"],
    typicalRent: "₦3m – ₦15m/yr",
    tips: ["Service charge and diesel costs can exceed rent in some blocks."],
  },
  "abuja::lugbe": {
    vibe: "Affordable Abuja fringe — estates popular with civil servants.",
    highlights: ["Estate options", "Airport road access", "Growing infrastructure"],
    typicalRent: "₦450k – ₦1.2m/yr",
    tips: ["Distance to central Abuja matters — budget for transport."],
  },
  // Nationwide — other cities
  "ibadan::bodija": {
    vibe: "Ibadan premium — quiet GRA-style living near UI corridor.",
    highlights: ["Tree-lined streets", "Family homes", "Near UI & malls"],
    typicalRent: "₦500k – ₦2m/yr",
    tips: ["Older buildings may need generator — confirm power arrangement."],
  },
  "kano::nassarawa": {
    vibe: "Central Kano residential — flats for professionals and families.",
    highlights: ["Central location", "Mixed housing", "Strong local market"],
    typicalRent: "₦300k – ₦1.2m/yr",
    tips: ["Confirm water supply schedule in older compounds."],
  },
  "uyo::ewet housing": {
    vibe: "Akwa Ibom flagship estate — planned streets and modern flats.",
    highlights: ["Estate layout", "Government workers", "Calm environment"],
    typicalRent: "₦400k – ₦1.5m/yr",
    tips: ["Popular with civil servants — listings move fast after postings."],
  },
  "benin city::ugbowo": {
    vibe: "UNIBEN student hub — lodges and affordable self contains.",
    highlights: ["Campus adjacent", "Student pricing", "Active agents"],
    typicalRent: "₦180k – ₦500k/yr",
    tips: ["Resumption weeks are peak — book inspections early."],
  },
  "calabar::marian": {
    vibe: "Calabar hillside — views, estates, and family homes.",
    highlights: ["Scenic area", "Expat-friendly pockets", "Estate security"],
    typicalRent: "₦400k – ₦1.8m/yr",
    tips: ["Rainy season access roads can be tricky on hilly streets."],
  },
  "kaduna::barnawa": {
    vibe: "Kaduna mid-market — flats near shopping and schools.",
    highlights: ["Family area", "Good amenities", "Mixed rent"],
    typicalRent: "₦350k – ₦1.2m/yr",
    tips: ["Verify compound gate security before evening viewings."],
  },
  "asaba::core area": {
    vibe: "Delta capital centre — flats for workers and business travellers.",
    highlights: ["Central", "Shortlet-friendly", "River state access"],
    typicalRent: "₦350k – ₦1.4m/yr",
    tips: ["Many listings target weekly/monthly corporate lets — confirm period."],
  },
  "warri::effurun": {
    vibe: "Warri-Effurun corridor — oil-sector workers and families.",
    highlights: ["Industrial proximity", "Mixed estates", "Active rental market"],
    typicalRent: "₦350k – ₦1.5m/yr",
    tips: ["Confirm if rent includes security levy in estate homes."],
  },
  "jos::rayfield": {
    vibe: "Jos premium — cool climate and spacious compounds.",
    highlights: ["Cool weather", "Detached homes", "Quiet streets"],
    typicalRent: "₦400k – ₦1.6m/yr",
    tips: ["Heating isn't needed but water tanks matter in dry season."],
  },
  "akure::alagbaka": {
    vibe: "Ondo capital GRA — government workers and professionals.",
    highlights: ["GRA layout", "Near state offices", "Calm living"],
    typicalRent: "₦300k – ₦1m/yr",
    tips: ["FUTA staff often prefer here over student zones."],
  },
  "onitsha::gra": {
    vibe: "Onitsha upscale — away from market bustle, estate living.",
    highlights: ["Quieter than main market", "Family homes", "Security gates"],
    typicalRent: "₦400k – ₦1.5m/yr",
    tips: ["Market traffic nearby — visit during business hours to judge noise."],
  },
  "abeokuta::panseke": {
    vibe: "Ogun capital student/worker mix — affordable self contains.",
    highlights: ["Near institutions", "Budget rent", "Growing builds"],
    typicalRent: "₦200k – ₦550k/yr",
    tips: ["Hilly terrain — confirm okada or bus access to your route."],
  },
  "port harcourt::woji": {
    vibe: "PH residential — mid-income flats away from oil hub noise.",
    highlights: ["Family area", "Shops & schools", "Mixed stock"],
    typicalRent: "₦500k – ₦1.8m/yr",
    tips: ["Some zones flood — ask about rainy season history."],
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
      "Decide viewing and agency fees on your terms — receipts help.",
    ],
  };
}
