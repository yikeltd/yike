/**
 * YIP Runtime — public surface. See docs/architecture/YIP_RUNTIME.md.
 *
 * This is the last platform layer above `plugins/*`. It does not duplicate
 * `PluginHost`'s lifecycle logic — it discovers, validates, and coordinates
 * the same `YipPlugin` packages through the same host.
 */
export { CapabilityRuntime } from "./capability-runtime";
export type { CapabilityRuntimeDeps } from "./capability-runtime";

export type {
  CapabilityConfigProperty,
  CapabilityConfigSchema,
  CapabilityGraphNode,
  CapabilityHealthRequirements,
  CapabilityManifest,
  DependencyEdge,
  ProviderDiagnostics,
  RuntimeDiagnostics,
  RuntimeStatus,
  SoftSandboxPolicy,
} from "./types";

export { toManifest, assertValidManifest } from "./manifest";

export {
  ConfigurationError,
  InvalidManifestError,
  PermissionDeniedError,
  ProviderNotFoundError,
  RuntimeStateError,
} from "./errors";

export { PermissionManager } from "./permission-manager";
export { ProviderResolver } from "./provider-resolver";
export { ConfigurationManager } from "./configuration-manager";
export { CapabilityLogger } from "./logger";
export type { LogLevel } from "./logger";
export { CapabilityMetrics } from "./metrics";
export type { CapabilityMetricsSnapshot } from "./metrics";
export { CapabilityHealthMonitor } from "./health-monitor";
export { SoftSandbox } from "./sandbox";
export type { SoftSandboxRunOptions } from "./sandbox";
export { CapabilityDiscovery } from "./discovery";
export { CapabilityLoader } from "./loader";
export { LifecycleManager } from "./lifecycle-manager";
export { buildRuntimeDiagnostics } from "./diagnostics";
export type { BuildRuntimeDiagnosticsDeps } from "./diagnostics";
