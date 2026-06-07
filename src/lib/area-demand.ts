import type { SupabaseClient } from "@supabase/supabase-js";

export async function recalculateAreaDemandMemory(
  admin: SupabaseClient,
  days = 30
): Promise<number> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const [{ data: events }, { data: leads }] = await Promise.all([
    admin
      .from("listing_analytics_events")
      .select("city, state, event_type, metadata")
      .gte("created_at", since)
      .in("event_type", ["whatsapp_click", "call_click", "save", "search_impression"]),
    admin
      .from("leads")
      .select("city, area")
      .gte("created_at", since),
  ]);

  type Bucket = {
    state: string;
    city: string;
    area: string;
    property_type: string | null;
    search_count: number;
    save_count: number;
    whatsapp_click_count: number;
    inquiry_count: number;
  };

  const buckets = new Map<string, Bucket>();

  function touch(
    state: string,
    city: string,
    area: string,
    propertyType: string | null,
    field: keyof Omit<Bucket, "state" | "city" | "area" | "property_type">
  ) {
    const key = `${state}|${city}|${area}|${propertyType ?? ""}`;
    const b =
      buckets.get(key) ??
      {
        state,
        city,
        area,
        property_type: propertyType,
        search_count: 0,
        save_count: 0,
        whatsapp_click_count: 0,
        inquiry_count: 0,
      };
    b[field]++;
    buckets.set(key, b);
  }

  for (const e of events ?? []) {
    const state = String(e.state ?? "Nigeria");
    const city = String(e.city ?? "");
    const area = city;
    const meta = (e.metadata ?? {}) as Record<string, unknown>;
    const pt = meta.property_type ? String(meta.property_type) : null;
    if (e.event_type === "search_impression") touch(state, city, area, pt, "search_count");
    if (e.event_type === "save") touch(state, city, area, pt, "save_count");
    if (e.event_type === "whatsapp_click" || e.event_type === "call_click") {
      touch(state, city, area, pt, "whatsapp_click_count");
    }
  }

  for (const l of leads ?? []) {
    touch("Nigeria", String(l.city ?? ""), String(l.area ?? l.city ?? ""), null, "inquiry_count");
  }

  let n = 0;
  for (const b of buckets.values()) {
    const demand_score = Math.min(
      100,
      b.search_count * 2 +
        b.save_count * 4 +
        b.whatsapp_click_count * 6 +
        b.inquiry_count * 8
    );
    const demand_key = `${b.state}|${b.city}|${b.area}|${b.property_type ?? ""}`;
    const { error } = await admin.from("area_demand_memory").upsert(
      {
        demand_key,
        ...b,
        demand_score,
        last_calculated_at: new Date().toISOString(),
      },
      { onConflict: "demand_key", ignoreDuplicates: false }
    );
    if (!error) n++;
  }
  return n;
}
