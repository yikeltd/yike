import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { requireServerClient } from "@/lib/supabase/require-client";
import { getOrCreateTrustProfile, recordTrustEvent, logTrustAudit } from "@/lib/trust-safety/service";

export async function POST(req: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const supabase = await requireServerClient();
    const body = await req.json();
    const { reportId, appealReason } = body;

    if (!appealReason || String(appealReason).trim().length < 10) {
      return NextResponse.json(
        { error: "Appeal reason must be at least 10 characters." },
        { status: 400 }
      );
    }

    // 1. Insert into trust_appeals table
    const { data: appeal, error: insertErr } = await supabase
      .from("trust_appeals")
      .insert({
        user_id: user.id,
        report_id: reportId ?? null,
        appeal_reason: String(appealReason).slice(0, 3000),
        appeal_status: "pending",
      })
      .select("*")
      .single();

    if (insertErr || !appeal) {
      return NextResponse.json({ error: insertErr?.message ?? "Failed to save appeal" }, { status: 500 });
    }

    // 2. Update trust_profile appeal_status
    await supabase
      .from("trust_profiles")
      .update({
        appeal_status: "submitted",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    // 3. Record Trust Ledger Event
    await recordTrustEvent(supabase, {
      userId: user.id,
      eventType: "appeal_submitted",
      actorId: user.id,
      title: "Trust Appeal Submitted",
      description: appealReason,
      metadata: { appeal_id: appeal.id, report_id: reportId },
    });

    // 4. Audit Log
    await logTrustAudit(supabase, {
      actorId: user.id,
      targetUserId: user.id,
      reportId: reportId ?? undefined,
      action: "appeal_submitted",
      details: { appeal_id: appeal.id },
    });

    return NextResponse.json({
      success: true,
      message: "Your appeal has been submitted to the Trust & Safety Operations team.",
      appealId: appeal.id,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to submit appeal";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
