import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isListingSellerAccountType,
  listingSellerAccountTypeLabel,
} from "@/lib/profile/seller-account-types";
import type { AccountType } from "@/types/database";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

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
  const body = (await req.json().catch(() => ({}))) as {
    accountType?: string;
    reason?: string;
    companyName?: string;
  };

  const nextType = String(body.accountType ?? "").trim() as AccountType;
  if (!isListingSellerAccountType(nextType)) {
    return NextResponse.json({ error: "Invalid profile type." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: existing, error: loadError } = await admin
    .from("profiles")
    .select("id, account_type, full_name, company_name, role")
    .eq("id", id)
    .single();

  if (loadError || !existing) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const patch: Record<string, unknown> = {
    account_type: nextType,
  };

  const isBusiness =
    nextType === "agency" || nextType === "developer";
  const companyName = String(body.companyName ?? "").trim();

  if (isBusiness) {
    if (companyName) {
      patch.company_name = companyName;
    } else if (!existing.company_name?.trim() && existing.full_name?.trim()) {
      patch.company_name = existing.full_name.trim();
    }
  }

  const { data, error } = await admin
    .from("profiles")
    .update(patch)
    .eq("id", id)
    .select("id, account_type, company_name, full_name")
    .single();

  if (error) {
    console.error("[admin/account-type] update failed:", error.message, error.code);
    return NextResponse.json({ error: "Could not update profile type." }, { status: 500 });
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "agent.account_type",
    target_type: "profile",
    target_id: id,
    reason: body.reason?.trim() || null,
    metadata: {
      from: existing.account_type,
      to: nextType,
      from_label: listingSellerAccountTypeLabel(existing.account_type as AccountType),
      to_label: listingSellerAccountTypeLabel(nextType),
      company_name: data.company_name,
    },
    ip,
  });

  return NextResponse.json({
    ok: true,
    profile: data,
    accountTypeLabel: listingSellerAccountTypeLabel(nextType),
  });
}
