import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminAlertInbox } from "@/lib/email/admin-inbox";
import { sendAdminAlert, sendReportReceivedEmail } from "@/lib/email/service";
import { REPORT_REASONS } from "@/lib/constants";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  let body: {
    propertyId?: string;
    reason?: string;
    message?: string;
    reporterName?: string;
    reporterPhone?: string;
    reporterEmail?: string;
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const propertyId = String(body.propertyId ?? "").trim();
  const reason = String(body.reason ?? "").trim();

  if (!propertyId || !reason) {
    return NextResponse.json({ error: "propertyId and reason required" }, { status: 400 });
  }

  if (!REPORT_REASONS.includes(reason as (typeof REPORT_REASONS)[number])) {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }

  const { data: property } = await admin
    .from("properties")
    .select("id, title, agent_id")
    .eq("id", propertyId)
    .maybeSingle();

  if (!property) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const { data: report, error } = await admin
    .from("listing_reports")
    .insert({
      property_id: propertyId,
      reporter_name: body.reporterName?.trim() || null,
      reporter_phone: body.reporterPhone?.trim() || null,
      reason,
      message: body.message?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !report) {
    return NextResponse.json({ error: "Could not save report" }, { status: 500 });
  }

  if (property.agent_id) {
    void admin.rpc("yike_refresh_abuse_review_flag", {
      p_user_id: property.agent_id,
    });
  }

  const email = body.reporterEmail?.trim();
  if (email) {
    void sendReportReceivedEmail(admin, {
      email,
      reporterName: body.reporterName?.trim() || "Yike user",
      listingTitle: property.title,
      reportId: report.id,
    });
  } else {
    void sendAdminAlert(admin, {
      to: getAdminAlertInbox(),
      subject: "Listing reported — review needed",
      body: `${body.reporterName?.trim() || "Someone"} reported "${property.title}" (${reason}).\n\nReview: /lex/auth/reports`,
    });
  }

  return NextResponse.json({ ok: true });
}
