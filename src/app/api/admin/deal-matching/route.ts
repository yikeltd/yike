import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireDealMatchingApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import {
  DEAL_REQUEST_SOURCES,
  DEAL_REQUEST_TYPES,
  DEAL_STATUSES,
  DEAL_URGENCY_LEVELS,
} from "@/lib/deal-matching/constants";
import { updateDealStatus } from "@/lib/deal-matching/status";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await requireDealMatchingApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);

  let query = admin
    .from("deal_match_requests")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (status && (DEAL_STATUSES as readonly string[]).includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const tabs = [
    { id: "all", label: "All" },
    ...DEAL_STATUSES.filter((s) =>
      ["created", "outreach_sent", "agent_responded", "negotiation_started", "closed_successfully"].includes(s)
    ).map((s) => ({ id: s, label: s.replace(/_/g, " ") })),
  ];

  return NextResponse.json({ requests: data ?? [], tabs });
}

export async function POST(req: Request) {
  const auth = await requireDealMatchingApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const subject = String(body.subject ?? "").trim();
  if (!subject) {
    return NextResponse.json({ error: "Subject is required" }, { status: 400 });
  }

  const requestType = String(body.request_type ?? "premium_request");
  if (!(DEAL_REQUEST_TYPES as readonly string[]).includes(requestType)) {
    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  }

  const requestSource = String(body.request_source ?? "admin_manual");
  if (!(DEAL_REQUEST_SOURCES as readonly string[]).includes(requestSource)) {
    return NextResponse.json({ error: "Invalid request source" }, { status: 400 });
  }

  const urgency = String(body.urgency ?? "normal");
  if (!(DEAL_URGENCY_LEVELS as readonly string[]).includes(urgency)) {
    return NextResponse.json({ error: "Invalid urgency" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const payload = {
    subject,
    request_type: requestType,
    request_source: requestSource,
    target_area: String(body.target_area ?? "").trim() || null,
    city: String(body.city ?? "").trim() || null,
    state: String(body.state ?? "").trim() || null,
    property_type: String(body.property_type ?? "").trim() || null,
    budget_min: body.budget_min != null ? Number(body.budget_min) : null,
    budget_max: body.budget_max != null ? Number(body.budget_max) : null,
    requirements: String(body.requirements ?? "").trim() || null,
    internal_notes: String(body.internal_notes ?? "").trim() || null,
    urgency,
    visibility: "private",
    status: "created",
    assigned_support_id: (body.assigned_support_id as string) || null,
    created_by: auth.user.id,
  };

  const { data, error } = await admin
    .from("deal_match_requests")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Create failed" }, { status: 500 });
  }

  await updateDealStatus(admin, data.id, "created", auth.user.id, "Request created");

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();
  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "deal_matching.request.create",
    target_type: "deal_match_request",
    target_id: data.id,
    metadata: { request_type: requestType, request_source: requestSource },
    ip,
  });

  return NextResponse.json({ request: data });
}
