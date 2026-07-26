/**
 * YipContext — the normalized envelope every capability receives. Building
 * it once (via `buildContext`) means decision/recommendation/pricing/trust
 * providers all read the same shape instead of each inventing their own.
 */
import type { Actor, MarketplaceDomain } from "../shared/types";

export type YipContext = {
  domain: MarketplaceDomain;
  categoryId?: string;
  /** Seller-entered / resolved field values, keyed by field id — deliberately loose-typed. */
  values: Record<string, unknown>;
  location: {
    state?: string;
    city?: string;
    area?: string;
  };
  actor: Actor;
  sessionId?: string;
  photoCount: number;
  builtAt: string;
};

export type BuildContextInput = {
  domain: MarketplaceDomain;
  categoryId?: string;
  values?: Record<string, unknown>;
  location?: { state?: string; city?: string; area?: string };
  actor?: Actor;
  sessionId?: string;
  photoCount?: number;
};
