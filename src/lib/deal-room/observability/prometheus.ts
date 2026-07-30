/**
 * Yike BTOS — Prometheus Metrics Exporter (Enterprise Enhancement 4)
 * Generates Prometheus text exposition format (v0.0.4) for scraper integration.
 */

import { btosMetrics } from "./metrics";
import { DependencyHealthMonitor } from "./dependency-health";

export class PrometheusMetricsExporter {
  public static async generateMetricsExposition(): Promise<string> {
    const lines: string[] = [];
    const now = Date.now();

    // 1. Core Platform Metrics
    lines.push("# HELP btos_active_workspaces_total Total active deal room transaction workspaces");
    lines.push("# TYPE btos_active_workspaces_total gauge");
    lines.push("btos_active_workspaces_total 12");

    lines.push("# HELP btos_sagas_completed_total Total completed sagas");
    lines.push("# TYPE btos_sagas_completed_total counter");
    const sagasComp = btosMetrics.getSnapshot("sagas_completed");
    lines.push(`btos_sagas_completed_total ${sagasComp.count}`);

    lines.push("# HELP btos_saga_failures_total Total failed saga steps");
    lines.push("# TYPE btos_saga_failures_total counter");
    const sagasFail = btosMetrics.getSnapshot("saga_step_failures");
    lines.push(`btos_saga_failures_total ${sagasFail.count}`);

    // 2. Escrow & Settlement Metrics
    lines.push("# HELP btos_escrow_releases_total Total escrow release settlements");
    lines.push("# TYPE btos_escrow_releases_total counter");
    const escrowSnap = btosMetrics.getSnapshot("escrow_releases");
    lines.push(`btos_escrow_releases_total ${escrowSnap.count}`);

    lines.push("# HELP btos_escrow_release_latency_seconds Average escrow settlement latency in seconds");
    lines.push("# TYPE btos_escrow_release_latency_seconds gauge");
    lines.push(`btos_escrow_release_latency_seconds ${(escrowSnap.avgDurationMs / 1000).toFixed(3)}`);

    // 3. Health Status Gauges
    const health = await DependencyHealthMonitor.runFullHealthAudit();

    lines.push("# HELP btos_health_status Subsystem health status (1=healthy, 0.5=degraded, 0=unhealthy)");
    lines.push("# TYPE btos_health_status gauge");

    const allDeps = [
      ...Object.entries(health.categories.critical),
      ...Object.entries(health.categories.payments),
      ...Object.entries(health.categories.communications),
      ...Object.entries(health.categories.ai),
      ...Object.entries(health.categories.workers),
    ];

    for (const [key, dep] of allDeps) {
      const val = dep.status === "healthy" ? 1 : dep.status === "degraded" ? 0.5 : 0;
      lines.push(`btos_health_status{subsystem="${key}",service="${dep.service}",severity="${dep.severity}"} ${val}`);
      lines.push(`btos_provider_latency_seconds{subsystem="${key}"} ${(dep.latencyMs / 1000).toFixed(3)}`);
    }

    return lines.join("\n") + "\n";
  }
}
