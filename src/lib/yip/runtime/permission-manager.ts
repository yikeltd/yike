/**
 * `PermissionManager` — tracks which `PluginPermission`s each plugin was
 * granted. Default policy: whatever a manifest declares in `permissions` is
 * granted automatically at install time (declarative, reviewed in the same
 * PR as the plugin's code — see YIP_PLUGIN_ARCHITECTURE.md's "Security /
 * permissions" section). Anything a plugin does *not* declare is denied by
 * `check()`, even if the plugin never actually attempts it.
 */
import type { PluginPermission } from "../plugins/types";

export class PermissionManager {
  private readonly grants = new Map<string, Set<PluginPermission>>();

  /** Grants the given permissions to a plugin. Additive — does not clear prior grants. */
  grant(pluginId: string, permissions: readonly PluginPermission[]): void {
    const set = this.grants.get(pluginId) ?? new Set<PluginPermission>();
    for (const permission of permissions) set.add(permission);
    this.grants.set(pluginId, set);
  }

  /** Revokes every permission previously granted to a plugin (e.g. on `remove`). */
  revokeAll(pluginId: string): void {
    this.grants.delete(pluginId);
  }

  check(pluginId: string, permission: PluginPermission): boolean {
    return this.grants.get(pluginId)?.has(permission) ?? false;
  }

  list(pluginId: string): PluginPermission[] {
    return Array.from(this.grants.get(pluginId) ?? []);
  }

  listAll(): Record<string, PluginPermission[]> {
    const out: Record<string, PluginPermission[]> = {};
    for (const [pluginId, permissions] of this.grants) {
      out[pluginId] = Array.from(permissions);
    }
    return out;
  }

  clear(): void {
    this.grants.clear();
  }
}
