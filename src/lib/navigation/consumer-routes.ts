/** Canonical consumer marketplace routes — verify paths exist before linking. */

export const CONSUMER_ROUTES = {
  home: "/",
  discover: "/discover",
  search: "/search",
  saved: "/saved",
  messages: "/conversations",
  profile: "/agent",
  wallet: "/account/coins",
  agentListings: "/agent/listings",
} as const;

export type ConsumerRouteKey = keyof typeof CONSUMER_ROUTES;

export function consumerRoute(key: ConsumerRouteKey): string {
  return CONSUMER_ROUTES[key];
}

/** Saved empty state — search feed (legacy `/browse` redirects to discover). */
export const SAVED_EMPTY_BROWSE_HREF = CONSUMER_ROUTES.search;
