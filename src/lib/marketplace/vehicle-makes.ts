/**
 * Nigeria marketplace vehicle make → type (model) catalog.
 * Used by homepage vehicle search and shared filters.
 * Values align with `make` / `model` listing columns and `/vehicles` query params.
 */

import type { ThemedSelectOption } from "@/components/ui/themed-select";

/** Make → popular types/models sold on Nigerian marketplaces. */
export const VEHICLE_MAKE_TYPES: Record<string, readonly string[]> = {
  Acura: ["MDX", "RDX", "TLX", "TSX", "ZDX"],
  Audi: ["A3", "A4", "A6", "A8", "Q3", "Q5", "Q7", "Q8"],
  BMW: ["3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X6", "X7"],
  BYD: ["Atto 3", "Dolphin", "Han", "Seal", "Song Plus"],
  Changan: ["Alsvin", "CS35", "CS55", "CS75", "UNI-T", "UNI-V"],
  Chevrolet: ["Aveo", "Camaro", "Captiva", "Cruze", "Equinox", "Malibu", "Spark", "Tahoe", "Trailblazer"],
  Chrysler: ["300", "Pacifica", "Voyager"],
  Citroën: ["C3", "C4", "C5", "Berlingo"],
  Dodge: ["Challenger", "Charger", "Durango", "Journey"],
  Ford: [
    "Edge",
    "Escape",
    "Everest",
    "Explorer",
    "F-150",
    "Fiesta",
    "Focus",
    "Fusion",
    "Mustang",
    "Ranger",
    "Transit",
  ],
  GAC: ["Emzoom", "GS3", "GS4", "GS8"],
  GMC: ["Acadia", "Sierra", "Terrain", "Yukon"],
  Haval: ["H6", "Jolion", "Dargo"],
  Honda: [
    "Accord",
    "Civic",
    "CR-V",
    "Fit",
    "HR-V",
    "Insight",
    "Jazz",
    "Odyssey",
    "Pilot",
    "Stream",
  ],
  Hyundai: [
    "Accent",
    "Creta",
    "Elantra",
    "Ioniq",
    "ix35",
    "Kona",
    "Palisade",
    "Santa Fe",
    "Sonata",
    "Tucson",
  ],
  Infiniti: ["Q50", "QX50", "QX60", "QX80"],
  Innoson: ["G5", "G6", "G80", "IVM Carrier", "IVM Fox"],
  Isuzu: ["D-Max", "MUX", "NPR", "NQR"],
  Jac: ["J7", "S3", "S5", "T6", "T8"],
  Jaguar: ["E-Pace", "F-Pace", "XE", "XF", "XJ"],
  Jeep: ["Cherokee", "Compass", "Grand Cherokee", "Wrangler"],
  Kia: [
    "Carnival",
    "Cerato",
    "Optima",
    "Rio",
    "Seltos",
    "Sorento",
    "Soul",
    "Sportage",
    "Stonic",
  ],
  "Land Rover": [
    "Defender",
    "Discovery",
    "Discovery Sport",
    "Range Rover",
    "Range Rover Evoque",
    "Range Rover Sport",
    "Range Rover Velar",
  ],
  Lexus: ["ES", "GX", "IS", "LX", "NX", "RX", "UX"],
  Lincoln: ["Aviator", "Navigator"],
  Mazda: ["2", "3", "6", "CX-3", "CX-5", "CX-9", "CX-30"],
  "Mercedes-Benz": [
    "A-Class",
    "C-Class",
    "CLA",
    "E-Class",
    "G-Class",
    "GLA",
    "GLC",
    "GLE",
    "GLS",
    "S-Class",
    "Sprinter",
  ],
  MG: ["HS", "ZS", "5", "RX5"],
  Mini: ["Cooper", "Countryman", "Clubman"],
  Mitsubishi: ["ASX", "Lancer", "Outlander", "Pajero", "Pajero Sport"],
  Nissan: [
    "Altima",
    "Frontier",
    "Juke",
    "Maxima",
    "Murano",
    "Navara",
    "Pathfinder",
    "Patrol",
    "Qashqai",
    "Rogue",
    "Sentra",
    "Sunny",
    "X-Trail",
  ],
  Opel: ["Astra", "Corsa", "Insignia", "Mokka"],
  Peugeot: ["2008", "3008", "301", "308", "406", "407", "5008", "508", "Partner"],
  Porsche: ["Cayenne", "Macan", "Panamera", "911"],
  Renault: ["Duster", "Koleos", "Logan", "Megane", "Sandero"],
  Skoda: ["Octavia", "Rapid", "Superb"],
  SsangYong: ["Korando", "Rexton", "Tivoli"],
  Subaru: ["Forester", "Impreza", "Legacy", "Outback", "XV"],
  Suzuki: ["Alto", "Baleno", "Ciaz", "Grand Vitara", "Jimny", "Swift", "Vitara"],
  Tesla: ["Model 3", "Model S", "Model X", "Model Y"],
  Toyota: [
    "4Runner",
    "Avalon",
    "Avanza",
    "Camry",
    "Corolla",
    "Fortuner",
    "Hiace",
    "Highlander",
    "Hilux",
    "Land Cruiser",
    "Matrix",
    "Prado",
    "Prius",
    "RAV4",
    "Sequoia",
    "Sienna",
    "Tacoma",
    "Tundra",
    "Venza",
    "Yaris",
  ],
  Volkswagen: ["Arteon", "Golf", "Jetta", "Passat", "Polo", "Tiguan", "Touareg"],
  Volvo: ["S60", "S90", "XC40", "XC60", "XC90"],
};

/** High-traffic makes on Nigerian marketplaces — shown first in the Make picker. */
export const POPULAR_VEHICLE_MAKES = [
  "Toyota",
  "Honda",
  "Mercedes-Benz",
  "Lexus",
  "Hyundai",
  "Kia",
  "Nissan",
  "Ford",
  "BMW",
  "Volkswagen",
  "Peugeot",
  "Mazda",
] as const;

/** All makes in A–Z order. */
export const VEHICLE_MAKES: readonly string[] = Object.keys(VEHICLE_MAKE_TYPES).sort(
  (a, b) => a.localeCompare(b),
);

export function typesForMake(make: string): readonly string[] {
  if (!make) return [];
  return VEHICLE_MAKE_TYPES[make] ?? [];
}

export function isValidTypeForMake(make: string, type: string): boolean {
  if (!make || !type) return false;
  return typesForMake(make).includes(type);
}

export function buildVehicleMakeSelectOptions(): ThemedSelectOption[] {
  const popularSet = new Set<string>(POPULAR_VEHICLE_MAKES);
  const popular = POPULAR_VEHICLE_MAKES.filter((m) => m in VEHICLE_MAKE_TYPES).map(
    (m) => ({ value: m, label: m }),
  );
  const remaining = VEHICLE_MAKES.filter((m) => !popularSet.has(m)).map((m) => ({
    value: m,
    label: m,
  }));

  return [
    { value: "", label: "Any make" },
    { kind: "header", id: "popular-makes", label: "Popular makes" },
    ...popular,
    { kind: "separator", id: "all-makes", label: "All makes" },
    ...remaining,
  ];
}

export function buildVehicleTypeSelectOptions(make: string): ThemedSelectOption[] {
  const types = typesForMake(make);
  return [
    { value: "", label: make ? "Any type" : "Select make first" },
    ...types.map((t) => ({ value: t, label: t })),
  ];
}
