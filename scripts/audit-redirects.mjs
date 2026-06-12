#!/usr/bin/env node
/**
 * Spot-check public URLs for redirect chains (SEO diagnostics).
 * Usage: node scripts/audit-redirects.mjs [baseUrl]
 */
const BASE = (process.argv[2] ?? "https://yike.ng").replace(/\/$/, "");

const PATHS = [
  "/",
  "/sitemap.xml",
  "/robots.txt",
  "/search",
  "/rent",
  "/buy",
  "/about",
  "/pricing",
  "/post-property",
  "/auth/login",
  "/agent",
  "/lex",
];

async function follow(url, maxHops = 5) {
  const chain = [];
  let current = url;
  for (let i = 0; i < maxHops; i++) {
    const res = await fetch(current, { redirect: "manual" });
    chain.push({ url: current, status: res.status });
    if (res.status < 300 || res.status >= 400) {
      return { final: current, chain, ok: res.status >= 200 && res.status < 300 };
    }
    const loc = res.headers.get("location");
    if (!loc) break;
    current = new URL(loc, current).href;
  }
  return { final: current, chain, ok: false, error: "too_many_redirects" };
}

async function main() {
  console.log(`Redirect audit for ${BASE}\n`);
  let issues = 0;

  for (const path of PATHS) {
    const url = `${BASE}${path}`;
    try {
      const result = await follow(url);
      const hops = result.chain.length - 1;
      const flag =
        hops > 1
          ? "CHAIN"
          : !result.ok && path !== "/auth/login" && path !== "/agent" && path !== "/lex"
            ? "FAIL"
            : "OK";
      if (flag !== "OK") issues++;
      console.log(
        `${flag.padEnd(5)} ${path.padEnd(18)} → ${result.final} (${result.chain.map((c) => c.status).join(" → ")})`
      );
    } catch (e) {
      issues++;
      console.log(`ERROR ${path}: ${e.message}`);
    }
  }

  const www = await follow(`https://www.yike.ng/`);
  const wwwHops = www.chain.length - 1;
  console.log(
    `\nwww: ${wwwHops === 1 ? "OK" : "CHAIN"} (${www.chain.map((c) => c.status).join(" → ")}) → ${www.final}`
  );
  if (wwwHops > 1) issues++;

  console.log(`\n${issues} issue(s) found.`);
  process.exit(issues > 0 ? 1 : 0);
}

main();
