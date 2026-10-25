import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  clearEngineListingDraft,
  discardEngineListingDraft,
  loadEngineListingDraft,
  loadEngineListingDraftWithLegacyFallback,
  markEngineListingDraftConsumed,
  saveEngineListingDraft,
} from "@/lib/listing-engine/listing-engine-draft";
import { buildListingReviewSummary } from "@/lib/listing-engine/review-summary";
import { PROPERTY_CATEGORY_MANIFEST } from "@/lib/listing-engine/categories/property";
import {
  listOrphanDraftMediaUrls,
  trackDraftMediaUrl,
} from "@/lib/listing-create/draft-media-registry";

const SESSION_A = "session-tab-a";
const SESSION_B = "session-tab-b";

function withMockLocalStorage(run: () => void) {
  const bag = new Map<string, string>();
  const storage = {
    getItem: (key: string) => bag.get(key) ?? null,
    setItem: (key: string, value: string) => {
      bag.set(key, value);
    },
    removeItem: (key: string) => {
      bag.delete(key);
    },
  };
  const g = globalThis as { localStorage?: Storage; window?: { localStorage?: Storage } };
  const prev = g.localStorage;
  g.localStorage = storage as Storage;
  if (typeof g.window === "undefined") {
    g.window = { localStorage: storage as Storage };
  } else {
    g.window.localStorage = storage as Storage;
  }
  try {
    run();
  } finally {
    if (prev === undefined) {
      delete g.localStorage;
    } else {
      g.localStorage = prev;
    }
  }
}

function draftBase(
  agentId: string,
  draftSessionId: string,
  title: string,
): Parameters<typeof saveEngineListingDraft>[0] {
  return {
    version: 2,
    agentId,
    categoryId: "property",
    draftSessionId,
    activeSection: 0,
    values: { title },
    media_urls: [],
  };
}

test("engine listing draft round-trip is scoped by agent and category", () => {
  withMockLocalStorage(() => {
    const agentA = "agent-a";
    const agentB = "agent-b";
    saveEngineListingDraft(draftBase(agentA, SESSION_A, "Draft A"));
    saveEngineListingDraft({
      ...draftBase(agentB, SESSION_A, "Draft B"),
      categoryId: "property",
    });

    const loadedA = loadEngineListingDraft(agentA, "property", SESSION_A);
    const loadedB = loadEngineListingDraft(agentB, "property", SESSION_A);
    assert.equal(loadedA?.values.title, "Draft A");
    assert.equal(loadedB?.values.title, "Draft B");

    clearEngineListingDraft(agentA, "property", SESSION_A);
    assert.equal(loadEngineListingDraft(agentA, "property", SESSION_A), null);
    assert.ok(loadEngineListingDraft(agentB, "property", SESSION_A));
    clearEngineListingDraft(agentB, "property", SESSION_A);
  });
});

test("separate draft sessions keep independent drafts for same agent", () => {
  withMockLocalStorage(() => {
    const agentId = "agent-multi-tab";
    saveEngineListingDraft(draftBase(agentId, SESSION_A, "Tab A draft"));
    saveEngineListingDraft(draftBase(agentId, SESSION_B, "Tab B draft"));

    assert.equal(
      loadEngineListingDraft(agentId, "property", SESSION_A)?.values.title,
      "Tab A draft",
    );
    assert.equal(
      loadEngineListingDraft(agentId, "property", SESSION_B)?.values.title,
      "Tab B draft",
    );
  });
});

test("legacy fallback migrates shared key draft into session-scoped storage", () => {
  withMockLocalStorage(() => {
    const agentId = "agent-legacy";
    const legacyKey = `yike_engine_listing_draft_v2:property:${agentId}`;
    globalThis.localStorage!.setItem(
      legacyKey,
      JSON.stringify({
        version: 2,
        agentId,
        categoryId: "property",
        savedAt: Date.now(),
        revision: 1,
        activeSection: 0,
        values: { title: "Legacy draft" },
        media_urls: [],
      }),
    );
    const migrated = loadEngineListingDraftWithLegacyFallback(
      agentId,
      "property",
      SESSION_A,
    );
    assert.equal(migrated?.values.title, "Legacy draft");
    assert.equal(migrated?.draftSessionId, SESSION_A);
    assert.equal(globalThis.localStorage!.getItem(legacyKey), null);
  });
});

