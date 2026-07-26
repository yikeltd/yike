/**
 * In-process capability registry.
 *
 * Applications consume capabilities via `registry.get(id)` — never by
 * importing a provider module directly. This keeps every capability
 * swappable (stub today, real provider tomorrow) without call-site churn.
 */
import { CapabilityAlreadyRegisteredError, CapabilityDisabledError, CapabilityNotFoundError } from "../shared/errors";
import type { CapabilityId } from "../shared/types";
import { toCapabilityId } from "../shared/types";
import type { CapabilityDescriptor, ICapabilityRegistry, RegisteredCapability } from "./types";

type Entry<T = unknown> = {
  descriptor: CapabilityDescriptor<T>;
  instance?: T;
};

export class CapabilityRegistry implements ICapabilityRegistry {
  private readonly entries = new Map<CapabilityId, Entry>();

  register<T>(descriptor: CapabilityDescriptor<T>): void {
    const id = toCapabilityId(descriptor.id);
    if (this.entries.has(id)) {
      throw new CapabilityAlreadyRegisteredError(id);
    }
    this.entries.set(id, { descriptor: descriptor as CapabilityDescriptor });
  }

  /** Registers, overwriting any existing entry with the same id. Useful for tests. */
  registerOrReplace<T>(descriptor: CapabilityDescriptor<T>): void {
    const id = toCapabilityId(descriptor.id);
    this.entries.set(id, { descriptor: descriptor as CapabilityDescriptor });
  }

  get<T>(id: CapabilityId | string): T {
    const entry = this.entries.get(toCapabilityId(id));
    if (!entry) throw new CapabilityNotFoundError(String(id));
    if (!entry.descriptor.enabled) throw new CapabilityDisabledError(String(id));
    if (entry.instance === undefined) {
      entry.instance = entry.descriptor.factory();
    }
    return entry.instance as T;
  }

  tryGet<T>(id: CapabilityId | string): T | undefined {
    const entry = this.entries.get(toCapabilityId(id));
    if (!entry || !entry.descriptor.enabled) return undefined;
    if (entry.instance === undefined) {
      entry.instance = entry.descriptor.factory();
    }
    return entry.instance as T;
  }

  isEnabled(id: CapabilityId | string): boolean {
    return this.entries.get(toCapabilityId(id))?.descriptor.enabled ?? false;
  }

  /** Flips a descriptor's enabled flag. Disabling also drops the memoized instance so a later re-enable rebuilds it. */
  setEnabled(id: CapabilityId | string, enabled: boolean): void {
    const entry = this.entries.get(toCapabilityId(id));
    if (!entry) throw new CapabilityNotFoundError(String(id));
    entry.descriptor.enabled = enabled;
    if (!enabled) entry.instance = undefined;
  }

  has(id: CapabilityId | string): boolean {
    return this.entries.has(toCapabilityId(id));
  }

  list(): RegisteredCapability[] {
    return Array.from(this.entries.values()).map(({ descriptor }) => ({
      id: descriptor.id,
      version: descriptor.version,
      enabled: descriptor.enabled,
      description: descriptor.description,
    }));
  }

  /** Test/dev helper — clears every registration. */
  clear(): void {
    this.entries.clear();
  }
}
