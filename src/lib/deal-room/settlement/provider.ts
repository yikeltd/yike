/**
 * Yike Transaction Workspace Engine — Settlement Provider Abstraction
 * Decouples escrow and money movements from specific PSP gateways.
 */

import type { SettlementSplit, SettlementType } from "./types";

export interface SettlementAuthorizationResult {
  settlementReference: string;
  authorizationUrl?: string;
  success: boolean;
  providerId: string;
}

export interface SettlementProvider {
  id: string;
  name: string;
  authorizePayment(
    settlementId: string,
    amount: number,
    currency: "NGN" | "USD",
    payerId: string
  ): Promise<SettlementAuthorizationResult>;
  releaseEscrow(
    settlementId: string,
    amount: number,
    currency: "NGN" | "USD",
    splits: SettlementSplit[]
  ): Promise<boolean>;
  processRefund(
    settlementId: string,
    amount: number,
    currency: "NGN" | "USD",
    recipientId: string
  ): Promise<boolean>;
}

export class PaystackSettlementAdapter implements SettlementProvider {
  id = "paystack_adapter";
  name = "Paystack Financial Switch";

  async authorizePayment(
    settlementId: string,
    amount: number,
    currency: "NGN" | "USD",
    payerId: string
  ): Promise<SettlementAuthorizationResult> {
    return {
      settlementReference: `pstk_ref_${Date.now()}`,
      authorizationUrl: `https://checkout.paystack.com/pstk_ref_${Date.now()}`,
      success: true,
      providerId: this.id,
    };
  }

  async releaseEscrow(
    settlementId: string,
    amount: number,
    currency: "NGN" | "USD",
    splits: SettlementSplit[]
  ): Promise<boolean> {
    return true;
  }

  async processRefund(
    settlementId: string,
    amount: number,
    currency: "NGN" | "USD",
    recipientId: string
  ): Promise<boolean> {
    return true;
  }
}

export class KorapaySettlementAdapter implements SettlementProvider {
  id = "korapay_adapter";
  name = "Korapay Settlement Switch";

  async authorizePayment(
    settlementId: string,
    amount: number,
    currency: "NGN" | "USD",
    payerId: string
  ): Promise<SettlementAuthorizationResult> {
    return {
      settlementReference: `kora_ref_${Date.now()}`,
      authorizationUrl: `https://checkout.korapay.com/kora_ref_${Date.now()}`,
      success: true,
      providerId: this.id,
    };
  }

  async releaseEscrow(): Promise<boolean> {
    return true;
  }

  async processRefund(): Promise<boolean> {
    return true;
  }
}

export class MockSettlementAdapter implements SettlementProvider {
  id = "mock_settlement";
  name = "Mock Settlement Engine";

  async authorizePayment(
    settlementId: string,
    amount: number,
    currency: "NGN" | "USD",
    payerId: string
  ): Promise<SettlementAuthorizationResult> {
    return {
      settlementReference: `mock_ref_${Date.now()}`,
      success: true,
      providerId: this.id,
    };
  }

  async releaseEscrow(): Promise<boolean> {
    return true;
  }

  async processRefund(): Promise<boolean> {
    return true;
  }
}

const providerRegistry: Map<string, SettlementProvider> = new Map([
  ["paystack", new PaystackSettlementAdapter()],
  ["korapay", new KorapaySettlementAdapter()],
  ["mock", new MockSettlementAdapter()],
]);

let activeProviderKey = "paystack";

export function getActiveSettlementAdapter(): SettlementProvider {
  return providerRegistry.get(activeProviderKey) || new PaystackSettlementAdapter();
}

export function setActiveSettlementAdapter(key: string): void {
  if (providerRegistry.has(key)) {
    activeProviderKey = key;
  }
}
