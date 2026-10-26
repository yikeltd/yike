import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("service worker does not serve marketplace offline shell for auth navigations", () => {
  const sw = fs.readFileSync(
    path.resolve(process.cwd(), "public/sw.js"),
    "utf-8",
  );
  assert.match(sw, /requiresLiveNetwork/);
  assert.match(sw, /"\/auth\/"/);
  assert.match(sw, /"\/payments\/"/);
  assert.match(sw, /if \(requiresLiveNetwork\(url\.pathname\)\)/);
});

test("PWA register skips service worker in development", () => {
  const src = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/pwa/register.tsx"),
    "utf-8",
  );
  assert.match(src, /NODE_ENV === "development"/);
  assert.match(src, /clearServiceWorkers/);
});

test("root layout unregisters service workers on localhost in development", () => {
  const layout = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/layout.tsx"),
    "utf-8",
  );
  const inline = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/app-mode-inline.ts"),
    "utf-8",
  );
  assert.match(layout, /devSwCleanupScript/);
  assert.match(inline, /devSwCleanupScript/);
});
