/**
 * `PluginHost` — runs the plugin lifecycle (install → initialize → enable →
 * disable/reload/upgrade → remove/destroy) against a `CapabilityRegistry`
 * and `EventBus`. Applications never talk to `PluginHost` for capability
 * lookups — they still call `registry.get(...)`. The host only exists to
 * install/enable the providers behind those capability ids.
 *
 * `install`/`initialize`/`enable`/`installAll` use a sync-fast-path: when a
 * plugin's hooks are synchronous (true for every builtin), the whole chain
 * completes before the call returns — no `await` is a Promise cast in the
 * middle. This is what lets `createYip()` stay a plain synchronous function.
 * A hook that genuinely returns a Promise still works — the method then
 * returns a Promise instead of `void`.
 */
import type { CapabilityRegistry } from "../registry/capability-registry";
import type { EventBus } from "../events/event-bus";
import type { Unsubscribe } from "../events/types";
import { assertValidPlugin } from "./define-plugin";
import { resolveInstallOrder, validatePluginGraph } from "./dependency";
import { InvalidPluginError, PluginConflictError, PluginDependencyError, PluginLifecycleError, PluginNotFoundError } from "./errors";
import type { PluginDiagnostics, PluginHealth, PluginId, PluginLifecycleState, YipPlugin, YipPluginContext } from "./types";

type PluginRecord = {
  plugin: YipPlugin;
  state: PluginLifecycleState;
  subscriptions: Unsubscribe[];
  errorCount: number;
  lastError?: string;
  lastExecutionAt?: string;
  health: PluginHealth;
};

export type PluginHostDeps = {
  registry: CapabilityRegistry;
  eventBus: EventBus;
};

function unknownHealth(): PluginHealth {
  return { status: "unknown", checkedAt: new Date().toISOString() };
}

function isPromiseLike(value: unknown): value is Promise<void> {
  return !!value && typeof (value as { then?: unknown }).then === "function";
}

export class PluginHost {
  private readonly registry: CapabilityRegistry;
  private readonly eventBus: EventBus;
  private readonly records = new Map<string, PluginRecord>();

  constructor(deps: PluginHostDeps) {
    this.registry = deps.registry;
    this.eventBus = deps.eventBus;
  }

  private buildContext(record: PluginRecord): YipPluginContext {
    return {
      registry: this.registry,
      eventBus: this.eventBus,
      getCapability: <T>(id: string) => this.registry.get<T>(id),
      subscribe: ((type: never, handler: never) => {
        const unsubscribe = this.eventBus.subscribe(type, handler);
        record.subscriptions.push(unsubscribe);
        return unsubscribe;
      }) as EventBus["subscribe"],
      log: (level, message, meta) => {
        const prefix = `[yip:plugin:${record.plugin.id}]`;
        console[level === "debug" ? "log" : level](prefix, message, meta ?? "");
      },
    };
  }

  private requireRecord(pluginId: string): PluginRecord {
    const record = this.records.get(pluginId);
    if (!record) throw new PluginNotFoundError(pluginId);
    return record;
  }

  /** Resolves a `dependsOn`/`conflictsWith` reference to an installed plugin, by plugin id or provided capability id. */
  private findInstalledByRef(ref: string): YipPlugin | undefined {
    const byId = this.records.get(ref);
    if (byId) return byId.plugin;
    for (const record of this.records.values()) {
      if (record.plugin.provides.includes(ref)) return record.plugin;
    }
    return undefined;
  }

  private assertDependenciesEnabled(plugin: YipPlugin): void {
    for (const dep of plugin.dependsOn ?? []) {
      const depPlugin = this.findInstalledByRef(dep);
      if (depPlugin) {
        const depRecord = this.records.get(String(depPlugin.id));
        if (depRecord?.state !== "enabled") {
          throw new PluginDependencyError(
            String(plugin.id),
            `Dependency "${dep}" (plugin "${depPlugin.id}") must be enabled first.`,
          );
        }
        continue;
      }
      if (this.registry.has(dep) && this.registry.isEnabled(dep)) continue;
      throw new PluginDependencyError(String(plugin.id), `Dependency "${dep}" could not be resolved.`);
    }
  }

