import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isYikeCoinsEnabled } from "@/lib/yike-coins/flags";
import { executePeerYcTransfer } from "@/lib/yike-coins/transfer";
import { isTransferRateLimited } from "@/lib/yike-coins/rate-limit";
import { normalizeUsername, validateUsername } from "@/lib/username/rules";

export const runtime = "nodejs";

type TransferBody = {
  recipientUsername?: string;
  amountCoins?: number;
  note?: string;
};

export async function POST(request: Request) {
  if (!isYikeCoinsEnabled()) {
    return NextResponse.json({ error: "YC wallet is not available" }, { status: 503 });
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const idempotencyKey =
    request.headers.get("idempotency-key")?.trim() ||
    request.headers.get("x-idempotency-key")?.trim();
  if (!idempotencyKey || idempotencyKey.length > 128) {
    return NextResponse.json(
      { error: "Idempotency-Key header is required (max 128 chars)" },
      { status: 400 }
    );
  }

  let body: TransferBody = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const recipientRaw = String(body.recipientUsername ?? "");
  const validated = validateUsername(recipientRaw);
  if (!validated.ok) {
    return NextResponse.json({ error: "Enter a valid recipient username", code: validated.code }, { status: 400 });
  }

  const amountCoins = body.amountCoins;
  if (!Number.isInteger(amountCoins) || (amountCoins ?? 0) <= 0) {
    return NextResponse.json({ error: "Amount must be a positive whole number of YC" }, { status: 400 });
  }

  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (!senderProfile?.username) {
    return NextResponse.json(
      { error: "Set a username before sending YC", code: "username_required" },
      { status: 403 }
    );
  }

  if (normalizeUsername(senderProfile.username) === validated.username) {
    return NextResponse.json({ error: "You cannot send YC to yourself", code: "self_transfer" }, { status: 400 });
  }

  if (await isTransferRateLimited(user.id)) {
    return NextResponse.json({ error: "Transfer limit reached — try again later" }, { status: 429 });
  }

  const result = await executePeerYcTransfer({
    senderId: user.id,
    recipientUsername: validated.username,
    amountCoins: amountCoins!,
    idempotencyKey,
    note: body.note,
  });

  if (!result.ok) {
    const status =
      result.code === "insufficient_balance"
        ? 402
        : result.code === "recipient_not_found"
          ? 404
          : result.code === "idempotency_mismatch"
            ? 409
            : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({
    transferId: result.transferId,
    transferReference: result.transferReference,
    balanceAfter: result.balanceAfter,
    alreadyApplied: result.alreadyApplied,
  });
}
