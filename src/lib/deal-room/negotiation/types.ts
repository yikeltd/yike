/**
 * Yike Transaction Workspace Engine — Negotiation Engine Domain Types
 * Immutable, versioned negotiation aggregate, summary, and lifecycle contracts.
 */

import type { BaseEntity, ParticipantRole } from "../types";

export type NegotiationStatus =
  | "draft"
  | "submitted"
  | "viewed"
  | "countered"
  | "accepted"
  | "rejected"
  | "withdrawn"
  | "expired"
  | "cancelled"
  | "completed";

export interface NegotiationVersion {
  versionNumber: number;
  amount: number;
  currency: "NGN" | "USD";
  offeredBy: string;
  offeredRole: ParticipantRole;
  offeredTo: string;
  note?: string;
  negotiationStatus: NegotiationStatus;
  expiresAt: string;
  createdAt: string;
}

export interface NegotiationAggregate extends BaseEntity {
  workspaceId: string;
  listingId: string;
  originalAskingPrice: number;
  currentAmount: number;
  currency: "NGN" | "USD";
  negotiationStatus: NegotiationStatus;
  currentVersionNumber: number;
  versions: NegotiationVersion[];
  expiresAt: string;
  metadata?: Record<string, unknown>;
}

export interface NegotiationSummary {
  negotiationId: string;
  workspaceId: string;
  currentAmount: number;
  originalAskingPrice: number;
  differenceAmount: number;
  percentageDifference: number;
  totalOffersExchanged: number;
  currentStatus: NegotiationStatus;
  currentOfferedByRole: ParticipantRole;
  expiresAt: string;
  lastUpdated: string;
}