  private assertNoConflicts(plugin: YipPlugin): void {
    for (const conflictRef of plugin.conflictsWith ?? []) {
      const conflictRecord = this.records.get(conflictRef);
      if (conflictRecord && conflictRecord.state === "enabled") {
        throw new PluginConflictError(String(plugin.id), conflictRef);
      }
    }
  }

  /** Runs a lifecycle hook. Returns `undefined` if it resolved synchronously, or a `Promise` if the hook was async. */
  private runHook(record: PluginRecord, hook: () => void | Promise<void>): void | Promise<void> {
    const onError = (error: unknown): never => {
      record.errorCount += 1;
      record.lastError = error instanceof Error ? error.message : String(error);
      throw new PluginLifecycleError(String(record.plugin.id), record.lastError);
    };
    try {
      const result = hook();
      if (isPromiseLike(result)) return result.catch(onError);
      return undefined;
    } catch (error) {
      return onError(error);
    }
  }

  install(plugin: YipPlugin): void | Promise<void> {
    assertValidPlugin(plugin);
    const id = String(plugin.id);
    if (this.records.has(id)) {
      throw new InvalidPluginError(`Plugin "${id}" is already installed.`, { pluginId: id });
    }
    const record: PluginRecord = {
      plugin,
      state: "registered",
      subscriptions: [],
      errorCount: 0,
      health: unknownHealth(),
    };
    this.records.set(id, record);
    return this.runHook(record, () => plugin.hooks.onInstall?.(this.buildContext(record)));
  }

  initialize(pluginId: string): void | Promise<void> {
    const record = this.requireRecord(pluginId);
    if (record.state !== "registered") return undefined;
    const ctx = this.buildContext(record);
    record.plugin.registerCapabilities(ctx);
    const result = this.runHook(record, () => record.plugin.hooks.onInitialize?.(ctx));
    if (isPromiseLike(result)) {
      return result.then(() => {
        record.state = "initialized";
      });
    }
    record.state = "initialized";
    return undefined;
  }

  enable(pluginId: string): void | Promise<void> {
    const record = this.requireRecord(pluginId);

    const proceed = (): void | Promise<void> => {
      if (record.state === "enabled") return undefined;
      this.assertDependenciesEnabled(record.plugin);
      this.assertNoConflicts(record.plugin);
      const ctx = this.buildContext(record);
      const result = this.runHook(record, () => record.plugin.hooks.onEnable?.(ctx));
      const finish = (): void => {
        for (const capabilityId of record.plugin.provides) {
          if (this.registry.has(capabilityId)) this.registry.setEnabled(capabilityId, true);
        }
        record.state = "enabled";
      };
      if (isPromiseLike(result)) return result.then(finish);
      finish();
      return undefined;
    };

    if (record.state === "registered") {
      const initResult = this.initialize(pluginId);
      if (isPromiseLike(initResult)) return initResult.then(proceed);
      return proceed();
    }
    return proceed();
  }

  async disable(pluginId: string): Promise<void> {
    const record = this.requireRecord(pluginId);
    if (record.state !== "enabled") return;
    const ctx = this.buildContext(record);
    await this.runHook(record, () => record.plugin.hooks.onDisable?.(ctx));
    for (const capabilityId of record.plugin.provides) {
      if (this.registry.has(capabilityId)) this.registry.setEnabled(capabilityId, false);
    }
    record.state = "disabled";
  }

  async reload(pluginId: string): Promise<void> {
    const record = this.requireRecord(pluginId);
    const ctx = this.buildContext(record);
    await this.runHook(record, () => record.plugin.hooks.onReload?.(ctx));
    const wasEnabled = record.state === "enabled";
    for (const capabilityId of record.plugin.provides) {
      if (!this.registry.has(capabilityId)) continue;
      this.registry.setEnabled(capabilityId, false);
      if (wasEnabled) this.registry.setEnabled(capabilityId, true);
    }
  }

