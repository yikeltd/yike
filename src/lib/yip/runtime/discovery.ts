/**
 * `CapabilityDiscovery` — CORE's discovery source is a list of statically
 * imported `YipPlugin` modules registered before `start()` (no filesystem
 * scanning, no dynamic `import()`, no DB-stored manifests — same
 * constraints as `plugins/*`). A future package-based discovery mechanism
 * (e.g. scanning an installed-packages manifest) can implement the same
 * `discover()` contract without the runtime or `CapabilityRuntime` changing.
 */
import type { YipPlugin } from "../plugins/types";
import { toManifest } from "./manifest";
import type { CapabilityManifest } from "./types";

export class CapabilityDiscovery {
  private readonly packages: YipPlugin[] = [];

  register(plugin: YipPlugin): void {
    this.packages.push(plugin);
  }

  registerMany(plugins: readonly YipPlugin[]): void {
    for (const plugin of plugins) this.register(plugin);
  }

  listPackages(): YipPlugin[] {
    return [...this.packages];
  }

  discover(): CapabilityManifest[] {
    return this.packages.map(toManifest);
  }

  clear(): void {
    this.packages.length = 0;
  }
}
