import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type FeedbackBody = {
  reference: string;
  usefulness?: number;
  professionalism?: number;
  speed?: number;
  trustLevel?: number;
  comments?: string;
};

function clampScore(n: unknown): number | null {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 1 || v > 5) return null;
  return Math.round(v);
}

export async function POST(request: Request) {
  const body = (await request.json()) as FeedbackBody;
  const reference = body.reference?.trim().toUpperCase();
  if (!reference) {
    return NextResponse.json({ error: "Reference required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const { data: row } = await admin
    .from("property_verification_requests")
    .select("id, status, buyer_feedback")
    .eq("request_reference", reference)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (!["delivered", "closed", "reviewed"].includes(row.status as string)) {
    return NextResponse.json(
      { error: "Feedback is available after your verification summary is ready." },
      { status: 400 }
    );
  }

  if (row.buyer_feedback) {
    return NextResponse.json({ error: "Feedback already submitted" }, { status: 409 });
  }

  const feedback = {
    usefulness: clampScore(body.usefulness),
    professionalism: clampScore(body.professionalism),
    speed: clampScore(body.speed),
    trust_level: clampScore(body.trustLevel),
    comments: body.comments?.trim().slice(0, 500) || null,
    submitted_at: new Date().toISOString(),
    source: "buyer",
  };

  await admin
    .from("property_verification_requests")
    .update({ buyer_feedback: feedback, updated_at: new Date().toISOString() })
    .eq("id", row.id);

  return NextResponse.json({ ok: true });
}
