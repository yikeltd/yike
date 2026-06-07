import { createAdminClient } from "@/lib/supabase/admin";
import { getAgentWalletBalance, processLeadCharge } from "@/lib/leads/billing";
import { buildDedupeKey, dedupeWindowExpiresAt } from "@/lib/leads/dedupe";
import { logLeadEvent } from "@/lib/leads/events";
import {
  buildDirectAgentInquiryMessage,
  buildGatewayInquiryMessage,
} from "@/lib/leads/message";
import { decideLeadRouting } from "@/lib/leads/routing";
import { refreshHotListingFlag } from "@/lib/leads/hot-listing";
import { ensurePublicAgentCode, ensurePublicListingCode } from "@/lib/public-codes";
import type {
  AgentRoutingProfile,
  LeadRoutingDecision,
  ListingRoutingContext,
  VisitorContext,
} from "@/lib/leads/routing-types";
import { handoffPath, yikeWhatsAppNumber } from "@/lib/leads/gateway";
import { enrichConciergeLead } from "@/lib/leads/concierge";
import { listingPublicUrl } from "@/lib/leads/whatsapp-urls";
import { createLeadReceipt } from "@/lib/leads/receipts";
import { buildSupportFallbackResult } from "@/lib/leads/fallback";
import { autoAssignSupportLead } from "@/lib/support/dispatch";
import { whatsAppDeepLink } from "@/lib/whatsapp";
import type { LeadType } from "./types";

export type LeadPipelineInput = {
  leadId: string;
  yikeReference: string;
  listingId: string;
  agentId: string;
  agent: AgentRoutingProfile;
  listing: ListingRoutingContext;
  visitor: VisitorContext;
  leadType: LeadType;
  sourcePage?: string;
  agentName: string;
  agentWhatsapp?: string | null;
  agentPhone?: string | null;
  title: string;
  area: string;
  city: string;
  price: number;
  paymentPeriod: string;
  listingType: string;
  bedrooms?: number;
  propertyType?: string | null;
};

export type LeadPipelineResult = {
  redirectUrl: string;
  handoffUrl?: string;
  gateway: boolean;
  decision: LeadRoutingDecision;
};

export async function finalizeLeadRouting(
  input: LeadPipelineInput
): Promise<LeadPipelineResult> {
  try {
    return await runLeadRouting(input);
  } catch (err) {
    console.error("[leads/pipeline] routing failed, using support fallback:", err);
    const fb = buildSupportFallbackResult({
      yikeReference: input.yikeReference,
      listingId: input.listingId,
      agentId: input.agentId,
      title: input.title,
      area: input.area,
      city: input.city,
      slug: input.listing.slug,
      price: input.price,
      paymentPeriod: input.paymentPeriod,
      listingType: input.listingType,
      bedrooms: input.bedrooms,
      propertyType: input.propertyType,
    });
    return {
      redirectUrl: fb.redirectUrl,
      handoffUrl: fb.handoffUrl,
      gateway: true,
      decision: {
        route_to: "yike_support",
        reason: "pipeline_fallback",
        charge_required: false,
        charge_amount: 0,
        charge_status: "not_chargeable",
        handoff_url: fb.handoffUrl ?? null,
        routing_mode_used: input.agent.routing_mode,
      },
    };
  }
}

