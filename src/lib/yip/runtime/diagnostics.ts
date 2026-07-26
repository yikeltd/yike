/**
 * `buildRuntimeDiagnostics` — assembles the single `RuntimeDiagnostics`
 * snapshot from `PluginHost.list()` plus the runtime's own bookkeeping
 * (`PermissionManager`, `ProviderResolver`, `CapabilityMetrics`). Pulled out
 * of `CapabilityRuntime` so it stays a pure function that's easy to unit
 * test and easy to reuse from a future `/lex` diagnostics panel.
 */
import type { PluginHost } from "../plugins/host";
import type { CapabilityMetrics } from "./metrics";
import type { PermissionManager } from "./permission-manager";
import type { ProviderResolver } from "./provider-resolver";
import type { CapabilityManifest, DependencyEdge, RuntimeDiagnostics, RuntimeStatus } from "./types";

export type BuildRuntimeDiagnosticsDeps = {
  status: RuntimeStatus;
  host: PluginHost;
  manifests: ReadonlyMap<string, CapabilityManifest>;
  permissions: PermissionManager;
  providers: ProviderResolver;
  metrics: CapabilityMetrics;
};

export function buildRuntimeDiagnostics(deps: BuildRuntimeDiagnosticsDeps): RuntimeDiagnostics {
  const pluginDiagnostics = deps.host.list();

  const capabilities = pluginDiagnostics.map((diagnostics) => {
    const pluginId = String(diagnostics.pluginId);
    return {
      pluginId,
      manifest: deps.manifests.get(pluginId),
      state: diagnostics.state,
      errorCount: diagnostics.errorCount,
    };
  });

  const dependencies: DependencyEdge[] = [];
  for (const manifest of deps.manifests.values()) {
    for (const dependsOn of manifest.dependsOn) {
      dependencies.push({ from: manifest.id, to: dependsOn });
    }
  }

  const health: RuntimeDiagnostics["health"] = {};
  const versions: RuntimeDiagnostics["versions"] = {};
  for (const diagnostics of pluginDiagnostics) {
    const pluginId = String(diagnostics.pluginId);
    health[pluginId] = diagnostics.health;
    versions[pluginId] = diagnostics.version;
  }

  return {
    status: deps.status,
    generatedAt: new Date().toISOString(),
    capabilities,
    dependencies,
    health,
    versions,
    permissions: deps.permissions.listAll(),
    providers: deps.providers.listAll(),
  };
}
