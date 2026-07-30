/**
 * Yike BTOS — Security & RBAC Authorization Engine (Milestone 6)
 * Role-Based Access Control enforcing fine-grained security policies across all 12 domains.
 */

import type { ParticipantRole } from "../types";

export type BTOSAction =
  | "workspace:read"
  | "workspace:write"
  | "settlement:authorize"
  | "settlement:release"
  | "evidence:upload"
  | "evidence:verify"
  | "execution:submit_report"
  | "workflow:approve"
  | "lifecycle:dispute_freeze"
  | "lifecycle:resolve_dispute";

const ROLE_PERMISSIONS: Record<ParticipantRole, Set<BTOSAction>> = {
  buyer: new Set([
    "workspace:read",
    "workspace:write",
    "settlement:authorize",
    "evidence:upload",
    "workflow:approve",
  ]),
  seller: new Set([
    "workspace:read",
    "workspace:write",
    "settlement:authorize",
    "evidence:upload",
    "workflow:approve",
  ]),
  agent: new Set([
    "workspace:read",
    "workspace:write",
    "evidence:upload",
    "workflow:approve",
  ]),
  agency_manager: new Set([
    "workspace:read",
    "workspace:write",
    "evidence:upload",
    "workflow:approve",
  ]),
  enterprise_staff: new Set([
    "workspace:read",
    "workspace:write",
    "evidence:upload",
    "evidence:verify",
    "workflow:approve",
  ]),
  inspector: new Set([
    "workspace:read",
    "execution:submit_report",
    "evidence:upload",
  ]),
  administrator: new Set([
    "workspace:read",
    "workspace:write",
    "settlement:authorize",
    "settlement:release",
    "evidence:upload",
    "evidence:verify",
    "execution:submit_report",
    "workflow:approve",
    "lifecycle:dispute_freeze",
    "lifecycle:resolve_dispute",
  ]),
  moderator: new Set([
    "workspace:read",
    "evidence:verify",
    "lifecycle:dispute_freeze",
  ]),
};

export class BTOSSecurityManager {
  public static isAuthorized(role: ParticipantRole, action: BTOSAction): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return false;
    return permissions.has(action);
  }

  public static assertAuthorized(role: ParticipantRole, action: BTOSAction): void {
    if (!this.isAuthorized(role, action)) {
      throw new Error(`Security Exception: Role '${role}' is not authorized to perform action '${action}'`);
    }
  }
}
