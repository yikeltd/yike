/**
 * Nearby city / state expansion for local-first discovery fallbacks.
 */

import { CITY_CENTROIDS, haversineKm, resolveCityCentroid } from "./centroids";

/** Land-border / market-adjacent Nigerian states. */
export const NEARBY_STATES: Record<string, readonly string[]> = {
  Abia: ["Imo", "Anambra", "Ebonyi", "Rivers", "Akwa Ibom", "Cross River"],
  Adamawa: ["Borno", "Gombe", "Taraba", "Bauchi"],
  "Akwa Ibom": ["Cross River", "Abia", "Rivers", "Ebonyi"],
  Anambra: ["Enugu", "Imo", "Abia", "Delta", "Kogi", "Ebonyi"],
  Bauchi: ["Gombe", "Plateau", "Kaduna", "Kano", "Jigawa", "Yobe", "Taraba", "Adamawa"],
  Bayelsa: ["Rivers", "Delta", "Imo"],
  Benue: ["Nasarawa", "Taraba", "Cross River", "Enugu", "Kogi", "Ebonyi"],
  Borno: ["Yobe", "Adamawa", "Gombe"],
  "Cross River": ["Akwa Ibom", "Ebonyi", "Benue", "Abia"],
  Delta: ["Edo", "Anambra", "Imo", "Rivers", "Bayelsa", "Ondo"],
  Ebonyi: ["Enugu", "Abia", "Cross River", "Benue", "Anambra", "Imo"],
  Edo: ["Delta", "Ondo", "Kogi", "Anambra"],
  Ekiti: ["Ondo", "Osun", "Kwara", "Kogi"],
  Enugu: ["Anambra", "Ebonyi", "Benue", "Kogi", "Imo", "Abia"],
  FCT: ["Niger", "Nasarawa", "Kogi", "Kaduna"],
  Gombe: ["Bauchi", "Adamawa", "Borno", "Yobe", "Taraba"],
  Imo: ["Abia", "Anambra", "Rivers", "Delta", "Enugu", "Bayelsa"],
  Jigawa: ["Kano", "Bauchi", "Yobe", "Katsina"],
  Kaduna: ["Katsina", "Kano", "Bauchi", "Plateau", "Nasarawa", "Niger", "FCT", "Zamfara"],
  Kano: ["Jigawa", "Bauchi", "Kaduna", "Katsina"],
  Katsina: ["Kano", "Jigawa", "Kaduna", "Zamfara", "Sokoto"],
  Kebbi: ["Sokoto", "Zamfara", "Niger", "Kwara"],
  Kogi: ["FCT", "Nasarawa", "Benue", "Enugu", "Anambra", "Edo", "Ondo", "Ekiti", "Kwara", "Niger"],
  Kwara: ["Oyo", "Osun", "Ekiti", "Kogi", "Niger", "Kebbi"],
  Lagos: ["Ogun", "Oyo"],
  Nasarawa: ["FCT", "Kaduna", "Plateau", "Benue", "Kogi", "Taraba"],
  Niger: ["FCT", "Kaduna", "Kebbi", "Kwara", "Kogi", "Zamfara"],
  Ogun: ["Lagos", "Oyo", "Ondo", "Osun"],
  Ondo: ["Ogun", "Osun", "Ekiti", "Kogi", "Edo", "Delta"],
  Osun: ["Oyo", "Ogun", "Ondo", "Ekiti", "Kwara"],
  Oyo: ["Ogun", "Osun", "Kwara", "Lagos"],
  Plateau: ["Bauchi", "Kaduna", "Nasarawa", "Taraba"],
  Rivers: ["Bayelsa", "Imo", "Abia", "Akwa Ibom", "Delta"],
  Sokoto: ["Kebbi", "Zamfara", "Katsina"],
  Taraba: ["Adamawa", "Gombe", "Bauchi", "Plateau", "Nasarawa", "Benue"],
  Yobe: ["Borno", "Gombe", "Bauchi", "Jigawa"],
  Zamfara: ["Sokoto", "Kebbi", "Katsina", "Kaduna", "Niger"],
};

const NEARBY_CITY_MAX_KM = 80;

/** Cities within ~80 km of preferred city (same or adjacent states). */
export function getNearbyCities(
  city: string,
  state: string,
  limit = 6,
): { state: string; city: string }[] {
  const origin = resolveCityCentroid(city, state);
  if (!origin) {
    // Same-state peers from centroid table
    return CITY_CENTROIDS.filter(
      (c) =>
        c.state.toLowerCase() === state.toLowerCase() &&
        c.city.toLowerCase() !== city.toLowerCase(),
    )
      .slice(0, limit)
      .map((c) => ({ state: c.state, city: c.city }));
  }

  const scored = CITY_CENTROIDS.filter(
    (c) =>
      !(
        c.city.toLowerCase() === city.toLowerCase() &&
        c.state.toLowerCase() === state.toLowerCase()
      ),
  )
    .map((c) => ({
      state: c.state,
      city: c.city,
      km: haversineKm(origin.lat, origin.lng, c.lat, c.lng),
    }))
    .filter((c) => c.km <= NEARBY_CITY_MAX_KM)
    .sort((a, b) => a.km - b.km);

  return scored.slice(0, limit).map(({ state: s, city: c }) => ({
    state: s,
    city: c,
  }));
}

export function getNearbyStates(state: string, limit = 4): string[] {
  const list = NEARBY_STATES[state] ?? [];
  return [...list].slice(0, limit);
}

export function citiesMatch(a?: string | null, b?: string | null): boolean {
  if (!a?.trim() || !b?.trim()) return false;
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  return x === y || x.includes(y) || y.includes(x);
}

export function statesMatch(a?: string | null, b?: string | null): boolean {
  if (!a?.trim() || !b?.trim()) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
