import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLaunchFeatureVisible } from "@/lib/launch-mode";
import {
  buildVehicleInsertPayload,
  type VehicleListingInput,
} from "@/lib/marketplace/listings";
import type { VehicleCategoryId } from "@/lib/marketplace/vehicle-specs";
import { VEHICLE_CATEGORIES } from "@/lib/marketplace/vehicle-specs";

export const runtime = "nodejs";

function parseVehicleBody(body: Record<string, unknown>): VehicleListingInput | null {
  const auto_category = String(body.auto_category ?? "").trim() as VehicleCategoryId;
  if (!VEHICLE_CATEGORIES.some((c) => c.id === auto_category)) return null;

  const title = String(body.title ?? "").trim();
  const make = String(body.make ?? "").trim();
  const model = String(body.model ?? "").trim();
  const year = Number(body.year);
  const price = Number(body.price);
  const state = String(body.state ?? "").trim();
  const city = String(body.city ?? "").trim();
  const vehicle_condition = String(
    body.vehicle_condition ?? body.condition ?? "",
  ).trim();

  if (!title || !make || !model || !state || !city || !vehicle_condition) return null;
  if (!Number.isFinite(year) || year < 1980) return null;
  if (!Number.isFinite(price) || price <= 0) return null;

  const media = Array.isArray(body.media_urls)
    ? body.media_urls.map(String).filter(Boolean)
    : [];

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
    const { data: existing } = await admin
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

    const { data, error } = await admin
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

  const { data, error } = await admin
    .from("properties")
    .insert(payload)
    .select("id, slug, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, listing: data }, { status: 201 });
}
