/**
 * Yike Transaction Workspace Engine — Trust & Verification Service
 * Manages evidence verification workflows, weighted trust scores, & stream cards.
 */

import type { ParticipantRole } from "../types";
import type {
  TrustScoreBreakdown,
  VerificationAggregate,
  VerificationEvidence,
  VerificationStatus,
  VerificationType,
} from "./types";
import { ConversationService } from "../conversation/service";
import { auditLogService } from "../audit";
import { dealRoomEvents } from "../events";
import { automationHooks } from "../hooks";
import { workspaceSearchIndex } from "../search";

class VerificationRepository {
  private verifications: Map<string, VerificationAggregate> = new Map();

  save(verification: VerificationAggregate): void {
    this.verifications.set(verification.id, verification);
  }

  getById(id: string): VerificationAggregate | undefined {
    const v = this.verifications.get(id);
    return v && v.status === "active" ? v : undefined;
  }

  getByWorkspace(workspaceId: string): VerificationAggregate[] {
    return Array.from(this.verifications.values())
      .filter((v) => v.workspaceId === workspaceId && v.status === "active")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
}

export const verificationRepo = new VerificationRepository();

export class TrustScoreCalculator {
  /**
   * Computes a weighted Trust Score (0 to 100) for a workspace
   */
  static calculate(workspaceId: string): TrustScoreBreakdown {
    const items = verificationRepo.getByWorkspace(workspaceId);
    const verifiedItems = items.filter((i) => i.verificationStatus === "verified");

    let identitySum = 0;
    let documentSum = 0;
    let count = 0;

    verifiedItems.forEach((item) => {
      count += 1;
      if (item.verificationType === "identity" || item.verificationType === "business" || item.verificationType === "phone") {
        identitySum += item.confidenceScore;
      } else {
        documentSum += item.confidenceScore;
      }
    });

    const identityScore = count > 0 ? Math.min(100, Math.round(identitySum / Math.max(1, count) + 30)) : 0;
    const documentScore = count > 0 ? Math.min(100, Math.round(documentSum / Math.max(1, count) + 20)) : 0;
    const historyScore = count > 0 ? 85 : 40;

    const overallScore = count === 0 ? 30 : Math.round(identityScore * 0.4 + documentScore * 0.4 + historyScore * 0.2);

    let badgeLevel: TrustScoreBreakdown["badgeLevel"] = "unverified";
    if (overallScore >= 85) badgeLevel = "high_trust";
    else if (overallScore >= 65) badgeLevel = "verified";
    else if (overallScore >= 40) badgeLevel = "basic_trust";

    return {
      overallScore,
      identityScore,
      documentScore,
      historyScore,
      badgeLevel,
      verificationsCount: count,
      lastUpdated: new Date().toISOString(),
    };
  }
}

export class VerificationService {
  /**
   * Submits a verification request with evidence
   */
  static submitVerification(
    workspaceId: string,
    subjectId: string,
    subjectType: "user" | "listing" | "document",
    verificationType: VerificationType,
    evidence: VerificationEvidence[],
    actorId: string,
    actorRole: ParticipantRole
  ): VerificationAggregate {
    const now = new Date().toISOString();
    const id = `ver_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const verification: VerificationAggregate = {
      id,
      workspaceId,
      subjectId,
      subjectType,
      verificationType,
      verificationStatus: "submitted",
      confidenceScore: 75,
      evidence,
      createdBy: actorId,
      createdAt: now,
      updatedAt: now,
      version: 1,
      status: "active",
    };

    verificationRepo.save(verification);

    // 1. Embed Verification Card into Conversation Stream
    ConversationService.embedCard(
      workspaceId,
      actorId,
      actorRole,
      "verification_card",
      `Verification Submitted: ${verificationType.toUpperCase()}`,
      {
        verificationId: id,
        subjectType: `${subjectType}_${verificationType}`,
        status: "pending",
        score: 75,
        badgeLabel: `${verificationType.toUpperCase()} SUBMITTED`,
      }
    );

    // 2. Audit Log & Search Index
    auditLogService.log(workspaceId, "entity_created", actorId, actorRole, "Verification", id, undefined, { type: verificationType });
    workspaceSearchIndex.indexResource(workspaceId, "document", id, `Verification ${verificationType}`, subjectId, ["verification", verificationType], actorId);

    // 3. Timeline Event & Automation Hooks
    const evt = dealRoomEvents.createEvent(workspaceId, actorId, actorRole, "document_uploaded", "Verification Submitted", `${verificationType} verification submitted`);
    void dealRoomEvents.publish(evt);
    void automationHooks.emit(evt);

    return verification;
  }

  /**
   * Approves a verification record and updates the workspace Trust Score
   */
  static approveVerification(
    verificationId: string,
    reviewerId: string,
    reviewerRole: ParticipantRole,
    confidenceScore = 95
  ): VerificationAggregate {
    const v = verificationRepo.getById(verificationId);
    if (!v) throw new Error("Verification record not found.");

    const now = new Date().toISOString();
    const updatedV: VerificationAggregate = {
      ...v,
      verificationStatus: "verified",
      confidenceScore,
      reviewerId,
      reviewerRole,
      updatedBy: reviewerId,
      updatedAt: now,
      version: v.version + 1,
    };

    verificationRepo.save(updatedV);

    const trustScore = TrustScoreCalculator.calculate(v.workspaceId);

    ConversationService.appendSystemEvent(
      v.workspaceId,
      reviewerId,
      reviewerRole,
      `🟢 ${v.verificationType.toUpperCase()} VERIFIED`,
      `Verification approved with ${confidenceScore}% confidence score. Updated Trust Score: ${trustScore.overallScore}/100.`
    );

    auditLogService.log(v.workspaceId, "entity_updated", reviewerId, reviewerRole, "Verification", v.id, { status: v.verificationStatus }, { status: "verified", confidenceScore });
    const evt = dealRoomEvents.createEvent(v.workspaceId, reviewerId, reviewerRole, "document_verified", `${v.verificationType.toUpperCase()} Verified`, `Approved by ${reviewerRole}`);
    void dealRoomEvents.publish(evt);
    void automationHooks.emit(evt);

    return updatedV;
  }
}
