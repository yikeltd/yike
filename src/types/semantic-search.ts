export type CategoryType = "property" | "vehicle";

export type ParsedIntent = {
  rawQuery: string;
  category: CategoryType;
  targetLocation: string;
  priceCap?: string;
  keywordsExtracted: string[];
  vectorDimensions: number;
  modelUsed: string;
};

export type SemanticQueryResult = {
  id: string;
  title: string;
  category: CategoryType;
  location: string;
  price: string;
  similarityScore: number;
  bm25Score: number;
  hybridScore: number;
  matchReasons: string[];
  image: string;
};

export type SemanticBenchmark = {
  modelName: string;
  dimensions: number;
  avgQueryTimeMs: number;
  cacheHitLatencyMs: number;
  vectorIndexType: string;
};
