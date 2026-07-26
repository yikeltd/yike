/**
 * Yike Intelligence Platform (YIP) — error types.
 */
import type { YipErrorInfo } from "./types";

export class YipError extends Error implements YipErrorInfo {
  code: string;
  details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "YipError";
    this.code = code;
    this.details = details;
  }

  toInfo(): YipErrorInfo {
    return { code: this.code, message: this.message, details: this.details };
  }
}

export class CapabilityNotFoundError extends YipError {
  constructor(id: string) {
    super("capability_not_found", `Capability "${id}" is not registered.`, { id });
    this.name = "CapabilityNotFoundError";
  }
}

export class CapabilityDisabledError extends YipError {
  constructor(id: string) {
    super("capability_disabled", `Capability "${id}" is registered but disabled.`, { id });
    this.name = "CapabilityDisabledError";
  }
}

export class CapabilityAlreadyRegisteredError extends YipError {
  constructor(id: string) {
    super("capability_already_registered", `Capability "${id}" is already registered.`, { id });
    this.name = "CapabilityAlreadyRegisteredError";
  }
}

/** Thrown by learning/* stub methods — the learning layer is reserved, not implemented. */
export class NotImplementedError extends YipError {
  constructor(feature: string) {
    super("not_implemented", `${feature} is not implemented in YIP CORE (reserved for a future ML/learning phase).`, {
      feature,
    });
    this.name = "NotImplementedError";
  }
}
