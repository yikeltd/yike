/**
 * Yike Transaction Workspace Engine — Enterprise Intelligence Service
 * Assembles structured workspace context, executes AI reasoning via adapters, & feeds stream.
 */

import type { ParticipantRole } from "../types";
import type {
  IntelligenceCapability,
  IntelligenceRequestAggregate,
} from "./types";
import { getActiveIntelligenceAdapter } from "./provider";
import { TrustScoreCalculator } from "../trust/service";
import { ConversationService } from "../conversation/service";
import { auditLogService } from "../audit";
import { dealRoomEvents } from "../events";
import { automationHooks } from "../hooks";
import { workspaceSearchIndex } from "../search";

class IntelligenceRepository {
  private items: Map<string, IntelligenceRequestAggregate> = new Map();

  save(request: IntelligenceRequestAggregate): void {
    this.items.set(request.id, request);
  }

  getById(id: string): IntelligenceRequestAggregate | undefined {
    const req = this.items.get(id);
    return req && req.status === "active" ? req : undefined;
  }

  getByWorkspace(workspaceId: string): IntelligenceRequestAggregate[] {
    return Array.from(this.items.values())
      .filter((r) => r.workspaceId === workspaceId && r.status === "active")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
}

export const intelligenceRepo = new IntelligenceRepository();

export class ContextAssembler {
  /**
   * Assembles structured workspace context for AI reasoning models
   */
  static assemble(workspaceId: string): Record<string, unknown> {
    const trustBreakdown = TrustScoreCalculator.calculate(workspaceId);
    return {
      workspaceId,
      trustScore: trustBreakdown.overallScore,
      trustBadge: trustBreakdown.badgeLevel,
      assembledAt: new Date().toISOString(),
    };
  }
}

export class IntelligenceService {
  /**
   * Dispatches an Intelligence Request to the active provider adapter
   */
  static async requestIntelligence(
    workspaceId: string,
    capability: IntelligenceCapability,
    inputPrompt: string,
    actorId: string,
    actorRole: ParticipantRole
  ): Promise<IntelligenceRequestAggregate> {
    const adapter = getActiveIntelligenceAdapter();
    const context = ContextAssembler.assemble(workspaceId);
    const now = new Date().toISOString();
    const id = `ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const initialReq: IntelligenceRequestAggregate = {
      id,
      workspaceId,
      capability,
      requestStatus: "processing",
      inputPrompt,
      contextData: context,
      providerId: adapter.id,
      createdBy: actorId,
      createdAt: now,
      updatedAt: now,
      version: 1,
      status: "active",
    };

    intelligenceRepo.save(initialReq);

    // Process via provider adapter
    const output = await adapter.processRequest(capability, inputPrompt, context);

    const completedReq: IntelligenceRequestAggregate = {
      ...initialReq,
      requestStatus: "completed",
      output,
      updatedAt: new Date().toISOString(),
      version: 2,
    };

    intelligenceRepo.save(completedReq);

    // 1. Embed AI System Event Card into Conversation Stream
    ConversationService.appendSystemEvent(
      workspaceId,
      actorId,
      actorRole,
      `🤖 AI INSIGHT: ${capability.toUpperCase()}`,
      `${output.summary} (Confidence: ${output.confidenceScore}%, Provider: ${adapter.name})`
    );

    // 2. Audit Log & Search Index
    auditLogService.log(workspaceId, "entity_created", actorId, actorRole, "Intelligence", id, undefined, { capability, provider: adapter.id });
    workspaceSearchIndex.indexResource(workspaceId, "message", id, `AI Insight ${capability}`, output.summary || "", ["ai", capability], actorId);

    // 3. Timeline Event & Automation Hooks
    const evt = dealRoomEvents.createEvent(workspaceId, actorId, actorRole, "custom_event", "AI Insight Generated", output.summary || "");
    void dealRoomEvents.publish(evt);
    void automationHooks.emit(evt);

    return completedReq;
  }
}
