import { NextResponse } from "next/server";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { reconcileAndFulfillPayment } from "@/lib/payments/services/payment-service";
import { isKorapayConfigured } from "@/lib/payments/config";
import { verifyKorapayWebhookSignature } from "@/lib/payments/providers/korapay";

export async function processKorapayWebhookPost(
  request: Request,
  logTag = "korapay webhook"
): Promise<NextResponse> {
  if (!isKorapayConfigured()) {
    return NextResponse.json({ error: "Korapay not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-korapay-signature");

  if (!verifyKorapayWebhookSignature(rawBody, signature)) {
    return NextResponse.json(
      { error: "Unauthorized", reason: "invalid_signature" },
      { status: 401 }
    );
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const admin = tryCreateAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const data = (payload.data as Record<string, unknown>) || {};
  const reference = String(data.reference || data.payment_reference || "").trim();

  if (reference) {
    // Reconcile and fulfill payment idempotently server-side
    await reconcileAndFulfillPayment(admin, reference);
  }

  return NextResponse.json({ ok: true, status: "success" });
}
