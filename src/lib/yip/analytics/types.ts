/**
 * AnalyticsSink — tracking seam for YIP-originated events. CORE's default
 * implementation is a no-op (or console.debug behind a flag) — no data
 * warehouse, no third-party analytics calls.
 */
import type { YipEvent } from "../events/types";

export interface AnalyticsSink {
  track(event: YipEvent): void;
}
