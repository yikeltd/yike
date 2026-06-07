import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { toCsv } from "@/lib/trust/operations/exports";

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
  const kind = url.searchParams.get("kind") ?? "property_verifications";

  if (kind === "property_verifications") {
    const { data } = await admin
      .from("property_verification_requests")
      .select(
        "request_reference, status, priority, internal_risk_level, buyer_full_name, property_title, property_location_text, is_diaspora_request, requested_at, delivered_at"
      )
      .order("requested_at", { ascending: false })
      .limit(500);

    const columns = [
      "request_reference",
      "status",
      "priority",
      "internal_risk_level",
      "buyer_full_name",
      "property_title",
      "property_location_text",
      "is_diaspora_request",
      "requested_at",
      "delivered_at",
    ];
    const csv = toCsv((data ?? []) as Record<string, unknown>[], columns);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="property-verifications.csv"',
      },
    });
  }

  if (kind === "legal_verifications") {
    const { data } = await admin
      .from("legal_verification_requests")
      .select(
        "request_reference, status, review_type, internal_risk_level, buyer_full_name, property_title, property_location_text, is_diaspora_request, requested_at, delivered_at"
      )
      .order("requested_at", { ascending: false })
      .limit(500);

    const columns = [
      "request_reference",
      "status",
      "review_type",
      "internal_risk_level",
      "buyer_full_name",
      "property_title",
      "property_location_text",
      "is_diaspora_request",
      "requested_at",
      "delivered_at",
    ];
    const csv = toCsv((data ?? []) as Record<string, unknown>[], columns);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="legal-verifications.csv"',
      },
    });
  }

  if (kind === "timeline") {
    const caseId = url.searchParams.get("caseId");
    const caseType = url.searchParams.get("caseType") ?? "property_verification";
    if (!caseId) return NextResponse.json({ error: "caseId required" }, { status: 400 });

    const { data } = await admin
      .from("trust_case_timeline")
      .select("case_reference, event_type, title, detail, actor_role, created_at")
      .eq("case_type", caseType)
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });

    const columns = ["case_reference", "event_type", "title", "detail", "actor_role", "created_at"];
    const csv = toCsv((data ?? []) as Record<string, unknown>[], columns);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="timeline-${caseId}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: "Invalid export kind" }, { status: 400 });
}
