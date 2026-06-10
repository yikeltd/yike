import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmailVerified } from "@/lib/auth";
import { UNVERIFIED_AGENT_LISTING_LIMIT } from "@/lib/agent-tiers";
import { computeExpiresAt } from "@/lib/listing-lifecycle";

export const runtime = "nodejs";
export const maxDuration = 30;

type Body = {
  idempotencyKey?: string;
  listingId?: string;
  payload?: Record<string, unknown>;
  pricingFields?: Record<string, unknown>;
};

const LISTER_ROLES = new Set([
  "agent_unverified",
  "agent_verified",
  "admin",
  "super_admin",
]);

function logStage(stage: string, extra: Record<string, unknown> = {}): void {
  console.info("[listing-create]", { stage, ...extra });
}

function httpMediaUrls(payload: Record<string, unknown>): string[] {
  if (!Array.isArray(payload.media_urls)) return [];
  return payload.media_urls.filter(
    (u): u is string =>
      typeof u === "string" &&
      u.startsWith("http") &&
      !u.startsWith("blob:") &&
      !u.startsWith("data:")
  );
}

function buildMinimalRow(
  payload: Record<string, unknown>,
  userId: string,
  mediaUrls: string[]
): Record<string, unknown> {
  const { expiresAt } = computeExpiresAt(
    (payload.listing_plan as "free") ?? "free"
  );
  const city = String(payload.city ?? "").trim();
  const state = String(payload.state ?? "").trim() || "Abia";

  return {
    agent_id: userId,
    title: String(payload.title ?? "").trim(),
    description: payload.description ?? null,
    listing_type: String(payload.listing_type ?? "rent"),
    property_type: payload.property_type ?? "flat",
    bedrooms: Number(payload.bedrooms ?? 0) || 0,
    bathrooms: Number(payload.bathrooms ?? 0) || 0,
    toilets: Number(payload.toilets ?? 0) || 0,
    price: Number(payload.price ?? 0),
    payment_period: String(payload.payment_period ?? "yearly"),
    state,
    city,
    area: String(payload.area ?? "").trim() || city,
    address_hint: payload.address_hint ?? null,
    landmark: payload.landmark ?? null,
    media_urls: mediaUrls,
    media_items: Array.isArray(payload.media_items) ? payload.media_items : [],
    video_url: payload.video_url || null,
    extras: payload.extras ?? {},
    status: "pending",
    listing_plan: payload.listing_plan ?? "free",
    expires_at: payload.expires_at ?? expiresAt,
    listing_duration_days: payload.listing_duration_days ?? 14,
    published_at: payload.published_at ?? new Date().toISOString(),
    moderation_flags: Array.isArray(payload.moderation_flags)
      ? payload.moderation_flags
      : [],
  };
}

function stripOptionalFields(row: Record<string, unknown>): Record<string, unknown> {
  const out = { ...row };
  delete out.price_confidence_score;
  delete out.price_anomaly_level;
  delete out.price_anomaly_reason;
  delete out.market_price_snapshot;
  delete out.price_review_status;
  if (Array.isArray(out.moderation_flags) && !(out.moderation_flags as string[]).length) {
    delete out.moderation_flags;
  }
  return out;
}

async function insertListing(
  admin: ReturnType<typeof createAdminClient>,
  row: Record<string, unknown>
): Promise<{ id: string } | { error: string; code?: string }> {
  const { data, error } = await admin
    .from("properties")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    return { error: error.message, code: error.code };
  }
  return { id: data.id };
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  logStage("listing_insert_started");

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

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const payload = body.payload ?? {};
  const pricingFields = body.pricingFields ?? {};
  const listingId = body.listingId?.trim() || null;

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role, email_verified, is_banned, listing_limit")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 403 });
  }

  if (profile.is_banned) {
    return NextResponse.json({ error: "Account unavailable" }, { status: 403 });
  }

  if (!isEmailVerified(user, { email_verified: profile.email_verified })) {
    return NextResponse.json({ error: "Verify your email to list." }, { status: 400 });
  }

  if (!LISTER_ROLES.has(profile.role)) {
    return NextResponse.json(
      { error: "Complete seller setup before listing." },
      { status: 403 }
    );
  }

  const title = String(payload.title ?? "").trim();
  const city = String(payload.city ?? "").trim();
  const price = Number(payload.price ?? 0);
  const mediaUrls = httpMediaUrls(payload);

  if (!title || !city || !price) {
    return NextResponse.json(
      { error: "Add title, location, and price." },
      { status: 400 }
    );
  }

  if (mediaUrls.length < 2 || mediaUrls.length > 20) {
    return NextResponse.json(
      { error: "Upload between 2 and 20 photos." },
      { status: 400 }
    );
  }

  const minimal = buildMinimalRow(payload, user.id, mediaUrls);
  const fullRow = stripOptionalFields({ ...minimal, ...pricingFields });

  if (listingId) {
    const { data: updated, error: updateError } = await admin
      .from("properties")
      .update(fullRow)
      .eq("id", listingId)
      .eq("agent_id", user.id)
      .select("id")
      .maybeSingle();

    if (!updateError && updated?.id) {
      logStage("listing_insert_success", {
        userId: user.id,
        listingId: updated.id,
        mode: "update",
        durationMs: Date.now() - startedAt,
      });
      return NextResponse.json({ ok: true, listingId: updated.id });
    }

    if (updateError) {
      logStage("listing_insert_failed", {
        userId: user.id,
        listingId,
        message: updateError.message,
        code: updateError.code,
      });
    }
    // Stale pending id — fall through to fresh insert
  }

  const limit = profile.listing_limit ?? UNVERIFIED_AGENT_LISTING_LIMIT;
  const { count: activeCount } = await admin
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", user.id)
    .in("status", ["pending", "approved", "flagged"]);

  if ((activeCount ?? 0) >= limit) {
    return NextResponse.json({ error: "Listing limit reached." }, { status: 400 });
  }

  let result = await insertListing(admin, fullRow);
  if ("error" in result) {
    logStage("listing_insert_retry", {
      userId: user.id,
      message: result.error,
      code: result.code,
    });
    result = await insertListing(admin, minimal);
  }

  if ("error" in result) {
    logStage("listing_insert_failed", {
      userId: user.id,
      message: result.error,
      code: result.code,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json(
      { error: "Could not save listing. Please try again." },
      { status: 500 }
    );
  }

  logStage("listing_insert_success", {
    userId: user.id,
    listingId: result.id,
    durationMs: Date.now() - startedAt,
  });

  return NextResponse.json({ ok: true, listingId: result.id });
}
