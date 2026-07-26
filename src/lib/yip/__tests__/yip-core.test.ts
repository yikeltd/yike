/**
 * YIP CORE unit tests — run with:
 *   npx tsx --test src/lib/yip/__tests__/yip-core.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createYip } from "../bootstrap";
import { CapabilityRegistry } from "../registry/capability-registry";
import { CAPABILITIES } from "../registry/capabilities";
import { EventBus } from "../events/event-bus";
import { buildContext } from "../context/build-context";
import { createLearningLayer } from "../learning";
import { NotImplementedError } from "../shared/errors";
import type { VehicleKnowledge } from "../knowledge/types";

describe("capability registry", () => {
  it("registers, gets, and lists capabilities", () => {
    const registry = new CapabilityRegistry();
    registry.register({
      id: CAPABILITIES.VEHICLE_KNOWLEDGE,
      version: "1.0.0",
      enabled: true,
      description: "test capability",
      factory: () => ({ hello: "world" }),
    });

    const instance = registry.get<{ hello: string }>(CAPABILITIES.VEHICLE_KNOWLEDGE);
    assert.equal(instance.hello, "world");

    const list = registry.list();
    assert.equal(list.length, 1);
    assert.equal(list[0].id, CAPABILITIES.VEHICLE_KNOWLEDGE);
    assert.equal(registry.isEnabled(CAPABILITIES.VEHICLE_KNOWLEDGE), true);
  });

  it("throws for unknown or disabled capabilities", () => {
    const registry = new CapabilityRegistry();
    assert.throws(() => registry.get("nope.unknown"));

    registry.register({
      id: CAPABILITIES.PRICING_ENGINE,
      version: "0.1.0",
      enabled: false,
      description: "disabled stub",
      factory: () => ({}),
    });
    assert.equal(registry.isEnabled(CAPABILITIES.PRICING_ENGINE), false);
    assert.throws(() => registry.get(CAPABILITIES.PRICING_ENGINE));
    assert.equal(registry.tryGet(CAPABILITIES.PRICING_ENGINE), undefined);
  });

  it("memoizes the factory result (singleton per capability)", () => {
    const registry = new CapabilityRegistry();
    let calls = 0;
    registry.register({
      id: CAPABILITIES.TRUST_ASSESSMENT,
      version: "1.0.0",
      enabled: true,
      description: "counts factory calls",
      factory: () => {
        calls += 1;
        return { calls };
      },
    });
    registry.get(CAPABILITIES.TRUST_ASSESSMENT);
    registry.get(CAPABILITIES.TRUST_ASSESSMENT);
    assert.equal(calls, 1);
  });
});

describe("event bus", () => {
  it("publishes to subscribers of the matching type only", () => {
    const bus = new EventBus();
    const received: string[] = [];

    bus.subscribe("listing.created", (event) => {
      received.push(event.payload.listingId);
    });
    bus.subscribe("photo.uploaded", () => {
      received.push("should-not-fire");
    });

    bus.publish({
      type: "listing.created",
      occurredAt: new Date().toISOString(),
      payload: { listingId: "l1", domain: "vehicle", categoryId: "car" },
    });

    assert.deepEqual(received, ["l1"]);
  });

  it("unsubscribe stops further delivery", () => {
    const bus = new EventBus();
    let count = 0;
    const unsubscribe = bus.subscribe("price.changed", () => {
      count += 1;
    });

    const event = {
      type: "price.changed" as const,
      occurredAt: new Date().toISOString(),
      payload: { listingId: "l2", newPrice: 100, currency: "NGN" as const },
    };
    bus.publish(event);
    unsubscribe();
    bus.publish(event);

    assert.equal(count, 1);
  });
});

describe("createYip bootstrap", () => {
  it("registers the default capability set", () => {
    const yip = createYip();
    const ids = yip.registry.list().map((c) => c.id);

    for (const id of Object.values(CAPABILITIES)) {
      assert.ok(ids.includes(id), `expected ${id} to be registered`);
    }
    assert.equal(yip.registry.isEnabled(CAPABILITIES.VEHICLE_KNOWLEDGE), true);
    assert.equal(yip.registry.isEnabled(CAPABILITIES.PRICING_ENGINE), false);
    assert.equal(yip.registry.isEnabled(CAPABILITIES.TRUST_ASSESSMENT), false);
  });

  it("resolves vehicle knowledge through the registry and returns Toyota models", () => {
    const yip = createYip();
    const vehicleKnowledge = yip.registry.get<VehicleKnowledge>(CAPABILITIES.VEHICLE_KNOWLEDGE);

    const makes = vehicleKnowledge.listMakes();
    assert.ok(makes.some((m) => m.value === "Toyota"));

    const models = vehicleKnowledge.listModelsForMake("Toyota");
    assert.ok(models.some((m) => m.value === "Camry"));
    assert.equal(vehicleKnowledge.isValidModelForMake("Toyota", "Camry"), true);
    assert.equal(vehicleKnowledge.isValidModelForMake("Toyota", "Not A Real Model"), false);
  });

  it("market knowledge reports insufficient_data — CORE never fabricates a price", () => {
    const yip = createYip();
    const result = yip.knowledge.market.getPriceSuggestion({ domain: "vehicle", categoryId: "car" });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.available, false);
      if (!result.value.available) {
        assert.equal(result.value.reason, "insufficient_data");
      }
    }
  });

  it("property and location knowledge wrap existing marketplace constants", () => {
    const yip = createYip();
    assert.ok(yip.knowledge.property.listListingTypes().length > 0);
    assert.ok(yip.knowledge.location.listStates().some((s) => s.value === "Lagos"));
    assert.ok(yip.knowledge.location.listCitiesForState("Lagos").some((c) => c.value === "Lekki"));
  });
});

describe("context builder", () => {
  it("normalizes partial input with safe defaults", () => {
    const context = buildContext({ domain: "vehicle" });
    assert.deepEqual(context.values, {});
    assert.equal(context.photoCount, 0);
    assert.equal(context.actor.role, "guest");
    assert.ok(context.builtAt);
  });
});

describe("learning layer (reserved, not implemented)", () => {
  it("exists on the platform surface but never claims to learn", () => {
    const learning = createLearningLayer();
    assert.throws(() => learning.recordOutcome({ kind: "test", payload: {} }), NotImplementedError);
    assert.throws(() => learning.getLearnedAdjustment("any-key"), NotImplementedError);
  });
});
