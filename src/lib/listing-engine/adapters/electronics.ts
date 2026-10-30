import type { ListingValues } from "../types";

export function valuesToElectronicsPayload(
  values: ListingValues,
  opts: {
    listingId?: string;
    mediaUrls?: string[];
    idempotencyKey?: string;
  } = {},
): Record<string, unknown> {
  const mediaUrls =
    opts.mediaUrls ?? (Array.isArray(values.media_urls) ? (values.media_urls as string[]) : []);

  const attributes: Record<string, unknown> = {};
  for (const key of [
    "storage_gb",
    "ram_gb",
    "screen_size",
    "power_kva",
    "capacity_liters",
    "battery_capacity_ah",
    "warranty_status",
    "warranty_note",
    "warranty_months",
  ] as const) {
    if (values[key] != null && values[key] !== "") {
      attributes[key] = values[key];
    }
  }

  return {
    id: opts.listingId,
    ...(opts.idempotencyKey ? { idempotencyKey: opts.idempotencyKey } : {}),
    auto_category: values.auto_category,
    title: values.title,
    description: values.description,
    price: Number(values.price),
    state: values.state,
    city: values.city,
    area: values.area || values.city,
    media_urls: mediaUrls,
    brand: values.brand ?? values.make,
    model: values.model,
    condition: values.condition ?? values.electronics_condition,
    attributes,
  };
}
