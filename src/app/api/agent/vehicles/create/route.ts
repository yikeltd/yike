import { NextResponse } from "next/server";
import { getSession, isEmailVerified } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import { getListingLimit, isAgentRole } from "@/lib/agent-tiers";
import {
  assertCanCreateListing,
  ensurePendingManualSellerVerification,
} from "@/lib/seller-trust";
import { buildVehicleInsertPayload } from "@/lib/marketplace/listings";
import { parseVehicleBody } from "@/lib/listing-create/vehicle-body";
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
  if (!isLaunchFeatureVisible("vehicle_marketplace")) {
    return NextResponse.json(
      { error: "Vehicle marketplace is not enabled" },
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
      "role, email_verified, phone_verified, phone_verified_at, is_banned, listing_limit, subscription_plan_code, starter_plan_started_at, created_at, whatsapp, phone, email, full_name, verification_status, verified_badge, account_status, profile_status, whatsapp_verified_at, whatsapp_verification_status, date_of_birth, residential_address, office_address, residential_state, seller_profile_completed_at, verification_submitted_at",
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
  const input = parseVehicleBody(body);
  if (!input) {
    return NextResponse.json(
      { error: "Missing required vehicle fields" },
      { status: 400 },
    );
  }

  const payload = buildVehicleInsertPayload(user.id, input, "pending");

  if (id) {
    const { data: existing } = await supabase
      .from("properties")
      .select("id, agent_id, asset_type, status, attributes")
      .eq("id", id)
      .maybeSingle();

    if (!existing || existing.agent_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.asset_type && existing.asset_type !== "VEHICLE") {
      return NextResponse.json(
        { error: "Not a vehicle listing" },
        { status: 400 },
      );
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
      { error: "idempotencyKey is required for new vehicle listings" },
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
    return NextResponse.json(
      { error: "You have reached your active listing limit." },
      { status: 400 },
    );
  }

  const reservedId = deterministicListingCreateId(
    "vehicle",
    user.id,
    idempotencyKey,
  );
  const fingerprint = fingerprintListingCreatePayload("vehicle", payload);
  const rowWithIdempotency = withListingCreateIdempotencyExtras(payload, {
    scope: "vehicle",
    fingerprint,
    idempotency_key: idempotencyKey,
  });

  const insertResult = await insertPropertyRowWithReservedId(
    supabase as unknown as PropertiesInsertClient,
    reservedId,
    rowWithIdempotency,
    {
      agentId: user.id,
      assetType: "VEHICLE",
      scope: "vehicle",
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
    }).catch((error) => {
      console.error("[vehicle-create] seller queue failed", error);
    });
  }

  return NextResponse.json(
    { ok: true, listing: insertResult.listing, idempotentReplay: !insertResult.created },
    { status: insertResult.created ? 201 : 200 },
  );
}
