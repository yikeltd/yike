import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { adjustAgentWallet } from "@/lib/leads/billing";
import type {
  AgentBillingMode,
  DirectRoutingHealth,
  LeadRoutingMode,
} from "@/lib/leads/routing-types";

type RouteCtx = { params: Promise<{ id: string }> };

const PIN_ACTIONS = new Set([
  "enable_direct",
  "disable_direct",
  "billing_mode",
  "lead_price",
  "enable_direct_calls",
  "disable_direct_calls",
  "call_routing_mode",
  "call_lead_price",
]);

export async function GET(_req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const [{ data: agent }, { data: wallet }, { data: ledger }] = await Promise.all([
    admin
      .from("profiles")
      .select(
        `routing_mode, allow_direct_whatsapp, direct_whatsapp_enabled_at,
         direct_whatsapp_disabled_reason, billing_mode, default_lead_price,
         premium_lead_price, lead_billing_enabled, direct_routing_health_status,
         allow_direct_calls, direct_call_enabled_at, direct_call_disabled_reason,
         call_routing_mode, default_call_lead_price`
      )
      .eq("id", id)
      .single(),
    admin.from("agent_wallets").select("*").eq("agent_id", id).maybeSingle(),
    admin
      .from("agent_wallet_ledger")
      .select("*")
      .eq("agent_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const { data: leadStats } = await admin
    .from("leads")
    .select("route_to, charge_status, is_duplicate")
    .eq("agent_id", id);

  const rows = leadStats ?? [];
  const stats = {
    total: rows.length,
    direct: rows.filter((r) => r.route_to === "direct_agent").length,
    concierge: rows.filter((r) => r.route_to === "yike_support").length,
    duplicates: rows.filter((r) => r.is_duplicate).length,
    charged: rows.filter((r) => r.charge_status === "charged").length,
    waived: rows.filter((r) => r.charge_status === "waived").length,
  };

  return NextResponse.json({ agent, wallet, ledger: ledger ?? [], stats });
}

export async function PATCH(req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json()) as {
    action?: string;
    routing_mode?: LeadRoutingMode;
    allow_direct_whatsapp?: boolean;
    billing_mode?: AgentBillingMode;
    default_lead_price?: number | null;
    premium_lead_price?: number | null;
    lead_billing_enabled?: boolean;
    direct_routing_health_status?: DirectRoutingHealth;
    disabled_reason?: string;
    call_routing_mode?: "whatsapp_only" | "direct_calls" | "hybrid";
    allow_direct_calls?: boolean;
    default_call_lead_price?: number | null;
    call_internal_notes?: string;
    wallet_adjustment?: number;
    wallet_reason?: string;
    wallet_reference?: string;
    wallet_ledger_type?: "topup" | "adjustment" | "waiver" | "refund";
  };

  if (body.action && PIN_ACTIONS.has(body.action)) {
    const pinValid = await hasValidPinSession(auth.user.id);
    if (!pinValid) {
      return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
    }
  }

  const { id } = await ctx.params;
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {};
  let auditAction = "agent.routing";

  if (body.routing_mode !== undefined) patch.routing_mode = body.routing_mode;

  if (body.action === "enable_direct" || body.allow_direct_whatsapp === true) {
    patch.allow_direct_whatsapp = true;
    patch.direct_whatsapp_enabled_at = now;
    patch.direct_whatsapp_enabled_by = auth.user.id;
    patch.direct_whatsapp_disabled_reason = null;
    auditAction = "agent.routing.enable_direct";
  }

  if (body.action === "disable_direct" || body.allow_direct_whatsapp === false) {
    patch.allow_direct_whatsapp = false;
    patch.direct_whatsapp_disabled_reason =
      body.disabled_reason ?? "Disabled by admin";
    auditAction = "agent.routing.disable_direct";
  }

  if (body.billing_mode !== undefined) {
    patch.billing_mode = body.billing_mode;
    auditAction = "agent.billing_mode";
  }
  if (body.default_lead_price !== undefined) {
    patch.default_lead_price = body.default_lead_price;
    auditAction = "agent.lead_price";
  }
  if (body.premium_lead_price !== undefined) {
    patch.premium_lead_price = body.premium_lead_price;
  }
  if (body.lead_billing_enabled !== undefined) {
    patch.lead_billing_enabled = body.lead_billing_enabled;
  }
  if (body.direct_routing_health_status !== undefined) {
    patch.direct_routing_health_status = body.direct_routing_health_status;
  }

  if (body.call_routing_mode !== undefined) {
    patch.call_routing_mode = body.call_routing_mode;
    auditAction = "agent.call_routing_mode";
  }

  if (body.action === "enable_direct_calls" || body.allow_direct_calls === true) {
    patch.allow_direct_calls = true;
    patch.direct_call_enabled_at = now;
    patch.direct_call_enabled_by = auth.user.id;
    patch.direct_call_disabled_reason = null;
    auditAction = "agent.routing.enable_direct_calls";
  }

  if (body.action === "disable_direct_calls" || body.allow_direct_calls === false) {
    patch.allow_direct_calls = false;
    patch.direct_call_disabled_reason =
      body.disabled_reason ?? "Disabled by admin";
    auditAction = "agent.routing.disable_direct_calls";
  }

  if (body.default_call_lead_price !== undefined) {
    patch.default_call_lead_price = body.default_call_lead_price;
    auditAction = "agent.call_lead_price";
  }

  if (Object.keys(patch).length > 0) {
    const { error } = await admin.from("profiles").update(patch).eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (body.wallet_adjustment != null && body.wallet_reason) {
    const pinValid = await hasValidPinSession(auth.user.id);
    if (!pinValid) {
      return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
    }
    const result = await adjustAgentWallet({
      agentId: id,
      amount: body.wallet_adjustment,
      reason: body.wallet_reason,
      actorId: auth.user.id,
      reference: body.wallet_reference,
      ledgerType: body.wallet_ledger_type,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    auditAction = "agent.wallet_adjustment";
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: auditAction,
    target_type: "agent",
    target_id: id,
    metadata: { ...patch, wallet_adjustment: body.wallet_adjustment },
    ip,
  });

  return NextResponse.json({ ok: true });
}
