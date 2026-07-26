/**
 * Dependency graph resolution for plugin installation. `dependsOn` entries
 * may reference either a plugin id or a capability id another plugin
 * `provides` — resolved here so `host.ts` doesn't duplicate lookup logic.
 */
import type { YipPlugin } from "./types";

type Lookup = {
  byPluginId: Map<string, YipPlugin>;
  byCapabilityId: Map<string, YipPlugin>;
};

export type PluginGraphValidation = {
  ok: boolean;
  errors: string[];
};

function buildLookup(plugins: YipPlugin[]): Lookup {
  const byPluginId = new Map<string, YipPlugin>();
  const byCapabilityId = new Map<string, YipPlugin>();
  for (const plugin of plugins) {
    byPluginId.set(String(plugin.id), plugin);
    for (const capabilityId of plugin.provides) {
      byCapabilityId.set(capabilityId, plugin);
    }
  }
  return { byPluginId, byCapabilityId };
}

function resolveRef(ref: string, lookup: Lookup): YipPlugin | undefined {
  return lookup.byPluginId.get(ref) ?? lookup.byCapabilityId.get(ref);
}

function findCycle(plugins: YipPlugin[], lookup: Lookup): string[] | undefined {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  function visit(plugin: YipPlugin): string[] | undefined {
    const id = String(plugin.id);
    if (visited.has(id)) return undefined;
    if (visiting.has(id)) {
      const cycleStart = stack.indexOf(id);
      return [...stack.slice(cycleStart), id];
    }
    visiting.add(id);
    stack.push(id);
    for (const dep of plugin.dependsOn ?? []) {
      const depPlugin = resolveRef(dep, lookup);
      if (depPlugin) {
        const cycle = visit(depPlugin);
        if (cycle) return cycle;
      }
    }
    stack.pop();
    visiting.delete(id);
    visited.add(id);
    return undefined;
  }

  for (const plugin of plugins) {
    const cycle = visit(plugin);
    if (cycle) return cycle;
  }
  return undefined;
}

/**
 * Validates structural correctness only: unresolvable deps and cycles.
 * `conflictsWith` is a *soft* constraint — conflicting plugins may be
 * installed side by side, they just can't both be `enable()`d at once (see
 * `PluginHost.enable`). Co-installing them is not a graph error.
 */
export function validatePluginGraph(plugins: YipPlugin[]): PluginGraphValidation {
  const errors: string[] = [];
  const lookup = buildLookup(plugins);

  for (const plugin of plugins) {
    const id = String(plugin.id);
    for (const dep of plugin.dependsOn ?? []) {
      if (!resolveRef(dep, lookup)) {
        errors.push(`Plugin "${id}" depends on unknown capability/plugin "${dep}".`);
      }
    }
  }

  const cycle = findCycle(plugins, lookup);
  if (cycle) {
    errors.push(`Circular dependency detected: ${cycle.join(" -> ")}.`);
  }

  return { ok: errors.length === 0, errors };
}

/** Topological sort by `dependsOn`. Assumes the graph was already validated (cycles are skipped, not thrown). */
export function resolveInstallOrder(plugins: YipPlugin[]): YipPlugin[] {
  const lookup = buildLookup(plugins);
  const resolved: YipPlugin[] = [];
  const resolvedIds = new Set<string>();
  const visiting = new Set<string>();

  function visit(plugin: YipPlugin): void {
    const id = String(plugin.id);
    if (resolvedIds.has(id) || visiting.has(id)) return;
    visiting.add(id);
    for (const dep of plugin.dependsOn ?? []) {
      const depPlugin = resolveRef(dep, lookup);
      if (depPlugin) visit(depPlugin);
    }
    visiting.delete(id);
    resolvedIds.add(id);
    resolved.push(plugin);
  }

  for (const plugin of plugins) visit(plugin);
  return resolved;
}
