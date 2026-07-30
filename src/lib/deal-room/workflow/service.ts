/**
 * Yike Transaction Workspace Engine — Enterprise Workflow Service
 * Manages operational tasks, approval chains, decision logs, & stream cards.
 */

import type { ParticipantRole } from "../types";
import type {
  ApprovalChainStep,
  DecisionLogEntry,
  TaskPriority,
  TaskType,
  WorkflowAggregate,
  WorkflowState,
  WorkflowTask,
  WorkflowType,
} from "./types";
import { ConversationService } from "../conversation/service";
import { auditLogService } from "../audit";
import { dealRoomEvents } from "../events";
import { automationHooks } from "../hooks";
import { workspaceSearchIndex } from "../search";

class WorkflowRepository {
  private items: Map<string, WorkflowAggregate> = new Map();

  save(workflow: WorkflowAggregate): void {
    this.items.set(workflow.id, workflow);
  }

  getById(id: string): WorkflowAggregate | undefined {
    const wf = this.items.get(id);
    return wf && wf.status === "active" ? wf : undefined;
  }

  getByWorkspace(workspaceId: string): WorkflowAggregate[] {
    return Array.from(this.items.values())
      .filter((w) => w.workspaceId === workspaceId && w.status === "active")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
}

export const workflowRepo = new WorkflowRepository();

export class WorkflowService {
  /**
   * Initializes a Workflow for a Transaction Workspace
   */
  static createWorkflow(
    workspaceId: string,
    workflowType: WorkflowType,
    initialTasks: Omit<WorkflowTask, "id" | "workflowId" | "completedAt">[],
    approvalChain: ApprovalChainStep[],
    actorId: string,
    actorRole: ParticipantRole
  ): WorkflowAggregate {
    const now = new Date().toISOString();
    const id = `wf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const tasks: WorkflowTask[] = initialTasks.map((t, idx) => ({
      ...t,
      id: `task_${Date.now()}_${idx}`,
      workflowId: id,
    }));

    const initialLog: DecisionLogEntry = {
      id: `dec_${Date.now()}`,
      action: "Workflow Initialized",
      actorId,
      actorRole,
      timestamp: now,
      notes: `Started ${workflowType.replace("_", " ").toUpperCase()}`,
    };

    const workflow: WorkflowAggregate = {
      id,
      workspaceId,
      workflowType,
      workflowState: "active",
      tasks,
      approvalChain,
      decisionLog: [initialLog],
      currentStepIndex: 0,
      createdBy: actorId,
      createdAt: now,
      updatedAt: now,
      version: 1,
      status: "active",
    };

    workflowRepo.save(workflow);

    // 1. Embed System Event Card into Conversation Stream
    ConversationService.appendSystemEvent(
      workspaceId,
      actorId,
      actorRole,
      `⚙️ WORKFLOW STARTED: ${workflowType.replace("_", " ").toUpperCase()}`,
      `${tasks.length} Tasks Scheduled • ${approvalChain.length}-Step Approval Chain`
    );

    // 2. Audit Log & Search Index
    auditLogService.log(workspaceId, "entity_created", actorId, actorRole, "Workflow", id, undefined, { type: workflowType });
    workspaceSearchIndex.indexResource(workspaceId, "message", id, `Workflow ${workflowType}`, `${tasks.length} tasks`, ["workflow"], actorId);

    // 3. Timeline Event & Automation Hooks
    const evt = dealRoomEvents.createEvent(workspaceId, actorId, actorRole, "custom_event", "Workflow Initialized", `${workflowType} started`);
    void dealRoomEvents.publish(evt);
    void automationHooks.emit(evt);

    return workflow;
  }

  /**
   * Completes a task inside an active workflow
   */
  static completeTask(
    workflowId: string,
    taskId: string,
    actorId: string,
    actorRole: ParticipantRole,
    evidenceId?: string
  ): WorkflowAggregate {
    const wf = workflowRepo.getById(workflowId);
    if (!wf) throw new Error("Workflow aggregate not found.");

    const now = new Date().toISOString();
    const updatedTasks = wf.tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          taskStatus: "completed" as const,
          completedAt: now,
          evidenceIds: evidenceId ? [...task.evidenceIds, evidenceId] : task.evidenceIds,
        };
      }
      return task;
    });

    const allCompleted = updatedTasks.every((t) => t.taskStatus === "completed");
    const nextState: WorkflowState = allCompleted ? "completed" : "active";

    const decisionLogEntry: DecisionLogEntry = {
      id: `dec_${Date.now()}`,
      action: "Task Completed",
      actorId,
      actorRole,
      timestamp: now,
      notes: `Task ${taskId} finished.`,
    };

    const updatedWf: WorkflowAggregate = {
      ...wf,
      workflowState: nextState,
      tasks: updatedTasks,
      decisionLog: [...wf.decisionLog, decisionLogEntry],
      updatedBy: actorId,
      updatedAt: now,
      version: wf.version + 1,
    };

    workflowRepo.save(updatedWf);

    ConversationService.appendSystemEvent(
      wf.workspaceId,
      actorId,
      actorRole,
      `✅ TASK COMPLETED`,
      `Workflow task finished. Remaining pending tasks: ${updatedTasks.filter((t) => t.taskStatus !== "completed").length}`
    );

    return updatedWf;
  }
}
