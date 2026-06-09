/** Mainstream Nigerian commercial banks only — no fintech wallets. */
export type NigerianBank = {
  name: string;
  code: string;
};

export const NIGERIAN_COMMERCIAL_BANKS: NigerianBank[] = [
  { name: "Access Bank", code: "044" },
  { name: "Citibank", code: "023" },
  { name: "Ecobank", code: "050" },
  { name: "FCMB", code: "214" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank", code: "011" },
  { name: "Globus Bank", code: "103" },
  { name: "GTBank", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Jaiz Bank", code: "301" },
  { name: "Keystone Bank", code: "082" },
  { name: "Lotus Bank", code: "303" },
  { name: "Optimus Bank", code: "107" },
  { name: "Parallex Bank", code: "104" },
  { name: "Polaris Bank", code: "076" },
  { name: "PremiumTrust Bank", code: "105" },
  { name: "Providus Bank", code: "101" },
  { name: "Signature Bank", code: "106" },
  { name: "Stanbic IBTC", code: "221" },
  { name: "Standard Chartered", code: "068" },
  { name: "Sterling Bank", code: "232" },
  { name: "SunTrust Bank", code: "100" },
  { name: "Taj Bank", code: "302" },
  { name: "Titan Trust Bank", code: "102" },
  { name: "UBA", code: "033" },
  { name: "Union Bank", code: "032" },
  { name: "Unity Bank", code: "215" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
];

export function resolveBankByCode(code: string): NigerianBank | null {
  const normalized = code.trim();
  return NIGERIAN_COMMERCIAL_BANKS.find((b) => b.code === normalized) ?? null;
}

export function resolveBankByName(name: string): NigerianBank | null {
  const normalized = name.trim().toLowerCase();
  return (
    NIGERIAN_COMMERCIAL_BANKS.find((b) => b.name.toLowerCase() === normalized) ??
    null
  );
}

export function isValidAccountNumber(accountNumber: string): boolean {
  return /^\d{10}$/.test(accountNumber.trim());
}
