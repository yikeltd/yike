/**
 * Generates src/constants/nigeriaLgas.ts — all 774 Nigerian LGAs by state.
 * Run: node scripts/generate-nigeria-lgas.mjs
 */
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../src/constants/nigeriaLgas.ts");

const URL =
  "https://raw.githubusercontent.com/xosasx/nigerian-local-government-areas/master/lgas.json";

const STATE_ALIASES = {
  "Federal Capital Territory": "FCT",
  "Abuja Federal Capital Territory": "FCT",
};

async function main() {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length < 700) {
    throw new Error(`Expected ~774 LGAs, got ${rows?.length ?? 0}`);
  }

  const byState = {};
  for (const row of rows) {
    const state = STATE_ALIASES[row.state_name] ?? row.state_name;
    if (!byState[state]) byState[state] = new Set();
    byState[state].add(row.name);
  }

  const sorted = Object.fromEntries(
    Object.entries(byState)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => [k, [...v].sort((a, b) => a.localeCompare(b))])
  );

  const total = Object.values(sorted).reduce((n, arr) => n + arr.length, 0);
  console.log(`Generated ${Object.keys(sorted).length} states, ${total} LGAs`);

  const ts = `/** Auto-generated — run: node scripts/generate-nigeria-lgas.mjs */
export const NIGERIA_LGAS_BY_STATE: Record<string, readonly string[]> = ${JSON.stringify(sorted, null, 2)} as const;

export function getLgasForState(state: string): string[] {
  return [...(NIGERIA_LGAS_BY_STATE[state] ?? [])];
}

export function getAllLgas(): string[] {
  return Object.values(NIGERIA_LGAS_BY_STATE).flat();
}
`;

  writeFileSync(OUT, ts);
  console.log(`Wrote ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
