import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hashClientIp, logLead } from "@/lib/leads/log";
import { generateLeadReference } from "@/lib/leads/reference";
import { COOLDOWN_USER_MESSAGE } from "@/lib/leads/operations-types";
import { listingAvailabilityNotice } from "@/lib/leads/availability";
import { finalizeLeadRouting } from "@/lib/leads/pipeline";
import { buildSupportFallbackResult } from "@/lib/leads/fallback";
import { validateLeadRequest } from "@/lib/leads/validation";
import { buildLeadAttribution } from "@/lib/leads/attribution";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AgentRoutingProfile, ListingRoutingContext } from "@/lib/leads/routing-types";
import type { LeadType } from "@/lib/leads/types";
import { decideCallRouting, buildTelUrl } from "@/lib/leads/call-routing";
import { logLeadEvent } from "@/lib/leads/events";
import { buildDedupeKey } from "@/lib/leads/dedupe";
import {
  agentToCallProfile,
  persistCallLeadMetadata,
} from "@/lib/leads/call-metadata";
import { isDirectAgentCallsEnabled } from "@/lib/feature-flags";
import type {
  ListingAvailabilityStatus,
  ListingType,
  PaymentPeriod,
} from "@/types/database";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const listingId = String(body.listingId ?? "").trim();
  const agentId = String(body.agentId ?? "").trim();
  const leadType = body.leadType as LeadType;
  const sourcePage = String(body.sourcePage ?? "");
  const guestId = String(body.guestId ?? "") || null;

  if (!listingId || !agentId || (leadType !== "whatsapp" && leadType !== "call")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const agentName = String(body.agentName ?? "there");
  const title = String(body.title ?? "");
  const area = String(body.area ?? "");
  const city = String(body.city ?? "");
  const price = Number(body.price ?? 0);
  const paymentPeriod = (body.paymentPeriod ?? "yearly") as PaymentPeriod;
  const listingType = (body.listingType ?? "rent") as ListingType;
  const bedrooms = Number(body.bedrooms ?? 0) || undefined;
  const propertyType = body.propertyType ? String(body.propertyType) : null;
  const whatsapp = body.whatsapp ? String(body.whatsapp) : null;
  const phone = body.phone ? String(body.phone) : null;

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent");

  const supabase = await createClient();
  let userId: string | null = null;
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  }

  const validation = supabase
    ? await validateLeadRequest(supabase, listingId, agentId)
    : null;

  if (validation && !validation.ok) {
    if (validation.code === "invalid_ids" || validation.code === "missing_ids") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    if (validation.code === "agent_listing_mismatch") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    // Business failures → Yike support fallback (no scary errors)
    if (validation.useFallback) {
      const ref = generateLeadReference(city, area);
      const fb = buildSupportFallbackResult({
        yikeReference: ref,
        listingId,
        agentId,
        title: title || "Property inquiry",
        area,
        city,
        price,
        paymentPeriod,
        listingType,
        bedrooms,
        propertyType,
      });
      return NextResponse.json({
        ok: true,
        yikeReference: ref,
        redirectUrl: fb.redirectUrl,
        handoffUrl: fb.handoffUrl,
        gateway: true,
        fallback: true,
      });
    }
  }

  const listingRow: ListingRoutingContext | null = validation?.ok
    ? {
        id: validation.listing.id,
        slug: validation.listing.slug,
        title: validation.listing.title,
        availability_status: validation.listing.availability_status,
        status: validation.listing.status,
        lead_price_override: validation.listing.lead_price_override,
        premium_lead: validation.listing.premium_lead,
        requires_manual_review: validation.listing.requires_manual_review,
      }
    : null;

  const agentRow: AgentRoutingProfile | null = validation?.ok
    ? (validation.agent as unknown as AgentRoutingProfile)
    : null;

  const listingNotice =
    listingRow != null
      ? listingAvailabilityNotice({
          availability_status:
            (listingRow.availability_status as ListingAvailabilityStatus | null) ??
            undefined,
        })
      : null;

  const logResult = await logLead({
    userId,
    guestId,
    userIpHash: hashClientIp(ip),
    listingId,
    agentId,
    leadType,
    sourcePage,
    userAgent,
    city,
    area,
  });

  if (!logResult.ok && logResult.cooldown) {
    return NextResponse.json(
      { error: COOLDOWN_USER_MESSAGE, cooldown: true },
      { status: 429 }
    );
  }

  const yikeReference = logResult.ok
    ? logResult.yikeReference
    : generateLeadReference(city, area);

  if (!logResult.ok) {
    console.warn("[leads/track] logging skipped:", logResult.error);
  } else {
    const admin = createAdminClient();
    if (admin) {
      const dedupeKey = buildDedupeKey({
        listingId,
        agentId,
        visitor: { userId, guestId, ipHash: hashClientIp(ip) },
      });
      void admin.rpc("yike_bump_recent_lead_interaction", {
        p_listing_id: listingId,
        p_agent_id: agentId,
        p_dedupe_key: dedupeKey,
        p_lead_id: logResult.leadId,
      });
      const attribution = buildLeadAttribution({
        sourcePage,
        sourceSurface: body.sourceSurface ? String(body.sourceSurface) : null,
        sourceListingPosition:
          body.sourceListingPosition != null
            ? Number(body.sourceListingPosition)
            : null,
        sourceCampaign: body.sourceCampaign ? String(body.sourceCampaign) : null,
        placement: body.placement ? String(body.placement) : undefined,
      });
      void admin
        .from("leads")
        .update(attribution)
        .eq("id", logResult.leadId)
        .then(({ error }) => {
          if (error) console.warn("[leads/track] attribution update failed", error.message);
        });
    }
  }

  if (leadType === "call") {
    const agentForCall = validation?.ok
      ? agentToCallProfile(validation.agent)
      : {
          id: agentId,
          allow_direct_calls: false,
          call_routing_mode: "whatsapp_only" as const,
          phone: phone,
          whatsapp: whatsapp,
          direct_routing_health_status: "healthy",
        };

    let isDuplicateCall = false;
    if (logResult.ok && supabase) {
      const dedupeKey = buildDedupeKey({
        listingId,
        agentId,
        visitor: { userId, guestId, ipHash: hashClientIp(ip) },
      });
      const adminForDup = createAdminClient();
      if (adminForDup) {
        const { data: dupId } = await adminForDup.rpc("yike_find_duplicate_lead", {
          p_listing_id: listingId,
          p_agent_id: agentId,
          p_dedupe_key: dedupeKey,
          p_exclude_id: logResult.leadId,
        });
        isDuplicateCall = !!dupId;
      }
    }

    const callDecision = decideCallRouting({
      agent: agentForCall,
      listing: listingRow ?? { id: listingId, title },
      globalEnabled: isDirectAgentCallsEnabled(),
      isDuplicate: isDuplicateCall,
    });

    if (logResult.ok) {
      await persistCallLeadMetadata(logResult.leadId, callDecision);
      void logLeadEvent({
        leadId: logResult.leadId,
        type: "call_clicked",
        metadata: { reason: callDecision.reason },
      });
      void logLeadEvent({
        leadId: logResult.leadId,
        type: callDecision.allow_direct_call ? "call_allowed" : "call_blocked",
        metadata: {
          route_type: callDecision.route_type,
          reason: callDecision.reason,
        },
      });
    }

    const defaultAgent: AgentRoutingProfile = {
      id: agentId,
      routing_mode: "yike_concierge",
      allow_direct_whatsapp: false,
      billing_mode: "free",
      lead_billing_enabled: false,
      direct_routing_health_status: "healthy",
      whatsapp: validation?.ok ? validation.agent.whatsapp : whatsapp,
      phone: validation?.ok ? validation.agent.phone : phone,
    };

    const defaultListing: ListingRoutingContext = {
      id: listingId,
      title,
      slug: listingRow?.slug ?? null,
    };

    try {
      const pipeline = await finalizeLeadRouting({
        leadId: logResult.ok ? logResult.leadId : "",
        yikeReference,
        listingId,
        agentId,
        agent: agentRow ?? defaultAgent,
        listing: listingRow ?? defaultListing,
        visitor: {
          userId,
          guestId,
          ipHash: hashClientIp(ip),
          requesterWhatsapp: whatsapp,
        },
        leadType: "whatsapp",
        sourcePage,
        agentName,
        agentWhatsapp: validation?.ok ? validation.agent.whatsapp : whatsapp,
        agentPhone: validation?.ok ? validation.agent.phone : phone,
        title,
        area,
        city,
        price,
        paymentPeriod,
        listingType,
        bedrooms,
        propertyType,
      });

      if (callDecision.allow_direct_call && callDecision.phone_number) {
        return NextResponse.json({
          ok: true,
          yikeReference,
          callAllowed: true,
          routeType: "direct_call",
          redirectUrl: buildTelUrl(callDecision.phone_number),
          handoffUrl: pipeline.handoffUrl,
          listingNotice,
        });
      }

      if (!pipeline.redirectUrl) {
        throw new Error("empty_whatsapp_redirect");
      }

      return NextResponse.json({
        ok: true,
        yikeReference,
        callAllowed: false,
        routeType: "whatsapp_fallback",
        redirectUrl: pipeline.redirectUrl,
        handoffUrl: pipeline.handoffUrl,
        gateway: pipeline.gateway,
        listingNotice,
      });
    } catch (err) {
      console.error("[leads/track] call routing error:", err);
      const fb = buildSupportFallbackResult({
        yikeReference,
        listingId,
        agentId,
        title,
        area,
        city,
        slug: listingRow?.slug,
        price,
        paymentPeriod,
        listingType,
        bedrooms,
        propertyType,
      });
      return NextResponse.json({
        ok: true,
        yikeReference,
        callAllowed: false,
        routeType: "whatsapp_fallback",
        redirectUrl: fb.redirectUrl,
        handoffUrl: fb.handoffUrl,
        gateway: true,
        fallback: true,
        listingNotice,
      });
    }
  }

  const defaultAgent: AgentRoutingProfile = {
    id: agentId,
    routing_mode: "yike_concierge",
    allow_direct_whatsapp: false,
    billing_mode: "free",
    lead_billing_enabled: false,
    direct_routing_health_status: "healthy",
    whatsapp,
    phone,
  };

  const defaultListing: ListingRoutingContext = {
    id: listingId,
    title,
    slug: null,
  };

  try {
    const pipeline = await finalizeLeadRouting({
      leadId: logResult.ok ? logResult.leadId : "",
      yikeReference,
      listingId,
      agentId,
      agent: agentRow ?? defaultAgent,
      listing: listingRow ?? defaultListing,
      visitor: {
        userId,
        guestId,
        ipHash: hashClientIp(ip),
        requesterWhatsapp: whatsapp,
      },
      leadType,
      sourcePage,
      agentName,
      agentWhatsapp: whatsapp,
      agentPhone: phone,
      title,
      area,
      city,
      price,
      paymentPeriod,
      listingType,
      bedrooms,
      propertyType,
    });

    if (!pipeline.redirectUrl) {
      throw new Error("empty_redirect");
    }

    return NextResponse.json({
      ok: true,
      yikeReference,
      redirectUrl: pipeline.redirectUrl,
      handoffUrl: pipeline.handoffUrl,
      gateway: pipeline.gateway,
      listingNotice,
    });
  } catch (err) {
    console.error("[leads/track] pipeline error:", err);
    const fb = buildSupportFallbackResult({
      yikeReference,
      listingId,
      agentId,
      title,
      area,
      city,
      slug: listingRow?.slug,
      price,
      paymentPeriod,
      listingType,
      bedrooms,
      propertyType,
    });
    return NextResponse.json({
      ok: true,
      yikeReference,
      redirectUrl: fb.redirectUrl,
      handoffUrl: fb.handoffUrl,
      gateway: true,
      fallback: true,
      listingNotice,
    });
  }
}
