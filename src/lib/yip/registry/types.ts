/**
 * Capability registry types.
 *
 * A "capability" is any unit of marketplace intelligence (knowledge lookup,
 * pricing hint, trust score, etc). Applications never import providers
 * directly — they ask the registry for a capability by id.
 */
import type { CapabilityId } from "../shared/types";

export type CapabilityDescriptor<T = unknown> = {
  id: CapabilityId;
  /** Semver-ish string; bump when the provider's shape/behavior changes meaningfully. */
  version: string;
  enabled: boolean;
  description: string;
  /** Lazily constructs the provider instance. Called at most once per registry (memoized). */
  factory: () => T;
};

export type RegisteredCapability = {
  id: CapabilityId;
  version: string;
  enabled: boolean;
  description: string;
};

export interface ICapabilityRegistry {
  register<T>(descriptor: CapabilityDescriptor<T>): void;
  get<T>(id: CapabilityId | string): T;
  tryGet<T>(id: CapabilityId | string): T | undefined;
  isEnabled(id: CapabilityId | string): boolean;
  list(): RegisteredCapability[];
  has(id: CapabilityId | string): boolean;
  setEnabled(id: CapabilityId | string, enabled: boolean): void;
}
