import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildPropertySlugBase,
  normalizePropertySlug,
} from "@/lib/property-slugs";
import type { PropertyStatus, ListingType } from "@/types/database";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("properties")
    .select(
      `*, agent:profiles!properties_agent_id_fkey (id, full_name, email, phone, role, verification_status, listing_limit)`
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.json({ listing: data });
}

export async function PATCH(req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = (await req.json()) as {
    title?: string;
    description?: string | null;
    price?: number;
    listing_type?: string;
    property_type?: string | null;
    bedrooms?: number;
    bathrooms?: number;
    toilets?: number;
    payment_period?: string;
    state?: string;
    city?: string;
    area?: string;
    address_hint?: string | null;
    landmark?: string | null;
    status?: PropertyStatus;
    agent_id?: string;
    slug?: string;
    slug_locked?: boolean;
    regenerate_slug?: boolean;
    seo_title?: string | null;
    seo_description?: string | null;
    is_featured?: boolean;
    featured_until?: string | null;
    featured_tier?: string | null;
    featured_reason?: string | null;
    is_verified_listing?: boolean;
    yike_verified?: boolean;
    yike_verification_level?: string | null;
    is_premium_deal?: boolean;
    closing_tracking_enabled?: boolean;
    expected_commission_rate?: number | null;
    developer_partner_id?: string | null;
    is_boosted?: boolean;
    boosted_until?: string | null;
    sponsored_status?: string;
    boost_score?: number;
    expires_at?: string;
  };

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: existing } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const auditMeta: Record<string, unknown> = {};

  const scalarFields = [
    "title",
    "description",
    "price",
    "listing_type",
    "property_type",
    "bedrooms",
    "bathrooms",
    "toilets",
    "payment_period",
    "state",
    "city",
    "area",
    "address_hint",
    "landmark",
    "status",
    "agent_id",
    "slug_locked",
    "seo_title",
    "seo_description",
    "is_featured",
    "featured_until",
    "featured_tier",
    "featured_reason",
    "is_verified_listing",
    "yike_verified",
    "yike_verification_level",
    "is_premium_deal",
    "closing_tracking_enabled",
    "expected_commission_rate",
    "developer_partner_id",
    "is_boosted",
    "boosted_until",
    "sponsored_status",
    "boost_score",
    "expires_at",
  ] as const;

  for (const key of scalarFields) {
    if (body[key] !== undefined) patch[key] = body[key];
  }

  if (body.regenerate_slug && !existing.slug_locked) {
    const base = buildPropertySlugBase({
      bedrooms: (body.bedrooms ?? existing.bedrooms) as number,
      property_type: (body.property_type ?? existing.property_type) as string | null,
      listing_type: (body.listing_type ?? existing.listing_type) as ListingType,
      area: (body.area ?? existing.area) as string,
      city: (body.city ?? existing.city) as string,
    });
    patch.slug = await pickUniqueSlug(supabase, base, id);
    auditMeta.regenerated_slug = patch.slug;
  } else if (body.slug !== undefined && body.slug !== existing.slug) {
    const normalized = normalizePropertySlug(body.slug);
    const taken = await slugTaken(supabase, normalized, id);
    if (taken) {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
    patch.slug = normalized;
    auditMeta.slug = normalized;
  }

  const { data, error } = await supabase
    .from("properties")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  let action = "listing.update";
  if (body.slug !== undefined || body.regenerate_slug) action = "listing.slug";
  if (body.status === "hidden") action = "listing.reject";
  if (body.agent_id && body.agent_id !== existing.agent_id) action = "listing.reassign";
  if (
    body.is_premium_deal !== undefined ||
    body.closing_tracking_enabled !== undefined ||
    body.expected_commission_rate !== undefined
  ) {
    action = "listing.premium_deal";
  }

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action,
    target_type: "property",
    target_id: id,
    metadata: { ...auditMeta, fields: Object.keys(patch) },
    ip,
  });

  return NextResponse.json({ listing: data });
}

async function slugTaken(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  slug: string,
  excludeId: string
) {
  const { data } = await supabase
    .from("properties")
    .select("id")
    .eq("slug", slug)
    .neq("id", excludeId)
    .maybeSingle();
  return !!data;
}

async function pickUniqueSlug(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  base: string,
  excludeId: string
) {
  const candidate = normalizePropertySlug(base);
  for (let n = 1; n <= 25; n++) {
    const trySlug = n === 1 ? candidate : `${candidate}-${n}`;
    if (!(await slugTaken(supabase, trySlug, excludeId))) return trySlug;
  }
  return `${candidate}-yk${Math.random().toString(36).slice(2, 5)}`;
}
