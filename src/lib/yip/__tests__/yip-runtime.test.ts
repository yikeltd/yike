/**
 * YIP Runtime tests — run with:
 *   npx tsx --test src/lib/yip/__tests__/yip-runtime.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { createYip } from "../bootstrap";
import { CAPABILITIES } from "../registry/capabilities";
import { CapabilityRegistry } from "../registry/capability-registry";
import { EventBus } from "../events/event-bus";
import { PluginHost } from "../plugins/host";
import { definePlugin } from "../plugins/define-plugin";
import type { YipPlugin } from "../plugins/types";
import type { VehicleKnowledge } from "../knowledge/types";
import { CapabilityRuntime } from "../runtime/capability-runtime";
import { SoftSandbox } from "../runtime/sandbox";
import { PermissionManager } from "../runtime/permission-manager";
import { toManifest } from "../runtime/manifest";
import { toCapabilityId } from "../shared/types";

function makeRuntime(): { runtime: CapabilityRuntime; registry: CapabilityRegistry; eventBus: EventBus; plugins: PluginHost } {
  const registry = new CapabilityRegistry();
  const eventBus = new EventBus();
  const plugins = new PluginHost({ registry, eventBus });
  const runtime = new CapabilityRuntime({ registry, eventBus, plugins });
  return { runtime, registry, eventBus, plugins };
}

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
    permissions: rest.permissions,
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

describe("CapabilityRuntime.start()", () => {
  it("createYip() boots the runtime into the running state", () => {
    const yip = createYip();
    assert.equal(yip.runtime.status, "running");
  });

  it("registers builtin plugin manifests, discoverable via listManifests/getManifest", () => {
    const yip = createYip();
    const ids = yip.runtime.listManifests().map((m) => m.id);

    assert.ok(ids.includes("yip.vehicle-knowledge"));
    assert.ok(ids.includes("yip.property-knowledge"));
    assert.ok(ids.includes("yip.location-knowledge"));
    assert.ok(ids.includes("yip.market-knowledge"));
    assert.ok(ids.includes("yip.photo-knowledge"));

    const vehicleManifest = yip.runtime.getManifest("yip.vehicle-knowledge");
    assert.ok(vehicleManifest);
    assert.equal(vehicleManifest?.category, "knowledge");
    assert.deepEqual(vehicleManifest?.provides, [CAPABILITIES.VEHICLE_KNOWLEDGE]);
  });

  it("still resolves Toyota models through the registry after runtime start (capability contract unchanged)", () => {
    const yip = createYip();
    const vehicleKnowledge = yip.registry.get<VehicleKnowledge>(CAPABILITIES.VEHICLE_KNOWLEDGE);

    const makes = vehicleKnowledge.listMakes();
    assert.ok(makes.some((m) => m.value === "Toyota"));

    const models = vehicleKnowledge.listModelsForMake("Toyota");
    assert.ok(models.some((m) => m.value === "Camry"));
  });

  it("registerPackage after start() throws — every package must be registered before start()", () => {
    const { runtime } = makeRuntime();
    runtime.registerPackage(makePlugin({ id: "early", provides: ["early.cap"] }));
    runtime.start();

    assert.throws(() => runtime.registerPackage(makePlugin({ id: "late", provides: ["late.cap"] })));
  });
});

describe("CapabilityRuntime diagnostics", () => {
  it("diagnostics() includes builtin knowledge plugins with health + version graphs", async () => {
    const yip = createYip();
    const diagnostics = yip.runtime.diagnostics();

    assert.equal(diagnostics.status, "running");
    const pluginIds = diagnostics.capabilities.map((c) => c.pluginId);
    assert.ok(pluginIds.includes("yip.vehicle-knowledge"));
    assert.ok(pluginIds.includes("yip.property-knowledge"));

    const vehicleNode = diagnostics.capabilities.find((c) => c.pluginId === "yip.vehicle-knowledge");
    assert.ok(vehicleNode?.manifest);
    assert.equal(vehicleNode?.state, "enabled");
    assert.ok(diagnostics.versions["yip.vehicle-knowledge"]);
  });

  it("health() delegates to PluginHost.healthCheckAll and reports healthy enabled plugins", async () => {
    const yip = createYip();
    const health = await yip.runtime.health();
    const vehicleHealth = health.find((d) => String(d.pluginId) === "yip.vehicle-knowledge");

    assert.ok(vehicleHealth);
    assert.equal(vehicleHealth?.health.status, "healthy");
  });
});

describe("CapabilityRuntime.permissions", () => {
  it("grants exactly what a manifest declares and denies everything else", () => {
    const permissions = new PermissionManager();
    permissions.grant("plugin-a", ["knowledge.read", "events.subscribe"]);

    assert.equal(permissions.check("plugin-a", "knowledge.read"), true);
    assert.equal(permissions.check("plugin-a", "events.subscribe"), true);
    assert.equal(permissions.check("plugin-a", "registry.register"), false);
    assert.equal(permissions.check("unknown-plugin", "knowledge.read"), false);
  });

  it("createYip() grants declared plugin permissions automatically at start()", () => {
    const yip = createYip();
    assert.equal(yip.runtime.permissions.check("yip.vehicle-knowledge", "knowledge.read"), true);
    assert.equal(yip.runtime.permissions.check("yip.vehicle-knowledge", "registry.register"), false);
  });
});

describe("CapabilityRuntime.sandbox (SoftSandbox)", () => {
  it("swallows a thrown error by default and returns a Result instead of rejecting", async () => {
    const sandbox = new SoftSandbox();
    const result = await sandbox.run("flaky", () => {
      throw new Error("boom");
    });

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "sandbox_error");
  });

  it("opens the circuit after maxErrorsBeforeOpenCircuit consecutive failures", async () => {
    const sandbox = new SoftSandbox({ maxErrorsBeforeOpenCircuit: 2, circuitCooldownMs: 60_000 });
    const failer = () => {
      throw new Error("nope");
    };

    await sandbox.run("circuit-test", failer);
    assert.equal(sandbox.circuitState("circuit-test").open, false);

    await sandbox.run("circuit-test", failer);
    assert.equal(sandbox.circuitState("circuit-test").open, true);

    const blocked = await sandbox.run("circuit-test", () => "should not run");
    assert.equal(blocked.ok, false);
    if (!blocked.ok) assert.equal(blocked.error.code, "circuit_open");
  });

  it("swallow: false re-throws instead of returning a Result", async () => {
    const sandbox = new SoftSandbox();
    await assert.rejects(() => sandbox.run("throwing", () => {
      throw new Error("explicit");
    }, { swallow: false }));
  });

  it("resets a circuit's error count on success", async () => {
    const sandbox = new SoftSandbox({ maxErrorsBeforeOpenCircuit: 3 });
    await sandbox.run("recovering", () => {
      throw new Error("fail once");
    });
    assert.equal(sandbox.circuitState("recovering").errorCount, 1);

    await sandbox.run("recovering", () => "ok");
    assert.equal(sandbox.circuitState("recovering").errorCount, 0);
  });
});

describe("CapabilityRuntime.stop()", () => {
  it("stop() flips status to stopped", () => {
    const yip = createYip();
    assert.equal(yip.runtime.status, "running");

    yip.runtime.stop();
    assert.equal(yip.runtime.status, "stopped");
  });

  it("stop() is idempotent", () => {
    const yip = createYip();
    yip.runtime.stop();
    yip.runtime.stop();
    assert.equal(yip.runtime.status, "stopped");
  });
});

describe("CapabilityRuntime.reload()", () => {
  it("reload() does not throw for a currently-installed plugin", () => {
    const yip = createYip();
    assert.doesNotThrow(() => yip.runtime.reload("yip.vehicle-knowledge"));
  });
});

describe("manifest derivation", () => {
  it("toManifest derives a manifest from an existing YipPlugin without a second manifest file", () => {
    const plugin = makePlugin({
      id: "derived",
      provides: ["derived.cap"],
      permissions: ["knowledge.read"],
      dependsOn: ["base.cap"],
    });
    const manifest = toManifest(plugin);

    assert.equal(manifest.id, "derived");
    assert.deepEqual(manifest.provides, ["derived.cap"]);
    assert.deepEqual(manifest.dependsOn, ["base.cap"]);
    assert.deepEqual(manifest.permissions, ["knowledge.read"]);
  });
});

describe("YIP Runtime foundation constraints", () => {
  it("runtime/ source files never hardcode named future-capability strings (VIN Decoder, Flood Risk, OpenAI)", () => {
    const runtimeDir = path.join(__dirname, "..", "runtime");
    const forbidden = [/VIN Decoder/i, /Flood Risk/i, /OpenAI/i];

    const files = readdirSync(runtimeDir).filter((file) => file.endsWith(".ts"));
    assert.ok(files.length > 0, "expected runtime/ to contain source files");

    for (const file of files) {
      const contents = readFileSync(path.join(runtimeDir, file), "utf8");
      for (const pattern of forbidden) {
        assert.equal(
          pattern.test(contents),
          false,
          `${file} should not mention "${pattern}" — runtime/ stays capability-agnostic`,
        );
      }
    }
  });
});