test("review summary uses saved values not placeholder defaults", () => {
  const rows = buildListingReviewSummary(
    PROPERTY_CATEGORY_MANIFEST,
    {
      listing_type: "sale",
      property_type: "flat",
      title: "2-bed flat in Yaba",
      price: 1_200_000,
      state: "Lagos",
      city: "Yaba",
    },
    new Set([
      "listing_type",
      "property_type",
      "title",
      "price",
      "state",
      "city",
    ]),
  );
  assert.ok(rows.some((r) => r.value.includes("2-bed flat in Yaba")));
  assert.ok(rows.some((r) => r.label.includes("Price") && r.value.includes("1,200,000")));
});

test("consumed marker prevents stale draft restore after publish", () => {
  withMockLocalStorage(() => {
    const agentId = "agent-publish";
    saveEngineListingDraft({
      version: 2,
      agentId,
      categoryId: "vehicle",
      draftSessionId: SESSION_A,
      activeSection: 0,
      values: { title: "Old draft" },
      media_urls: [],
    });
    markEngineListingDraftConsumed(agentId, "vehicle", "published", SESSION_A);
    assert.equal(loadEngineListingDraft(agentId, "vehicle", SESSION_A), null);
  });
});

test("discard marks consumed and clears draft", () => {
  withMockLocalStorage(() => {
    const agentId = "agent-discard";
    saveEngineListingDraft(draftBase(agentId, SESSION_A, "Discard me"));
    discardEngineListingDraft(agentId, "property", SESSION_A);
    assert.equal(loadEngineListingDraft(agentId, "property", SESSION_A), null);
    saveEngineListingDraft(draftBase(agentId, SESSION_A, "New"));
    const loaded = loadEngineListingDraft(agentId, "property", SESSION_A);
    assert.equal(loaded?.values.title, "New");
  });
});

test("save blocks when remote revision is newer than base", () => {
  withMockLocalStorage(() => {
    const agentId = "agent-tab";
    const first = saveEngineListingDraft({
      version: 2,
      agentId,
      categoryId: "electronics",
      draftSessionId: SESSION_A,
      activeSection: 0,
      values: { title: "Tab A" },
      media_urls: [],
    });
    assert.equal(first.ok, true);
    if (!first.ok) return;
    const blocked = saveEngineListingDraft(
      {
        version: 2,
        agentId,
        categoryId: "electronics",
        draftSessionId: SESSION_A,
        activeSection: 0,
        values: { title: "Tab B stale" },
        media_urls: [],
      },
      { baseRevision: first.revision - 1 },
    );
    assert.equal(blocked.ok, false);
    if (!blocked.ok) assert.equal(blocked.reason, "blocked_by_remote");
  });
});

test("draft media registry lists orphans not in active wizard photos", () => {
  withMockLocalStorage(() => {
    const session = "media-session";
    trackDraftMediaUrl(session, "https://cdn.example/uploaded.webp");
    trackDraftMediaUrl(session, "https://cdn.example/removed.webp");
    const orphans = listOrphanDraftMediaUrls(session, ["https://cdn.example/uploaded.webp"]);
    assert.deepEqual(orphans, ["https://cdn.example/removed.webp"]);
  });
});

test("listing engine autosave uses generation guard in UI source", () => {
  const src = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/listing-engine/listing-engine.tsx"),
    "utf-8",
  );
  assert.match(src, /saveGenerationRef/);
  assert.match(src, /Saved on this device only/);
  assert.match(src, /Restored draft from this device/);
  assert.match(src, /markEngineListingDraftConsumed/);
  assert.match(src, /draftSessionIdRef/);
  assert.match(src, /trackDraftMediaUrl/);
});
