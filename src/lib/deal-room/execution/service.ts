/**
 * Yike Transaction Workspace Engine — Enterprise Execution Service
 * Manages operational work, checklist progress, personnel assignments, & evidence links.
 */

import type { ParticipantRole } from "../types";
import type {
  ChecklistGroup,
  ChecklistItemResult,
  ExecutionAggregate,
  ExecutionAssignee,
  ExecutionStatus,
  ExecutionType,
} from "./types";
import { VerificationService } from "../trust/service";
import { ConversationService } from "../conversation/service";
import { auditLogService } from "../audit";
import { dealRoomEvents } from "../events";
import { automationHooks } from "../hooks";
import { workspaceSearchIndex } from "../search";

class ExecutionRepository {
  private items: Map<string, ExecutionAggregate> = new Map();

  save(execution: ExecutionAggregate): void {
    this.items.set(execution.id, execution);
  }

  getById(id: string): ExecutionAggregate | undefined {
    const ex = this.items.get(id);
    return ex && ex.status === "active" ? ex : undefined;
  }

  getByWorkspace(workspaceId: string): ExecutionAggregate[] {
    return Array.from(this.items.values())
      .filter((e) => e.workspaceId === workspaceId && e.status === "active")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
}

export const executionRepo = new ExecutionRepository();

export class ExecutionService {
  /**
   * Requests a new real-world operational execution
   */
  static requestExecution(
    workspaceId: string,
    executionType: ExecutionType,
    initialChecklists: ChecklistGroup[],
    actorId: string,
    actorRole: ParticipantRole,
    appointmentId?: string,
    negotiationId?: string,
    notes?: string
  ): ExecutionAggregate {
    const now = new Date().toISOString();
    const id = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const execution: ExecutionAggregate = {
      id,
      workspaceId,
      appointmentId,
      negotiationId,
      executionType,
      executionStatus: "requested",
      assignees: [],
      checklists: initialChecklists,
      completionPercentage: 0,
      evidenceIds: [],
      notes,
      createdBy: actorId,
      createdAt: now,
      updatedAt: now,
      version: 1,
      status: "active",
    };

    executionRepo.save(execution);

    // 1. Embed Card into Conversation Stream
    ConversationService.embedCard(
      workspaceId,
      actorId,
      actorRole,
      "inspection_card",
      `Execution Requested: ${executionType.replace("_", " ").toUpperCase()}`,
      {
        inspectionId: id,
        status: "requested",
        locationAddress: "Operational Field Execution",
      }
    );

    // 2. Audit Log & Search Index
    auditLogService.log(workspaceId, "entity_created", actorId, actorRole, "Execution", id, undefined, { type: executionType });
    workspaceSearchIndex.indexResource(workspaceId, "inspection", id, `Execution ${executionType}`, notes || "", ["execution", executionType], actorId);

    // 3. Timeline Event & Automation Hooks
    const evt = dealRoomEvents.createEvent(workspaceId, actorId, actorRole, "inspection_requested", "Execution Requested", `${executionType} requested`);
    void dealRoomEvents.publish(evt);
    void automationHooks.emit(evt);

    return execution;
  }

  /**
   * Assigns operational personnel (Inspector, Mechanic, Lawyer, Delivery Agent)
   */
  static assignPersonnel(
    executionId: string,
    personnelId: string,
    personnelRole: ParticipantRole,
    actorId: string,
    actorRole: ParticipantRole
  ): ExecutionAggregate {
    const ex = executionRepo.getById(executionId);
    if (!ex) throw new Error("Execution aggregate not found.");

    const now = new Date().toISOString();
    const assignee: ExecutionAssignee = {
      userId: personnelId,
      role: personnelRole,
      status: "assigned",
      assignedAt: now,
    };

    const updatedEx: ExecutionAggregate = {
      ...ex,
      executionStatus: "assigned",
      assignees: [...ex.assignees, assignee],
      updatedBy: actorId,
      updatedAt: now,
      version: ex.version + 1,
    };

    executionRepo.save(updatedEx);

    ConversationService.appendSystemEvent(
      ex.workspaceId,
      actorId,
      actorRole,
      `📌 Personnel Assigned to ${ex.executionType.replace("_", " ").toUpperCase()}`,
      `Assigned ${personnelRole} to operational work.`
    );

    return updatedEx;
  }

  /**
   * Updates a checklist item result and calculates completion percentage
   */
  static updateChecklistItem(
    executionId: string,
    category: string,
    itemId: string,
    result: ChecklistItemResult,
    actorId: string,
    notes?: string,
    evidenceId?: string
  ): ExecutionAggregate {
    const ex = executionRepo.getById(executionId);
    if (!ex) throw new Error("Execution aggregate not found.");

    let totalItems = 0;
    let completedItems = 0;

    const updatedChecklists = ex.checklists.map((group) => {
      if (group.category !== category) {
        group.items.forEach((item) => {
          totalItems += 1;
          if (item.result !== "pending") completedItems += 1;
        });
        return group;
      }

      const updatedItems = group.items.map((item) => {
        totalItems += 1;
        if (item.id === itemId) {
          if (result !== "pending") completedItems += 1;
          return { ...item, result, notes, evidenceId };
        }
        if (item.result !== "pending") completedItems += 1;
        return item;
      });

      return { ...group, items: updatedItems };
    });

    const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    const now = new Date().toISOString();

    const updatedEx: ExecutionAggregate = {
      ...ex,
      executionStatus: completionPercentage === 100 ? "completed" : "in_progress",
      checklists: updatedChecklists,
      completionPercentage,
      evidenceIds: evidenceId ? [...ex.evidenceIds, evidenceId] : ex.evidenceIds,
      updatedBy: actorId,
      updatedAt: now,
      version: ex.version + 1,
    };

    executionRepo.save(updatedEx);

    if (completionPercentage === 100) {
      // Auto-trigger Trust Platform Approval
      const verification = VerificationService.submitVerification(
        ex.workspaceId,
        ex.id,
        "listing",
        "inspection",
        [],
        actorId,
        "inspector"
      );
      VerificationService.approveVerification(verification.id, actorId, "inspector", 96);
    }

    return updatedEx;
  }
}
