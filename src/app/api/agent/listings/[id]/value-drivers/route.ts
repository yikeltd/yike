import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isVerifiedAgentProfile } from "@/lib/agent-tiers";
import { MAX_VALUE_DRIVER_SELECTIONS } from "@/constants/valueDrivers";
import {
  getListingValueDrivers,
  syncListingValueDrivers,
} from "@/lib/value-drivers/service";
import { writeAuditLog } from "@/lib/admin/audit";
import type { Profile } from "@/types/database";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
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

  const { id } = await ctx.params;
  const { data: listing } = await supabase
    .from("properties")
    .select("id, agent_id")
    .eq("id", id)
    .eq("agent_id", user.id)
    .single();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const drivers = await getListingValueDrivers(supabase, id);
  return NextResponse.json({ drivers });
}

export async function PUT(req: Request, ctx: RouteCtx) {
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

  const { id } = await ctx.params;
  const body = (await req.json()) as { driverKeys?: string[] };

  const driverKeys = Array.isArray(body.driverKeys)
    ? body.driverKeys.map(String)
    : [];

  if (driverKeys.length > MAX_VALUE_DRIVER_SELECTIONS) {
    return NextResponse.json(
      { error: `Select up to ${MAX_VALUE_DRIVER_SELECTIONS} features` },
      { status: 400 }
    );
  }

  const { data: listing } = await supabase
    .from("properties")
    .select(
      `id, agent_id, status, agent:profiles!properties_agent_id_fkey (
        id, verification_status, verified_badge, role
      )`
    )
    .eq("id", id)
    .eq("agent_id", user.id)
    .single();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const row = listing as {
    id: string;
    agent_id: string;
    status: string;
    agent?: Profile | Profile[] | null;
  };
  const agent = Array.isArray(row.agent) ? row.agent[0] : row.agent;

  const admin = createAdminClient();
  const client = admin ?? supabase;

  const result = await syncListingValueDrivers(client, {
    listingId: id,
    driverKeys,
    submittedBy: user.id,
    listingApproved: row.status === "approved",
    agentVerified: agent ? isVerifiedAgentProfile(agent) : false,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  void writeAuditLog({
    actor_id: user.id,
    actor_role: agent?.role ?? "agent",
    action: "listing.value_drivers.update",
    target_type: "property",
    target_id: id,
    metadata: { driverKeys, count: result.count },
  });

  const drivers = await getListingValueDrivers(client, id);
  return NextResponse.json({ ok: true, drivers });
}
