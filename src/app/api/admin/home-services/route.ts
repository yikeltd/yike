import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isHomeServicesEnabled } from "@/lib/feature-flags";

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
  const tab = url.searchParams.get("tab") ?? "providers";

  const { data: config } = await admin
    .from("home_services_program_config")
    .select("*")
    .eq("id", true)
    .maybeSingle();

  if (tab === "applications") {
    const { data } = await admin
      .from("service_provider_applications")
      .select("*")
      .in("status", ["pending", "under_review"])
      .order("created_at", { ascending: false })
      .limit(60);
    return NextResponse.json({
      enabled: isHomeServicesEnabled(),
      config,
      applications: data ?? [],
    });
  }

  if (tab === "requests") {
    const { data } = await admin
      .from("service_requests")
      .select("*")
      .in("status", ["submitted", "reviewing", "assigned", "in_progress", "disputed"])
      .order("created_at", { ascending: false })
      .limit(60);
    return NextResponse.json({
      enabled: isHomeServicesEnabled(),
      config,
      requests: data ?? [],
    });
  }

  if (tab === "complaints") {
    const { data } = await admin
      .from("service_provider_complaints")
      .select("*, service_provider_profiles(full_name, business_name, provider_type, city)")
      .in("status", ["submitted", "under_review", "escalated"])
      .order("created_at", { ascending: false })
      .limit(40);
    return NextResponse.json({
      enabled: isHomeServicesEnabled(),
      config,
      complaints: data ?? [],
    });
  }

  const status = url.searchParams.get("status");
  let query = admin
    .from("service_provider_profiles")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(80);

  if (status) {
    query = query.eq("verification_status", status);
  } else {
    query = query.in("verification_status", [
      "pending",
      "under_review",
      "approved",
      "paused",
      "suspended",
      "fraud_review",
    ]);
  }

  const { data: providers } = await query;

  const [{ count: pendingApps }, { count: openRequests }, { count: openComplaints }] =
    await Promise.all([
      admin
        .from("service_provider_applications")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "under_review"]),
      admin
        .from("service_requests")
        .select("id", { count: "exact", head: true })
        .in("status", ["submitted", "reviewing", "assigned", "in_progress"]),
      admin
        .from("service_provider_complaints")
        .select("id", { count: "exact", head: true })
        .in("status", ["submitted", "under_review", "escalated"]),
    ]);

  return NextResponse.json({
    enabled: isHomeServicesEnabled(),
    config,
    providers: providers ?? [],
    summary: {
      pendingApplications: pendingApps ?? 0,
      openRequests: openRequests ?? 0,
      openComplaints: openComplaints ?? 0,
      approvedProviders:
        providers?.filter((p) => p.verification_status === "approved").length ?? 0,
    },
  });
}
