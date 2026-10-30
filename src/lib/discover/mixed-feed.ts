import type { Property } from "@/types/database";
import { normalizeAssetType } from "@/lib/marketplace/listings";

/** Round-robin interleave so mixed discover shows variety, not one vertical first. */
export function interleaveDiscoverListings(
  pools: Property[][],
  targetSize: number,
): Property[] {
  const active = pools.filter((p) => p.length > 0);
  if (active.length === 0) return [];
  if (active.length === 1) return active[0].slice(0, targetSize);

  const out: Property[] = [];
  const seen = new Set<string>();
  let round = 0;

  while (out.length < targetSize && round < targetSize * active.length) {
    let added = false;
    for (const pool of active) {
      const item = pool[round];
      if (!item || seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
      added = true;
      if (out.length >= targetSize) break;
    }
    round++;
    if (!added) break;
  }

  return out;
}

export function splitDiscoverPools(items: Property[]): {
  property: Property[];
  vehicle: Property[];
  electronics: Property[];
} {
  const property: Property[] = [];
  const vehicle: Property[] = [];
  const electronics: Property[] = [];
  for (const p of items) {
    const asset = normalizeAssetType(p.asset_type);
    if (asset === "VEHICLE") vehicle.push(p);
    else if (asset === "ELECTRONICS") electronics.push(p);
    else property.push(p);
  }
  return { property, vehicle, electronics };
}
