/**
 * Yike Transaction Workspace Engine — Universal Audit Log Framework
 * Legal compliance log independent from user-facing timeline events.
 */

import type { BaseEntity } from "./types";

export type AuditAction =
  | "entity_created"
  | "entity_updated"
  | "entity_soft_deleted"
  | "entity_restored"
  | "state_transitioned"
  | "permission_granted"
  | "permission_revoked"
  | "offer_status_changed"
  | "document_verified"
  | "escrow_status_changed"
  | "dispute_opened"
  | "dispute_resolved";

export interface AuditLogEntry extends BaseEntity {
  workspaceId: string;
  action: AuditAction;
  actorId: string;
  actorRole: string;
  entityType: string;
  entityId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  automationSource?: string;
}

class AuditLogService {
  private logs: AuditLogEntry[] = [];

  log(
    workspaceId: string,
    action: AuditAction,
    actorId: string,
    actorRole: string,
    entityType: string,
    entityId: string,
    oldValue?: Record<string, unknown>,
    newValue?: Record<string, unknown>,
    reason?: string,
    automationSource?: string
  ): AuditLogEntry {
    const now = new Date().toISOString();
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      workspaceId,
      action,
      actorId,
      actorRole,
      entityType,
      entityId,
      oldValue,
      newValue,
      reason,
      automationSource,
      createdBy: actorId,
      createdAt: now,
      updatedAt: now,
      version: 1,
      status: "active",
    };

    this.logs.push(entry);
    return entry;
  }

  getLogs(workspaceId: string): AuditLogEntry[] {
    return this.logs.filter((l) => l.workspaceId === workspaceId && l.status === "active");
  }
}

export const auditLogService = new AuditLogService();
