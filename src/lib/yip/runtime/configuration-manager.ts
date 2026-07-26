/**
 * `ConfigurationManager` — typed-ish per-plugin config: defaults declared by
 * the capability (or none) merged with overrides an operator sets at
 * runtime. Validation is intentionally simple (required-key presence
 * against `CapabilityConfigSchema`) — this is not a JSON-schema engine, it's
 * enough to catch "you forgot to configure X" before a plugin starts
 * throwing at call time.
 */
import { ConfigurationError } from "./errors";
import type { CapabilityConfigSchema } from "./types";

export class ConfigurationManager {
  private readonly defaults = new Map<string, Record<string, unknown>>();
  private readonly overrides = new Map<string, Record<string, unknown>>();
  private readonly schemas = new Map<string, CapabilityConfigSchema>();

  setDefaults(pluginId: string, defaults: Record<string, unknown>): void {
    this.defaults.set(pluginId, { ...defaults });
  }

  setSchema(pluginId: string, schema: CapabilityConfigSchema | undefined): void {
    if (!schema) {
      this.schemas.delete(pluginId);
      return;
    }
    this.schemas.set(pluginId, schema);
  }

  /** Merges `config` on top of any existing overrides, then validates against the schema (if one is set). */
  set(pluginId: string, config: Record<string, unknown>): void {
    const merged = { ...(this.overrides.get(pluginId) ?? {}), ...config };
    this.overrides.set(pluginId, merged);
    this.validate(pluginId);
  }

  get<T extends Record<string, unknown> = Record<string, unknown>>(pluginId: string): T {
    return {
      ...(this.defaults.get(pluginId) ?? {}),
      ...(this.overrides.get(pluginId) ?? {}),
    } as T;
  }

  /** Throws `ConfigurationError` if a required key (per the registered schema) is missing from the merged config. */
  validate(pluginId: string): void {
    const schema = this.schemas.get(pluginId);
    if (!schema?.required?.length) return;
    const merged = this.get(pluginId);
    const missing = schema.required.filter((key) => merged[key] === undefined);
    if (missing.length > 0) {
      throw new ConfigurationError(pluginId, `missing required key(s): ${missing.join(", ")}`);
    }
  }

  clear(pluginId?: string): void {
    if (pluginId) {
      this.defaults.delete(pluginId);
      this.overrides.delete(pluginId);
      this.schemas.delete(pluginId);
      return;
    }
    this.defaults.clear();
    this.overrides.clear();
    this.schemas.clear();
  }
}