async function runLeadRouting(
  input: LeadPipelineInput
): Promise<LeadPipelineResult> {
  const admin = createAdminClient();
  const dedupeKey = buildDedupeKey({
    listingId: input.listingId,
    agentId: input.agentId,
    visitor: input.visitor,
  });

  let isDuplicate = false;
  let duplicateOfId: string | null = null;

  if (admin) {
    const { data: dupId } = await admin.rpc("yike_find_duplicate_lead", {
      p_listing_id: input.listingId,
      p_agent_id: input.agentId,
      p_dedupe_key: dedupeKey,
      p_exclude_id: input.leadId,
    });
    if (dupId) {
      isDuplicate = true;
      duplicateOfId = String(dupId);
    }
  }

  const walletBalance = await getAgentWalletBalance(input.agentId);

  const decision = decideLeadRouting({
    agent: input.agent,
    listing: input.listing,
    visitor: input.visitor,
    yikeReference: input.yikeReference,
    sourceSurface: input.sourcePage,
    isDuplicate,
    walletBalance,
  });

  let chargeResult = {
    charge_status: decision.charge_status,
    charge_amount: decision.charge_amount,
    wallet_balance_before: null as number | null,
    wallet_balance_after: null as number | null,
    charge_reference: null as string | null,
  };

  if (
    decision.route_to === "direct_agent" &&
    decision.charge_required &&
    !isDuplicate
  ) {
    chargeResult = await processLeadCharge({
      agentId: input.agentId,
      leadId: input.leadId,
      amount: decision.charge_amount,
      billingMode: input.agent.billing_mode,
      isDuplicate: false,
    });
    if (chargeResult.charge_status === "insufficient_balance") {
      decision.route_to = "yike_support";
      decision.reason = "insufficient_balance";
      decision.charge_status = "insufficient_balance";
    } else {
      decision.charge_status = chargeResult.charge_status;
    }
  } else if (isDuplicate) {
    chargeResult.charge_status = "duplicate_no_charge";
  }

  const listingUrl = listingPublicUrl(input.listing.slug, input.listingId);

  let conciergeCodes: {
    publicListingCode: string;
    publicAgentCode: string;
  } | null = null;

  if (admin && input.leadId && input.leadType === "whatsapp") {
    const enriched = await enrichConciergeLead(admin, {
      leadId: input.leadId,
      listingId: input.listingId,
      agentId: input.agentId,
      listingTitle: input.title,
      listingSlug: input.listing.slug,
      agentName: input.agentName,
      agentWhatsapp: input.agentWhatsapp,
      agentPhone: input.agentPhone,
      sourcePage: input.sourcePage,
      guestId: input.visitor.guestId ?? null,
      userId: input.visitor.userId ?? null,
    });
    if (enriched) {
      conciergeCodes = {
        publicListingCode: enriched.publicListingCode,
        publicAgentCode: enriched.publicAgentCode,
      };
    }
  }

  const inquiryType =
    decision.route_to === "direct_agent" ? "direct_whatsapp" : "whatsapp";

  if (admin && input.leadId) {
    await admin
      .from("leads")
      .update({
        dedupe_key: dedupeKey,
        dedupe_window_expires_at: dedupeWindowExpiresAt(),
        is_duplicate: isDuplicate,
        duplicate_of_lead_id: duplicateOfId,
        route_to: decision.route_to,
        routing_mode_used: decision.routing_mode_used,
        routing_reason: decision.reason,
        inquiry_type: inquiryType,
        charge_status: chargeResult.charge_status,
        charge_amount: chargeResult.charge_amount,
        billing_mode_snapshot: input.agent.billing_mode,
        wallet_balance_before: chargeResult.wallet_balance_before,
        wallet_balance_after: chargeResult.wallet_balance_after,
        charge_reference: chargeResult.charge_reference,
        charged_at:
          chargeResult.charge_status === "charged"
            ? new Date().toISOString()
            : null,
        requester_whatsapp: input.visitor.requesterWhatsapp ?? null,
        notification_channel: "manual",
        notification_status: "pending",
      })
      .eq("id", input.leadId);

    void refreshHotListingFlag(admin, input.listingId);

    void logLeadEvent({
      leadId: input.leadId,
      type: "routing_decided",
      metadata: {
        route_to: decision.route_to,
        reason: decision.reason,
        charge_status: chargeResult.charge_status,
        is_duplicate: isDuplicate,
      },
    });

    void createLeadReceipt({
      leadId: input.leadId,
      agentId: input.agentId,
      listingId: input.listingId,
      chargeAmount: chargeResult.charge_amount,
      chargeStatus: chargeResult.charge_status,
      routeUsed: decision.route_to,
      isDuplicate,
      yikeReference: input.yikeReference,
    });

    if (decision.route_to === "yike_support") {
      void autoAssignSupportLead(admin, input.leadId);
    }
  }

  if (input.leadType !== "whatsapp") {
    return {
      redirectUrl: "",
      decision,
      gateway: false,
    };
  }

  let listCode = conciergeCodes?.publicListingCode;
  let agentCode = conciergeCodes?.publicAgentCode;
  if (admin && (!listCode || !agentCode)) {
    const [lc, ac] = await Promise.all([
      listCode ? Promise.resolve(listCode) : ensurePublicListingCode(admin, input.listingId),
      agentCode ? Promise.resolve(agentCode) : ensurePublicAgentCode(admin, input.agentId),
    ]);
    listCode = lc ?? listCode;
    agentCode = ac ?? agentCode;
  }

  if (decision.route_to === "direct_agent") {
    const wa = input.agentWhatsapp || input.agentPhone;
    const message = buildDirectAgentInquiryMessage({
      agentName: input.agentName,
      propertyTitle: input.title,
      publicListingCode: listCode ?? "pending",
      listingUrl,
    });
    return {
      redirectUrl: whatsAppDeepLink(wa ?? "", message),
      gateway: false,
      decision,
    };
  }

  const gatewayMessage = buildGatewayInquiryMessage({
    propertyTitle: input.title,
    publicListingCode: listCode ?? "pending",
    publicAgentCode: agentCode ?? "pending",
    listingUrl,
  });

  return {
    redirectUrl: whatsAppDeepLink(yikeWhatsAppNumber(), gatewayMessage),
    handoffUrl: handoffPath(input.yikeReference),
    gateway: true,
    decision,
  };
}
