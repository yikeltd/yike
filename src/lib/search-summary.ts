import { PROPERTY_TYPES } from "@/constants/propertyCategories";
import { hubLabel } from "@/constants/listingTypes";
import { budgetLabelFromSearchParams } from "@/lib/budget-ranges";

export function budgetLabelFromParams(min: string | null, max: string | null): string | null {
  const label = budgetLabelFromSearchParams(min, max);
  if (label) return label;
  if (min && max) return `₦${Number(min).toLocaleString()} - ₦${Number(max).toLocaleString()}`;
  if (min) return `From ₦${Number(min).toLocaleString()}`;
  if (max) return `Under ₦${Number(max).toLocaleString()}`;
  return null;
}

export function formatSearchFilterSummary(
  params: URLSearchParams | { get: (key: string) => string | null }
): string | null {
  const parts: string[] = [];

  const city = params.get("city");
  const area = params.get("area");
  if (city && area) parts.push(`${area}, ${city}`);
  else if (city) parts.push(city);
  else if (area) parts.push(area);

  const hub = params.get("hub");
  if (hub) {
    parts.push(hubLabel(hub as Parameters<typeof hubLabel>[0]) ?? hub);
  } else {
    const type = params.get("type");
    if (type) parts.push(type.charAt(0).toUpperCase() + type.slice(1));
  }

  const propertyType = params.get("property_type");
  if (propertyType) {
    const label =
      PROPERTY_TYPES.find((t) => t.value === propertyType)?.label ??
      propertyType.replace(/_/g, " ");
    parts.push(label);
  }

  const budget = budgetLabelFromParams(params.get("min"), params.get("max"));
  if (budget) parts.push(budget);

  if (params.get("verified") === "1") parts.push("Verified");
  if (params.get("featured") === "1") parts.push("Featured");

  return parts.length > 0 ? parts.join(" · ") : null;
}