  async upgrade(pluginId: string, newPlugin: YipPlugin): Promise<void> {
    assertValidPlugin(newPlugin);
    const record = this.requireRecord(pluginId);
    if (String(newPlugin.id) !== pluginId) {
      throw new PluginLifecycleError(pluginId, `Upgrade plugin id "${newPlugin.id}" must match "${pluginId}".`);
    }
    const fromVersion = record.plugin.version;
    record.plugin = newPlugin;
    const ctx = this.buildContext(record);
    await this.runHook(record, () => newPlugin.hooks.onUpgrade?.(ctx, fromVersion));
  }

  async remove(pluginId: string): Promise<void> {
    const record = this.requireRecord(pluginId);
    if (record.state === "enabled") await this.disable(pluginId);
    const ctx = this.buildContext(record);
    await this.runHook(record, () => record.plugin.hooks.onRemove?.(ctx));
    await this.destroy(pluginId);
    this.records.delete(pluginId);
  }

  async destroy(pluginId: string): Promise<void> {
    const record = this.requireRecord(pluginId);
    const ctx = this.buildContext(record);
    await this.runHook(record, () => record.plugin.hooks.onDestroy?.(ctx));
    for (const unsubscribe of record.subscriptions) unsubscribe();
    record.subscriptions.length = 0;
    record.state = "destroyed";
  }

  installAll(plugins: YipPlugin[]): void | Promise<void> {
    const validation = validatePluginGraph(plugins);
    if (!validation.ok) {
      throw new InvalidPluginError(`Plugin graph is invalid: ${validation.errors.join(" ")}`, {
        errors: validation.errors,
      });
    }
    const order = resolveInstallOrder(plugins);
    return this.installFrom(order, 0);
  }

  private installFrom(order: YipPlugin[], index: number): void | Promise<void> {
    if (index >= order.length) return undefined;
    const plugin = order[index];

    const afterEnable = (): void | Promise<void> => this.installFrom(order, index + 1);

    const afterInit = (): void | Promise<void> => {
      if (plugin.enabledByDefault === false) return afterEnable();
      const enableResult = this.enable(String(plugin.id));
      if (isPromiseLike(enableResult)) return enableResult.then(afterEnable);
      return afterEnable();
    };

    const afterInstall = (): void | Promise<void> => {
      const initResult = this.initialize(String(plugin.id));
      if (isPromiseLike(initResult)) return initResult.then(afterInit);
      return afterInit();
    };

    const installResult = this.install(plugin);
    if (isPromiseLike(installResult)) return installResult.then(afterInstall);
    return afterInstall();
  }

  list(): PluginDiagnostics[] {
    return Array.from(this.records.values()).map((record) => this.toDiagnostics(record));
  }

  get(pluginId: string): YipPlugin | undefined {
    return this.records.get(pluginId)?.plugin;
  }

  async healthCheck(pluginId: string): Promise<PluginHealth> {
    const record = this.requireRecord(pluginId);
    const ctx = this.buildContext(record);
    const startedAt = Date.now();
    try {
      const health = record.plugin.hooks.healthCheck
        ? await record.plugin.hooks.healthCheck(ctx)
        : this.defaultHealth(record);
      record.health = { ...health, latencyMs: health.latencyMs ?? Date.now() - startedAt };
    } catch (error) {
      record.errorCount += 1;
      record.lastError = error instanceof Error ? error.message : String(error);
      record.health = {
        status: "unhealthy",
        checkedAt: new Date().toISOString(),
        message: record.lastError,
        latencyMs: Date.now() - startedAt,
      };
    }
    record.lastExecutionAt = new Date().toISOString();
    return record.health;
  }

  async healthCheckAll(): Promise<PluginDiagnostics[]> {
    await Promise.all(Array.from(this.records.keys()).map((id) => this.healthCheck(id)));
    return this.list();
  }

  private defaultHealth(record: PluginRecord): PluginHealth {
    const status = record.state === "enabled" ? "healthy" : record.state === "destroyed" ? "unhealthy" : "degraded";
    return { status, checkedAt: new Date().toISOString() };
  }

  private toDiagnostics(record: PluginRecord): PluginDiagnostics {
    return {
      pluginId: record.plugin.id as PluginId,
      version: record.plugin.version,
      state: record.state,
      health: record.health,
      errorCount: record.errorCount,
      lastError: record.lastError,
      lastExecutionAt: record.lastExecutionAt,
    };
  }
}
