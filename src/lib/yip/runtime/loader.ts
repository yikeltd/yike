/**
 * `CapabilityLoader` — validates a set of packages and resolves their
 * install order. Reuses `validatePluginGraph`/`resolveInstallOrder` from
 * `plugins/dependency.ts` instead of re-implementing graph resolution —
 * runtime dependency semantics (deps hard/conflicts soft) must stay
 * identical to what `PluginHost` already enforces at `enable()` time.
 */
import { resolveInstallOrder, validatePluginGraph } from "../plugins/dependency";
import type { YipPlugin } from "../plugins/types";
import { InvalidManifestError } from "./errors";
import { assertValidManifest, toManifest } from "./manifest";
import type { CapabilityManifest } from "./types";

export class CapabilityLoader {
  /** Validates every manifest's own shape, then the plugin dependency graph. Throws on the first problem found. */
  validateManifests(plugins: readonly YipPlugin[]): CapabilityManifest[] {
    const manifests = plugins.map(toManifest);
    for (const manifest of manifests) assertValidManifest(manifest);

    const graph = validatePluginGraph([...plugins]);
    if (!graph.ok) {
      throw new InvalidManifestError(`Capability dependency graph is invalid: ${graph.errors.join(" ")}`, {
        errors: graph.errors,
      });
    }
    return manifests;
  }

  /** Topologically sorted install order — dependencies before dependents. */
  resolveOrder(plugins: readonly YipPlugin[]): YipPlugin[] {
    return resolveInstallOrder([...plugins]);
  }
}
