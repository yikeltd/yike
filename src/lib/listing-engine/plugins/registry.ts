/**
 * UNIVERSAL LISTING FLOW ENGINE — PLUGIN ARCHITECTURE & REGISTRATION
 * Extensible enterprise plugin system for listing types, question fields,
 * custom validators, media processors, draft storage, and analytics providers.
 */

import type { ListingCategoryConfig, QuestionFieldConfig } from "../types";

export type CustomValidatorFn = (
  value: unknown,
  formData: Record<string, unknown>,
  field: QuestionFieldConfig
) => string | Promise<string | null> | null;

export type MediaProcessorFn = (
  file: File | Blob | string,
  options?: Record<string, unknown>
) => Promise<{ url: string; mediaType: string }>;

class PluginRegistry {
  private categoryConfigs = new Map<string, ListingCategoryConfig>();
  private customValidators = new Map<string, CustomValidatorFn>();
  private mediaProcessors = new Map<string, MediaProcessorFn>();

  registerListingType(config: ListingCategoryConfig): void {
    this.categoryConfigs.set(config.id, config);
  }

  getListingType(id: string): ListingCategoryConfig | undefined {
    return this.categoryConfigs.get(id);
  }

  getAllListingTypes(): ListingCategoryConfig[] {
    return Array.from(this.categoryConfigs.values());
  }

  registerValidator(id: string, validatorFn: CustomValidatorFn): void {
    this.customValidators.set(id, validatorFn);
  }

  getValidator(id: string): CustomValidatorFn | undefined {
    return this.customValidators.get(id);
  }

  registerMediaProcessor(mediaType: string, processorFn: MediaProcessorFn): void {
    this.mediaProcessors.set(mediaType, processorFn);
  }

  getMediaProcessor(mediaType: string): MediaProcessorFn | undefined {
    return this.mediaProcessors.get(mediaType);
  }
}

export const listingEnginePlugins = new PluginRegistry();
