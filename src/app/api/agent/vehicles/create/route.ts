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
import { mustVerifyWhatsappBeforeListing } from "@/lib/whatsapp-verification/profile";
import { WHATSAPP_VERIFY_COPY } from "@/lib/whatsapp-verification/copy";
import {
  buildVehicleInsertPayload,
  type VehicleListingInput,
} from "@/lib/marketplace/listings";
import type { VehicleCategoryId } from "@/lib/marketplace/vehicle-specs";
import { VEHICLE_CATEGORIES } from "@/lib/marketplace/vehicle-specs";
import { isYearOptionalCategory } from "@/lib/marketplace/vehicle-taxonomy";

export const runtime = "nodejs";

const ACTIVE_LISTING_STATUSES = ["pending", "approved", "flagged"];

function isSafeListingMediaUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

function parseVehicleBody(body: Record<string, unknown>): VehicleListingInput | null {
  const auto_category = String(body.auto_category ?? "").trim() as VehicleCategoryId;
  if (!VEHICLE_CATEGORIES.some((c) => c.id === auto_category)) return null;

  const title = String(body.title ?? "").trim();
  const make = String(body.make ?? "").trim();
  const model = String(body.model ?? "").trim();
  const yearRaw = body.year;
  const year =
    yearRaw != null && yearRaw !== "" ? Number(yearRaw) : null;
  const price = Number(body.price);
  const state = String(body.state ?? "").trim();
  const city = String(body.city ?? "").trim();
  const vehicle_condition = String(
    body.vehicle_condition ?? body.condition ?? "",
  ).trim();

  if (!title || !make || !model || !state || !city || !vehicle_condition) return null;
  if (isYearOptionalCategory(auto_category)) {
    if (year != null && (!Number.isFinite(year) || year < 1980)) return null;
  } else if (!Number.isFinite(year) || year! < 1980) {
    return null;
  }
  if (!Number.isFinite(price) || price <= 0) return null;

  const media = Array.isArray(body.media_urls)
    ? body.media_urls.map(String).filter(Boolean)
    : [];

  if (
    media.length < 2 ||
    media.length > 20 ||
    media.some((url) => !isSafeListingMediaUrl(url))
  ) {
    return null;
  }

  return {
    title,
    description: body.description != null ? String(body.description) : undefined,
    price,
    state,
    city,
    area: body.area != null ? String(body.area) : city,
    auto_category,
    media_urls: media,
    video_url: body.video_url != null ? String(body.video_url) : null,
    make,
    model,
    year,
    trim: body.trim != null ? String(body.trim) : null,
    transmission: body.transmission != null ? String(body.transmission) : null,
    fuel_type: body.fuel_type != null ? String(body.fuel_type) : null,
    mileage:
      body.mileage != null && body.mileage !== "" ? Number(body.mileage) : null,
    vehicle_condition,
    vin: body.vin != null ? String(body.vin) : null,
    exterior_color:
      body.exterior_color != null ? String(body.exterior_color) : null,
    interior_color:
      body.interior_color != null ? String(body.interior_color) : null,
    body_type: body.body_type != null ? String(body.body_type) : null,
    drivetrain: body.drivetrain != null ? String(body.drivetrain) : null,
    engine: body.engine != null ? String(body.engine) : null,
    registration_status:
      body.registration_status != null
        ? String(body.registration_status)
        : null,
    financing_available: Boolean(body.financing_available),
    attributes:
      body.attributes && typeof body.attributes === "object"
        ? (body.attributes as Record<string, unknown>)
        : {},
  };
}

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

  if (mustVerifyWhatsappBeforeListing(profile)) {
    return NextResponse.json(
      { error: WHATSAPP_VERIFY_COPY.listingPrompt, code: "whatsapp_verification_required" },
      { status: 403 },
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

    // Soft edit: keep approved listings live; flag for Lex content review.
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

  const { data, error } = await supabase
    .from("properties")
    .insert(payload)
    .select("id, slug, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await ensurePendingManualSellerVerification(admin, user.id, {
    ...profile,
    email: profile.email ?? user.email ?? null,
  }).catch((error) => {
    console.error("[vehicle-create] seller queue failed", error);
  });

  return NextResponse.json({ ok: true, listing: data }, { status: 201 });
}
