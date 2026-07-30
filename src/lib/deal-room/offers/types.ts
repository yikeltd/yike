/**
 * Yike Deal Room Platform — Structured Offer Engine Schemas
 */

export type OfferStatus =
  | "draft"
  | "submitted"
  | "countered"
  | "accepted"
  | "rejected"
  | "withdrawn"
  | "expired";

export interface OfferHistoryEntry {
  id: string;
  amount: number;
  currency: "NGN" | "USD";
  actorId: string;
  note?: string;
  createdAt: string;
}

export interface DealOffer {
  id: string;
  dealRoomId: string;
  listingId: string;
  offeredBy: string;
  offeredTo: string;
  originalAmount: number;
  currentAmount: number;
  currency: "NGN" | "USD";
  status: OfferStatus;
  expiresAt: string;
  history: OfferHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}
