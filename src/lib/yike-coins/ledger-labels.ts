type LedgerRow = {
  direction: "credit" | "debit";
  amount_coins: number;
  reason: string | null;
  service_code: string | null;
  reference: string | null;
  metadata?: Record<string, unknown> | null;
};

export function formatLedgerEntryLabel(entry: LedgerRow): string {
  const meta = entry.metadata ?? {};
  const code = entry.service_code ?? "";

  if (code === "yc_transfer_out") {
    const u = meta.counterparty_username;
    return typeof u === "string" ? `Sent YC to @${u}` : "Sent YC";
  }
  if (code === "yc_transfer_in") {
    return "Received YC";
  }
  if (code === "admin_grant") {
    return "YC grant (Yike)";
  }
  if (code === "wallet_topup") {
    return "Top-up (Paystack)";
  }
  if (entry.reason?.trim()) return entry.reason.trim();
  if (code) return code.replace(/_/g, " ");
  return entry.direction === "credit" ? "YC credit" : "YC debit";
}
