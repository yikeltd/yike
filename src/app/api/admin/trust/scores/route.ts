import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") ?? "all";
  const entityType = url.searchParams.get("entity_type");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 60), 100);

  let query = admin
    .from("trust_scores")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (entityType) query = query.eq("entity_type", entityType);

  switch (filter) {
    case "high_risk":
      query = query.in("trust_level", ["critical_risk", "high_risk", "elevated_risk"]);
      break;
    case "low_confidence":
      query = query.lt("confidence_score", 25);
      break;
    case "highly_trusted":
      query = query.in("trust_level", ["trusted", "highly_trusted", "elite"]);
      break;
    case "escalated":
      query = query.eq("escalated", true);
      break;
    case "frozen":
      query = query.eq("score_frozen", true);
      break;
    default:
      break;
  }

  const { data: scores, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = scores ?? [];
  const entityIds = rows.map((r) => r.entity_id);

  const labels = await resolveEntityLabels(admin, rows);

  const { data: recentEvents } = await admin
    .from("trust_score_events")
    .select("entity_type, entity_id, event_type, reason, score_delta, created_at")
    .in("entity_id", entityIds.length ? entityIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: false })
    .limit(40);

  const summary = {
    total: rows.length,
    highRisk: rows.filter((r) =>
      ["critical_risk", "high_risk", "elevated_risk"].includes(r.trust_level)
    ).length,
    trusted: rows.filter((r) =>
      ["trusted", "highly_trusted", "elite"].includes(r.trust_level)
    ).length,
    escalated: rows.filter((r) => r.escalated).length,
    lowConfidence: rows.filter((r) => Number(r.confidence_score) < 25).length,
  };

  return NextResponse.json({
    scores: rows.map((r) => ({
      ...r,
      label: labels.get(`${r.entity_type}:${r.entity_id}`) ?? r.entity_id,
    })),
    recentEvents: recentEvents ?? [],
    summary,
  });
}

async function resolveEntityLabels(
  admin: ReturnType<typeof createAdminClient>,
  rows: { entity_type: string; entity_id: string }[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!admin || rows.length === 0) return map;

  const agentIds = rows.filter((r) => r.entity_type === "agent" || r.entity_type === "company").map((r) => r.entity_id);
  const listingIds = rows.filter((r) => r.entity_type === "listing").map((r) => r.entity_id);
  const verifierIds = rows.filter((r) => r.entity_type === "field_verifier").map((r) => r.entity_id);
  const partnerIds = rows.filter((r) => r.entity_type === "legal_partner").map((r) => r.entity_id);
  const serviceProviderIds = rows.filter((r) => r.entity_type === "service_provider").map((r) => r.entity_id);

  if (agentIds.length) {
    const { data } = await admin.from("profiles").select("id, full_name, company_name").in("id", agentIds);
    for (const p of data ?? []) {
      map.set(`agent:${p.id}`, p.full_name ?? p.company_name ?? p.id);
      map.set(`company:${p.id}`, p.company_name ?? p.full_name ?? p.id);
    }
  }
  if (listingIds.length) {
    const { data } = await admin.from("properties").select("id, title, city").in("id", listingIds);
    for (const p of data ?? []) {
      map.set(`listing:${p.id}`, `${p.title} · ${p.city}`);
    }
  }
  if (verifierIds.length) {
    const { data } = await admin.from("field_verifiers").select("id, full_name, verifier_code").in("id", verifierIds);
    for (const v of data ?? []) {
      map.set(`field_verifier:${v.id}`, v.full_name ?? v.verifier_code ?? v.id);
    }
  }
  if (partnerIds.length) {
    const { data } = await admin.from("legal_partners").select("id, firm_name, partner_code").in("id", partnerIds);
    for (const p of data ?? []) {
      map.set(`legal_partner:${p.id}`, p.firm_name ?? p.partner_code ?? p.id);
    }
  }
  if (serviceProviderIds.length) {
    const { data } = await admin
      .from("service_provider_profiles")
      .select("id, full_name, business_name, provider_reference")
      .in("id", serviceProviderIds);
    for (const p of data ?? []) {
      map.set(
        `service_provider:${p.id}`,
        p.business_name ?? p.full_name ?? p.provider_reference ?? p.id
      );
    }
  }

  return map;
}
