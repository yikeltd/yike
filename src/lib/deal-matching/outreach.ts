import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createNotificationDraft,
  sendNotificationCampaign,
} from "@/lib/notifications/admin/send";
import { agentDealResponsePath } from "@/lib/deal-matching/whatsapp";
import type { DealMatchRequest } from "@/types/deal-matching";
import { publicBudgetLabel } from "@/lib/deal-matching/budget-display";
import { DEAL_REQUEST_TYPE_LABELS } from "@/lib/deal-matching/constants";

function buildNotificationBody(request: DealMatchRequest): string {
  const location = [request.target_area, request.city, request.state].filter(Boolean).join(", ");
  const typeLabel = DEAL_REQUEST_TYPE_LABELS[request.request_type] ?? "Property";
  const budget = publicBudgetLabel(request.budget_min, request.budget_max);

  const parts = [
    `A client is looking for ${typeLabel.toLowerCase()} support:`,
    request.subject.trim(),
  ];
  if (location) parts.push(`Area: ${location}`);
  if (request.property_type) parts.push(`Type: ${request.property_type}`);
  if (budget) parts.push(budget);
  if (request.requirements?.trim()) {
    parts.push("", request.requirements.trim().slice(0, 500));
  }
  parts.push("", "If you have a matching property, contact Yike Operations on WhatsApp.");
  return parts.join("\n");
}

export async function sendDealOutreachNotifications(
  admin: SupabaseClient,
  request: DealMatchRequest,
  outreachRows: Array<{ id: string; recipient_user_id: string }>,
  sentBy: string
): Promise<{ sentCount: number; campaignIds: string[] }> {
  const campaignIds: string[] = [];
  let sentCount = 0;
  const now = new Date().toISOString();

  for (const row of outreachRows) {
    const actionUrl = agentDealResponsePath(row.id);
    const { campaignId } = await createNotificationDraft(admin, {
      title: request.subject.trim().slice(0, 120),
      body: buildNotificationBody(request),
      category: "lead",
      priority: request.urgency === "urgent" ? "urgent" : "high",
      targetType: "selected_agents",
      selectedRecipientIds: [row.recipient_user_id],
      actionLabel: "Respond on WhatsApp",
      actionUrl,
      createdBy: sentBy,
    });

    const result = await sendNotificationCampaign(admin, campaignId, sentBy);
    sentCount += result.sentCount;
    campaignIds.push(campaignId);

    await admin
      .from("deal_match_outreach")
      .update({
        status: "sent",
        sent_at: now,
        notification_campaign_id: campaignId,
      })
      .eq("id", row.id);
  }

  return { sentCount, campaignIds };
}
