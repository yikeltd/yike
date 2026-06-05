/**
 * Area zone profiles for search ranking, SEO, and future recommendations.
 * Not stored per-listing yet — used for discovery and scaling.
 */

export type AreaProfile =
  | "luxury"
  | "mid_income"
  | "affordable"
  | "student"
  | "commercial";

export type AreaProfileEntry = {
  city: string;
  area: string;
  profiles: AreaProfile[];
};

function entry(
  city: string,
  area: string,
  profiles: AreaProfile[]
): AreaProfileEntry {
  return { city, area, profiles };
}

export const AREA_PROFILES: AreaProfileEntry[] = [
  // Luxury Lagos
  ...["Banana Island", "Ikoyi", "Victoria Island", "Lekki Phase 1", "Parkview", "Oniru", "VGC"].map(
    (a) => entry("Lagos", a, ["luxury"])
  ),
  // Luxury Abuja
  ...["Maitama", "Asokoro", "Guzape", "Katampe Extension", "Wuse 2"].map((a) =>
    entry("Abuja", a, ["luxury"])
  ),
  // Mid-income
  ...["Gbagada", "Ogudu", "Maryland", "Surulere", "Yaba", "Festac", "Ikorodu"].map(
    (a) => entry("Lagos", a, ["mid_income"])
  ),
  ...["Gwarinpa", "Jahi", "Lugbe", "Kubwa"].map((a) =>
    entry("Abuja", a, ["mid_income"])
  ),
  ...["Woji", "Eliozu", "Ada George"].map((a) =>
    entry("Port Harcourt", a, ["mid_income"])
  ),
  // Affordable
  ...["Ikorodu", "Egbeda", "Ayobo", "Ipaja", "Ikotun", "Iyana Ipaja"].map((a) =>
    entry("Lagos", a, ["affordable"])
  ),
  ...["Nyanya", "Mararaba", "Karu", "Kubwa"].map((a) =>
    entry("Abuja", a, ["affordable"])
  ),
  ...["Choba", "Eneka"].map((a) => entry("Port Harcourt", a, ["affordable"])),
  ...["Osisioma", "World Bank"].map((a) => entry("Aba", a, ["affordable"])),
  ...["Abakpa"].map((a) => entry("Enugu", a, ["affordable"])),
  ...["Nekede"].map((a) => entry("Owerri", a, ["affordable"])),
  // Student
  ...["UNILAG Area", "LASU Area", "YABATECH Area", "Akoka"].map((a) =>
    entry("Lagos", a, ["student"])
  ),
  ...["UNN Nsukka", "ESUT Area"].map((a) => entry("Enugu", a, ["student"])),
  ...["FUTO Area", "IMSU Area", "Nekede"].map((a) =>
    entry("Owerri", a, ["student"])
  ),
  ...["UI Area", "UI"].map((a) => entry("Ibadan", a, ["student"])),
  ...["FUTA Area"].map((a) => entry("Akure", a, ["student"])),
  ...["UNILORIN Area"].map((a) => entry("Ilorin", a, ["student"])),
  ...["UNIBEN Area", "Ugbowo"].map((a) => entry("Benin City", a, ["student"])),
  ...["UNIPORT Area", "Choba"].map((a) =>
    entry("Port Harcourt", a, ["student"])
  ),
  ...["UniUyo Area"].map((a) => entry("Uyo", a, ["student"])),
  ...["FUNAAB Area"].map((a) => entry("Abeokuta", a, ["student"])),
  // Commercial
  ...["CMS", "Marina", "Broad Street", "Idumota", "Balogun", "Trade Fair", "Computer Village", "Ladipo", "Alaba International"].map(
    (a) => entry("Lagos", a, ["commercial"])
  ),
  ...["Ariaria Market", "Cemetery Market", "Ngwa Road Market"].map((a) =>
    entry("Aba", a, ["commercial"])
  ),
  ...["Main Market", "Bridgehead", "Upper Iweka"].map((a) =>
    entry("Onitsha", a, ["commercial"])
  ),
  ...["Sabon Gari", "Singer Market"].map((a) => entry("Kano", a, ["commercial"])),
  ...["Area 1", "Area 10", "Wuse Market", "Garki Market"].map((a) =>
    entry("Abuja", a, ["commercial"])
  ),
];

const profileIndex = new Map<string, AreaProfile[]>();

for (const { city, area, profiles } of AREA_PROFILES) {
  const key = `${city.toLowerCase()}::${area.toLowerCase()}`;
  const existing = profileIndex.get(key) ?? [];
  profileIndex.set(key, [...new Set([...existing, ...profiles])]);
}

export function getAreaProfiles(city: string, area: string): AreaProfile[] {
  return (
    profileIndex.get(`${city.toLowerCase()}::${area.toLowerCase()}`) ?? []
  );
}

export function getAreasByProfile(
  profile: AreaProfile,
  city?: string
): AreaProfileEntry[] {
  return AREA_PROFILES.filter(
    (e) =>
      e.profiles.includes(profile) &&
      (!city || e.city.toLowerCase() === city.toLowerCase())
  );
}
