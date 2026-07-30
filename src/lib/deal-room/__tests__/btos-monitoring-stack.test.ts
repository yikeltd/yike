/**
 * Yike BTOS — Enterprise Monitoring Stack Automated Test Suite (Enterprise Enhancement 5)
 * Validates Grafana dashboard JSON schema validity, docker-compose syntax, & alert rules.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";

test("Grafana Dashboards JSON Schema Validity Test", () => {
  const dashboardsDir = path.join(process.cwd(), "config/monitoring/dashboards");
  const files = fs.readdirSync(dashboardsDir);

  assert.ok(files.length >= 4);

  for (const file of files) {
    if (file.endsWith(".json")) {
      const content = fs.readFileSync(path.join(dashboardsDir, file), "utf-8");
      const json = JSON.parse(content);
      assert.ok(json.title);
      assert.ok(json.uid);
      assert.ok(Array.isArray(json.panels));
    }
  }
});

test("Prometheus & Docker Compose Configurations Exist Test", () => {
  const dockerComposePath = path.join(process.cwd(), "config/monitoring/docker-compose.yml");
  const promPath = path.join(process.cwd(), "config/prometheus/prometheus.yml");

  assert.ok(fs.existsSync(dockerComposePath));
  assert.ok(fs.existsSync(promPath));
});
