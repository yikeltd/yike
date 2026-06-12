import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { isSuperAdmin } from "@/lib/admin/roles";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRevenuePricingCatalog } from "@/lib/revenue-pricing/service";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const catalog = await getRevenuePricingCatalog(admin, { includeInactive: true });
  return NextResponse.json({
    catalog,
    canEdit: isSuperAdmin(auth.profile.role),
  });
}

type PricingPatch = {
  items?: Array<{
    id: string;
    amount?: number;
    label?: string;
    active?: boolean;
    duration_days?: number | null;
    duration_hours?: number | null;
  }>;
  subscriptions?: Array<{
    id: string;
    monthly_price?: number;
    name?: string;
    active_listing_limit?: number | null;
    features?: Record<string, unknown>;
    status?: string;
  }>;
  offers?: { founding_subscription_offer?: boolean };
  billingTerms?: Array<{
    id: string;
    discount_percent?: number;
    label?: string;
    short_label?: string;
    active?: boolean;
    sort_order?: number;
  }>;
  billingTermCreates?: Array<{
    months: number;
    label: string;
    short_label: string;
    discount_percent?: number;
    sort_order?: number;
  }>;
};

export async function PATCH(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isSuperAdmin(auth.profile.role)) {
    return NextResponse.json({ error: "Chief admin required to edit pricing" }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  let body: PricingPatch = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const now = new Date().toISOString();

  if (body.items?.length) {
    for (const item of body.items) {
      const patch: Record<string, unknown> = { updated_at: now, updated_by: auth.user.id };
      if (item.amount != null && Number.isFinite(item.amount) && item.amount >= 0) {
        patch.amount = item.amount;
      }
      if (item.label?.trim()) patch.label = item.label.trim();
      if (typeof item.active === "boolean") patch.active = item.active;
      if (item.duration_days !== undefined) patch.duration_days = item.duration_days;
      if (item.duration_hours !== undefined) patch.duration_hours = item.duration_hours;

      if (Object.keys(patch).length > 2) {
        await admin.from("revenue_pricing_items").update(patch).eq("id", item.id);
      }
    }
  }

  if (body.subscriptions?.length) {
    for (const plan of body.subscriptions) {
      const patch: Record<string, unknown> = { updated_at: now };
      if (plan.monthly_price != null && Number.isFinite(plan.monthly_price) && plan.monthly_price >= 0) {
        patch.monthly_price = plan.monthly_price;
      }
      if (plan.name?.trim()) patch.name = plan.name.trim();
      if (plan.active_listing_limit !== undefined) patch.active_listing_limit = plan.active_listing_limit;
      if (plan.features) patch.features = plan.features;
      if (plan.status === "active" || plan.status === "inactive") patch.status = plan.status;

      if (Object.keys(patch).length > 1) {
        await admin.from("subscription_plans").update(patch).eq("id", plan.id);
      }
    }
  }

  if (body.offers && typeof body.offers.founding_subscription_offer === "boolean") {
    await admin
      .from("revenue_offers")
      .update({
        founding_subscription_offer: body.offers.founding_subscription_offer,
        updated_at: now,
        updated_by: auth.user.id,
      })
      .eq("id", true);
  }

  if (body.billingTerms?.length) {
    for (const term of body.billingTerms) {
      const patch: Record<string, unknown> = { updated_at: now, updated_by: auth.user.id };
      if (term.discount_percent != null && Number.isFinite(term.discount_percent)) {
        const discount = Math.min(100, Math.max(0, term.discount_percent));
        patch.discount_percent = discount;
      }
      if (term.label?.trim()) patch.label = term.label.trim();
      if (term.short_label?.trim()) patch.short_label = term.short_label.trim();
      if (typeof term.active === "boolean") patch.active = term.active;
      if (term.sort_order != null && Number.isFinite(term.sort_order)) {
        patch.sort_order = term.sort_order;
      }

      if (Object.keys(patch).length > 2) {
        await admin.from("subscription_billing_terms").update(patch).eq("id", term.id);
      }
    }
  }

  if (body.billingTermCreates?.length) {
    for (const term of body.billingTermCreates) {
      const months = Number(term.months);
      if (!Number.isFinite(months) || months < 1 || months > 36) continue;
      if (!term.label?.trim() || !term.short_label?.trim()) continue;

      await admin.from("subscription_billing_terms").upsert(
        {
          months,
          label: term.label.trim(),
          short_label: term.short_label.trim(),
          discount_percent: Math.min(
            100,
            Math.max(0, Number(term.discount_percent ?? 0))
          ),
          sort_order: Number.isFinite(term.sort_order) ? Number(term.sort_order) : months * 10,
          active: true,
          updated_at: now,
          updated_by: auth.user.id,
        },
        { onConflict: "months" }
      );
    }
  }

  revalidateTag("revenue-pricing", "max");
  revalidateTag("subscription-billing-terms", "max");

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();
  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "revenue.pricing.update",
    target_type: "revenue_pricing_items",
    metadata: {
      items: body.items?.length ?? 0,
      subscriptions: body.subscriptions?.length ?? 0,
      billingTerms: body.billingTerms?.length ?? 0,
      billingTermCreates: body.billingTermCreates?.length ?? 0,
      offers: body.offers ?? null,
    },
    ip,
  });

  const catalog = await getRevenuePricingCatalog(admin, { includeInactive: true });
  return NextResponse.json({ ok: true, catalog });
}
