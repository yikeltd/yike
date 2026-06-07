import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { enforceActiveSession } from "@/lib/auth/require-active-session";
import { requireSensitiveGate } from "@/lib/auth/sensitive-gate";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/admin/audit";

export async function POST(req: Request) {
  const session = await enforceActiveSession(req);
  if (!session.ok) return session.response;

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

  const body = (await req.json()) as {
    cac_number?: string;
    cac_document_url?: string;
    bank_name?: string;
    bank_account_number?: string;
    bank_account_name?: string;
    applicant_name?: string;
    applicant_role?: string;
    applicant_phone?: string;
    applicant_email?: string;
    applicant_id_url?: string;
    sensitiveConfirmationToken?: string;
    confirmationToken?: string;
  };

  const gate = await requireSensitiveGate(body, user.id, "change_identity");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type, role, company_name")
    .eq("id", user.id)
    .single();

  const isCompany =
    profile?.account_type === "agency" ||
    profile?.account_type === "developer" ||
    profile?.role === "agent_verified";

  if (!isCompany && !profile?.company_name) {
    return NextResponse.json(
      { error: "Set your company profile before applying for verification." },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("company_verification_requests")
    .select("id")
    .eq("company_id", user.id)
    .in("status", ["pending", "under_review", "needs_more_info"])
    .limit(1);

  if (existing?.length) {
    return NextResponse.json(
      { error: "You already have a verification request under review." },
      { status: 409 }
    );
  }

  const { error } = await supabase.from("company_verification_requests").insert({
    company_id: user.id,
    submitted_by: user.id,
    cac_number: body.cac_number?.trim() || null,
    cac_document_url: body.cac_document_url?.trim() || null,
    bank_name: body.bank_name?.trim() || null,
    bank_account_number: body.bank_account_number?.trim() || null,
    bank_account_name: body.bank_account_name?.trim() || null,
    applicant_name: body.applicant_name?.trim() || null,
    applicant_role: body.applicant_role?.trim() || null,
    applicant_phone: body.applicant_phone?.trim() || null,
    applicant_email: body.applicant_email?.trim() || null,
    applicant_id_url: body.applicant_id_url?.trim() || null,
    status: "pending",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hdrs = await headers();
  await writeAuditLog({
    actor_id: user.id,
    actor_role: profile?.role ?? "agent",
    action: "company.verification.submit",
    target_type: "profile",
    target_id: user.id,
    metadata: { cac_number: body.cac_number?.trim() },
    ip: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  return NextResponse.json({ ok: true });
}
