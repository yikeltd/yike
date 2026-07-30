/**
 * Yike Business Transaction Operating System (BTOS) — Shared Platform Kernel
 * Cross-cutting building blocks used across all 13 business domains.
 */

export interface OwnershipMetadata {
  createdBy: string;
  updatedBy?: string;
  deletedBy?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  version: number;
  status: "active" | "archived" | "deleted";
}

export interface EntityBase extends OwnershipMetadata {
  id: string;
}

export interface AggregateRoot extends EntityBase {
  workspaceId: string;
}

export interface DomainEventBase {
  id: string;
  workspaceId: string;
  actorId: string;
  eventType: string;
  timestamp: string;
  version: number;
  correlationId: string;
  payload: Record<string, unknown>;
}

export type Result<T> =
  | { isSuccess: true; isFailure: false; value: T }
  | { isSuccess: false; isFailure: true; error: string; errorCode?: string };

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PlatformClock {
  now(): Date;
  isoString(): string;
  timestamp(): number;
}

export interface IdGenerator {
  generate(prefix?: string): string;
}
