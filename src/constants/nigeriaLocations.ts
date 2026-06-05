import { locationExpansions } from "@/constants/locationExpansions";
import { locationExpansionsPhase3 } from "@/constants/locationExpansionsPhase3";

const ALL_LOCATION_EXPANSIONS = [locationExpansions, locationExpansionsPhase3];

/**
 * Central Nigerian location architecture: State → City → Area/Neighborhood
 * Used platform-wide for search, listings, SEO, and future map integration.
 */

export type NigeriaLocations = Record<
  string,
  { cities: Record<string, string[]> }
>;

function mergeLocationExpansions(
  base: NigeriaLocations
): NigeriaLocations {
  const result: NigeriaLocations = JSON.parse(JSON.stringify(base));
  for (const expansion of ALL_LOCATION_EXPANSIONS) {
    for (const [state, cities] of Object.entries(expansion)) {
      if (!result[state]) result[state] = { cities: {} };
      for (const [city, areas] of Object.entries(cities)) {
        const existing = result[state].cities[city] ?? [];
        result[state].cities[city] = [...new Set([...existing, ...areas])].sort();
      }
    }
  }
  return result;
}

const baseNigeriaLocations: NigeriaLocations = {
  Lagos: {
    cities: {
      Lekki: [
        "Chevron",
        "Ikate",
        "Sangotedo",
        "Lekki Phase 1",
        "Lekki Phase 2",
        "Ajah",
        "Ikoyi Link Road",
        "Osapa London",
        "Agungi",
        "Orchid Road",
      ],
      "Victoria Island": ["VI", "Oniru", "Banana Island", "Ligali Ayorinde"],
      Ikoyi: ["Parkview", "Gerrard Road", "Bourdillon", "Old Ikoyi"],
      Yaba: ["Sabo", "Akoka", "Ebute Metta Adjacent", "Tejuosho"],
      Surulere: ["Aguda", "Itire", "Lawanson", "Bode Thomas"],
      Ikeja: ["Maryland", "Ogba", "Allen Avenue", "Ikeja GRA", "Alausa", "Opebi"],
      Gbagada: ["Ifako", "Oworo", "Atunrase", "Sholuyi"],
      Magodo: ["Magodo Phase 1", "Magodo Phase 2", "Isheri"],
      Ikorodu: ["Ita Oluwo", "Ebute", "Agric", "Igbogbo"],
      Festac: ["Festac Town", "Amuwo Odofin", "Satellite Town"],
      Maryland: ["Mende", "Anthony", "Ojota"],
      Agege: ["Pencinema", "Iloro", "Tabon Tabon"],
      Mushin: ["Palm Avenue", "Olosha", "Idi Oro"],
      Ogudu: ["Ogudu GRA", "Ojota"],
      Ogba: ["Ogba Ikeja", "Agidingbi"],
      Alimosho: ["Egbeda", "Iyana Ipaja", "Akowonjo", "Abule Egba"],
      Apapa: ["Apapa GRA", "Creek Road"],
      Badagry: ["Badagry Town", "Ajara"],
      Epe: ["Epe Town", "Lekki Epe Expressway"],
    },
  },
  FCT: {
    cities: {
      Abuja: [
        "Wuse",
        "Wuse 2",
        "Maitama",
        "Asokoro",
        "Gwarinpa",
        "Jahi",
        "Lugbe",
        "Kubwa",
        "Katampe",
        "Lokogoma",
        "Apo",
        "Gudu",
        "Utako",
        "Durumi",
        "Karmo",
        "Jikwoyi",
        "Life Camp",
        "Kuje",
        "Garki",
      ],
    },
  },
  Rivers: {
    cities: {
      "Port Harcourt": [
        "GRA",
        "Rumuola",
        "Woji",
        "Eliozu",
        "Ada George",
        "Choba",
        "Rukpokwu",
        "Rumuokoro",
        "Trans Amadi",
        "D-Line",
        "Old GRA",
        "Peter Odili",
      ],
      Omoku: ["Omoku Town", "Egbema"],
      Bonny: ["Bonny Island"],
    },
  },
  Abia: {
    cities: {
      Aba: [
        "Ogbor Hill",
        "Ariaria",
        "Faulks Road",
        "Osisioma",
        "World Bank",
        "Abayi",
        "Umungasi",
        "Eziukwu",
        "Factory Road",
        "Port Harcourt Road",
        "Brass Junction",
      ],
      Umuahia: ["Umuahia Town", "World Bank Umuahia", "Ubakala"],
    },
  },
  Enugu: {
    cities: {
      Enugu: [
        "Independence Layout",
        "New Haven",
        "GRA",
        "Trans Ekulu",
        "Achara Layout",
        "Emene",
        "Uwani",
        "Abakpa",
        "Ogui",
        "Coal Camp",
      ],
      Nsukka: ["Nsukka Town", "University Gate", "Opi"],
    },
  },
  Imo: {
    cities: {
      Owerri: [
        "Ikenegbu",
        "World Bank",
        "New Owerri",
        "Aladinma",
        "Orji",
        "Nekede",
        "Wetheral Road",
        "Douglas Road",
      ],
      Orlu: ["Orlu Town", "Amaifeke"],
      Okigwe: ["Okigwe Town"],
    },
  },
  Edo: {
    cities: {
      "Benin City": [
        "GRA",
        "Ugbowo",
        "Sapele Road",
        "Aduwawa",
        "Ikpoba Hill",
        "Ring Road",
        "New Benin",
        "Ekenwan",
      ],
      Ekpoma: ["Ekpoma Town", "Ambrose Alli University"],
      Auchi: ["Auchi Town", "FCE Auchi"],
    },
  },
  "Akwa Ibom": {
    cities: {
      Uyo: [
        "Ewet Housing",
        "Shelter Afrique",
        "Osongama",
        "Aka Road",
        "Ikot Ekpene Road",
        "Itam",
        "Ewet Offot",
      ],
      Eket: ["Eket Town", "Ibeno"],
      "Ikot Ekpene": ["Ikot Ekpene Town"],
    },
  },
  Delta: {
    cities: {
      Warri: ["Effurun", "Enerhen", "DSC Express", "Udu", "Ekpan", "Warri GRA"],
      Asaba: ["DBS Road", "Okpanam", "Anwai Road", "Core Area", "Summit Road"],
      Ughelli: ["Ughelli Town", "Oteri"],
      Sapele: ["Sapele Town", "Amukpe"],
      Agbor: ["Agbor Town", "Alihame"],
    },
  },
  Anambra: {
    cities: {
      Awka: ["Aroma", "Ifite", "Temporary Site", "Agu Awka", "Amawbia"],
      Onitsha: ["Fegge", "GRA Onitsha", "Awada", "Harbour Road"],
      Nnewi: ["Nnewi Town", "Otolo", "Uruagu"],
      Ekwulobia: ["Ekwulobia Town"],
    },
  },
  "Cross River": {
    cities: {
      Calabar: [
        "State Housing",
        "Marian",
        "Parliamentary",
        "MCC Road",
        "Satellite Town",
        "8 Miles",
        "Atimbo",
      ],
      Ikom: ["Ikom Town"],
      Obudu: ["Obudu Town", "Obudu Ranch"],
    },
  },
  Kaduna: {
    cities: {
      Kaduna: ["Barnawa", "Ungwan Rimi", "Sabon Tasha", "Rigasa", "Narayi", "Kakuri"],
      Zaria: ["Zaria Town", "Samaru", "ABU Zaria"],
      Kafanchan: ["Kafanchan Town"],
    },
  },
  Kano: {
    cities: {
      Kano: ["Nassarawa", "Tarauni", "Hotoro", "Rijiyar Zaki", "Bompai", "Sabon Gari"],
      Wudil: ["Wudil Town"],
    },
  },
  Oyo: {
    cities: {
      Ibadan: ["Bodija", "Akobo", "Oluyole", "Challenge", "UI", "Agodi GRA", "Mokola", "Ring Road"],
      Ogbomosho: ["Ogbomosho Town"],
      Oyo: ["Oyo Town"],
    },
  },
  Kwara: {
    cities: {
      Ilorin: ["Tanke", "GRA", "Fate", "Adewole", "Unity Road", "Taiwo Road"],
      Offa: ["Offa Town"],
    },
  },
  Ogun: {
    cities: {
      Abeokuta: ["Ibara", "Lafenwa", "Adigbe", "Panseke", "Kuto", "Asero"],
      "Ijebu Ode": ["Ijebu Ode Town"],
      Sagamu: ["Sagamu Town", "Makun"],
      Ota: ["Ota Town", "Sango", "Agbara"],
    },
  },
  Plateau: {
    cities: {
      Jos: ["Rayfield", "Bukuru", "Tudun Wada", "Bukuru Low Cost", "Angwan Rukuba"],
      Bukuru: ["Bukuru Town"],
    },
  },
  Ondo: {
    cities: {
      Akure: ["Alagbaka", "Ijapo Estate", "Oba Ile", "Shasha"],
      "Ondo Town": ["Ondo Town"],
      Owo: ["Owo Town"],
    },
  },
  Adamawa: {
    cities: {
      Yola: ["Jimeta", "Doubeli", "VIN"],
      Mubi: ["Mubi Town", "Mubi North"],
    },
  },
  Bauchi: {
    cities: { Bauchi: ["Bauchi Town", "Yelwa", "Wunti"], Azare: ["Azare Town"] },
  },
  Bayelsa: {
    cities: { Yenagoa: ["Yenagoa Town", "Kpansia", "Amarata"], Amassoma: ["NDU"] },
  },
  Benue: {
    cities: { Makurdi: ["Wurukum", "High Level", "North Bank"], Gboko: ["Gboko Town"] },
  },
  Borno: {
    cities: { Maiduguri: ["Maiduguri Town", "Bulumkutu", "Gwange"] },
  },
  Ebonyi: {
    cities: { Abakaliki: ["Abakaliki Town", "Presco"], Afikpo: ["Afikpo Town"] },
  },
  Ekiti: {
    cities: { "Ado Ekiti": ["Ado Ekiti Town", "Fajuyi"], Ikere: ["Ikere Ekiti"] },
  },
  Gombe: {
    cities: { Gombe: ["Gombe Town", "Tumfure"], Bajoga: ["Bajoga Town"] },
  },
  Jigawa: {
    cities: { Dutse: ["Dutse Town"], Hadejia: ["Hadejia Town"] },
  },
  Katsina: {
    cities: { Katsina: ["Katsina Town"], Daura: ["Daura Town"] },
  },
  Kebbi: {
    cities: { "Birnin Kebbi": ["Birnin Kebbi Town"], Argungu: ["Argungu Town"] },
  },
  Kogi: {
    cities: { Lokoja: ["Lokoja Town", "Ganaja"], Okene: ["Okene Town"] },
  },
  Nasarawa: {
    cities: {
      Lafia: ["Lafia Town"],
      Keffi: ["Keffi Town"],
      Karu: ["Karu", "Mararaba", "One Man Village"],
    },
  },
  Niger: {
    cities: { Minna: ["Minna Town", "Bosso"], Suleja: ["Suleja Town", "Maitama Suleja"] },
  },
  Osun: {
    cities: { Osogbo: ["Osogbo Town", "Oke Baale"], "Ile-Ife": ["Ile-Ife Town", "OAU"] },
  },
  Sokoto: {
    cities: { Sokoto: ["Sokoto Town", "Gidan Iliya"] },
  },
  Taraba: {
    cities: { Jalingo: ["Jalingo Town"], Wukari: ["Wukari Town"] },
  },
  Yobe: {
    cities: { Damaturu: ["Damaturu Town"], Potiskum: ["Potiskum Town"] },
  },
  Zamfara: {
    cities: { Gusau: ["Gusau Town"], "Kaura Namoda": ["Kaura Namoda Town"] },
  },
};

