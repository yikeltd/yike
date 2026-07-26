/**
 * `definePlugin` — the only supported way to author a `YipPlugin`. It
 * validates the contract at author-time (not just at install-time) so a
 * malformed plugin fails where it's defined, with a clear message.
 */
import { InvalidPluginError } from "./errors";
import type { PluginId, YipPlugin } from "./types";

export function assertValidPlugin(plugin: YipPlugin): void {
  if (!plugin.id || typeof plugin.id !== "string") {
    throw new InvalidPluginError("Plugin must have a non-empty string id.");
  }
  if (!plugin.name) {
    throw new InvalidPluginError(`Plugin "${plugin.id}" must have a name.`, { pluginId: plugin.id });
  }
  if (!plugin.version) {
    throw new InvalidPluginError(`Plugin "${plugin.id}" must have a version.`, { pluginId: plugin.id });
  }
  if (!plugin.capabilityType) {
    throw new InvalidPluginError(`Plugin "${plugin.id}" must have a capabilityType.`, { pluginId: plugin.id });
  }
  if (!Array.isArray(plugin.provides) || plugin.provides.length === 0) {
    throw new InvalidPluginError(`Plugin "${plugin.id}" must provide at least one capability id.`, {
      pluginId: plugin.id,
    });
  }
  if (typeof plugin.registerCapabilities !== "function") {
    throw new InvalidPluginError(`Plugin "${plugin.id}" must implement registerCapabilities.`, {
      pluginId: plugin.id,
    });
  }
  if (!plugin.hooks || typeof plugin.hooks !== "object") {
    throw new InvalidPluginError(`Plugin "${plugin.id}" must declare a hooks object (may be empty).`, {
      pluginId: plugin.id,
    });
  }
}

export function definePlugin(plugin: YipPlugin): YipPlugin {
  assertValidPlugin(plugin);
  return { ...plugin, id: String(plugin.id) as PluginId };
}
