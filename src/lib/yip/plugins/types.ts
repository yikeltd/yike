/**
 * YIP 2.0 plugin contract. Plugins are git-reviewed TypeScript modules that
 * export a `YipPlugin` — no filesystem dynamic loading, no DB-stored
 * manifests. Applications still consume capabilities exclusively via
 * `CapabilityRegistry`; plugins are how CORE and future intelligence
 * register themselves into that registry.
 */
import type { CapabilityRegistry } from "../registry/capability-registry";
import type { EventBus } from "../events/event-bus";

export type PluginId = string & { readonly __brand: "PluginId" };

export type PluginLifecycleState = "registered" | "initialized" | "enabled" | "disabled" | "destroyed";

export type PluginPermission =
  | "knowledge.read"
  | "events.subscribe"
  | "events.publish"
  | "analytics.track"
  | "registry.register"
  | "finance.read"
  | "finance.write";

export type PluginHealthStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

export type PluginHealth = {
  status: PluginHealthStatus;
  checkedAt: string;
  latencyMs?: number;
  message?: string;
  details?: Record<string, unknown>;
};

export type PluginDiagnostics = {
  pluginId: PluginId;
  version: string;
  state: PluginLifecycleState;
  health: PluginHealth;
  errorCount: number;
  lastError?: string;
  lastExecutionAt?: string;
};

export type PluginProviderOption = {
  id: string;
  label: string;
  /** When true this provider is the active selection unless config overrides */
  default?: boolean;
};

export type YipPluginContext = {
  registry: CapabilityRegistry;
  eventBus: EventBus;
  /** Resolve another capability (only after deps satisfied) */
  getCapability: <T>(id: string) => T;
  /** Subscribe helper — tracks for cleanup on destroy */
  subscribe: EventBus["subscribe"];
  log: (level: "debug" | "info" | "warn" | "error", message: string, meta?: Record<string, unknown>) => void;
};

export type YipPluginHooks = {
  onInstall?: (ctx: YipPluginContext) => void | Promise<void>;
  onInitialize?: (ctx: YipPluginContext) => void | Promise<void>;
  onEnable?: (ctx: YipPluginContext) => void | Promise<void>;
  onDisable?: (ctx: YipPluginContext) => void | Promise<void>;
  onReload?: (ctx: YipPluginContext) => void | Promise<void>;
  onUpgrade?: (ctx: YipPluginContext, fromVersion: string) => void | Promise<void>;
  onRemove?: (ctx: YipPluginContext) => void | Promise<void>;
  onDestroy?: (ctx: YipPluginContext) => void | Promise<void>;
  healthCheck?: (ctx: YipPluginContext) => PluginHealth | Promise<PluginHealth>;
};

export type YipPlugin = {
  id: PluginId | string;
  name: string;
  version: string;
  description: string;
  /** Capability type tag e.g. "knowledge" | "recommendation" | "pricing" | "trust" | "media" | "integration" */
  capabilityType: string;
  /** Capability ids this plugin registers into the CapabilityRegistry */
  provides: string[];
  /** Capability ids (or plugin ids) that must be enabled first */
  dependsOn?: string[];
  /** Soft conflicts — cannot enable if these plugins are enabled */
  conflictsWith?: string[];
  permissions?: PluginPermission[];
  /** Events this plugin may subscribe to */
  supportedEvents?: string[];
  /** Optional multiple providers behind this capability */
  providers?: PluginProviderOption[];
  /** Active provider id (config) */
  activeProviderId?: string;
  /** Feature flag — if false, plugin installs as disabled */
  enabledByDefault?: boolean;
  hooks: YipPluginHooks;
  /** Register CapabilityDescriptor(s) onto registry — called during initialize */
  registerCapabilities: (ctx: YipPluginContext) => void;
};
