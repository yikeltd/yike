/**
 * Sample catalog ids use an `s` prefix for stable dev fixtures.
 * Supabase Auth and Postgres UUID columns require hex — map `s` → `a` for DB seed only.
 */
export function sampleCatalogIdToDbUuid(catalogId: string): string {
  if (!catalogId.startsWith("s")) return catalogId;
  return `a${catalogId.slice(1)}`;
}
