/**
 * Yike Deal Room Platform — Transaction Lifecycle State Machine
 * Prevents invalid state leaps and guarantees transaction audit integrity.
 */

import type { DealRoomStatus } from "./types";

const VALID_TRANSITIONS: Record<DealRoomStatus, DealRoomStatus[]> = {
  lead_created: ["buyer_interested", "seller_responded", "cancelled"],
  buyer_interested: ["seller_responded", "negotiation", "inspection_requested", "cancelled"],
  seller_responded: ["negotiation", "inspection_requested", "offer_sent", "cancelled"],
  negotiation: ["inspection_requested", "offer_sent", "documents_shared", "cancelled"],
  inspection_requested: ["inspection_scheduled", "negotiation", "cancelled"],
  inspection_scheduled: ["inspection_completed", "cancelled"],
  inspection_completed: ["negotiation", "documents_shared", "offer_sent", "cancelled"],
  documents_shared: ["offer_sent", "payment_pending", "cancelled"],
  offer_sent: ["offer_accepted", "negotiation", "cancelled"],
  offer_accepted: ["payment_pending", "completed", "cancelled"],
  payment_pending: ["completed", "cancelled"],
  completed: ["archived"],
  archived: [],
  cancelled: ["archived"],
};

export function canTransition(current: DealRoomStatus, next: DealRoomStatus): boolean {
  if (current === next) return true;
  const allowed = VALID_TRANSITIONS[current] ?? [];
  return allowed.includes(next);
}

export function validateTransition(current: DealRoomStatus, next: DealRoomStatus): void {
  if (!canTransition(current, next)) {
    throw new Error(
      `Invalid Deal Room transition: cannot move from '${current}' to '${next}'.`
    );
  }
}
