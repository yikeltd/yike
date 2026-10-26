import { canListProperties } from "@/lib/agent-tiers";
import { resolveProfilePath } from "@/lib/account/account-home";
import type { Profile } from "@/types/database";
import { consumerRoute } from "@/lib/navigation/consumer-routes";

/** Query param: user opened wallet from the agent dashboard hero/tools. */
export const WALLET_FROM_AGENT = "agent" as const;

export type WalletFromContext = typeof WALLET_FROM_AGENT;

export function walletPath(options?: { from?: WalletFromContext }): string {
  const base = consumerRoute("wallet");
  if (options?.from === WALLET_FROM_AGENT) {
    return `${base}?from=${WALLET_FROM_AGENT}`;
  }
  return base;
}

export function parseWalletFromParam(
  raw: string | null | undefined,
): WalletFromContext | null {
  return raw === WALLET_FROM_AGENT ? WALLET_FROM_AGENT : null;
}

/** Post-login return to wallet (preserves agent return context when present). */
export function walletAuthLoginPath(options?: { from?: WalletFromContext }): string {
  return `/auth/login?next=${encodeURIComponent(walletPath(options))}`;
}

export function resolveWalletBackNavigation(input: {
  from: WalletFromContext | null;
  profile: Pick<Profile, "role"> | null;
}): { href: string; label: string } {
  if (input.from === WALLET_FROM_AGENT) {
    return { href: "/agent", label: "Back to agent dashboard" };
  }
  if (input.profile && canListProperties(input.profile as Profile)) {
    return {
      href: resolveProfilePath(input.profile),
      label: "Back to dashboard",
    };
  }
  return { href: consumerRoute("home"), label: "Back to home" };
}
