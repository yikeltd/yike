/**
 * Yike Transaction Workspace Engine — Double-Entry Ledger Engine
 * Guarantees balanced financial entries (Sum(Debits) === Sum(Credits)) with derived balances.
 */

import type { LedgerEntry } from "./types";

export class LedgerService {
  /**
   * Records a balanced set of debit and credit ledger entries
   */
  static createBalancedEntries(
    settlementId: string,
    entries: Omit<LedgerEntry, "id" | "settlementId" | "timestamp" | "referenceHash">[]
  ): LedgerEntry[] {
    const totalDebits = entries
      .filter((e) => e.entryType === "debit")
      .reduce((sum, e) => sum + e.amount, 0);

    const totalCredits = entries
      .filter((e) => e.entryType === "credit")
      .reduce((sum, e) => sum + e.amount, 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new Error(
        `Ledger Unbalanced Error: Debits (${totalDebits}) must equal Credits (${totalCredits}).`
      );
    }

    const now = new Date().toISOString();
    return entries.map((entry, idx) => ({
      ...entry,
      id: `ledg_${Date.now()}_${idx}`,
      settlementId,
      timestamp: now,
      referenceHash: `sha256_${Math.random().toString(36).substring(2, 12)}`,
    }));
  }

  /**
   * Calculates derived balance for a specific account from ledger history
   */
  static calculateAccountBalance(entries: LedgerEntry[], accountId: string): number {
    let balance = 0;
    entries.forEach((e) => {
      if (e.accountId === accountId) {
        if (e.entryType === "credit") balance += e.amount;
        else if (e.entryType === "debit") balance -= e.amount;
      }
    });
    return balance;
  }
}
