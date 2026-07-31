export type EscrowAccountType =
  | "buyer_custody"
  | "milestone_hold"
  | "seller_payout"
  | "partner_fee"
  | "platform_commission"
  | "disputed_hold";

export type EscrowAccount = {
  id: string;
  passportId: string;
  accountType: EscrowAccountType;
  accountName: string;
  balance: number;
  currency: string;
  updatedAt: string;
};

export type EscrowMilestone = {
  id: string;
  milestoneIndex: number;
  title: string;
  percent: number;
  amount: number;
  status: "locked" | "approved" | "released" | "disputed";
  triggerRequirement: string;
};

export type PaymentAdapterSpec = {
  adapterId: string;
  name: string;
  countryCode: string;
  currency: string;
  supportedMethods: string[];
  status: "online" | "degraded";
  avgLatencyMs: number;
};

export type LedgerEntry = {
  entryId: string;
  passportId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  narration: string;
  timestamp: string;
};
