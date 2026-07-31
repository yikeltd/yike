export type TransactionPassportState =
  | "DRAFT"
  | "MATCHED"
  | "NEGOTIATING"
  | "INSPECTION"
  | "LEGAL_REVIEW"
  | "ESCROW"
  | "SETTLEMENT"
  | "TRANSFER"
  | "COMPLETED"
  | "ARCHIVED"
  | "CANCELLED"
  | "DISPUTED";

export type AssetCategory = "property" | "vehicle" | "rental" | "land";

export type TransactionPassport = {
  id: string;
  assetId: string;
  assetTitle: string;
  assetCategory: AssetCategory;
  buyerId: string;
  sellerId: string;
  countryCode: string;
  valuationAmount: number;
  currency: string;
  currentState: TransactionPassportState;
  createdAt: string;
  updatedAt: string;
};

export type StateTransition = {
  fromState: TransactionPassportState;
  toState: TransactionPassportState;
  actorId: string;
  timestamp: string;
  reason?: string;
};
