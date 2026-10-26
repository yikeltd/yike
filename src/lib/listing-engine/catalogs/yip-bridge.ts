/**
 * Optional YIP-backed catalog source for the listing engine.
 *
 * `CATALOG_REGISTRY` (see `./registry.ts`) stays the engine's default and
 * tests continue to exercise it directly. This bridge exposes the same
 * catalog ids resolved through YIP's Knowledge Layer instead, so the engine
 * can migrate to it incrementally (see
 * docs/architecture/YIKE_INTELLIGENCE_PLATFORM.md — "migration from
 * listing-engine catalogs to knowledge").
 */
import { createKnowledgeFacade } from "@/lib/yip/knowledge";
import { buildCatalogMapFromKnowledge } from "@/lib/yip/knowledge/to-catalog-map";
import type { CatalogMap } from "./types";
import { CATALOG_REGISTRY } from "./registry";

const knowledge = createKnowledgeFacade();

/** YIP knowledge catalogs merged with engine registry (registry wins on id conflicts). */
export function getListingCatalogsFromYip(): CatalogMap {
  return {
    ...buildCatalogMapFromKnowledge(knowledge),
    ...CATALOG_REGISTRY,
  };
}
