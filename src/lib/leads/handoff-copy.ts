import {
  buildAgentHandoffUrl,
  buildSupportHandoffReply,
} from "@/lib/leads/whatsapp-urls";
import { listingPublicUrl } from "@/lib/leads/whatsapp-urls";
import type { HandoffPayload } from "@/lib/leads/handoff";

export function buildSupportHandoffCopy(data: HandoffPayload): string {
  const listingUrl =
    data.listingUrl ??
    listingPublicUrl(data.listingSlug, data.listingId);
  const publicListingCode = data.publicListingCode ?? data.yikeReference;

  const handoffUrl =
    data.agentHandoffUrl ??
    buildAgentHandoffUrl({
      agentWhatsapp: data.agentWhatsapp,
      agentPhone: data.agentPhone,
      agentName: data.agentName,
      listingTitle: data.title,
      publicListingCode,
      listingUrl,
    });

  return (
    data.supportReply ??
    buildSupportHandoffReply({
      agentName: data.agentName,
      agentHandoffUrl: handoffUrl,
    })
  );
}
