import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmailVerified } from "@/lib/auth";
import { UNVERIFIED_AGENT_LISTING_LIMIT } from "@/lib/agent-tiers";
export const runtime = "nodejs";
export const maxDuration = 30;

type Body = {
  idempotencyKey?: string;
  listingId?: string;
  payload?: Record<string, unknown>;
  pricingFields?: Record<string, unknown>;
};

function logStage(
  stage: string,
  extra: Record<string, unknown> = {}
): void {
  console.info("[listing-create]", { stage, ...extra });
}

const LISTER_ROLES = new Set([
  "agent_unverified",
  "agent_verified",
  "admin",
  "super_admin",
]);

/** Strip fields that may be missing on older production schemas — core listing still saves. */
function sanitizeInsertRow(
  row: Record<string, unknown>
): Record<string, unknown> {
  const out = { ...row };
  if (
    Array.isArray(out.moderation_flags) &&
    (out.moderation_flags as string[]).length === 0
  ) {
    delete out.moderation_flags;
  }
  return out;
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
    logStage("listing_insert_failed", { errorCode: "auth_missing" });
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  logStage("auth_checked", { userId: user.id });

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
    .select(
      "role, email_verified, is_banned, account_type, listing_limit, account_status"
    )
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    logStage("listing_insert_failed", {
      userId: user.id,
      errorCode: "profile_missing",
      message: profileError?.message,
    });
    return NextResponse.json({ error: "Profile not found." }, { status: 403 });
  }

  logStage("profile_loaded", {
    userId: user.id,
    profileType: profile.account_type,
    role: profile.role,
  });

  if (profile.is_banned) {
    return NextResponse.json({ error: "Account unavailable" }, { status: 403 });
  }

  if (!isEmailVerified(user, { email_verified: profile.email_verified })) {
    return NextResponse.json({ error: "Verify your email to list." }, { status: 400 });
  }

  if (!LISTER_ROLES.has(profile.role)) {
    logStage("listing_insert_failed", {
      userId: user.id,
      errorCode: "not_lister",
      role: profile.role,
    });
    return NextResponse.json(
      { error: "Complete seller setup before listing." },
      { status: 403 }
    );
  }

  logStage("profile_type_checked", { profileType: profile.account_type });

  const title = String(payload.title ?? "").trim();
  const city = String(payload.city ?? "").trim();
  const price = Number(payload.price ?? 0);

  if (!title || !city || !price) {
    return NextResponse.json(
      { error: "Add title, location, and price." },
      { status: 400 }
    );
  }

  const mediaUrls = Array.isArray(payload.media_urls) ? payload.media_urls : [];
  if (mediaUrls.length < 2 || mediaUrls.length > 20) {
    return NextResponse.json(
      { error: "Upload between 2 and 20 photos." },
      { status: 400 }
    );
  }

  const invalidUrl = mediaUrls.some(
    (u) =>
      typeof u !== "string" ||
      u.startsWith("blob:") ||
      u.startsWith("data:") ||
      !u.startsWith("http")
  );
  if (invalidUrl) {
    logStage("listing_insert_failed", {
      userId: user.id,
      errorCode: "invalid_media_urls",
      photoCount: mediaUrls.length,
    });
    return NextResponse.json(
      {
        error:
          "Some photos could not upload. Please retry or remove the failed photos.",
      },
      { status: 400 }
    );
  }

  const row = sanitizeInsertRow({
    ...payload,
    ...pricingFields,
    agent_id: user.id,
    status: payload.status === "approved" ? "approved" : "pending",
  });

  if (listingId) {
    const { data: updated, error: updateError } = await admin
      .from("properties")
      .update(row)
      .eq("id", listingId)
      .eq("agent_id", user.id)
      .select("id")
      .maybeSingle();

    if (updateError) {
      logStage("listing_insert_failed", {
        userId: user.id,
        listingId,
        errorCode: updateError.code,
        message: updateError.message,
        durationMs: Date.now() - startedAt,
      });
      return NextResponse.json(
        { error: "Could not save listing. Please try again." },
        { status: 500 }
      );
    }

    if (!updated?.id) {
      return NextResponse.json(
        { error: "Could not save listing. Please try again." },
        { status: 404 }
      );
    }

    logStage("listing_insert_success", {
      userId: user.id,
      listingId: updated.id,
      photoCount: mediaUrls.length,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json({ ok: true, listingId: updated.id });
  }

  const limit = profile.listing_limit ?? UNVERIFIED_AGENT_LISTING_LIMIT;
  const { count: activeCount } = await admin
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", user.id)
    .in("status", ["pending", "approved", "flagged"]);

  if ((activeCount ?? 0) >= limit) {
    return NextResponse.json(
      { error: "Listing limit reached." },
      { status: 400 }
    );
  }

  const { data: created, error: insertError } = await admin
    .from("properties")
    .insert(row)
    .select("id")
    .single();

  if (insertError) {
    logStage("listing_insert_failed", {
      userId: user.id,
      errorCode: insertError.code,
      message: insertError.message,
      photoCount: mediaUrls.length,
      durationMs: Date.now() - startedAt,
    });

    const retryRow = { ...row };
    delete retryRow.moderation_flags;
    delete retryRow.price_confidence_score;
    delete retryRow.price_anomaly_level;
    delete retryRow.price_anomaly_reason;
    delete retryRow.market_price_snapshot;
    delete retryRow.price_review_status;

    const { data: retryCreated, error: retryError } = await admin
      .from("properties")
      .insert(retryRow)
      .select("id")
      .single();

    if (retryError) {
      return NextResponse.json(
        { error: "Could not save listing. Please try again." },
        { status: 500 }
      );
    }

    logStage("listing_insert_success", {
      userId: user.id,
      listingId: retryCreated.id,
      photoCount: mediaUrls.length,
      retried: true,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json({ ok: true, listingId: retryCreated.id });
  }

  logStage("listing_insert_success", {
    userId: user.id,
    listingId: created.id,
    photoCount: mediaUrls.length,
    durationMs: Date.now() - startedAt,
  });

  return NextResponse.json({ ok: true, listingId: created.id });
}
