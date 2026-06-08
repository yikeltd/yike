import { yikeWhatsAppNumber } from "@/lib/leads/gateway";
import { YIKE_SUPPORT_WHATSAPP } from "@/lib/constants";
import { normalizeWhatsApp } from "@/lib/utils";
import type { DealMatchRequest } from "@/types/deal-matching";
import { publicBudgetLabel } from "@/lib/deal-matching/budget-display";
import { DEAL_REQUEST_TYPE_LABELS } from "@/lib/deal-matching/constants";

export function buildDealResponseMessage(request: Pick<
  DealMatchRequest,
  "subject" | "request_type" | "target_area" | "city" | "state" | "property_type" | "requirements" | "budget_min" | "budget_max"
>): string {
  const location = [request.target_area, request.city, request.state].filter(Boolean).join(", ");
  const typeLabel = DEAL_REQUEST_TYPE_LABELS[request.request_type] ?? "Property";
  const budget = publicBudgetLabel(request.budget_min, request.budget_max);

  const lines = [
    "Hello Yike Operations,",
    "",
    `I have a matching property for the ${typeLabel.toLowerCase()} request:`,
    request.subject.trim(),
  ];

  if (location) lines.push(`Location: ${location}`);
  if (request.property_type) lines.push(`Type: ${request.property_type}`);
  if (budget) lines.push(budget);
  if (request.requirements?.trim()) {
    lines.push("", "Notes:", request.requirements.trim().slice(0, 400));
  }

  lines.push("", "Please connect me with the Yike deal desk.");
  return lines.join("\n");
}

export function dealResponseWhatsAppUrl(
  request: Parameters<typeof buildDealResponseMessage>[0],
  phone?: string | null
): string {
  const number = normalizeWhatsApp(phone ?? yikeWhatsAppNumber() ?? YIKE_SUPPORT_WHATSAPP);
  const text = buildDealResponseMessage(request);
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function agentDealResponsePath(outreachId: string): string {
  return `/agent/deal-match/${outreachId}`;
}
