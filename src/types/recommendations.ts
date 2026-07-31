export type UserProfileVector = {
  userId: string;
  personaName: string;
  preferredCategories: string[];
  targetLocations: string[];
  budgetRange: string;
  trustScoreRequirement: number;
  embeddingVectorId: string;
};

export type RecommendedListing = {
  id: string;
  title: string;
  category: "property" | "vehicle";
  location: string;
  price: string;
  matchScore: number;
  matchReason: string;
  trustScore: number;
  itemSimilarity: number;
  image: string;
};

export type RecommendationMetric = {
  ctrLiftPercentage: string;
  avgLatencyMs: number;
  trustBoostMultiplier: string;
  modelVersion: string;
  algorithmType: string;
};
