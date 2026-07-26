/**
 * Runtime error hierarchy — mirrors `plugins/errors.ts` conventions. These
 * are raised by the runtime's own bookkeeping (manifests, permissions,
 * providers, config); plugin lifecycle errors still come from
 * `plugins/errors.ts` and are never re-wrapped here.
 */
import { YipError } from "../shared/errors";

export class InvalidManifestError extends YipError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("invalid_manifest", message, details);
    this.name = "InvalidManifestError";
  }
}

export class PermissionDeniedError extends YipError {
  constructor(pluginId: string, permission: string) {
    super("permission_denied", `Plugin "${pluginId}" was not granted permission "${permission}".`, {
      pluginId,
      permission,
    });
    this.name = "PermissionDeniedError";
  }
}

export class ProviderNotFoundError extends YipError {
  constructor(capabilityOrPluginId: string, providerId: string) {
    super(
      "provider_not_found",
      `Provider "${providerId}" is not registered for "${capabilityOrPluginId}".`,
      { capabilityOrPluginId, providerId },
    );
    this.name = "ProviderNotFoundError";
  }
}

export class ConfigurationError extends YipError {
  constructor(pluginId: string, message: string) {
    super("configuration_error", `Configuration for "${pluginId}" is invalid: ${message}`, { pluginId });
    this.name = "ConfigurationError";
  }
}

export class RuntimeStateError extends YipError {
  constructor(message: string) {
    super("runtime_state_error", message);
    this.name = "RuntimeStateError";
  }
}
