export type {
  MarketplaceLocation,
  MarketplaceLocationSource,
  LocationScope,
  LocationRankResult,
  RailCopy,
} from "./types";

export {
  CITY_CENTROIDS,
  resolveCityCentroid,
  nearestCityCentroid,
  haversineKm,
} from "./centroids";

export {
  NEARBY_STATES,
  getNearbyCities,
  getNearbyStates,
  citiesMatch,
  statesMatch,
} from "./nearby";

export {
  getMarketplaceLocation,
  setMarketplaceLocation,
  setNationwideMarketplaceLocation,
  clearMarketplaceLocation,
  hasSeenLocationPrompt,
  markLocationPromptSeen,
  marketplaceLocationLabel,
  isNationwideMarketplaceLocation,
  ensureMarketplaceLocationPersisted,
} from "./preference";

export {
  formatDistanceKm,
  listingDistanceKm,
  listingDistanceLabel,
} from "./distance";

export {
  rankByMarketplaceLocation,
  pickLocationAwareRail,
  scopeSubtitle,
} from "./rank";

export {
  requestMarketplaceGeolocation,
  bootstrapMarketplaceLocation,
} from "./geolocation";

export {
  localeMarketplaceHint,
  applySilentLocationFallback,
} from "./silent-fallback";

export {
  featuredRailCopy,
  recentRailCopy,
  trendingRailCopy,
  nearbyDealsRailCopy,
  nationwideRailCopy,
  luxuryRailCopy,
  lowMileageRailCopy,
} from "./rail-labels";
