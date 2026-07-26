import type { YipEvent } from "../events/types";
import type { AnalyticsSink } from "./types";

/** No-op unless `debug` is set — then logs to console for local development only. */
export class NoOpAnalyticsSink implements AnalyticsSink {
  constructor(private readonly debug = false) {}

  track(event: YipEvent): void {
    if (!this.debug) return;
    console.debug("[yip:analytics]", event.type, event);
  }
}

export function createAnalyticsSink(opts: { debug?: boolean } = {}): AnalyticsSink {
  return new NoOpAnalyticsSink(opts.debug ?? false);
}

export type { AnalyticsSink } from "./types";
