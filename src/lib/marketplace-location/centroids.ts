/**
 * Approximate centroids for Nigerian cities used for:
 * - reverse-geocode (nearest city to GPS)
 * - card distance when listings lack lat/lng
 * - nearby-city expansion
 *
 * Accuracy is city-level (~5–40 km), not street-level.
 */

export type CityCentroid = {
  state: string;
  city: string;
  lat: number;
  lng: number;
};

/** Major marketplace cities + state capitals. */
export const CITY_CENTROIDS: readonly CityCentroid[] = [
  { state: "Abia", city: "Aba", lat: 5.1066, lng: 7.3667 },
  { state: "Abia", city: "Umuahia", lat: 5.5263, lng: 7.4896 },
  { state: "Adamawa", city: "Yola", lat: 9.2035, lng: 12.4954 },
  { state: "Adamawa", city: "Jimeta", lat: 9.2793, lng: 12.4583 },
  { state: "Akwa Ibom", city: "Uyo", lat: 5.0377, lng: 7.9128 },
  { state: "Anambra", city: "Awka", lat: 6.2109, lng: 7.074 },
  { state: "Anambra", city: "Onitsha", lat: 6.1498, lng: 6.7855 },
  { state: "Anambra", city: "Nnewi", lat: 6.0198, lng: 6.917 },
  { state: "Bauchi", city: "Bauchi", lat: 10.3158, lng: 9.8442 },
  { state: "Bayelsa", city: "Yenagoa", lat: 4.9267, lng: 6.2676 },
  { state: "Benue", city: "Makurdi", lat: 7.7322, lng: 8.5391 },
  { state: "Borno", city: "Maiduguri", lat: 11.8311, lng: 13.151 },
  { state: "Cross River", city: "Calabar", lat: 4.9757, lng: 8.3417 },
  { state: "Delta", city: "Asaba", lat: 6.2059, lng: 6.6959 },
  { state: "Delta", city: "Warri", lat: 5.516, lng: 5.75 },
  { state: "Ebonyi", city: "Abakaliki", lat: 6.3249, lng: 8.1137 },
  { state: "Edo", city: "Benin City", lat: 6.335, lng: 5.6037 },
  { state: "Ekiti", city: "Ado Ekiti", lat: 7.6233, lng: 5.2209 },
  { state: "Enugu", city: "Enugu", lat: 6.4402, lng: 7.4943 },
  { state: "Enugu", city: "Nsukka", lat: 6.8561, lng: 7.3958 },
  { state: "FCT", city: "Abuja", lat: 9.0765, lng: 7.3986 },
  { state: "Gombe", city: "Gombe", lat: 10.2897, lng: 11.171 },
  { state: "Imo", city: "Owerri", lat: 5.484, lng: 7.0351 },
  { state: "Jigawa", city: "Dutse", lat: 11.7594, lng: 9.3414 },
  { state: "Kaduna", city: "Kaduna", lat: 10.51, lng: 7.4167 },
  { state: "Kaduna", city: "Zaria", lat: 11.0855, lng: 7.7199 },
  { state: "Kano", city: "Kano", lat: 12.0022, lng: 8.592 },
  { state: "Katsina", city: "Katsina", lat: 12.9908, lng: 7.601 },
  { state: "Kebbi", city: "Birnin Kebbi", lat: 12.4539, lng: 4.1975 },
  { state: "Kogi", city: "Lokoja", lat: 7.8023, lng: 6.7333 },
  { state: "Kwara", city: "Ilorin", lat: 8.4966, lng: 4.5421 },
  { state: "Lagos", city: "Lagos", lat: 6.5244, lng: 3.3792 },
  { state: "Lagos", city: "Ikeja", lat: 6.6018, lng: 3.3515 },
  { state: "Lagos", city: "Lekki", lat: 6.4698, lng: 3.5852 },
  { state: "Nasarawa", city: "Lafia", lat: 8.4939, lng: 8.515 },
  { state: "Niger", city: "Minna", lat: 9.6139, lng: 6.5569 },
  { state: "Ogun", city: "Abeokuta", lat: 7.1475, lng: 3.3619 },
  { state: "Ondo", city: "Akure", lat: 7.2526, lng: 5.1931 },
  { state: "Osun", city: "Osogbo", lat: 7.7717, lng: 4.556 },
  { state: "Oyo", city: "Ibadan", lat: 7.3775, lng: 3.947 },
  { state: "Plateau", city: "Jos", lat: 9.8965, lng: 8.8583 },
  { state: "Rivers", city: "Port Harcourt", lat: 4.8156, lng: 7.0498 },
  { state: "Sokoto", city: "Sokoto", lat: 13.0059, lng: 5.2476 },
  { state: "Taraba", city: "Jalingo", lat: 8.8929, lng: 11.377 },
  { state: "Yobe", city: "Damaturu", lat: 11.747, lng: 11.9662 },
  { state: "Zamfara", city: "Gusau", lat: 12.1628, lng: 6.667 },
] as const;

const byCityKey = new Map<string, CityCentroid>();
const byStateCity = new Map<string, CityCentroid>();

function cityKey(city: string): string {
  return city.trim().toLowerCase();
}

function stateCityKey(state: string, city: string): string {
  return `${state.trim().toLowerCase()}|${cityKey(city)}`;
}

for (const c of CITY_CENTROIDS) {
  byCityKey.set(cityKey(c.city), c);
  byStateCity.set(stateCityKey(c.state, c.city), c);
}

/** Resolve centroid for a listing city (optional state disambiguation). */
export function resolveCityCentroid(
  city?: string | null,
  state?: string | null,
): CityCentroid | null {
  if (!city?.trim()) return null;
  if (state?.trim()) {
    const exact = byStateCity.get(stateCityKey(state, city));
    if (exact) return exact;
  }
  return byCityKey.get(cityKey(city)) ?? null;
}

/** Nearest known city to GPS coordinates (km). */
export function nearestCityCentroid(
  lat: number,
  lng: number,
): { centroid: CityCentroid; distanceKm: number } | null {
  let best: CityCentroid | null = null;
  let bestKm = Number.POSITIVE_INFINITY;
  for (const c of CITY_CENTROIDS) {
    const km = haversineKm(lat, lng, c.lat, c.lng);
    if (km < bestKm) {
      bestKm = km;
      best = c;
    }
  }
  if (!best) return null;
  return { centroid: best, distanceKm: bestKm };
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
