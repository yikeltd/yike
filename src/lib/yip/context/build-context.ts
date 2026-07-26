/**
 * Pure builder — partial, loosely-shaped inputs in, a normalized
 * `YipContext` out. No side effects, no I/O, safe to call on every render.
 */
import type { BuildContextInput, YipContext } from "./types";

export function buildContext(input: BuildContextInput): YipContext {
  return {
    domain: input.domain,
    categoryId: input.categoryId,
    values: input.values ?? {},
    location: {
      state: input.location?.state,
      city: input.location?.city,
      area: input.location?.area,
    },
    actor: input.actor ?? { role: "guest" },
    sessionId: input.sessionId,
    photoCount: input.photoCount ?? 0,
    builtAt: new Date().toISOString(),
  };
}
