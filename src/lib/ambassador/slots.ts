import type { SupabaseClient } from "@supabase/supabase-js";

export type CitySlotRow = {
  id: string;
  city: string;
  state: string;
  max_slots: number;
  active_slots: number;
  recruitment_paused: boolean;
  active: boolean;
};

export async function getCitySlot(
  client: SupabaseClient,
  city: string,
  state: string
): Promise<CitySlotRow | null> {
  const { data } = await client
    .from("city_ambassador_slots")
    .select("*")
    .ilike("city", city.trim())
    .ilike("state", state.trim())
    .maybeSingle();
  return (data as CitySlotRow | null) ?? null;
}

export function cityHasCapacity(slot: CitySlotRow | null): boolean {
  if (!slot || !slot.active || slot.recruitment_paused) return false;
  return slot.active_slots < slot.max_slots;
}

export async function incrementCityActiveSlots(
  client: SupabaseClient,
  city: string,
  state: string,
  delta: number
): Promise<void> {
  const slot = await getCitySlot(client, city, state);
  if (!slot) return;
  const next = Math.max(0, slot.active_slots + delta);
  await client
    .from("city_ambassador_slots")
    .update({ active_slots: next, updated_at: new Date().toISOString() })
    .eq("id", slot.id);
}
