/**
 * Plugin host error hierarchy — mirrors `shared/errors.ts` conventions.
 */
import { YipError } from "../shared/errors";

export class PluginNotFoundError extends YipError {
  constructor(pluginId: string) {
    super("plugin_not_found", `Plugin "${pluginId}" is not registered.`, { pluginId });
    this.name = "PluginNotFoundError";
  }
}

export class PluginDependencyError extends YipError {
  constructor(pluginId: string, message: string) {
    super("plugin_dependency_error", message, { pluginId });
    this.name = "PluginDependencyError";
  }
}

export class PluginConflictError extends YipError {
  constructor(pluginId: string, conflictingPluginId: string) {
    super("plugin_conflict", `Plugin "${pluginId}" conflicts with enabled plugin "${conflictingPluginId}".`, {
      pluginId,
      conflictingPluginId,
    });
    this.name = "PluginConflictError";
  }
}

export class PluginLifecycleError extends YipError {
  constructor(pluginId: string, message: string) {
    super("plugin_lifecycle_error", message, { pluginId });
    this.name = "PluginLifecycleError";
  }
}

export class InvalidPluginError extends YipError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("invalid_plugin", message, details);
    this.name = "InvalidPluginError";
  }
}
