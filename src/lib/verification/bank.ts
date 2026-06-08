/** Bank verification prep — provider integration (Paystack/Monnify) comes later. */

export type BankVerificationInput = {
  bankName: string;
  accountNumber: string;
};

const NIGERIAN_BANKS = [
  "Access Bank",
  "GTBank",
  "Zenith Bank",
  "First Bank",
  "UBA",
  "Stanbic IBTC",
  "Fidelity Bank",
  "Union Bank",
  "Sterling Bank",
  "Polaris Bank",
  "Wema Bank",
  "Kuda",
  "Opay",
  "Palmpay",
] as const;

export function listNigerianBanks(): readonly string[] {
  return NIGERIAN_BANKS;
}

export function normalizeAccountNumber(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 10);
}

/** Stub resolver — replace with Paystack/Monnify resolve API. */
export async function resolveBankAccountName(
  input: BankVerificationInput
): Promise<{ ok: true; accountName: string } | { ok: false; error: string }> {
  const num = normalizeAccountNumber(input.accountNumber);
  if (num.length < 10) {
    return { ok: false, error: "Enter a valid 10-digit account number." };
  }
  if (!input.bankName.trim()) {
    return { ok: false, error: "Select your bank." };
  }

  return {
    ok: true,
    accountName: "Pending provider verification",
  };
}
