import type { ListingTypeValue } from "@/constants/listingTypes";
import { getPropertyCategoryLabel } from "@/constants/propertyCategories";
import { getAmenityLabel } from "@/constants/amenities";
import { getValueDriverDefinition } from "@/constants/valueDrivers";
import {
  buildSuggestedTitle,
  descriptionTip,
} from "@/lib/listing-form-copy";
import {
  isCommercialProperty,
  isLandProperty,
} from "@/lib/listing-field-rules";

export type ListingWritingContext = {
  listingType: ListingTypeValue;
  propertyType: string;
  bedrooms?: string;
  bathrooms?: string;
  city?: string;
  area?: string;
  state?: string;
  amenities?: string[];
  valueDriverKeys?: string[];
};

export type WritingSuggestion = {
  id: string;
  text: string;
  label: string;
  kind: "phrase" | "sentence" | "completion";
};

export type WritingAssistBundle = {
  quickPick: WritingSuggestion | null;
  phrases: WritingSuggestion[];
  sentences: WritingSuggestion[];
  completions: WritingSuggestion[];
  tip: string;
};

function placeLabel(ctx: ListingWritingContext): string | null {
  return ctx.area?.trim() || ctx.city?.trim() || ctx.state?.trim() || null;
}

function beds(ctx: ListingWritingContext): number {
  const n = Number(ctx.bedrooms);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function propertyLabel(ctx: ListingWritingContext): string {
  return getPropertyCategoryLabel(ctx.propertyType).toLowerCase();
}

function listingIntent(ctx: ListingWritingContext): string {
  if (ctx.listingType === "sale") return "for sale";
  if (ctx.listingType === "shortlet") return "shortlet";
  if (ctx.listingType === "lease") return "for lease";
  return "for rent";
}

function uniqueSuggestions(items: WritingSuggestion[]): WritingSuggestion[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.text.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function notAlreadyUsed(text: string, current: string): boolean {
  const hay = current.trim().toLowerCase();
  if (!hay) return true;
  return !hay.includes(text.trim().toLowerCase());
}

function filterUnused(suggestions: WritingSuggestion[], current: string): WritingSuggestion[] {
  return suggestions.filter((s) => notAlreadyUsed(s.text, current));
}

function amenityPhrases(ctx: ListingWritingContext): WritingSuggestion[] {
  return (ctx.amenities ?? []).map((id) => {
    const label = getAmenityLabel(id);
    return {
      id: `amenity-${id}`,
      label,
      text: label,
      kind: "phrase" as const,
    };
  });
}

function valueDriverPhrases(ctx: ListingWritingContext): WritingSuggestion[] {
  return (ctx.valueDriverKeys ?? []).flatMap((key) => {
    const def = getValueDriverDefinition(key);
    if (!def) return [];
    return [
      {
        id: `driver-${key}`,
        label: def.label,
        text: def.label,
        kind: "phrase" as const,
      },
    ];
  });
}

function titlePhraseBank(ctx: ListingWritingContext): WritingSuggestion[] {
  const place = placeLabel(ctx);
  const type = propertyLabel(ctx);
  const bedCount = beds(ctx);
  const intent = listingIntent(ctx);
  const items: WritingSuggestion[] = [];

  if (bedCount > 0) {
    items.push({
      id: "beds",
      label: `${bedCount}-bed`,
      text: `${bedCount}-bedroom`,
      kind: "phrase",
    });
  }

  if (place) {
    items.push({
      id: "in-place",
      label: `in ${place}`,
      text: `in ${place}`,
      kind: "phrase",
    });
  }

  if (isLandProperty(ctx.propertyType)) {
    items.push(
      { id: "plot-size", label: "Plot size", text: "600sqm plot", kind: "phrase" },
      { id: "dry-land", label: "Dry land", text: "dry land", kind: "phrase" },
      { id: "tarred-road", label: "Tarred road", text: "tarred road access", kind: "phrase" }
    );
  } else if (isCommercialProperty(ctx.propertyType)) {
    items.push(
      { id: "road-front", label: "Road front", text: "road frontage", kind: "phrase" },
      { id: "shop-space", label: "Shop space", text: `${type} space`, kind: "phrase" },
      { id: "parking", label: "Parking", text: "parking available", kind: "phrase" }
    );
  } else if (ctx.listingType === "shortlet") {
    items.push(
      { id: "furnished", label: "Furnished", text: "furnished", kind: "phrase" },
      { id: "wifi", label: "WiFi", text: "WiFi included", kind: "phrase" },
      { id: "daily-rate", label: "Nightly", text: "nightly rate", kind: "phrase" }
    );
  } else {
    items.push(
      { id: "spacious", label: "Spacious", text: "spacious", kind: "phrase" },
      { id: "serene", label: "Serene", text: "serene area", kind: "phrase" },
      { id: "estate", label: "Estate", text: "gated estate", kind: "phrase" }
    );
  }

  items.push({
    id: "intent",
    label: intent,
    text: intent,
    kind: "phrase",
  });

  return uniqueSuggestions([...items, ...amenityPhrases(ctx).slice(0, 4)]);
}

function titleSentenceBank(ctx: ListingWritingContext): WritingSuggestion[] {
  const place = placeLabel(ctx);
  const type = propertyLabel(ctx);
  const bedCount = beds(ctx);
  const intent = listingIntent(ctx);
  const sentences: WritingSuggestion[] = [];

  const full = buildSuggestedTitle({
    listingType: ctx.listingType,
    propertyType: ctx.propertyType,
    bedrooms: ctx.bedrooms,
    area: ctx.area,
    city: ctx.city,
  });
  if (full) {
    sentences.push({
      id: "full-title",
      label: "Use full title",
      text: full,
      kind: "sentence",
    });
  }

  if (place) {
    if (isLandProperty(ctx.propertyType)) {
      sentences.push({
        id: "land-title",
        label: "Land in area",
        text: `${getPropertyCategoryLabel(ctx.propertyType)} ${intent} in ${place}`,
        kind: "sentence",
      });
    } else if (isCommercialProperty(ctx.propertyType)) {
      sentences.push({
        id: "commercial-title",
        label: "Commercial title",
        text: `${getPropertyCategoryLabel(ctx.propertyType)} ${intent} in ${place}`,
        kind: "sentence",
      });
    } else if (bedCount > 0) {
      sentences.push({
        id: "bed-title",
        label: "Bed + area",
        text: `${bedCount}-bedroom ${type} ${intent} in ${place}`,
        kind: "sentence",
      });
    } else {
      sentences.push({
        id: "type-title",
        label: "Type + area",
        text: `${type} ${intent} in ${place}`,
        kind: "sentence",
      });
    }
  }

  return uniqueSuggestions(sentences);
}

function descriptionSentenceBank(ctx: ListingWritingContext): WritingSuggestion[] {
  const place = placeLabel(ctx);
  const type = propertyLabel(ctx);
  const bedCount = beds(ctx);
  const sentences: WritingSuggestion[] = [];

  if (place) {
    if (isLandProperty(ctx.propertyType)) {
      sentences.push({
        id: "land-open",
        label: "Plot intro",
        text: `Well-located ${type} in ${place} with good road access.`,
        kind: "sentence",
      });
      sentences.push({
        id: "land-docs",
        label: "Documents",
        text: "Title documents are available for serious buyers.",
        kind: "sentence",
      });
    } else if (isCommercialProperty(ctx.propertyType)) {
      sentences.push({
        id: "commercial-open",
        label: "Space intro",
        text: `Prime ${type} in ${place} suitable for retail or office use.`,
        kind: "sentence",
      });
      sentences.push({
        id: "commercial-traffic",
        label: "Foot traffic",
        text: "Good road visibility and steady foot traffic.",
        kind: "sentence",
      });
    } else if (ctx.listingType === "shortlet") {
      sentences.push({
        id: "shortlet-open",
        label: "Stay intro",
        text: `Comfortable ${bedCount > 0 ? `${bedCount}-bedroom ` : ""}${type} shortlet in ${place}.`,
        kind: "sentence",
      });
      sentences.push({
        id: "shortlet-guests",
        label: "Guest ready",
        text: "Fully furnished with WiFi, power backup, and a clean setup for guests.",
        kind: "sentence",
      });
    } else {
      sentences.push({
        id: "res-open",
        label: "Property intro",
        text: `${bedCount > 0 ? `Spacious ${bedCount}-bedroom ` : ""}${type} located in ${place}.`,
        kind: "sentence",
      });
      sentences.push({
        id: "res-access",
        label: "Access",
        text: "Easy access to main road and nearby amenities.",
        kind: "sentence",
      });
    }
  }

  const amenityLabels = (ctx.amenities ?? []).map(getAmenityLabel);
  if (amenityLabels.length >= 2) {
    sentences.push({
      id: "amenities-line",
      label: "List features",
      text: `Features include ${amenityLabels.slice(0, 4).join(", ")}.`,
      kind: "sentence",
    });
  } else if (amenityLabels.length === 1) {
    sentences.push({
      id: "amenity-line",
      label: "Feature",
      text: `Includes ${amenityLabels[0]}.`,
      kind: "sentence",
    });
  }

  const drivers = (ctx.valueDriverKeys ?? [])
    .map((key) => getValueDriverDefinition(key)?.label)
    .filter(Boolean) as string[];
  if (drivers.length > 0) {
    sentences.push({
      id: "drivers-line",
      label: "Standout points",
      text: `Highlights: ${drivers.slice(0, 3).join(", ")}.`,
      kind: "sentence",
    });
  }

  sentences.push({
    id: "cta",
    label: "Close line",
    text: "Available for inspection — message for viewing.",
    kind: "sentence",
  });

  return uniqueSuggestions(sentences);
}

function descriptionPhraseBank(ctx: ListingWritingContext): WritingSuggestion[] {
  const items: WritingSuggestion[] = [];

  if (isLandProperty(ctx.propertyType)) {
    items.push(
      { id: "plot", label: "Plot size", text: "600sqm", kind: "phrase" },
      { id: "survey", label: "Survey", text: "survey plan available", kind: "phrase" },
      { id: "coo", label: "C of O", text: "C of O", kind: "phrase" },
      { id: "corner", label: "Corner piece", text: "corner piece", kind: "phrase" }
    );
  } else if (isCommercialProperty(ctx.propertyType)) {
    items.push(
      { id: "frontage", label: "Frontage", text: "shop frontage", kind: "phrase" },
      { id: "toilet", label: "Toilet", text: "has toilet", kind: "phrase" },
      { id: "power", label: "Power", text: "stable power supply", kind: "phrase" },
      { id: "parking", label: "Parking", text: "parking space", kind: "phrase" }
    );
  } else if (ctx.listingType === "shortlet") {
    items.push(
      { id: "wifi", label: "WiFi", text: "high-speed WiFi", kind: "phrase" },
      { id: "ac", label: "AC", text: "air conditioning", kind: "phrase" },
      { id: "cleaning", label: "Cleaning", text: "daily cleaning", kind: "phrase" },
      { id: "checkin", label: "Check-in", text: "flexible check-in", kind: "phrase" }
    );
  } else {
    items.push(
      { id: "pop", label: "POP", text: "POP ceiling", kind: "phrase" },
      { id: "tiled", label: "Tiled", text: "tiled floors", kind: "phrase" },
      { id: "bq", label: "BQ", text: "boys quarters", kind: "phrase" },
      { id: "security", label: "Security", text: "24hr security", kind: "phrase" }
    );
  }

  return uniqueSuggestions([
    ...items,
    ...amenityPhrases(ctx),
    ...valueDriverPhrases(ctx),
  ]);
}

function completionBank(ctx: ListingWritingContext, field: "title" | "description"): string[] {
  const place = placeLabel(ctx);
  const type = propertyLabel(ctx);
  const base =
    field === "title"
      ? [
          "spacious",
          "serene",
          "newly built",
          "well finished",
          "gated estate",
          "tarred road",
          "close to main road",
          place ? `in ${place}` : "",
          listingIntent(ctx),
        ]
      : [
          "Features include ",
          "Located in ",
          "Close to ",
          "Easy access to ",
          "Available for inspection",
          "Serious enquiries only",
          place ? `${place}, ` : "",
          type,
          "prepaid meter",
          "borehole water",
          "24hr security",
          "parking space",
          "POP ceiling",
          "tiled throughout",
        ];

  return base.filter(Boolean);
}

function matchCompletions(
  ctx: ListingWritingContext,
  field: "title" | "description",
  current: string
): WritingSuggestion[] {
  const trimmed = current.trim();
  if (!trimmed) return [];

  const fragment = trimmed.split(/\s+/).pop()?.toLowerCase() ?? "";
  if (fragment.length < 2) return [];

  return completionBank(ctx, field)
    .filter((phrase) => phrase.toLowerCase().startsWith(fragment))
    .slice(0, 4)
    .map((text, index) => ({
      id: `completion-${index}-${text}`,
      label: text,
      text,
      kind: "completion" as const,
    }));
}

/** Replace the word being typed when picking an autocomplete completion. */
export function applyWritingCompletion(current: string, completion: string): string {
  const trimmed = current.trimEnd();
  if (!trimmed) return completion.trim();

  const parts = trimmed.split(/\s+/);
  const last = parts[parts.length - 1] ?? "";
  if (last.length >= 2 && completion.toLowerCase().startsWith(last.toLowerCase())) {
    parts[parts.length - 1] = completion;
    return parts.join(" ");
  }

  return appendWritingFragment(current, completion);
}

export function appendWritingFragment(current: string, fragment: string): string {
  const base = current.trim();
  const piece = fragment.trim();
  if (!piece) return current;
  if (!base) return piece;

  const endsSentence = /[.!?]$/.test(base);
  const endsClause = /[,;:]$/.test(base);

  if (piece.endsWith(".") || piece.length > 40) {
    const joiner = endsSentence ? " " : endsClause ? " " : ". ";
    return `${base}${joiner}${piece}`;
  }

  if (endsSentence || endsClause) {
    return `${base} ${piece}`;
  }

  if (base.toLowerCase().includes(piece.toLowerCase())) return base;
  return `${base}, ${piece}`;
}

export function buildDraftDescription(ctx: ListingWritingContext): string | null {
  const sentences = descriptionSentenceBank(ctx);
  if (!sentences.length) return null;
  return sentences
    .filter((s) => s.id !== "cta")
    .slice(0, 3)
    .map((s) => s.text)
    .join(" ");
}

export function getWritingAssist(
  ctx: ListingWritingContext,
  field: "title" | "description",
  currentText: string
): WritingAssistBundle {
  const phrases =
    field === "title"
      ? filterUnused(titlePhraseBank(ctx), currentText)
      : filterUnused(descriptionPhraseBank(ctx), currentText);

  const sentences = filterUnused(
    field === "title" ? titleSentenceBank(ctx) : descriptionSentenceBank(ctx),
    currentText
  );

  const completions = filterUnused(matchCompletions(ctx, field, currentText), currentText);

  const quickPick =
    field === "title"
      ? sentences.find((s) => s.id === "full-title") ?? sentences[0] ?? null
      : null;

  return {
    quickPick,
    phrases: phrases.slice(0, 8),
    sentences: sentences.slice(0, 5),
    completions,
    tip: descriptionTip(ctx.listingType, ctx.propertyType),
  };
}
