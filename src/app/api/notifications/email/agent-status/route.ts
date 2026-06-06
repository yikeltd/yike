import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendAgentVerificationApprovedEmail,
  sendAgentVerificationRejectedEmail,
} from "@/lib/email/service";
import { requireAdminApi } from "@/lib/email/notify-auth";

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  let body: { agentId?: string; status?: string; reason?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const agentId = String(body.agentId ?? "").trim();
  const status = String(body.status ?? "").trim();

  if (!agentId || !status) {
    return NextResponse.json({ error: "agentId and status required" }, { status: 400 });
  }

  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json({ ok: true, skipped: "status_not_emailed" });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", agentId)
    .single();

  const { data: authUser } = await admin.auth.admin.getUserById(agentId);
  const email = authUser?.user?.email ?? profile?.email;
  if (!email) {
    return NextResponse.json({ ok: true, skipped: "no_email" });
  }

  const fullName = profile?.full_name ?? "";
  if (status === "approved") {
    await sendAgentVerificationApprovedEmail(admin, {
      email,
      fullName,
      userId: agentId,
    });
  } else {
    await sendAgentVerificationRejectedEmail(admin, {
      email,
      fullName,
      userId: agentId,
      reason: body.reason,
    });
  }

  return NextResponse.json({ ok: true });
}
