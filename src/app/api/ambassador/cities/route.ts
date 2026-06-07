import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cityHasCapacity } from "@/lib/ambassador/slots";

export const runtime = "nodejs";

export async function GET() {
  const client = createAdminClient();
  if (!client) {
    return NextResponse.json({ cities: [] });
  }

  const { data } = await client
    .from("city_ambassador_slots")
    .select("city, state, max_slots, active_slots, recruitment_paused, active")
    .eq("active", true)
    .order("city");

  const cities = (data ?? []).map((row) => ({
    city: row.city,
    state: row.state,
    maxSlots: row.max_slots,
    activeSlots: row.active_slots,
    open: cityHasCapacity(row as Parameters<typeof cityHasCapacity>[0]),
    recruitmentPaused: row.recruitment_paused,
  }));

  return NextResponse.json({ cities });
}
