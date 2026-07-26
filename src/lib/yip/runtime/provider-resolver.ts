/**
 * `ProviderResolver` — tracks the active provider for a capability or
 * plugin id, backed by `plugin.providers` / `plugin.activeProviderId`. CORE
 * ships no multi-provider capability today (see YIP_PLUGIN_ARCHITECTURE.md);
 * this exists so the first real A/B or vendor-swap capability doesn't need
 * another runtime concept invented for it.
 */
import type { PluginProviderOption } from "../plugins/types";
import { ProviderNotFoundError } from "./errors";
import type { ProviderDiagnostics } from "./types";

type ProviderState = {
  options: PluginProviderOption[];
  activeId?: string;
};

export class ProviderResolver {
  private readonly state = new Map<string, ProviderState>();

  /** Registers the candidate providers for a capability/plugin id. Seeds the active id from the option marked `default: true`, if any. */
  registerProviders(capabilityOrPluginId: string, options: readonly PluginProviderOption[]): void {
    const existing = this.state.get(capabilityOrPluginId);
    const activeId = existing?.activeId ?? options.find((option) => option.default)?.id;
    this.state.set(capabilityOrPluginId, { options: [...options], activeId });
  }

  setActive(capabilityOrPluginId: string, providerId: string): void {
    const entry = this.state.get(capabilityOrPluginId) ?? { options: [] };
    if (entry.options.length > 0 && !entry.options.some((option) => option.id === providerId)) {
      throw new ProviderNotFoundError(capabilityOrPluginId, providerId);
    }
    this.state.set(capabilityOrPluginId, { ...entry, activeId: providerId });
  }

  getActive(capabilityOrPluginId: string): string | undefined {
    return this.state.get(capabilityOrPluginId)?.activeId;
  }

  listProviders(capabilityOrPluginId: string): PluginProviderOption[] {
    return [...(this.state.get(capabilityOrPluginId)?.options ?? [])];
  }

  listAll(): Record<string, ProviderDiagnostics> {
    const out: Record<string, ProviderDiagnostics> = {};
    for (const [id, entry] of this.state) {
      out[id] = { active: entry.activeId, options: [...entry.options] };
    }
    return out;
  }

  clear(): void {
    this.state.clear();
  }
}
