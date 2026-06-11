import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canListProperties } from "@/lib/agent-tiers";
import { listSellerLeads, updateLeadStatus } from "@/lib/listing-leads/service";
import { isListingLeadStatus } from "@/lib/listing-leads/constants";
import type { Profile } from "@/types/database";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const { data: profileRow } = await admin
    .from("profiles")
    .select("id, role, subscription_plan_code, lead_insights_until")
    .eq("id", user.id)
    .single();

  if (!profileRow || !canListProperties(profileRow as Profile)) {
    return NextResponse.json({ error: "Lister account required" }, { status: 403 });
  }

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status")?.trim();
  const status =
    statusParam && isListingLeadStatus(statusParam) ? statusParam : undefined;

  const { leads, access } = await listSellerLeads(admin, user.id, {
    status,
    profile: profileRow as Profile,
  });

  return NextResponse.json({ leads, access });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: { leadId?: string; status?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const leadId = String(body.leadId ?? "").trim();
  const status = String(body.status ?? "").trim();
  if (!leadId || !isListingLeadStatus(status)) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const ok = await updateLeadStatus(admin, user.id, leadId, status);
  if (!ok) {
    return NextResponse.json({ error: "Could not update lead" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
