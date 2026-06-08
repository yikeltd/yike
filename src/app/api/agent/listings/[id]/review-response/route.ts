import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { saveReviewDecision } from "@/lib/review-memory/memory";
import type { Property } from "@/types/database";

export const runtime = "nodejs";

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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const { data: listing } = await supabase
    .from("properties")
    .select("id, agent_id, title")
    .eq("id", id)
    .eq("agent_id", user.id)
    .single();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const { data: requests } = await supabase
    .from("listing_review_requests")
    .select("id, request_type, message, status, created_at, updated_at")
    .eq("listing_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  const open = (requests ?? []).filter((r) => r.status === "open");

  const responses: Record<string, unknown[]> = {};
  for (const req of open) {
    const { data: res } = await supabase
      .from("listing_review_responses")
      .select("id, response_text, evidence_urls, created_at")
      .eq("request_id", req.id)
      .order("created_at", { ascending: false });
    responses[req.id] = res ?? [];
  }

  return NextResponse.json({ requests: requests ?? [], responses });
}

export async function POST(req: Request, ctx: RouteCtx) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = (await req.json()) as {
    requestId: string;
    responseText: string;
    evidenceUrls?: string[];
  };

  if (!body.requestId || !body.responseText?.trim()) {
    return NextResponse.json({ error: "Request ID and response required" }, { status: 400 });
  }

  const { data: listing } = await supabase
    .from("properties")
    .select("id, agent_id, title, status")
    .eq("id", id)
    .eq("agent_id", user.id)
    .single();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const { data: request } = await supabase
    .from("listing_review_requests")
    .select("id, status")
    .eq("id", body.requestId)
    .eq("listing_id", id)
    .eq("agent_id", user.id)
    .single();

  if (!request || request.status !== "open") {
    return NextResponse.json({ error: "Request not found or closed" }, { status: 404 });
  }

  const now = new Date().toISOString();

  const { data: response, error } = await supabase
    .from("listing_review_responses")
    .insert({
      request_id: body.requestId,
      listing_id: id,
      agent_id: user.id,
      response_text: body.responseText.trim(),
      evidence_urls: body.evidenceUrls ?? [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("listing_review_requests")
    .update({ status: "responded", updated_at: now })
    .eq("id", body.requestId);

  const admin = createAdminClient();
  if (admin) {
    await saveReviewDecision(admin, {
      listing: listing as Property,
      decisionType: "agent_responded",
      decisionReason: `Agent responded: ${body.responseText.slice(0, 200)}`,
      extraSignals: { request_id: body.requestId, response_id: response?.id },
    });
  }

  return NextResponse.json({ response });
}
