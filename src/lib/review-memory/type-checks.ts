import type { Property } from "@/types/database";
import { getListingExtras } from "@/lib/rent-breakdown";
import { analyzeListingQuality } from "@/lib/listing-quality";

export type TypeCheckSignal = {
  id: string;
  label: string;
  positive: boolean;
  weight: number;
};

function landSignals(property: Property): TypeCheckSignal[] {
  const text = `${property.title} ${property.description ?? ""}`.toLowerCase();
  const signals: TypeCheckSignal[] = [];

  const hasSize =
    /\d+\s*(sqm|square\s*metre|plot|acre|hectare)/i.test(text) ||
    (property.extras as Record<string, unknown> | null)?.land_size != null;

  signals.push({
    id: "land_size",
    label: hasSize ? "Land size stated" : "Land size unclear",
    positive: hasSize,
    weight: 12,
  });

  const titleClaim =
    /c of o|certificate of occupancy|survey|deed|governor.?s consent|excision|gazette/i.test(
      text
    );
  signals.push({
    id: "title_claim",
    label: titleClaim
      ? "Title/document claim present — verify if needed"
      : "No title/document details",
    positive: titleClaim,
    weight: titleClaim ? 6 : -4,
  });

  if (/flood|waterlog|dry land|swamp/i.test(text)) {
    signals.push({
      id: "flood_note",
      label: "Flood/dry land mentioned",
      positive: true,
      weight: 4,
    });
  }

  if (/urgent|hurry|last plot/i.test(text)) {
    signals.push({
      id: "urgency",
      label: "Urgency pressure language",
      positive: false,
      weight: -10,
    });
  }

  return signals;
}

function rentSignals(property: Property): TypeCheckSignal[] {
  const extras = getListingExtras(property);
  const signals: TypeCheckSignal[] = [];

  const feeModes = [
    extras.agency_fee_mode,
    extras.caution_fee_mode,
    extras.service_charge_mode,
    extras.agreement_fee_mode,
  ].filter(Boolean);

  signals.push({
    id: "fee_clarity",
    label:
      feeModes.length >= 2
        ? "Fee breakdown partially set"
        : "Agency/legal/caution fees unclear",
    positive: feeModes.length >= 2,
    weight: feeModes.length >= 2 ? 10 : -8,
  });

  const fresh =
    property.last_refreshed_at &&
    Date.now() - new Date(property.last_refreshed_at).getTime() < 30 * 86_400_000;
  signals.push({
    id: "freshness",
    label: fresh ? "Recently refreshed" : "Availability freshness unclear",
    positive: !!fresh,
    weight: fresh ? 6 : -4,
  });

  return signals;
}

function commercialSignals(property: Property): TypeCheckSignal[] {
  const text = `${property.title} ${property.description ?? ""}`.toLowerCase();
  const pt = (property.property_type ?? "").toLowerCase();
  const isCommercial =
    /shop|office|warehouse|plaza|commercial/i.test(text) ||
    /shop|office|commercial|warehouse/.test(pt);

  if (!isCommercial) return [];

  const signals: TypeCheckSignal[] = [];

  if (/frontage|road front|main road/i.test(text)) {
    signals.push({
      id: "frontage",
      label: "Frontage/access mentioned",
      positive: true,
      weight: 6,
    });
  }

  if (/foot traffic|busy area|market/i.test(text)) {
    signals.push({
      id: "foot_traffic",
      label: "Foot traffic claim — verify if exaggerated",
      positive: true,
      weight: 3,
    });
  }

  if (/parking|loading|truck/i.test(text)) {
    signals.push({
      id: "access",
      label: "Parking/loading access noted",
      positive: true,
      weight: 5,
    });
  }

  const extras = getListingExtras(property);
  if (
    extras.agency_fee_mode === "negotiable" ||
    extras.agency_fee_mode === "landlord"
  ) {
    signals.push({
      id: "commercial_flex",
      label: "Flexible commercial fees noted",
      positive: true,
      weight: 8,
    });
  }

  return signals;
}

function shortletSignals(property: Property): TypeCheckSignal[] {
  if (property.listing_type !== "shortlet") return [];

  const text = `${property.title} ${property.description ?? ""}`.toLowerCase();
  const signals: TypeCheckSignal[] = [];

  if (/furnished|wifi|wi-fi|ac|air condition/i.test(text)) {
    signals.push({
      id: "amenity_claims",
      label: "Furnished/WiFi/AC claims — check photos",
      positive: true,
      weight: 5,
    });
  }

  const roomPhotos = property.media_urls.length;
  signals.push({
    id: "room_photos",
    label:
      roomPhotos >= 4
        ? "Enough room photos"
        : "Too few room photos for shortlet",
    positive: roomPhotos >= 4,
    weight: roomPhotos >= 4 ? 10 : -12,
  });

  if (property.payment_period === "daily" || property.payment_period === "weekly") {
    signals.push({
      id: "shortlet_pricing",
      label: "Daily/weekly pricing set",
      positive: true,
      weight: 6,
    });
  }

  return signals;
}

export function runTypeSpecificChecks(property: Property): TypeCheckSignal[] {
  const pt = (property.property_type ?? "").toLowerCase();
  const isLand =
    property.listing_type === "sale" &&
    /land|plot|acre|hectare/i.test(`${pt} ${property.title} ${property.description ?? ""}`);

  const signals: TypeCheckSignal[] = [];

  if (isLand) {
    signals.push(...landSignals(property));
  } else if (property.listing_type === "rent" || property.listing_type === "lease") {
    signals.push(...rentSignals(property));
  }

  signals.push(...commercialSignals(property));
  signals.push(...shortletSignals(property));

  const qualityFlags = analyzeListingQuality(property);
  if (qualityFlags.includes("few_images")) {
    signals.push({
      id: "few_images",
      label: "Too few photos",
      positive: false,
      weight: -10,
    });
  }

  if (property.possible_duplicate) {
    signals.push({
      id: "duplicate",
      label: "Possible duplicate listing",
      positive: false,
      weight: -18,
    });
  }

  return signals;
}

export function typeCheckScore(signals: TypeCheckSignal[]): number {
  let score = 60;
  for (const s of signals) {
    score += s.positive ? s.weight : s.weight;
  }
  return Math.max(0, Math.min(100, score));
}
