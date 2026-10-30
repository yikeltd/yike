import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  CONSUMER_ROUTES,
  consumerRoute,
  SAVED_EMPTY_BROWSE_HREF,
} from "@/lib/navigation/consumer-routes";
import { staticPathRedirect } from "@/lib/route-redirects";
import { resolveBrowseBackTarget } from "@/lib/marketplace/browse-navigation";
import { resolveProfilePath } from "@/lib/account/account-home";

const REPO_ROOT = join(import.meta.dirname, "../../..");

test("consumerRoute returns stable marketplace paths", () => {
  assert.equal(consumerRoute("home"), "/");
  assert.equal(consumerRoute("discover"), "/discover");
  assert.equal(consumerRoute("search"), "/search");
  assert.equal(consumerRoute("saved"), "/saved");
  assert.equal(consumerRoute("messages"), "/conversations");
  assert.equal(consumerRoute("profile"), "/agent");
});

test("profile nav path is not saved listings", () => {
  assert.equal(CONSUMER_ROUTES.profile, "/agent");
  assert.notEqual(CONSUMER_ROUTES.profile, CONSUMER_ROUTES.saved);
  assert.equal(resolveProfilePath({ role: "user" }), CONSUMER_ROUTES.profile);
});

test("resolveBrowseBackTarget falls back to home on direct listing open", () => {
  assert.equal(resolveBrowseBackTarget(null, CONSUMER_ROUTES.home), "/");
  assert.equal(resolveBrowseBackTarget(undefined, "/search"), "/search");
});

test("saved empty browse CTA uses search not legacy browse alias", () => {
  assert.equal(SAVED_EMPTY_BROWSE_HREF, CONSUMER_ROUTES.search);
  assert.notEqual(SAVED_EMPTY_BROWSE_HREF, "/browse");
  assert.notEqual(SAVED_EMPTY_BROWSE_HREF, "/discover");
  assert.equal(staticPathRedirect("/browse"), "/discover");
});

test("canonical consumer routes map to existing app pages", () => {
  const app = join(REPO_ROOT, "src/app");
  assert.ok(existsSync(join(app, "(public)/discover/page.tsx")));
  assert.ok(existsSync(join(app, "(public)/search/page.tsx")));
  assert.ok(existsSync(join(app, "(public)/saved/page.tsx")));
  assert.ok(existsSync(join(app, "conversations/page.tsx")));
  assert.ok(existsSync(join(app, "agent/page.tsx")));
  assert.ok(existsSync(join(app, "(public)/account/coins/page.tsx")));
});

test("consumer wallet route is platform-wide not agent-only", () => {
  assert.equal(consumerRoute("wallet"), "/account/coins");
});
