/**
 * `LifecycleManager` — thin naming wrapper delegating to `PluginHost`.
 * `CapabilityRuntime` uses OS-flavored verbs (start/stop/reload a
 * capability) while `PluginHost` uses plugin-flavored verbs
 * (enable/disable/reload a plugin) — this file is the only place that
 * translation happens, so lifecycle logic itself is never duplicated.
 */
import type { PluginHost } from "../plugins/host";

export class LifecycleManager {
  constructor(private readonly host: PluginHost) {}

  startCapability(pluginId: string): void | Promise<void> {
    return this.host.enable(pluginId);
  }

  stopCapability(pluginId: string): Promise<void> {
    return this.host.disable(pluginId);
  }

  reloadCapability(pluginId: string): Promise<void> {
    return this.host.reload(pluginId);
  }
}
