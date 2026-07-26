/**
 * `CapabilityRuntime` — the OS façade for YIP. It discovers, validates,
 * loads, starts/stops, upgrades, soft-isolates, monitors, and coordinates
 * capability packages, but it **never re-implements plugin lifecycle** —
 * every install/enable/disable/reload/upgrade call delegates to the same
 * `PluginHost` the plugin architecture already ships. This class exists so
 * applications (and future `/lex` tooling) have one stable object to talk
 * to instead of five separate runtime concerns.
 *
 * See docs/architecture/YIP_RUNTIME.md for the full architecture write-up.
 */
import type { EventBus } from "../events/event-bus";
import type { PluginHost } from "../plugins/host";
import type { PluginDiagnostics, YipPlugin } from "../plugins/types";
import type { CapabilityRegistry } from "../registry/capability-registry";
import { CapabilityDiscovery } from "./discovery";
import { CapabilityHealthMonitor } from "./health-monitor";
import { CapabilityLoader } from "./loader";
import { toManifest } from "./manifest";
import { CapabilityMetrics } from "./metrics";
import { PermissionManager } from "./permission-manager";
import { ProviderResolver } from "./provider-resolver";
import { ConfigurationManager } from "./configuration-manager";
import { RuntimeStateError } from "./errors";
import { SoftSandbox } from "./sandbox";
import type { CapabilityManifest, RuntimeDiagnostics, RuntimeStatus, SoftSandboxPolicy } from "./types";
import { buildRuntimeDiagnostics } from "./diagnostics";

export type CapabilityRuntimeDeps = {
  registry: CapabilityRegistry;
  eventBus: EventBus;
  plugins: PluginHost;
  softSandbox?: SoftSandboxPolicy;
};

function isPromiseLike(value: unknown): value is Promise<void> {
  return !!value && typeof (value as { then?: unknown }).then === "function";
}

export class CapabilityRuntime {
  status: RuntimeStatus = "created";

  readonly permissions = new PermissionManager();
  readonly providers = new ProviderResolver();
  readonly config = new ConfigurationManager();
  readonly metrics = new CapabilityMetrics();
  readonly sandbox: SoftSandbox;

  private readonly registry: CapabilityRegistry;
  private readonly eventBus: EventBus;
  private readonly plugins: PluginHost;
  private readonly discovery = new CapabilityDiscovery();
  private readonly loader = new CapabilityLoader();
  private readonly healthMonitor = new CapabilityHealthMonitor();
  private readonly manifestsById = new Map<string, CapabilityManifest>();

  constructor(deps: CapabilityRuntimeDeps) {
    this.registry = deps.registry;
    this.eventBus = deps.eventBus;
    this.plugins = deps.plugins;
    this.sandbox = new SoftSandbox(deps.softSandbox);
  }

  /** Registers a package for discovery. Call before `start()` — see `registerPackages` for the bulk form. */
  registerPackage(plugin: YipPlugin): void {
    if (this.status === "running") {
      throw new RuntimeStateError(
        `Cannot registerPackage("${plugin.id}") after start() — the runtime is already running. Register every package before calling start().`,
      );
    }
    this.discovery.register(plugin);
    this.manifestsById.set(String(plugin.id), toManifest(plugin));
  }

  registerPackages(plugins: readonly YipPlugin[]): void {
    for (const plugin of plugins) this.registerPackage(plugin);
  }

  /**
   * discover → validate → installAll → status "running". Builtin plugins
   * (and any other plugin with fully synchronous hooks) complete before
   * this method returns — no `await` needed, matching `PluginHost`'s own
   * sync-fast-path. A plugin with a genuinely async hook still installs
   * correctly; `status` flips to `"running"` once that installation
   * settles instead of immediately.
   */
  start(): void {
    if (this.status === "running" || this.status === "starting") return;
    this.status = "starting";

    let packages: YipPlugin[];
    let manifests: CapabilityManifest[];
    try {
      packages = this.discovery.listPackages();
      manifests = this.loader.validateManifests(packages);
    } catch (error) {
      this.status = "failed";
      throw error;
    }

    for (const manifest of manifests) {
      this.manifestsById.set(manifest.id, manifest);
      this.permissions.grant(manifest.id, manifest.permissions);
      if (manifest.supportedProviders?.length) {
        this.providers.registerProviders(manifest.id, manifest.supportedProviders);
      }
    }

    try {
      const result = this.plugins.installAll(packages);
      if (isPromiseLike(result)) {
        result
          .then(() => {
            this.status = "running";
          })
          .catch((error: unknown) => {
            this.status = "failed";
            throw error;
          });
        return;
      }
      this.status = "running";
    } catch (error) {
      this.status = "failed";
      throw error;
    }
  }

  /**
   * Disables every currently-enabled plugin and flips `status` to
   * `"stopped"`. `PluginHost.disable` is always asynchronous (it's declared
   * `async`, even for sync hooks), so this method fires every disable and
   * does not block on their completion — the runtime's own state
   * transitions synchronously, matching `stop(): void`. Use `health()` /
   * `diagnostics()` afterward if you need to confirm every capability
   * actually finished disabling.
   */
  stop(): void {
    if (this.status === "stopped" || this.status === "stopping") return;
    this.status = "stopping";

    for (const diagnostics of this.plugins.list()) {
      if (diagnostics.state !== "enabled") continue;
      const pluginId = String(diagnostics.pluginId);
      this.plugins.disable(pluginId).catch((error: unknown) => {
        this.metrics.incrementError(pluginId);
        // eslint-disable-next-line no-console -- runtime-level failure during shutdown; never throw out of stop()
        console.error(`[yip:runtime] failed to disable "${pluginId}" during stop()`, error);
      });
    }

    this.status = "stopped";
  }

  /** Fire-and-forget reload — see `stop()`'s note on `PluginHost`'s async-only lifecycle methods. */
  reload(pluginId: string): void {
    this.plugins.reload(pluginId).catch((error: unknown) => {
      this.metrics.incrementError(pluginId);
      // eslint-disable-next-line no-console -- runtime-level failure; never throw out of reload()
      console.error(`[yip:runtime] failed to reload "${pluginId}"`, error);
    });
  }

  getManifest(pluginId: string): CapabilityManifest | undefined {
    return this.manifestsById.get(pluginId);
  }

  listManifests(): CapabilityManifest[] {
    return Array.from(this.manifestsById.values());
  }

  diagnostics(): RuntimeDiagnostics {
    return buildRuntimeDiagnostics({
      status: this.status,
      host: this.plugins,
      manifests: this.manifestsById,
      permissions: this.permissions,
      providers: this.providers,
      metrics: this.metrics,
    });
  }

  async health(): Promise<PluginDiagnostics[]> {
    return this.healthMonitor.runAll(this.plugins);
  }
}
