/**
 * `CapabilityHealthMonitor` — thin wrapper around `PluginHost.healthCheckAll`.
 * The runtime never re-implements health-check execution; it only exists so
 * `CapabilityRuntime.health()` has a stable, mockable seam for tests and for
 * a future scheduled health-check loop.
 */
import type { PluginHost } from "../plugins/host";
import type { PluginDiagnostics } from "../plugins/types";

export class CapabilityHealthMonitor {
  async runAll(host: PluginHost): Promise<PluginDiagnostics[]> {
    return host.healthCheckAll();
  }

  async runOne(host: PluginHost, pluginId: string): Promise<PluginDiagnostics[]> {
    await host.healthCheck(pluginId);
    return host.list().filter((diagnostics) => String(diagnostics.pluginId) === pluginId);
  }
}
