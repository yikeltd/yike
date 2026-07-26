/**
 * Configuration validator — catches broken category metadata in
 * development / CI, before a seller ever sees it. See docs/architecture/
 * METADATA_LISTING_ENGINE.md "Testing (config must fail in development)".
 */
import type { CategoryManifest, ListingFieldDef, VisibilityRule } from "./types";
import { CATALOG_REGISTRY } from "./catalogs/registry";
import { NAMED_VALIDATION_RULES, NAMED_VISIBILITY_RULES } from "./rules/registry";

function collectVisibilityRuleIds(rule: VisibilityRule | undefined, out: string[]): void {
  if (!rule) return;
  if (rule.op === "rule") out.push(rule.id);
  if (rule.op === "and" || rule.op === "or") {
    for (const inner of rule.rules) collectVisibilityRuleIds(inner, out);
  }
  if (rule.op === "not") collectVisibilityRuleIds(rule.rule, out);
}

function fieldVisibilityRuleIds(field: ListingFieldDef): string[] {
  const out: string[] = [];
  collectVisibilityRuleIds(field.visible, out);
  return out;
}

function fieldValidationRuleIds(field: ListingFieldDef): string[] {
  const out: string[] = [];
  for (const rule of field.validation ?? []) {
    if (rule.type === "rule") out.push(rule.id);
    if (rule.type === "when") {
      collectVisibilityRuleIds(rule.visible, out);
      for (const inner of rule.rules) {
        if (inner.type === "rule") out.push(inner.id);
      }
    }
  }
  return out;
}

export function validateCategoryManifest(
  manifest: CategoryManifest,
  opts: { throwOnError?: boolean } = {}
): string[] {
  const errors: string[] = [];
  const fieldIds = new Set<string>();

  for (const field of manifest.fields) {
    if (fieldIds.has(field.id)) {
      errors.push(`Duplicate field id "${field.id}"`);
    }
    fieldIds.add(field.id);
  }

  const stepIds = new Set<string>();
  for (const step of manifest.steps) {
    if (stepIds.has(step.id)) {
      errors.push(`Duplicate step id "${step.id}"`);
    }
    stepIds.add(step.id);

    const referencedIds = step.fieldIds ?? step.sections?.flatMap((s) => s.fieldIds) ?? [];
    for (const id of referencedIds) {
      if (!fieldIds.has(id)) {
        errors.push(`Step "${step.id}" references missing field id "${id}"`);
      }
    }
  }

  for (const field of manifest.fields) {
    if (field.dependsOn) {
      for (const watchedId of field.dependsOn.watch) {
        if (!fieldIds.has(watchedId)) {
          errors.push(`Field "${field.id}" depends on missing field id "${watchedId}"`);
        }
      }
      if (!CATALOG_REGISTRY[field.dependsOn.optionsFrom]) {
        errors.push(
          `Field "${field.id}" references unknown catalog "${field.dependsOn.optionsFrom}"`
        );
      }
    }

    if (field.suggestion?.type === "catalog" && !CATALOG_REGISTRY[field.suggestion.id]) {
      errors.push(`Field "${field.id}" references unknown suggestion catalog "${field.suggestion.id}"`);
    }

    for (const ruleId of fieldVisibilityRuleIds(field)) {
      if (!NAMED_VISIBILITY_RULES[ruleId]) {
        errors.push(`Field "${field.id}" references unknown visibility rule id "${ruleId}"`);
      }
    }

    for (const ruleId of fieldValidationRuleIds(field)) {
      if (!NAMED_VALIDATION_RULES[ruleId]) {
        errors.push(`Field "${field.id}" references unknown validation rule id "${ruleId}"`);
      }
    }

    if (field.required && field.submitKey === "") {
      errors.push(`Field "${field.id}" has an empty submitKey`);
    }
  }

  // Circular dependency detection over the watch graph (watched field -> dependent field).
  const graph = new Map<string, string[]>();
  for (const field of manifest.fields) {
    for (const watchedId of field.dependsOn?.watch ?? []) {
      graph.set(watchedId, [...(graph.get(watchedId) ?? []), field.id]);
    }
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cyclePath: string[] = [];

  function hasCycle(node: string): boolean {
    if (visiting.has(node)) {
      cyclePath.push(node);
      return true;
    }
    if (visited.has(node)) return false;
    visiting.add(node);
    cyclePath.push(node);
    for (const next of graph.get(node) ?? []) {
      if (hasCycle(next)) return true;
    }
    visiting.delete(node);
    visited.add(node);
    cyclePath.pop();
    return false;
  }

  for (const field of manifest.fields) {
    if (visited.has(field.id)) continue;
    cyclePath.length = 0;
    if (hasCycle(field.id)) {
      errors.push(`Circular dependency detected: ${cyclePath.join(" -> ")}`);
      break;
    }
  }

  if (manifest.photo.min > manifest.photo.max) {
    errors.push(`Photo rules invalid: min (${manifest.photo.min}) > max (${manifest.photo.max})`);
  }

  if (opts.throwOnError !== false && errors.length > 0) {
    throw new Error(
      `listing-engine: invalid category manifest "${manifest.id}":\n- ${errors.join("\n- ")}`
    );
  }

  return errors;
}
