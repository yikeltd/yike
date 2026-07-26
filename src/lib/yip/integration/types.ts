/**
 * External provider marker types ONLY.
 *
 * These describe the *shape* of a future external integration (OpenAI,
 * comps data vendor, image moderation API, etc.) so the rest of YIP can
 * type against "an external provider exists" without ever calling one.
 *
 * Do NOT add real network calls, SDK imports, or API keys here or anywhere
 * in `yip/*` this sprint — see docs/architecture/YIKE_INTELLIGENCE_PLATFORM.md
 * "what's not built yet".
 */
import type { ProviderId } from "../shared/types";

export type ExternalProviderKind = "llm" | "vision" | "comps_data" | "moderation" | (string & {});

export type ExternalProviderMarker = {
  id: ProviderId;
  kind: ExternalProviderKind;
  /** Always false in CORE — flips true only when a real integration ships (not this sprint). */
  configured: false;
  description: string;
};
