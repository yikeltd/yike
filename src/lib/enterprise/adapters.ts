/**
 * Enterprise Platform adapters — consume Stankings contracts only.
 * No local Identity / Passport / Trust / Consent / Explainability engines.
 *
 * When Stankings publishes @stankings/platform-sdk, replace adapter bodies.
 * Until then: interfaces + feature gates + documented readiness + graceful degrade.
 */

import { isLaunchFeatureVisible } from "@/lib/launch-mode";

export type EnterpriseCapabilityId =
  | "identity"
  | "passport"
  | "trust"
  | "consent"
  | "explainability"
  | "notifications"
  | "capability_discovery"
  | "platform_registration"
  | "shared_governance"
  | "platform_sdk";

export type EnterpriseRuntimeState =
  | "unavailable"
  | "contract_only"
  | "gated"
  | "ready"
  | "degraded";

export type EnterpriseCapabilityStatus = {
  id: EnterpriseCapabilityId;
  owner: "Stankings Legacy Ltd";
  state: EnterpriseRuntimeState;
  yikeMayImplementEngine: false;
  notes: string;
};

/** Mirror of Stankings shared capability readiness (consumer view). */
export const ENTERPRISE_CAPABILITY_STATUS: EnterpriseCapabilityStatus[] = [
  {
    id: "identity",
    owner: "Stankings Legacy Ltd",
    state: "contract_only",
    yikeMayImplementEngine: false,
    notes:
      "Local Supabase auth remains product session until federation SDK ships. Do not mint shared subject IDs.",
  },
  {
    id: "passport",
    owner: "Stankings Legacy Ltd",
    state: "contract_only",
    yikeMayImplementEngine: false,
    notes:
      "Bind points documented; UI gated by passport_ui. Never implement Passport runtime.",
  },
  {
    id: "trust",
    owner: "Stankings Legacy Ltd",
    state: "contract_only",
    yikeMayImplementEngine: false,
    notes:
      "Marketplace badges remain product UX. Constitutional Trust Engine stays in Stankings.",
  },
  {
    id: "consent",
    owner: "Stankings Legacy Ltd",
    state: "contract_only",
    yikeMayImplementEngine: false,
    notes: "Consume shared consent ledger when published.",
  },
  {
    id: "explainability",
    owner: "Stankings Legacy Ltd",
    state: "contract_only",
    yikeMayImplementEngine: false,
    notes: "Display shared explanations; do not invent scoring canon.",
  },
  {
    id: "notifications",
    owner: "Stankings Legacy Ltd",
    state: "contract_only",
    yikeMayImplementEngine: false,
    notes:
      "Yike keeps product email/WhatsApp/push; shared notification bus consumed when SDK ready.",
  },
  {
    id: "capability_discovery",
    owner: "Stankings Legacy Ltd",
    state: "contract_only",
    yikeMayImplementEngine: false,
    notes: "Local snapshot via discoverEnterpriseCapabilities(); swap for SDK client later.",
  },
  {
    id: "platform_registration",
    owner: "Stankings Legacy Ltd",
    state: "contract_only",
    yikeMayImplementEngine: false,
    notes: "Yike is registered as marketplace consumer in Stankings HQ seeds.",
  },
  {
    id: "shared_governance",
    owner: "Stankings Legacy Ltd",
    state: "contract_only",
    yikeMayImplementEngine: false,
    notes: "Inherit docs; do not fork constitution.",
  },
  {
    id: "platform_sdk",
    owner: "Stankings Legacy Ltd",
    state: "unavailable",
    yikeMayImplementEngine: false,
    notes: "Await @stankings/platform-sdk publish. Adapters are the temporary boundary.",
  },
];

export function getEnterpriseCapability(
  id: EnterpriseCapabilityId,
): EnterpriseCapabilityStatus {
  return (
    ENTERPRISE_CAPABILITY_STATUS.find((c) => c.id === id) ?? {
      id,
      owner: "Stankings Legacy Ltd",
      state: "unavailable",
      yikeMayImplementEngine: false,
      notes: "Unknown capability",
    }
  );
}

/** Capability discovery — local contract snapshot until SDK ships. */
export function discoverEnterpriseCapabilities(): {
  source: "local_contract" | "platform_sdk";
  generatedAt: string;
  capabilities: EnterpriseCapabilityStatus[];
  anyRuntimeReady: boolean;
} {
  const capabilities = ENTERPRISE_CAPABILITY_STATUS.map((c) => ({ ...c }));
  return {
    source: "local_contract",
    generatedAt: new Date().toISOString(),
    capabilities,
    anyRuntimeReady: capabilities.some((c) => c.state === "ready"),
  };
}

export function isEnterpriseCapabilityReady(id: EnterpriseCapabilityId): boolean {
  return getEnterpriseCapability(id).state === "ready";
}

/**
 * Graceful degrade helper — prefer product UX when enterprise runtime is down.
 * Returns true when Yike should use local marketplace behaviour.
 */
export function shouldDegradeEnterprise(id: EnterpriseCapabilityId): boolean {
  const state = getEnterpriseCapability(id).state;
  return state === "unavailable" || state === "contract_only" || state === "degraded";
}

/** Passport product surfaces — never build local engine. */
export function isPassportIntegrationActive(): boolean {
  return (
    isLaunchFeatureVisible("passport_ui") &&
    getEnterpriseCapability("passport").state === "ready"
  );
}

/** Shared Trust consumption — local badges always allowed as marketplace UX. */
export function isSharedTrustRuntimeActive(): boolean {
  return getEnterpriseCapability("trust").state === "ready";
}

export type PassportBindTarget = {
  profileId: string;
  passportId?: string | null;
};

/** Integration point — no-op until SDK ready. */
export async function resolvePassportBind(
  _target: PassportBindTarget,
): Promise<{ bound: false; reason: string }> {
  return {
    bound: false,
    reason: "Stankings Passport runtime not consumed yet — contract only",
  };
}

export type TrustSignalContribution = {
  entityType: "seller" | "dealer" | "agency" | "listing";
  entityId: string;
  signalType: string;
  payload?: Record<string, unknown>;
};

/** Emit placeholder — never computes constitutional trust locally. */
export async function contributeMarketplaceTrustSignal(
  _signal: TrustSignalContribution,
): Promise<{ accepted: false; reason: string }> {
  return {
    accepted: false,
    reason: "Shared Trust runtime unavailable — signal buffered/not sent",
  };
}

export type MarketplaceNotificationIntent = {
  channel: "email" | "push" | "whatsapp" | "in_app";
  templateId: string;
  recipientId: string;
  payload?: Record<string, unknown>;
};

/** Shared notification bus — degrade to local product channels. */
export async function enqueueEnterpriseNotification(
  _intent: MarketplaceNotificationIntent,
): Promise<{ queued: false; degradedToLocal: true; reason: string }> {
  return {
    queued: false,
    degradedToLocal: true,
    reason: "Shared notification runtime unavailable — use Yike product channels",
  };
}

export type MarketplaceSellerKind =
  | "individual"
  | "agent"
  | "agency"
  | "dealer"
  | "developer"
  | "enterprise";

export function sellerKindFromAccountType(
  accountType: string | null | undefined,
): MarketplaceSellerKind {
  switch (accountType) {
    case "dealer":
      return "dealer";
    case "agency":
      return "agency";
    case "developer":
      return "developer";
    case "agent":
      return "agent";
    default:
      return "individual";
  }
}
