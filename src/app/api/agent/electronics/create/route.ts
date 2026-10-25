import { NextResponse } from "next/server";
import { getSession, isEmailVerified } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { getListingLimit, isAgentRole } from "@/lib/agent-tiers";
import { LISTING_LIMIT_REACHED_MESSAGE } from "@/lib/copy/user-messages";
import {
  assertCanCreateListing,
  ensurePendingManualSellerVerification,
} from "@/lib/seller-trust";
import {
  buildElectronicsInsertPayload,
  parseElectronicsBody,
} from "@/lib/listing-create/electronics-body";
import {
  deterministicListingCreateId,
  insertPropertyRowWithReservedId,
  normalizeIdempotencyKey,
  type PropertiesInsertClient,
} from "@/lib/listing-create/idempotency";
import {
  fingerprintListingCreatePayload,
  withListingCreateIdempotencyExtras,
} from "@/lib/listing-create/payload-fingerprint";

export const runtime = "nodejs";

const ACTIVE_LISTING_STATUSES = ["pending", "approved", "flagged"];

export async function POST(request: Request) {
  if (!isLaunchFeatureVisible("electronics_marketplace")) {
    return NextResponse.json(
      { error: "Electronics marketplace is not enabled" },
      { status: 403 },
    );
  }

  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select(
      "role, email_verified, phone_verified, is_banned, listing_limit, subscription_plan_code, whatsapp, phone, email, full_name, verification_status, verified_badge, account_status, profile_status, whatsapp_verified_at, whatsapp_verification_status, seller_profile_completed_at, verification_submitted_at",
    )
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 403 });
  }

  const createGate = assertCanCreateListing({
    ...profile,
    email_verified:
      isEmailVerified(user, { email_verified: profile.email_verified }) ||
      Boolean(profile.email_verified),
  });
  if (!createGate.ok) {
    return NextResponse.json(
      { error: createGate.error, code: createGate.code },
      { status: createGate.code === "phone_verification_required" ? 403 : 400 },
    );
  }

  if (profile.is_banned || !isAgentRole(profile.role)) {
    return NextResponse.json(
      { error: "Complete seller setup before listing." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = body.id != null ? String(body.id) : null;
  const input = parseElectronicsBody(body);
  if (!input) {
    return NextResponse.json(
      { error: "Missing required electronics fields" },
      { status: 400 },
    );
  }

  const payload = buildElectronicsInsertPayload(user.id, input, "pending");

  if (id) {
    const { data: existing } = await supabase
      .from("properties")
      .select("id, agent_id, asset_type, status, attributes")
      .eq("id", id)
      .maybeSingle();

    if (!existing || existing.agent_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.asset_type && existing.asset_type !== "ELECTRONICS") {
      return NextResponse.json({ error: "Not an electronics listing" }, { status: 400 });
    }

    const stayLive = existing.status === "approved";
    const prevAttrs =
      existing.attributes &&
      typeof existing.attributes === "object" &&
      !Array.isArray(existing.attributes)
        ? (existing.attributes as Record<string, unknown>)
        : {};
    const nextAttrs = {
      ...prevAttrs,
      ...(payload.attributes as Record<string, unknown>),
      ...(stayLive
        ? {
            content_review_requested: true,
            content_review_at: new Date().toISOString(),
          }
        : {}),
    };

    const { data, error } = await supabase
      .from("properties")
      .update({
        ...payload,
        attributes: nextAttrs,
        status: stayLive ? "approved" : "pending",
      })
      .eq("id", id)
      .eq("agent_id", user.id)
      .select("id, slug, status")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, listing: data });
  }

  const idempotencyKey = normalizeIdempotencyKey(body.idempotencyKey);
  if (!idempotencyKey) {
    return NextResponse.json(
      { error: "idempotencyKey is required for new electronics listings" },
      { status: 400 },
    );
  }

  const limit = getListingLimit(profile);
  const nowIso = new Date().toISOString();
  const { count: activeCount } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", user.id)
    .in("status", ACTIVE_LISTING_STATUSES)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`);

  if (limit !== null && (activeCount ?? 0) >= limit) {
    return NextResponse.json({ error: LISTING_LIMIT_REACHED_MESSAGE }, { status: 400 });
  }

  const reservedId = deterministicListingCreateId(
    "electronics",
    user.id,
    idempotencyKey,
  );
  const fingerprint = fingerprintListingCreatePayload("electronics", payload);
  const rowWithIdempotency = withListingCreateIdempotencyExtras(payload, {
    scope: "electronics",
    fingerprint,
    idempotency_key: idempotencyKey,
  });

  const insertResult = await insertPropertyRowWithReservedId(
    supabase as unknown as PropertiesInsertClient,
    reservedId,
    rowWithIdempotency,
    {
      agentId: user.id,
      assetType: "ELECTRONICS",
      scope: "electronics",
      payloadFingerprint: fingerprint,
      idempotencyKey,
    },
  );

  if (!insertResult.ok) {
    return NextResponse.json(
      { error: insertResult.error, code: insertResult.code },
      { status: insertResult.status },
    );
  }

  if (insertResult.created) {
    await ensurePendingManualSellerVerification(admin, user.id, {
      ...profile,
      email: profile.email ?? user.email ?? null,
    }).catch((err) => {
      console.error("[electronics-create] seller queue failed", err);
    });
  }

  return NextResponse.json(
    { ok: true, listing: insertResult.listing, idempotentReplay: !insertResult.created },
    { status: insertResult.created ? 201 : 200 },
  );
}
