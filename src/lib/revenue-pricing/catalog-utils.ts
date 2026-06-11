import type { RevenuePricingCatalog, RevenuePricingItem } from "@/lib/revenue-pricing/types";

export function catalogToMap(catalog: RevenuePricingCatalog): Map<string, RevenuePricingItem> {
  const map = new Map<string, RevenuePricingItem>();
  for (const item of catalog.items) {
    map.set(`${item.product}:${item.variant_key}`, item);
  }
  return map;
}

export function getCatalogPrice(
  catalog: RevenuePricingCatalog | null,
  product: string,
  variantKey: string
): number | null {
  if (!catalog) return null;
  const item = catalog.items.find(
    (i) => i.product === product && i.variant_key === variantKey && i.active
  );
  return item ? item.amount : null;
}
