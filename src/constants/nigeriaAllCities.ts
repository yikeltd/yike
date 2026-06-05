import {
  getAllCities,
  getCitiesForState,
  nigeriaLocations,
  NIGERIAN_STATES,
} from "@/constants/nigeriaLocations";
import { getLgasForState } from "@/constants/nigeriaLgas";

/** State capitals — every state has at least one searchable city */
export const STATE_CAPITALS: Record<string, string> = {
  Abia: "Umuahia",
  Adamawa: "Yola",
  "Akwa Ibom": "Uyo",
  Anambra: "Awka",
  Bauchi: "Bauchi",
  Bayelsa: "Yenagoa",
  Benue: "Makurdi",
  Borno: "Maiduguri",
  "Cross River": "Calabar",
  Delta: "Asaba",
  Ebonyi: "Abakaliki",
  Edo: "Benin City",
  Ekiti: "Ado Ekiti",
  Enugu: "Enugu",
  FCT: "Abuja",
  Gombe: "Gombe",
  Imo: "Owerri",
  Jigawa: "Dutse",
  Kaduna: "Kaduna",
  Kano: "Kano",
  Katsina: "Katsina",
  Kebbi: "Birnin Kebbi",
  Kogi: "Lokoja",
  Kwara: "Ilorin",
  Lagos: "Lagos",
  Nasarawa: "Lafia",
  Niger: "Minna",
  Ogun: "Abeokuta",
  Ondo: "Akure",
  Osun: "Osogbo",
  Oyo: "Ibadan",
  Plateau: "Jos",
  Rivers: "Port Harcourt",
  Sokoto: "Sokoto",
  Taraba: "Jalingo",
  Yobe: "Damaturu",
  Zamfara: "Gusau",
};

/** Every city, town, and searchable locality in a state */
export function getAllCitiesForState(state: string): string[] {
  const cities = new Set<string>();
  const capital = STATE_CAPITALS[state];
  if (capital) cities.add(capital);

  for (const city of getCitiesForState(state)) {
    cities.add(city);
  }

  const stateData = nigeriaLocations[state]?.cities ?? {};
  for (const [city, areas] of Object.entries(stateData)) {
    cities.add(city);
    for (const area of areas) cities.add(area);
  }

  for (const lga of getLgasForState(state)) {
    cities.add(lga);
  }

  return [...cities].sort((a, b) => a.localeCompare(b));
}

/** Complete nationwide city/locality list */
export function getAllCitiesComplete(): string[] {
  const cities = new Set<string>(getAllCities());

  for (const state of NIGERIAN_STATES) {
    for (const city of getAllCitiesForState(state)) {
      cities.add(city);
    }
  }

  return [...cities].sort((a, b) => a.localeCompare(b));
}

export function getAllStates(): string[] {
  return [...NIGERIAN_STATES].sort((a, b) => a.localeCompare(b));
}
