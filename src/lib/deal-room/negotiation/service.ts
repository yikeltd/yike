/**
 * Yike Transaction Workspace Engine — Negotiation Service
 * Manages immutable version history, counter-offers, acceptances, and summary metrics.
 */

import type { ParticipantRole } from "../types";
import type { NegotiationAggregate, NegotiationStatus, NegotiationSummary, NegotiationVersion } from "./types";
import { ConversationService } from "../conversation/service";
import { auditLogService } from "../audit";
import { dealRoomEvents } from "../events";
import { automationHooks } from "../hooks";
import { workspaceSearchIndex } from "../search";

class NegotiationRepository {
  private negotiations: Map<string, NegotiationAggregate> = new Map();

  save(negotiation: NegotiationAggregate): void {
    this.negotiations.set(negotiation.id, negotiation);
  }

  getById(id: string): NegotiationAggregate | undefined {
    const neg = this.negotiations.get(id);
    return neg && neg.status === "active" ? neg : undefined;
  }

  getByWorkspace(workspaceId: string): NegotiationAggregate | undefined {
    return Array.from(this.negotiations.values()).find(
      (n) => n.workspaceId === workspaceId && n.status === "active"
    );
  }
}

export const negotiationRepo = new NegotiationRepository();

export class NegotiationService {
  /**
   * Initializes a new structured negotiation with Version 1
   */
  static submitOffer(
    workspaceId: string,
    listingId: string,
    originalAskingPrice: number,
    offeredAmount: number,
    buyerId: string,
    sellerId: string,
    currency: "NGN" | "USD" = "NGN",
    note?: string,
    durationHours = 48
  ): NegotiationAggregate {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationHours * 3600 * 1000).toISOString();
    const id = `neg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const v1: NegotiationVersion = {
      versionNumber: 1,
      amount: offeredAmount,
      currency,
      offeredBy: buyerId,
      offeredRole: "buyer",
      offeredTo: sellerId,
      note,
      negotiationStatus: "submitted",
      expiresAt,
      createdAt: now.toISOString(),
    };

    const negotiation: NegotiationAggregate = {
      id,
      workspaceId,
      listingId,
      originalAskingPrice,
      currentAmount: offeredAmount,
      currency,
      negotiationStatus: "submitted",
      currentVersionNumber: 1,
      versions: [v1],
      expiresAt,
      createdBy: buyerId,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      version: 1,
      status: "active",
    };

    negotiationRepo.save(negotiation);

    // 1. Embed Offer Card into Conversation Stream
    ConversationService.embedCard(
      workspaceId,
      buyerId,
      "buyer",
      "offer_card",
      `Offer Submitted: ₦${offeredAmount.toLocaleString()}`,
      {
        offerId: id,
        originalPrice: originalAskingPrice,
        offeredPrice: offeredAmount,
        currency,
        offerStatus: "submitted",
        expiresAt,
        note,
      },
      true // Pinned
    );

    // 2. Audit Log & Search Index
    auditLogService.log(workspaceId, "entity_created", buyerId, "buyer", "Negotiation", id, undefined, { amount: offeredAmount });
    workspaceSearchIndex.indexResource(workspaceId, "offer", id, `Offer ₦${offeredAmount.toLocaleString()}`, note || "", ["offer", "submitted"], buyerId);

    // 3. Timeline Event & Automation Hooks
    const evt = dealRoomEvents.createEvent(workspaceId, buyerId, "buyer", "offer_created", "Offer Submitted", `Offer of ₦${offeredAmount.toLocaleString()} submitted`);
    void dealRoomEvents.publish(evt);
    void automationHooks.emit(evt);

    return negotiation;
  }

  /**
   * Submits a counter-offer creating an immutable Version N+1
   */
  static counterOffer(
    negotiationId: string,
    counterAmount: number,
    actorId: string,
    actorRole: ParticipantRole,
    targetUserId: string,
    note?: string
  ): NegotiationAggregate {
    const neg = negotiationRepo.getById(negotiationId);
    if (!neg) throw new Error("Negotiation not found.");
    if (neg.negotiationStatus === "accepted" || neg.negotiationStatus === "cancelled" || neg.negotiationStatus === "completed") {
      throw new Error(`Cannot counter an offer in status '${neg.negotiationStatus}'.`);
    }

    const now = new Date();
    const nextVersionNumber = neg.currentVersionNumber + 1;
    const expiresAt = new Date(now.getTime() + 48 * 3600 * 1000).toISOString();

    const newVersion: NegotiationVersion = {
      versionNumber: nextVersionNumber,
      amount: counterAmount,
      currency: neg.currency,
      offeredBy: actorId,
      offeredRole: actorRole,
      offeredTo: targetUserId,
      note,
      negotiationStatus: "countered",
      expiresAt,
      createdAt: now.toISOString(),
    };

    const updatedNeg: NegotiationAggregate = {
      ...neg,
      currentAmount: counterAmount,
      negotiationStatus: "countered",
      currentVersionNumber: nextVersionNumber,
      versions: [...neg.versions, newVersion],
      expiresAt,
      updatedBy: actorId,
      updatedAt: now.toISOString(),
      version: neg.version + 1,
    };

    negotiationRepo.save(updatedNeg);

    // Embed Counter Card
    ConversationService.embedCard(
      neg.workspaceId,
      actorId,
      actorRole,
      "offer_card",
      `Counter Offer v${nextVersionNumber}: ₦${counterAmount.toLocaleString()}`,
      {
        offerId: neg.id,
        originalPrice: neg.originalAskingPrice,
        offeredPrice: counterAmount,
        currency: neg.currency,
        offerStatus: "countered",
        expiresAt,
        note,
      },
      true
    );

    auditLogService.log(neg.workspaceId, "offer_status_changed", actorId, actorRole, "Negotiation", neg.id, { amount: neg.currentAmount }, { amount: counterAmount });
    const evt = dealRoomEvents.createEvent(neg.workspaceId, actorId, actorRole, "offer_countered", `Counter Offer v${nextVersionNumber}`, `Countered at ₦${counterAmount.toLocaleString()}`);
    void dealRoomEvents.publish(evt);
    void automationHooks.emit(evt);

    return updatedNeg;
  }

  /**
   * Accepts the current negotiation offer
   */
  static acceptOffer(negotiationId: string, actorId: string, actorRole: ParticipantRole): NegotiationAggregate {
    const neg = negotiationRepo.getById(negotiationId);
    if (!neg) throw new Error("Negotiation not found.");

    const now = new Date().toISOString();
    const updatedVersions = neg.versions.map((v) =>
      v.versionNumber === neg.currentVersionNumber ? { ...v, negotiationStatus: "accepted" as NegotiationStatus } : v
    );

    const updatedNeg: NegotiationAggregate = {
      ...neg,
      negotiationStatus: "accepted",
      versions: updatedVersions,
      updatedBy: actorId,
      updatedAt: now,
      version: neg.version + 1,
    };

    negotiationRepo.save(updatedNeg);

    ConversationService.appendSystemEvent(
      neg.workspaceId,
      actorId,
      actorRole,
      `🎉 Offer Accepted: ₦${neg.currentAmount.toLocaleString()}`,
      "Negotiation successfully accepted. Moving to Document & Inspection verification."
    );

    auditLogService.log(neg.workspaceId, "offer_status_changed", actorId, actorRole, "Negotiation", neg.id, { status: neg.negotiationStatus }, { status: "accepted" });
    const evt = dealRoomEvents.createEvent(neg.workspaceId, actorId, actorRole, "offer_accepted", "Offer Accepted", `Final agreed amount: ₦${neg.currentAmount.toLocaleString()}`);
    void dealRoomEvents.publish(evt);
    void automationHooks.emit(evt);

    return updatedNeg;
  }

  /**
   * Computes a live summary object for pinned dashboard displays
   */
  static getSummary(workspaceId: string): NegotiationSummary | undefined {
    const neg = negotiationRepo.getByWorkspace(workspaceId);
    if (!neg) return undefined;

    const diff = neg.currentAmount - neg.originalAskingPrice;
    const pct = neg.originalAskingPrice > 0 ? (diff / neg.originalAskingPrice) * 100 : 0;
    const latestVersion = neg.versions[neg.versions.length - 1];

    return {
      negotiationId: neg.id,
      workspaceId: neg.workspaceId,
      currentAmount: neg.currentAmount,
      originalAskingPrice: neg.originalAskingPrice,
      differenceAmount: diff,
      percentageDifference: Number(pct.toFixed(1)),
      totalOffersExchanged: neg.versions.length,
      currentStatus: neg.negotiationStatus,
      currentOfferedByRole: latestVersion?.offeredRole || "buyer",
      expiresAt: neg.expiresAt,
      lastUpdated: neg.updatedAt,
    };
  }
}
