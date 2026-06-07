import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data } = await supabase
    .from("company_verification_requests")
    .select(
      "*, company:profiles!company_verification_requests_company_id_fkey(id, full_name, company_name, email, phone, whatsapp)"
    )
    .in("status", ["pending", "under_review", "needs_more_info"])
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ requests: data ?? [] });
}

export async function PATCH(req: Request) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const body = (await req.json()) as {
    request_id: string;
    company_id: string;
    action: "approve" | "reject" | "needs_more_info";
    admin_notes?: string;
    listing_limit?: number | null;
  };

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const now = new Date().toISOString();
  const status =
    body.action === "approve"
      ? "approved"
      : body.action === "reject"
        ? "rejected"
        : "needs_more_info";

  await supabase
    .from("company_verification_requests")
    .update({
      status,
      admin_notes: body.admin_notes ?? null,
      reviewed_by: auth.user.id,
      reviewed_at: now,
      updated_at: now,
    })
    .eq("id", body.request_id);

  if (body.action === "approve") {
    const profilePatch: Record<string, unknown> = {
      company_verified: true,
      company_verified_at: now,
      company_verified_by: auth.user.id,
      agency_verified: true,
      verification_level: "business_verified",
    };
    if (body.listing_limit !== undefined) {
      profilePatch.listing_limit = body.listing_limit;
    } else if (body.listing_limit === undefined) {
      profilePatch.listing_limit = null;
    }

    await supabase.from("profiles").update(profilePatch).eq("id", body.company_id);
  }

  const hdrs = await headers();
  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action:
      body.action === "approve"
        ? "company.verification.approve"
        : "company.verification.reject",
    target_type: "profile",
    target_id: body.company_id,
    metadata: { request_id: body.request_id, notes: body.admin_notes },
    ip: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  return NextResponse.json({ ok: true });
}
