/**
 * YIP Runtime — types for the capability runtime, the OS façade that sits
 * above `PluginHost`. The runtime never redefines plugin lifecycle state —
 * it reuses `PluginLifecycleState`/`PluginHealth` from `plugins/types.ts` and
 * layers discovery, permissions, providers, config, metrics, and soft
 * isolation on top.
 */
import type {
  PluginHealth,
  PluginLifecycleState,
  PluginPermission,
  PluginProviderOption,
} from "../plugins/types";

/** Runtime-wide lifecycle state — distinct from a single plugin's `PluginLifecycleState`. */
export type RuntimeStatus = "created" | "starting" | "running" | "stopping" | "stopped" | "failed";

export type CapabilityConfigProperty = {
  type: "string" | "number" | "boolean" | "object" | "array";
  description?: string;
};

/** Intentionally simple — no JSON-schema library. Just enough to validate required keys. */
export type CapabilityConfigSchema = {
  required?: string[];
  properties?: Record<string, CapabilityConfigProperty>;
};

export type CapabilityHealthRequirements = {
  /** Health checks slower than this are treated as degraded by diagnostics tooling. */
  maxLatencyMs?: number;
  /** Minimum acceptable health status for this capability to be considered ready. */
  minimumStatus?: PluginHealth["status"];
};

/**
 * `CapabilityManifest` — the runtime's normalized, read-only view of a
 * package. Every `YipPlugin` is derivable into one via `manifest.ts`; the
 * runtime operates on manifests for discovery/diagnostics so it never has to
 * reach into plugin internals.
 */
export type CapabilityManifest = {
  id: string;
  version: string;
  name: string;
  description: string;
  /** Team or individual responsible for this capability — informational only. */
  owner?: string;
  /** e.g. "knowledge" | "pricing" | "trust" | "media" | "recommendation" */
  category: string;
  provides: string[];
  dependsOn: string[];
  conflictsWith?: string[];
  eventsPublished: string[];
  eventsConsumed: string[];
  permissions: PluginPermission[];
  featureFlags?: string[];
  configSchema?: CapabilityConfigSchema;
  /** Runtime/manifest schema version this capability was authored against. */
  compatibilityVersion?: string;
  supportedProviders?: PluginProviderOption[];
  healthRequirements?: CapabilityHealthRequirements;
  enabledByDefault?: boolean;
};

export type CapabilityGraphNode = {
  pluginId: string;
  manifest: CapabilityManifest | undefined;
  state: PluginLifecycleState;
  errorCount: number;
};

export type DependencyEdge = {
  from: string;
  to: string;
};

export type ProviderDiagnostics = {
  active?: string;
  options: PluginProviderOption[];
};

/**
 * `RuntimeDiagnostics` — a single snapshot object a `/lex` panel (or a test)
 * can render without reaching into `PluginHost`, `PermissionManager`, etc
 * individually. Every sub-graph is keyed by plugin id.
 */
export type RuntimeDiagnostics = {
  status: RuntimeStatus;
  generatedAt: string;
  capabilities: CapabilityGraphNode[];
  dependencies: DependencyEdge[];
  health: Record<string, PluginHealth>;
  versions: Record<string, string>;
  permissions: Record<string, PluginPermission[]>;
  providers: Record<string, ProviderDiagnostics>;
};

/**
 * `SoftSandboxPolicy` — "soft" isolation only: a `try/catch` + timeout +
 * per-name circuit breaker in the same process. This is not a worker
 * thread/VM sandbox — it exists to stop one misbehaving capability from
 * taking down the request that invoked it, not to isolate untrusted code.
 */
export type SoftSandboxPolicy = {
  timeoutMs?: number;
  maxErrorsBeforeOpenCircuit?: number;
  circuitCooldownMs?: number;
};
