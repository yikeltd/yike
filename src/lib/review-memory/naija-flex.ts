import type { ListingExtras, Property } from "@/types/database";
import { getListingExtras } from "@/lib/rent-breakdown";

/** Phrases that signal realistic Nigerian market flexibility */
const GOOD_FLEX_PATTERNS = [
  /negotiable with landlord/i,
  /between you and landlord/i,
  /discuss with landlord/i,
  /landlord.?controlled/i,
  /service charge not fixed/i,
  /not fixed yet/i,
  /caretaker/i,
  /caretaker.?managed/i,
  /commercial terms discussed/i,
  /after inspection/i,
  /title processing/i,
  /c of o in process/i,
  /governor.?s consent/i,
  /flexible payment/i,
  /payment plan/i,
];

/** Phrases that signal suspicious vagueness when combined with weak signals */
const BAD_VAGUE_PATTERNS = [
  /call for price/i,
  /contact for price/i,
  /price on call/i,
  /hurry/i,
  /last last/i,
  /no inspection/i,
  /pay before viewing/i,
  /urgent urgent/i,
];

export type NaijaFlexResult = {
  score: number;
  isExplainableFlex: boolean;
  flexSignals: string[];
  vagueSignals: string[];
  abuseRisk: number;
};

function hasFlexibleMode(extras: ListingExtras): boolean {
  const modes = [
    extras.agency_fee_mode,
    extras.service_charge_mode,
    extras.caution_fee_mode,
    extras.agreement_fee_mode,
    extras.legal_fee_mode,
    extras.commission_mode,
  ];
  return modes.some(
    (m) => m === "negotiable" || m === "landlord" || m === "not_fixed"
  );
}

export function scoreNaijaFlexibility(
  property: Property,
  context?: { agentVagueListingCount?: number; complaintCount?: number }
): NaijaFlexResult {
  const extras = getListingExtras(property);
  const text = `${property.title} ${property.description ?? ""} ${extras.fees_flexible_note ?? ""}`;
  const flexSignals: string[] = [];
  const vagueSignals: string[] = [];

  if (hasFlexibleMode(extras)) {
    flexSignals.push("Transparent fee modes set (negotiable/landlord/not fixed)");
  }

  for (const pattern of GOOD_FLEX_PATTERNS) {
    if (pattern.test(text)) {
      flexSignals.push(`Explains market flexibility: "${pattern.source.slice(1, -2)}"`);
    }
  }

  if (extras.fees_flexible_note && extras.fees_flexible_note.trim().length >= 20) {
    flexSignals.push("Has fees flexibility note");
  }

  for (const pattern of BAD_VAGUE_PATTERNS) {
    if (pattern.test(text)) {
      vagueSignals.push(`Suspicious vagueness: "${pattern.source.slice(1, -2)}"`);
    }
  }

  const hasPrice = Number(property.price) > 0;
  const hasLocation = !!(property.area?.trim() && property.city?.trim());
  const hasPhotos = property.media_urls.length >= 3;
  const hasDescription = (property.description ?? "").trim().length >= 40;

  let score = 50;
  if (flexSignals.length > 0) score += Math.min(flexSignals.length * 8, 32);
  if (hasFlexibleMode(extras)) score += 12;
  if (hasPrice && hasLocation && hasPhotos) score += 10;
  if (hasDescription && flexSignals.length > 0) score += 8;

  if (vagueSignals.length > 0) score -= vagueSignals.length * 12;
  if (!hasPrice) score -= 15;
  if (!hasLocation) score -= 12;
  if (!hasPhotos) score -= 10;

  const agentVague = context?.agentVagueListingCount ?? 0;
  const complaints = context?.complaintCount ?? 0;
  let abuseRisk = 0;
  if (agentVague >= 3) abuseRisk += 20;
  if (complaints >= 2) abuseRisk += 25;
  if (vagueSignals.length >= 2 && flexSignals.length === 0) abuseRisk += 30;

  score -= abuseRisk * 0.4;

  const isExplainableFlex =
    flexSignals.length > 0 &&
    vagueSignals.length === 0 &&
    (hasPrice || property.listing_type === "sale") &&
    hasLocation;

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    isExplainableFlex,
    flexSignals,
    vagueSignals,
    abuseRisk: Math.min(100, abuseRisk),
  };
}
