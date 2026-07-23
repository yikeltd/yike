/**
 * Preferred marketplace location — local-first discovery context.
 * Enhances ordering; never blocks nationwide search.
 */

export type MarketplaceLocationSource =
  | "geo"
  | "manual"
  | "search"
  | "inferred"
  | "cookie"
  | "locale";

export type MarketplaceLocation = {
  state: string;
  /** Empty when browsing an entire state or nationwide. */
  city: string;
  /** Optional area/neighborhood when known */
  area?: string;
  lat?: number;
  lng?: number;
  source: MarketplaceLocationSource;
  updatedAt: number;
};

export type LocationScope =
  | "city"
  | "nearby_city"
  | "state"
  | "nearby_state"
  | "nationwide";

export type LocationRankResult = {
  items: import("@/types/database").Property[];
  scope: LocationScope;
  /** Honest copy when results were expanded beyond preferred city */
  expanded: boolean;
  labelCity?: string;
  labelState?: string;
};

export type RailCopy = {
  title: string;
  subtitle?: string;
  href: string;
};
