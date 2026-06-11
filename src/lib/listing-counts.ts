import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isProductionEnv } from "@/lib/env";
import { MOCK_LISTINGS } from "@/lib/mock-listings";

function allowMockCounts(): boolean {
  return !isProductionEnv() && !isSupabaseConfigured();
}

function countMockForCity(searchCity: string): number {
  const q = searchCity.toLowerCase();
  return MOCK_LISTINGS.filter(
    (p) =>
      p.city.toLowerCase().includes(q) ||
      p.area.toLowerCase().includes(q) ||
      (q === "lagos" && p.state === "Lagos") ||
      (q === "abuja" && (p.city === "Abuja" || p.state === "FCT"))
  ).length;
}

function countMockForArea(city: string, area: string): number {
  const cityQ = city.toLowerCase();
  const areaQ = area.toLowerCase();
  return MOCK_LISTINGS.filter(
    (p) =>
      (p.city.toLowerCase().includes(cityQ) ||
        p.area.toLowerCase().includes(cityQ)) &&
      (p.area.toLowerCase().includes(areaQ) ||
        p.city.toLowerCase().includes(areaQ))
  ).length;
}

export async function countListingsForCity(searchCity: string): Promise<number> {
  if (!isSupabaseConfigured()) {
    return allowMockCounts() ? countMockForCity(searchCity) : 0;
  }

  const supabase = await createClient();
  if (!supabase) return allowMockCounts() ? countMockForCity(searchCity) : 0;

  const q = searchCity.toLowerCase();
  let query = supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved")
    .gt("expires_at", new Date().toISOString());

  if (q === "lagos") {
    query = query.eq("state", "Lagos");
  } else if (q === "abuja") {
    query = query.or("city.ilike.%Abuja%,state.ilike.%FCT%");
  } else {
    query = query.or(`city.ilike.%${searchCity}%,area.ilike.%${searchCity}%`);
  }

  const { count } = await query;
  if (count && count > 0) return count;
  return allowMockCounts() ? countMockForCity(searchCity) : 0;
}

export async function countListingsForArea(
  city: string,
  area: string
): Promise<number> {
  if (!isSupabaseConfigured()) {
    return allowMockCounts() ? countMockForArea(city, area) : 0;
  }

  const supabase = await createClient();
  if (!supabase) return allowMockCounts() ? countMockForArea(city, area) : 0;

  const { count } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved")
    .gt("expires_at", new Date().toISOString())
    .ilike("area", `%${area}%`)
    .or(`city.ilike.%${city}%,area.ilike.%${city}%`);

  if (count && count > 0) return count;
  return allowMockCounts() ? countMockForArea(city, area) : 0;
}