export const nigeriaLocations: NigeriaLocations =
  mergeLocationExpansions(baseNigeriaLocations);

/** Major metros + underserved cities surfaced first in pickers */
export const POPULAR_CITIES = [
  "Lagos",
  "Abuja",
  "Port Harcourt",
  "Aba",
  "Enugu",
  "Owerri",
  "Benin City",
  "Uyo",
  "Asaba",
  "Awka",
  "Calabar",
  "Kano",
  "Kaduna",
  "Ibadan",
  "Warri",
  "Abeokuta",
  "Jos",
  "Akure",
  "Ilorin",
  "Onitsha",
  "Yenagoa",
  "Maiduguri",
  "Sokoto",
] as const;

export type PopularCity = (typeof POPULAR_CITIES)[number];

/** All states from location dataset */
export const NIGERIAN_STATES = Object.keys(nigeriaLocations).sort() as string[];

/** Flat city → areas map for search forms (includes district-level keys for Lagos) */
export function buildCityAreasMap(): Record<string, string[]> {
  const map: Record<string, string[]> = {};

  for (const [, { cities }] of Object.entries(nigeriaLocations)) {
    for (const [city, areas] of Object.entries(cities)) {
      const existing = map[city] ?? [];
      const merged = [...new Set([city, ...areas, ...existing])];
      map[city] = merged.sort();
    }
  }

  // Lagos mega-city: all districts + all sub-areas searchable under "Lagos"
  const lagosDistricts = nigeriaLocations.Lagos?.cities ?? {};
  const lagosAll: string[] = [];
  for (const [district, subs] of Object.entries(lagosDistricts)) {
    lagosAll.push(district, ...subs);
  }
  map.Lagos = [...new Set(lagosAll)].sort();

  // FCT alias
  map.Abuja = map.Abuja ?? nigeriaLocations.FCT?.cities.Abuja ?? [];

  return map;
}

export const CITY_AREAS: Record<string, string[]> = buildCityAreasMap();

export function getStates(): string[] {
  return NIGERIAN_STATES;
}

export function getCitiesForState(state: string): string[] {
  return Object.keys(nigeriaLocations[state]?.cities ?? {});
}

export function getAreasForCity(state: string, city: string): string[] {
  const areas = nigeriaLocations[state]?.cities[city];
  if (!areas) return CITY_AREAS[city] ?? [];
  return [city, ...areas];
}

export function getStateForCity(city: string): string | undefined {
  for (const [state, { cities }] of Object.entries(nigeriaLocations)) {
    if (city in cities) return state;
  }
  if (city === "Abuja") return "FCT";
  if (CITY_AREAS.Lagos?.includes(city)) return "Lagos";
  return undefined;
}

/** All searchable city names across Nigeria */
export function getAllCities(): string[] {
  const cities = new Set<string>();
  for (const { cities: stateCities } of Object.values(nigeriaLocations)) {
    for (const city of Object.keys(stateCities)) {
      cities.add(city);
    }
  }
  cities.add("Lagos");
  cities.add("Abuja");
  return [...cities].sort();
}

export function getAreasForSearchCity(city: string): string[] {
  return CITY_AREAS[city] ?? [];
}
