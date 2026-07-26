/**
 * `toManifest` derives a `CapabilityManifest` from an existing `YipPlugin` —
 * the runtime never asks plugin authors to write a second, parallel
 * manifest file. `assertValidManifest` re-validates the derived shape so a
 * manifest built by hand (not via `toManifest`) still gets the same
 * guarantees before the runtime trusts it.
 */
import type { YipPlugin } from "../plugins/types";
import { InvalidManifestError } from "./errors";
import type { CapabilityManifest } from "./types";

export function toManifest(plugin: YipPlugin): CapabilityManifest {
  return {
    id: String(plugin.id),
    version: plugin.version,
    name: plugin.name,
    description: plugin.description,
    category: plugin.capabilityType,
    provides: [...plugin.provides],
    dependsOn: [...(plugin.dependsOn ?? [])],
    conflictsWith: plugin.conflictsWith ? [...plugin.conflictsWith] : undefined,
    // YipPlugin only tracks events a plugin may *consume* (`supportedEvents`);
    // publishing isn't declared today, so this starts empty until plugins
    // opt in to declaring it.
    eventsPublished: [],
    eventsConsumed: [...(plugin.supportedEvents ?? [])],
    permissions: [...(plugin.permissions ?? [])],
    supportedProviders: plugin.providers ? [...plugin.providers] : undefined,
    enabledByDefault: plugin.enabledByDefault,
  };
}

export function assertValidManifest(manifest: CapabilityManifest): void {
  if (!manifest.id || typeof manifest.id !== "string") {
    throw new InvalidManifestError("Manifest must have a non-empty string id.");
  }
  if (!manifest.name) {
    throw new InvalidManifestError(`Manifest "${manifest.id}" must have a name.`, { id: manifest.id });
  }
  if (!manifest.version) {
    throw new InvalidManifestError(`Manifest "${manifest.id}" must have a version.`, { id: manifest.id });
  }
  if (!manifest.category) {
    throw new InvalidManifestError(`Manifest "${manifest.id}" must have a category.`, { id: manifest.id });
  }
  if (!Array.isArray(manifest.provides) || manifest.provides.length === 0) {
    throw new InvalidManifestError(`Manifest "${manifest.id}" must provide at least one capability id.`, {
      id: manifest.id,
    });
  }
  if (!Array.isArray(manifest.dependsOn)) {
    throw new InvalidManifestError(`Manifest "${manifest.id}" must declare dependsOn (may be empty array).`, {
      id: manifest.id,
    });
  }
  if (manifest.configSchema?.required?.length) {
    const declared = new Set(Object.keys(manifest.configSchema.properties ?? {}));
    const undeclared = manifest.configSchema.required.filter((key) => !declared.has(key));
    if (undeclared.length > 0) {
      throw new InvalidManifestError(
        `Manifest "${manifest.id}" marks required config keys with no matching property definition: ${undeclared.join(", ")}.`,
        { id: manifest.id, undeclared },
      );
    }
  }
}
