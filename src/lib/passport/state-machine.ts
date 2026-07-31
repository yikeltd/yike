import type { TransactionPassportState, StateTransition } from "@/types/passport";

const ALLOWED_TRANSITIONS: Record<TransactionPassportState, TransactionPassportState[]> = {
  DRAFT: ["MATCHED", "CANCELLED"],
  MATCHED: ["NEGOTIATING", "CANCELLED"],
  NEGOTIATING: ["INSPECTION", "CANCELLED"],
  INSPECTION: ["LEGAL_REVIEW", "DISPUTED", "CANCELLED"],
  LEGAL_REVIEW: ["ESCROW", "DISPUTED", "CANCELLED"],
  ESCROW: ["SETTLEMENT", "DISPUTED", "CANCELLED"],
  SETTLEMENT: ["TRANSFER", "DISPUTED"],
  TRANSFER: ["COMPLETED"],
  COMPLETED: ["ARCHIVED"],
  DISPUTED: ["ESCROW", "CANCELLED"],
  CANCELLED: ["ARCHIVED"],
  ARCHIVED: [],
};

export function isValidStateTransition(
  fromState: TransactionPassportState,
  toState: TransactionPassportState
): boolean {
  const allowed = ALLOWED_TRANSITIONS[fromState];
  return allowed ? allowed.includes(toState) : false;
}

export function executeStateTransition(
  currentState: TransactionPassportState,
  nextState: TransactionPassportState,
  actorId: string,
  reason?: string
): { success: boolean; newState: TransactionPassportState; transitionRecord?: StateTransition; error?: string } {
  if (!isValidStateTransition(currentState, nextState)) {
    return {
      success: false,
      newState: currentState,
      error: `Invalid state transition from ${currentState} to ${nextState}`,
    };
  }

  const transitionRecord: StateTransition = {
    fromState: currentState,
    toState: nextState,
    actorId,
    timestamp: new Date().toISOString(),
    reason,
  };

  return {
    success: true,
    newState: nextState,
    transitionRecord,
  };
}
