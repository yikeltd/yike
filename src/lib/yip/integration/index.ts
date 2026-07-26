import { toProviderId } from "../shared/types";
import type { ExternalProviderMarker } from "./types";

/**
 * Marker-only registry — documents integrations YIP is designed to support
 * later without calling any of them now.
 */
export const EXTERNAL_PROVIDER_MARKERS: ExternalProviderMarker[] = [
  {
    id: toProviderId("openai.llm"),
    kind: "llm",
    configured: false,
    description: "Reserved for future listing copy / description assistance. Not called in CORE.",
  },
  {
    id: toProviderId("comps.data_vendor"),
    kind: "comps_data",
    configured: false,
    description: "Reserved for future market pricing comps. Not called in CORE.",
  },
];

export function listExternalProviderMarkers(): ExternalProviderMarker[] {
  return EXTERNAL_PROVIDER_MARKERS;
}

export type { ExternalProviderKind, ExternalProviderMarker } from "./types";
