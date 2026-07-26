/**
 * `CapabilityMetrics` — in-process counters/latency samples per plugin id.
 * No StatsD/Prometheus export here; `snapshot()` returns plain objects a
 * `/lex` diagnostics panel (or a test) can render directly. A real metrics
 * backend can be layered on later by having it read `snapshot()` on an
 * interval — nothing here is exclusive to any one exporter.
 */
export type CapabilityMetricsSnapshot = {
  pluginId: string;
  errorCount: number;
  invocationCount: number;
  totalLatencyMs: number;
  averageLatencyMs: number;
  lastLatencyMs?: number;
};

type MetricState = {
  errorCount: number;
  invocationCount: number;
  totalLatencyMs: number;
  lastLatencyMs?: number;
};

function emptyState(): MetricState {
  return { errorCount: 0, invocationCount: 0, totalLatencyMs: 0 };
}

export class CapabilityMetrics {
  private readonly state = new Map<string, MetricState>();

  private stateFor(pluginId: string): MetricState {
    let entry = this.state.get(pluginId);
    if (!entry) {
      entry = emptyState();
      this.state.set(pluginId, entry);
    }
    return entry;
  }

  incrementError(pluginId: string): void {
    this.stateFor(pluginId).errorCount += 1;
  }

  recordLatency(pluginId: string, latencyMs: number): void {
    const entry = this.stateFor(pluginId);
    entry.invocationCount += 1;
    entry.totalLatencyMs += latencyMs;
    entry.lastLatencyMs = latencyMs;
  }

  snapshot(pluginId: string): CapabilityMetricsSnapshot;
  snapshot(): Record<string, CapabilityMetricsSnapshot>;
  snapshot(pluginId?: string): CapabilityMetricsSnapshot | Record<string, CapabilityMetricsSnapshot> {
    if (pluginId) return this.toSnapshot(pluginId, this.stateFor(pluginId));
    const out: Record<string, CapabilityMetricsSnapshot> = {};
    for (const [id, entry] of this.state) out[id] = this.toSnapshot(id, entry);
    return out;
  }

  private toSnapshot(pluginId: string, entry: MetricState): CapabilityMetricsSnapshot {
    return {
      pluginId,
      errorCount: entry.errorCount,
      invocationCount: entry.invocationCount,
      totalLatencyMs: entry.totalLatencyMs,
      averageLatencyMs: entry.invocationCount === 0 ? 0 : entry.totalLatencyMs / entry.invocationCount,
      lastLatencyMs: entry.lastLatencyMs,
    };
  }

  clear(pluginId?: string): void {
    if (pluginId) {
      this.state.delete(pluginId);
      return;
    }
    this.state.clear();
  }
}
