/**
 * YIP 2.0 plugin architecture tests — run with:
 *   npx tsx --test src/lib/yip/__tests__/yip-plugins.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createYip } from "../bootstrap";
import { CapabilityRegistry } from "../registry/capability-registry";
import { CAPABILITIES } from "../registry/capabilities";
import { EventBus } from "../events/event-bus";
import { definePlugin } from "../plugins/define-plugin";
import { resolveInstallOrder, validatePluginGraph } from "../plugins/dependency";
import { PluginHost } from "../plugins/host";
import { InvalidPluginError, PluginConflictError, PluginDependencyError } from "../plugins/errors";
import type { YipPlugin } from "../plugins/types";
import type { VehicleKnowledge } from "../knowledge/types";
import { toCapabilityId } from "../shared/types";

function makePlugin(overrides: Partial<YipPlugin> & { id: string; provides: string[] }): YipPlugin {
  const { id, provides, hooks, registerCapabilities, ...rest } = overrides;
  return definePlugin({
    id,
    provides,
    name: rest.name ?? id,
    version: rest.version ?? "1.0.0",
    description: rest.description ?? "test plugin",
    capabilityType: rest.capabilityType ?? "test",
    dependsOn: rest.dependsOn,
    conflictsWith: rest.conflictsWith,
    enabledByDefault: rest.enabledByDefault,
    hooks: hooks ?? {},
    registerCapabilities:
      registerCapabilities ??
      ((ctx) => {
        for (const capabilityId of provides) {
          ctx.registry.register({
            id: toCapabilityId(capabilityId),
            version: "1.0.0",
            enabled: rest.enabledByDefault !== false,
            description: "test capability",
            factory: () => ({ id: capabilityId }),
          });
        }
      }),
  });
}

function makeHost(): { host: PluginHost; registry: CapabilityRegistry; eventBus: EventBus } {
  const registry = new CapabilityRegistry();
  const eventBus = new EventBus();
  return { host: new PluginHost({ registry, eventBus }), registry, eventBus };
}

describe("plugin dependency resolution", () => {
  it("resolveInstallOrder installs dependencies before dependents", () => {
    const base = makePlugin({ id: "base", provides: ["base.cap"] });
    const dependent = makePlugin({ id: "dependent", provides: ["dependent.cap"], dependsOn: ["base.cap"] });

    const order = resolveInstallOrder([dependent, base]);
    const ids = order.map((p) => String(p.id));

    assert.deepEqual(ids, ["base", "dependent"]);
  });

  it("resolveInstallOrder resolves dependsOn by plugin id too", () => {
    const base = makePlugin({ id: "base", provides: ["base.cap"] });
    const dependent = makePlugin({ id: "dependent", provides: ["dependent.cap"], dependsOn: ["base"] });

    const order = resolveInstallOrder([dependent, base]);
    assert.deepEqual(order.map((p) => String(p.id)), ["base", "dependent"]);
  });

  it("validatePluginGraph rejects circular dependencies", () => {
    const a = makePlugin({ id: "a", provides: ["a.cap"], dependsOn: ["b.cap"] });
    const b = makePlugin({ id: "b", provides: ["b.cap"], dependsOn: ["a.cap"] });

    const result = validatePluginGraph([a, b]);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes("Circular dependency")));
  });

  it("validatePluginGraph rejects missing dependencies", () => {
    const orphan = makePlugin({ id: "orphan", provides: ["orphan.cap"], dependsOn: ["nope.cap"] });
    const result = validatePluginGraph([orphan]);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes("unknown capability/plugin")));
  });

  it("validatePluginGraph allows co-installing conflicting plugins — conflicts are soft, enforced at enable() time", () => {
    const a = makePlugin({ id: "a", provides: ["a.cap"], conflictsWith: ["b"] });
    const b = makePlugin({ id: "b", provides: ["b.cap"] });

    const result = validatePluginGraph([a, b]);
    assert.equal(result.ok, true);
  });
});

describe("PluginHost lifecycle", () => {
  it("installAll installs, initializes, and enables plugins in dependency order", () => {
    const { host, registry } = makeHost();
    const base = makePlugin({ id: "base", provides: ["base.cap"] });
    const dependent = makePlugin({ id: "dependent", provides: ["dependent.cap"], dependsOn: ["base.cap"] });

    host.installAll([dependent, base]);

    const diagnostics = host.list();
    assert.equal(diagnostics.length, 2);
    assert.ok(diagnostics.every((d) => d.state === "enabled"));
    assert.equal(registry.isEnabled("base.cap"), true);
    assert.equal(registry.isEnabled("dependent.cap"), true);
  });

  it("respects enabledByDefault: false — installs and initializes but does not enable", () => {
    const { host, registry } = makeHost();
    const disabledPlugin = makePlugin({ id: "disabled", provides: ["disabled.cap"], enabledByDefault: false });

    host.installAll([disabledPlugin]);

    const diagnostics = host.list();
    assert.equal(diagnostics[0].state, "initialized");
    assert.equal(registry.has("disabled.cap"), true);
    assert.equal(registry.isEnabled("disabled.cap"), false);
  });

  it("enable() throws PluginDependencyError when a dependency isn't enabled", () => {
    const { host } = makeHost();
    const base = makePlugin({ id: "base", provides: ["base.cap"], enabledByDefault: false });
    const dependent = makePlugin({ id: "dependent", provides: ["dependent.cap"], dependsOn: ["base.cap"], enabledByDefault: false });

    host.installAll([dependent, base]);

    assert.throws(() => host.enable("dependent"), PluginDependencyError);
  });

  it("enable() throws PluginConflictError when a conflicting plugin is already enabled", async () => {
    const { host } = makeHost();
    const a = makePlugin({ id: "a", provides: ["a.cap"] });
    const b = makePlugin({ id: "b", provides: ["b.cap"], conflictsWith: ["a"], enabledByDefault: false });

    host.installAll([a, b]);
    assert.equal(host.get("a")?.id, "a");

    await assert.rejects(async () => {
      const result = host.enable("b");
      if (result) await result;
    }, PluginConflictError);
  });

  it("disable() flips the capability to disabled and clears the memoized instance", async () => {
    const { host, registry } = makeHost();
    const plugin = makePlugin({ id: "toggle", provides: ["toggle.cap"] });
    host.installAll([plugin]);

    assert.equal(registry.get<{ id: string }>("toggle.cap").id, "toggle.cap");
    await host.disable("toggle");
    assert.equal(registry.isEnabled("toggle.cap"), false);
    assert.throws(() => registry.get("toggle.cap"));

    const enableResult = host.enable("toggle");
    if (enableResult) await enableResult;
    assert.equal(registry.isEnabled("toggle.cap"), true);
  });

  it("remove() fully removes the plugin from the host", async () => {
    const { host } = makeHost();
    const plugin = makePlugin({ id: "removable", provides: ["removable.cap"] });
    host.installAll([plugin]);
    assert.ok(host.get("removable"));

    await host.remove("removable");
    assert.equal(host.get("removable"), undefined);
    assert.equal(host.list().length, 0);
  });

  it("tracks and cleans up ctx.subscribe subscriptions on destroy", async () => {
    const { host, eventBus } = makeHost();
    let received = 0;
    const plugin = makePlugin({
      id: "subscriber",
      provides: ["subscriber.cap"],
      hooks: {
        onEnable: (ctx) => {
          ctx.subscribe("listing.created", () => {
            received += 1;
          });
        },
      },
    });

    host.installAll([plugin]);
    eventBus.publish({
      type: "listing.created",
      occurredAt: new Date().toISOString(),
      payload: { listingId: "l1", domain: "vehicle", categoryId: "car" },
    });
    assert.equal(received, 1);

    await host.destroy("subscriber");
    eventBus.publish({
      type: "listing.created",
      occurredAt: new Date().toISOString(),
      payload: { listingId: "l2", domain: "vehicle", categoryId: "car" },
    });
    assert.equal(received, 1, "handler should be unsubscribed after destroy");
  });

  it("healthCheck defaults to healthy when enabled and no custom healthCheck hook exists", async () => {
    const { host } = makeHost();
    const plugin = makePlugin({ id: "healthy", provides: ["healthy.cap"] });
    host.installAll([plugin]);

    const health = await host.healthCheck("healthy");
    assert.equal(health.status, "healthy");
  });

  it("healthCheck uses a plugin-provided hook when present", async () => {
    const { host } = makeHost();
    const plugin = makePlugin({
      id: "custom-health",
      provides: ["custom-health.cap"],
      hooks: {
        healthCheck: () => ({ status: "degraded", checkedAt: new Date().toISOString(), message: "warming up" }),
      },
    });
    host.installAll([plugin]);

    const health = await host.healthCheck("custom-health");
    assert.equal(health.status, "degraded");
    assert.equal(health.message, "warming up");
  });

  it("definePlugin rejects a plugin missing required fields", () => {
    assert.throws(
      () =>
        definePlugin({
          id: "",
          name: "bad",
          version: "1.0.0",
          description: "bad plugin",
          capabilityType: "test",
          provides: [],
          hooks: {},
          registerCapabilities: () => {},
        }),
      InvalidPluginError,
    );
  });
});

describe("createYip() with the plugin host", () => {
  it("plugins.list() includes every builtin plugin", () => {
    const yip = createYip();
    const diagnostics = yip.plugins.list();
    const ids = diagnostics.map((d) => String(d.pluginId));

    assert.ok(ids.includes("yip.vehicle-knowledge"));
    assert.ok(ids.includes("yip.property-knowledge"));
    assert.ok(ids.includes("yip.location-knowledge"));
    assert.ok(ids.includes("yip.market-knowledge"));
    assert.ok(ids.includes("yip.photo-knowledge"));
    assert.ok(ids.includes("yip.recommendation"));
    assert.ok(ids.includes("yip.pricing"));
    assert.ok(ids.includes("yip.trust"));
    assert.ok(ids.includes("yip.media-analysis"));
  });

  it("knowledge plugins install enabled; disabled-by-default plugins install initialized only", () => {
    const yip = createYip();
    const byId = new Map(yip.plugins.list().map((d) => [String(d.pluginId), d]));

    assert.equal(byId.get("yip.vehicle-knowledge")?.state, "enabled");
    assert.equal(byId.get("yip.recommendation")?.state, "initialized");
    assert.equal(byId.get("yip.pricing")?.state, "initialized");
    assert.equal(byId.get("yip.trust")?.state, "initialized");
    assert.equal(byId.get("yip.media-analysis")?.state, "initialized");
  });

  it("healthCheckAll reports healthy for enabled knowledge plugins", async () => {
    const yip = createYip();
    const diagnostics = await yip.plugins.healthCheckAll();
    const vehicleHealth = diagnostics.find((d) => String(d.pluginId) === "yip.vehicle-knowledge");

    assert.ok(vehicleHealth);
    assert.equal(vehicleHealth?.health.status, "healthy");
  });

  it("still resolves Toyota models via the registry (capability contract unchanged)", () => {
    const yip = createYip();
    const vehicleKnowledge = yip.registry.get<VehicleKnowledge>(CAPABILITIES.VEHICLE_KNOWLEDGE);

    const makes = vehicleKnowledge.listMakes();
    assert.ok(makes.some((m) => m.value === "Toyota"));

    const models = vehicleKnowledge.listModelsForMake("Toyota");
    assert.ok(models.some((m) => m.value === "Camry"));
  });

  it("registry.isEnabled matches CORE defaults — knowledge on, intelligence stubs off", () => {
    const yip = createYip();
    assert.equal(yip.registry.isEnabled(CAPABILITIES.VEHICLE_KNOWLEDGE), true);
    assert.equal(yip.registry.isEnabled(CAPABILITIES.PRICING_ENGINE), false);
    assert.equal(yip.registry.isEnabled(CAPABILITIES.TRUST_ASSESSMENT), false);
  });

  it("enabling the recommendation plugin at runtime flips its capability on", () => {
    const yip = createYip();
    assert.equal(yip.registry.isEnabled(CAPABILITIES.RECOMMENDATION_ENGINE), false);

    const result = yip.plugins.enable("yip.recommendation");
    assert.equal(result, undefined, "sync hooks should resolve without a Promise");
    assert.equal(yip.registry.isEnabled(CAPABILITIES.RECOMMENDATION_ENGINE), true);
  });
});
