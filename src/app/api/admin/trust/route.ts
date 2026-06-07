import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTrustAnalytics } from "@/lib/trust/operations/analytics";
import { TRUST_COMMAND_TABS } from "@/lib/trust/operations/constants";

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
  const tab = url.searchParams.get("tab") ?? "verification_requests";

  const counts = await Promise.all([
    admin
      .from("property_verification_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["submitted", "contacted", "awaiting_assignment"]),
    admin
      .from("legal_verification_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["submitted", "contacted", "awaiting_assignment"]),
    admin
      .from("property_verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "fraud_review"),
    admin
      .from("legal_verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "fraud_review"),
    admin
      .from("field_verifiers")
      .select("id", { count: "exact", head: true })
      .in("status", ["approved", "fraud_review"]),
    admin
      .from("legal_partners")
      .select("id", { count: "exact", head: true })
      .in("status", ["approved", "fraud_review"]),
    admin
      .from("trust_escalations")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    admin
      .from("staff_ops_alerts")
      .select("id", { count: "exact", head: true })
      .is("read_at", null),
    admin
      .from("property_verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("is_diaspora_request", true)
      .in("status", ["submitted", "contacted", "under_review", "awaiting_assignment"]),
    admin
      .from("field_verifiers")
      .select("id", { count: "exact", head: true })
      .eq("payout_enabled", false)
      .in("status", ["approved", "paused", "fraud_review"]),
    admin
      .from("legal_partners")
      .select("id", { count: "exact", head: true })
      .eq("payout_enabled", false)
      .in("status", ["approved", "paused", "fraud_review"]),
    admin
      .from("suspicious_property_flags")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    admin
      .from("city_ambassadors")
      .select("id", { count: "exact", head: true })
      .eq("payout_enabled", false)
      .in("status", ["approved", "paused"]),
  ]);

  const summary = {
    propertyQueue: counts[0].count ?? 0,
    legalQueue: counts[1].count ?? 0,
    propertyFraud: counts[2].count ?? 0,
    legalFraud: counts[3].count ?? 0,
    activeVerifiers: counts[4].count ?? 0,
    activeLegalPartners: counts[5].count ?? 0,
    openEscalations: counts[6].count ?? 0,
    unreadAlerts: counts[7].count ?? 0,
    diasporaBacklog: counts[8].count ?? 0,
    verifierPayoutHolds: counts[9].count ?? 0,
    legalPayoutHolds: counts[10].count ?? 0,
    suspiciousListingFlags: counts[11].count ?? 0,
    ambassadorPayoutHolds: counts[12].count ?? 0,
  };

  if (tab === "analytics") {
    const analytics = await getTrustAnalytics(admin);
    return NextResponse.json({ tabs: TRUST_COMMAND_TABS, summary, analytics });
  }

  if (tab === "verification_requests") {
    const { data: property } = await admin
      .from("property_verification_requests")
      .select(
        "id, request_reference, status, priority, internal_risk_level, buyer_full_name, buyer_whatsapp, property_title, property_location_text, is_diaspora_request, diaspora_priority, requested_at"
      )
      .in("status", [
        "submitted",
        "contacted",
        "awaiting_assignment",
        "assigned",
        "in_progress",
        "under_review",
      ])
      .order("requested_at", { ascending: false })
      .limit(60);

    return NextResponse.json({
      tabs: TRUST_COMMAND_TABS,
      summary,
      propertyRequests: property ?? [],
    });
  }

  if (tab === "legal_reviews") {
    const { data: legal } = await admin
      .from("legal_verification_requests")
      .select(
        "id, request_reference, status, review_type, internal_risk_level, buyer_full_name, buyer_whatsapp, property_title, property_location_text, is_diaspora_request, diaspora_priority, requested_at"
      )
      .in("status", [
        "submitted",
        "contacted",
        "awaiting_assignment",
        "assigned",
        "in_progress",
        "under_review",
        "awaiting_documents",
      ])
      .order("requested_at", { ascending: false })
      .limit(60);

    return NextResponse.json({
      tabs: TRUST_COMMAND_TABS,
      summary,
      legalRequests: legal ?? [],
    });
  }

  if (tab === "fraud_review") {
    const { data: property } = await admin
      .from("property_verification_requests")
      .select("id, request_reference, status, internal_risk_level, property_title, buyer_full_name, requested_at")
      .eq("status", "fraud_review")
      .order("requested_at", { ascending: false })
      .limit(40);

    const { data: legal } = await admin
      .from("legal_verification_requests")
      .select("id, request_reference, status, internal_risk_level, property_title, buyer_full_name, requested_at")
      .eq("status", "fraud_review")
      .order("requested_at", { ascending: false })
      .limit(40);

    const { data: verifiers } = await admin
      .from("field_verifiers")
      .select("id, verifier_code, full_name, status, fraud_flags_count, payout_hold_reason")
      .eq("status", "fraud_review")
      .limit(20);

    const { data: partners } = await admin
      .from("legal_partners")
      .select("id, partner_code, firm_name, status, fraud_flags_count, payout_hold_reason")
      .eq("status", "fraud_review")
      .limit(20);

    const { data: listingFlags } = await admin
      .from("suspicious_property_flags")
      .select("id, property_id, flag_type, severity, detail, created_at, properties(title, city, area)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(40);

    return NextResponse.json({
      tabs: TRUST_COMMAND_TABS,
      summary,
      propertyFraud: property ?? [],
      legalFraud: legal ?? [],
      verifierFraud: verifiers ?? [],
      partnerFraud: partners ?? [],
      listingFlags: listingFlags ?? [],
    });
  }

  if (tab === "escalations") {
    const { data } = await admin
      .from("trust_escalations")
      .select("*")
      .in("status", ["open", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(50);
    return NextResponse.json({ tabs: TRUST_COMMAND_TABS, summary, escalations: data ?? [] });
  }

  if (tab === "payout_holds") {
    const { data: verifiers } = await admin
      .from("field_verifiers")
      .select("id, verifier_code, full_name, payout_enabled, payout_hold_reason, bank_change_pending_review")
      .eq("payout_enabled", false)
      .in("status", ["approved", "paused", "fraud_review"])
      .limit(30);

    const { data: partners } = await admin
      .from("legal_partners")
      .select("id, partner_code, firm_name, payout_enabled, payout_hold_reason, bank_change_pending_review")
      .eq("payout_enabled", false)
      .in("status", ["approved", "paused", "fraud_review"])
      .limit(30);

    const { data: ambassadors } = await admin
      .from("city_ambassadors")
      .select("id, ambassador_code, full_name, payout_enabled, payout_hold_reason, bank_change_pending_review")
      .eq("payout_enabled", false)
      .in("status", ["approved", "paused"])
      .limit(30);

    return NextResponse.json({
      tabs: TRUST_COMMAND_TABS,
      summary,
      verifierHolds: verifiers ?? [],
      partnerHolds: partners ?? [],
      ambassadorHolds: ambassadors ?? [],
    });
  }

  if (tab === "diaspora") {
    const { data: property } = await admin
      .from("property_verification_requests")
      .select("*")
      .eq("is_diaspora_request", true)
      .in("status", [
        "submitted",
        "contacted",
        "awaiting_documents",
        "under_review",
        "awaiting_assignment",
        "assigned",
        "in_progress",
        "completed",
        "reviewed",
      ])
      .order("requested_at", { ascending: false })
      .limit(50);

    const { data: legal } = await admin
      .from("legal_verification_requests")
      .select("*")
      .eq("is_diaspora_request", true)
      .in("status", [
        "submitted",
        "contacted",
        "awaiting_documents",
        "under_review",
        "awaiting_assignment",
        "assigned",
        "in_progress",
        "completed",
        "reviewed",
      ])
      .order("requested_at", { ascending: false })
      .limit(30);

    return NextResponse.json({
      tabs: TRUST_COMMAND_TABS,
      summary,
      diasporaProperty: property ?? [],
      diasporaLegal: legal ?? [],
    });
  }

  if (tab === "field_verifiers") {
    const { data } = await admin
      .from("field_verifiers")
      .select("id, verifier_code, full_name, assigned_city, status, trust_level, completed_inspections, fraud_flags_count, performance_score, payout_enabled")
      .in("status", ["approved", "paused", "fraud_review"])
      .order("last_activity_at", { ascending: false, nullsFirst: false })
      .limit(40);
    return NextResponse.json({ tabs: TRUST_COMMAND_TABS, summary, verifiers: data ?? [] });
  }

  if (tab === "legal_partners") {
    const { data } = await admin
      .from("legal_partners")
      .select("id, partner_code, firm_name, assigned_city, status, trust_level, completed_reviews, fraud_flags_count, performance_score, payout_enabled")
      .in("status", ["approved", "paused", "fraud_review"])
      .order("last_activity_at", { ascending: false, nullsFirst: false })
      .limit(40);
    return NextResponse.json({ tabs: TRUST_COMMAND_TABS, summary, partners: data ?? [] });
  }

  return NextResponse.json({ tabs: TRUST_COMMAND_TABS, summary });
}
