import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  dispatchGuestFavoritesMerged,
  dispatchListingSavedChanged,
  YIKE_GUEST_FAVORITES_MERGED,
  YIKE_LISTING_SAVED_CHANGED,
} from "@/lib/listings/listing-save-events";

const root = process.cwd();

test("guest favorite sync dispatches merged ids for AuthProvider", () => {
  const src = readFileSync(
    join(root, "src/components/retention/guest-favorite-sync.tsx"),
    "utf8",
  );
  assert.match(src, /dispatchGuestFavoritesMerged/);
  assert.match(src, /ignoreDuplicates: true/);
});

test("AuthProvider listens for guest merge and listing saved events", () => {
  const src = readFileSync(
    join(root, "src/components/auth/auth-provider.tsx"),
    "utf8",
  );
  assert.match(src, /YIKE_GUEST_FAVORITES_MERGED/);
  assert.match(src, /YIKE_LISTING_SAVED_CHANGED/);
  assert.match(src, /setListingSaved/);
});

test("ListingSaveButton uses optimistic rollback and in-flight guard", () => {
  const src = readFileSync(
    join(root, "src/components/marketplace/listing-save-button.tsx"),
    "utf8",
  );
  assert.match(src, /mutationInFlightRef/);
  assert.match(src, /setListingSaved\(listingId, optimisticSaved\)/);
  assert.match(src, /setListingSaved\(listingId, previousSaved\)/);
});

test("swipe surfaces delegate authenticated saves to toggleAuthenticatedListingSave", () => {
  for (const rel of [
    "src/components/browse/browse-slide.tsx",
    "src/components/discover/discover-experience.tsx",
  ]) {
    const src = readFileSync(join(root, rel), "utf8");
    assert.match(
      src,
      /toggleAuthenticatedListingSave/,
      `${rel} must use shared authenticated toggle`,
    );
    assert.doesNotMatch(
      src,
      /\.from\("favorites"\)\.upsert/,
      `${rel} must not duplicate favorites upsert`,
    );
  }
});

test("executeAuthIntent notifies shared saved state after save intent", () => {
  const src = readFileSync(
    join(root, "src/lib/execute-auth-intent.ts"),
    "utf8",
  );
  assert.match(src, /dispatchListingSavedChanged/);
});

test("toggleAuthenticatedListingSave treats duplicate insert as success", () => {
  const src = readFileSync(
    join(root, "src/lib/listings/toggle-listing-save.ts"),
    "utf8",
  );
  assert.match(src, /23505/);
});

test("listing save events dispatch in browser only (mocked)", () => {
  const events: string[] = [];
  const handler = (e: Event) => {
    events.push(e.type);
  };
  // Node has no window — helpers must no-op without throwing
  assert.doesNotThrow(() => dispatchGuestFavoritesMerged(["a"]));
  assert.doesNotThrow(() => dispatchListingSavedChanged("a", true));

  if (typeof window !== "undefined") {
    window.addEventListener(YIKE_GUEST_FAVORITES_MERGED, handler);
    window.addEventListener(YIKE_LISTING_SAVED_CHANGED, handler);
    dispatchGuestFavoritesMerged(["id-1"]);
    dispatchListingSavedChanged("id-2", true);
    assert.ok(events.includes(YIKE_GUEST_FAVORITES_MERGED));
    assert.ok(events.includes(YIKE_LISTING_SAVED_CHANGED));
    window.removeEventListener(YIKE_GUEST_FAVORITES_MERGED, handler);
    window.removeEventListener(YIKE_LISTING_SAVED_CHANGED, handler);
  }
});

test("listing-like-button remains separate social like API (not favorites)", () => {
  const src = readFileSync(
    join(root, "src/components/social/listing-like-button.tsx"),
    "utf8",
  );
  assert.match(src, /\/api\/social\/listing-like/);
  assert.doesNotMatch(src, /ListingSaveButton/);
  assert.doesNotMatch(src, /favorites/);
});
