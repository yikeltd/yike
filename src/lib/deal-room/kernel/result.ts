/**
 * Yike BTOS Platform Kernel — Utilities & Helper Functions
 * Standardized Result<T> containers, PlatformClock, & IdGenerator implementations.
 */

import type { IdGenerator, PlatformClock, Result } from "./types";

export class ResultContainer {
  static ok<T>(value: T): Result<T> {
    return { isSuccess: true, isFailure: false, value };
  }

  static fail<T>(error: string, errorCode?: string): Result<T> {
    return { isSuccess: false, isFailure: true, error, errorCode };
  }
}

export class DefaultPlatformClock implements PlatformClock {
  now(): Date {
    return new Date();
  }

  isoString(): string {
    return new Date().toISOString();
  }

  timestamp(): number {
    return Date.now();
  }
}

export class DefaultIdGenerator implements IdGenerator {
  generate(prefix = "entity"): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
}

export const platformClock = new DefaultPlatformClock();
export const idGenerator = new DefaultIdGenerator();
