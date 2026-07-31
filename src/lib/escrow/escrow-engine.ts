import type { EscrowAccount, EscrowMilestone, LedgerEntry } from "@/types/escrow-os";

export function validateDoubleEntryLedger(accounts: EscrowAccount[]): {
  isValid: boolean;
  totalCustody: number;
  totalHolds: number;
  totalDisputed: number;
  difference: number;
} {
  const buyerAcc = accounts.find((a) => a.accountType === "buyer_custody");
  const holdAccs = accounts.filter((a) => a.accountType === "milestone_hold");
  const disputedAcc = accounts.find((a) => a.accountType === "disputed_hold");

  const totalCustody = buyerAcc ? buyerAcc.balance : 0;
  const totalHolds = holdAccs.reduce((sum, a) => sum + a.balance, 0);
  const totalDisputed = disputedAcc ? disputedAcc.balance : 0;

  const expectedHolds = totalHolds + totalDisputed;
  const isValid = Math.abs(totalCustody - expectedHolds) < 0.01;

  return {
    isValid,
    totalCustody,
    totalHolds,
    totalDisputed,
    difference: totalCustody - expectedHolds,
  };
}

export function releaseMilestoneSettlement(
  milestone: EscrowMilestone,
  passportId: string
): { success: boolean; entry?: LedgerEntry; updatedMilestone: EscrowMilestone } {
  if (milestone.status === "released") {
    return { success: false, updatedMilestone: milestone };
  }

  const entry: LedgerEntry = {
    entryId: `ldg_${Date.now().toString(36)}`,
    passportId,
    fromAccountId: `acc_hold_${milestone.milestoneIndex}`,
    toAccountId: `acc_seller_payout`,
    amount: milestone.amount,
    currency: "NGN",
    narration: `Milestone ${milestone.milestoneIndex} (${milestone.title}) Released`,
    timestamp: new Date().toISOString(),
  };

  const updatedMilestone: EscrowMilestone = {
    ...milestone,
    status: "released",
  };

  return {
    success: true,
    entry,
    updatedMilestone,
  };
}
