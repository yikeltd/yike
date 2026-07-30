/**
 * Yike BTOS — Metrics & Performance Telemetry Engine (Milestone 5)
 * Domain metrics counters, latency histograms, & provider error tracking.
 */

export interface MetricSnapshot {
  name: string;
  count: number;
  totalDurationMs: number;
  avgDurationMs: number;
  errors: number;
  lastRecordedAt: string;
}

export class BTOSMetrics {
  private static instance: BTOSMetrics;
  private counters: Map<string, number> = new Map();
  private durationStore: Map<string, number[]> = new Map();
  private errorStore: Map<string, number> = new Map();

  public static getInstance(): BTOSMetrics {
    if (!BTOSMetrics.instance) {
      BTOSMetrics.instance = new BTOSMetrics();
    }
    return BTOSMetrics.instance;
  }

  public incrementCounter(name: string, value = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  public recordLatency(name: string, durationMs: number): void {
    const durations = this.durationStore.get(name) || [];
    durations.push(durationMs);
    if (durations.length > 500) durations.shift();
    this.durationStore.set(name, durations);
  }

  public recordProviderError(providerName: string): void {
    const key = `provider_error_${providerName}`;
    const current = this.errorStore.get(key) || 0;
    this.errorStore.set(key, current + 1);
  }

  public getSnapshot(name: string): MetricSnapshot {
    const count = this.counters.get(name) || 0;
    const durations = this.durationStore.get(name) || [];
    const totalDurationMs = durations.reduce((sum, d) => sum + d, 0);
    const avgDurationMs = durations.length > 0 ? Math.round(totalDurationMs / durations.length) : 0;
    const errors = this.errorStore.get(`provider_error_${name}`) || 0;

    return {
      name,
      count,
      totalDurationMs,
      avgDurationMs,
      errors,
      lastRecordedAt: new Date().toISOString(),
    };
  }
}

export const btosMetrics = BTOSMetrics.getInstance();
