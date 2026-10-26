import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { readdirSync } from "node:fs";
import {
  classifyRoutePath,
  routeTreeHasConsumerShell,
} from "@/lib/navigation/route-shell-policy";
import { CONSUMER_ROUTES, consumerRoute } from "@/lib/navigation/consumer-routes";

const APP = join(process.cwd(), "src/app");

function listPageRoutes(): string[] {
  const files: string[] = [];
  function walk(dir: string, prefix: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith("(") && entry.name.endsWith(")")) {
          walk(full, prefix);
        } else {
          walk(full, prefix ? `${prefix}/${entry.name}` : entry.name);
        }
        continue;
      }
      if (entry.name === "page.tsx") {
        files.push(prefix || "/");
      }
    }
  }
  walk(APP, "");
  return files.sort();
}

test("canonical consumer routes classify as marketplace shell", () => {
  for (const key of Object.keys(CONSUMER_ROUTES) as (keyof typeof CONSUMER_ROUTES)[]) {
    const kind = classifyRoutePath(consumerRoute(key));
    assert.ok(
      kind === "consumer" || kind === "agent",
      `${String(key)} → ${consumerRoute(key)} expected consumer/agent shell, got ${kind}`,
    );
  }
});

test("payment callbacks classify as minimal chrome", () => {
  assert.equal(classifyRoutePath("/payments/callback"), "minimal");
  assert.equal(classifyRoutePath("/auth/login"), "minimal");
});

test("consumer shell mounts for conversations, trust, wallet, and payment history", () => {
  assert.equal(routeTreeHasConsumerShell("conversations"), true);
  assert.equal(routeTreeHasConsumerShell("trust"), true);
  assert.equal(routeTreeHasConsumerShell("account/coins"), true);
  assert.equal(routeTreeHasConsumerShell("payments/history"), true);
});

test("authenticated bottom nav exposes Messages tab", () => {
  const nav = readFileSync(
    join(process.cwd(), "src/components/layout/primary-bottom-nav.tsx"),
    "utf8",
  );
  assert.match(nav, /consumerRoute\("messages"\)/);
  assert.match(nav, /MessageSquare/);
});

test("conversations layout uses shared marketplace shell", () => {
  const layout = readFileSync(join(APP, "conversations/layout.tsx"), "utf8");
  assert.match(layout, /ConsumerMarketplaceShell/);
});

test("conversation thread subpage back links to inbox via ConsumerSubpageHeader", () => {
  const thread = readFileSync(
    join(APP, "conversations/[id]/marketplace-thread.tsx"),
    "utf8",
  );
  assert.match(thread, /ConsumerSubpageHeader/);
  assert.match(thread, /consumerRoute\("messages"\)/);
  assert.match(thread, /Back to inbox/);
  assert.doesNotMatch(thread, /router\.push\("\/conversations"\)/);
});

test("seller route tree mounts consumer marketplace shell", () => {
  assert.equal(routeTreeHasConsumerShell("seller"), true);
  assert.equal(routeTreeHasConsumerShell("seller/crm"), true);
});

test("route inventory discovers app pages", () => {
  const routes = listPageRoutes();
  assert.ok(routes.length >= 200);
  assert.ok(routes.some((r) => r === "conversations" || r.endsWith("/conversations")));
});
