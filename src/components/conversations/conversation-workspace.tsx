"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import type { ConversationWorkspace as WorkspaceType, InspectionType, TransactionActionType } from "@/lib/conversations/types";
import type { Deal } from "@/lib/commerce/types";
import { DealSummaryCard } from "@/components/commerce/deal-summary-card";
import { GatedReviewModal } from "@/components/commerce/gated-review-modal";
import { BuyerAssistanceModal } from "./buyer-assistance-modal";
import { ConnectActionSheet } from "./connect-action-sheet";
import { ConversationTimeline } from "./conversation-timeline";
import { InspectionRequestModal } from "./inspection-request-modal";
import { OfferModal } from "./offer-modal";
import { TransactionActionBar } from "./transaction-action-bar";
import { TransactionSummaryCard } from "./transaction-summary-card";
import { TrustPanelModal } from "./trust-panel";
import { ViewingModal } from "./viewing-modal";

export function ConversationWorkspace({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const [workspace, setWorkspace] = useState<WorkspaceType | null>(null);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);

  // Modal States
  const [connectSheetOpen, setConnectSheetOpen] = useState(false);
  const [trustPanelOpen, setTrustPanelOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [viewingModalOpen, setViewingModalOpen] = useState(false);
  const [buyerAssistanceOpen, setBuyerAssistanceOpen] = useState(false);
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}`);
        const data = (await res.json()) as { workspace?: WorkspaceType; error?: string };
        if (cancelled) return;

        if (!res.ok || !data.workspace) {
          setError(data.error ?? "Failed to load conversation workspace");
          return;
        }

        setWorkspace(data.workspace);

        // Fetch or sync canonical deal
        const dealRes = await fetch(`/api/deals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: data.workspace.id,
            listingId: data.workspace.listing.id,
            buyerId: data.workspace.buyerId,
            sellerId: data.workspace.seller.id,
            initialValue: data.workspace.listing.price,
          }),
        });
        const dealData = (await dealRes.json()) as { deal?: Deal };
        if (dealData.deal) setDeal(dealData.deal);
      } catch {
        if (!cancelled) setError("Network error loading conversation workspace");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  async function refreshWorkspace() {
    if (!workspace) return;
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(workspace.id)}`);
      const data = (await res.json()) as { workspace?: WorkspaceType };
      if (data.workspace) setWorkspace(data.workspace);
    } catch {
      // Ignore transient error
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageInput.trim() || sending || !workspace) return;

    setSending(true);
    try {
      await fetch(`/api/conversations/${encodeURIComponent(workspace.id)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageInput.trim() }),
      });
      setMessageInput("");
      await refreshWorkspace();
    } catch {
      // Ignore transient error
    } finally {
      setSending(false);
    }
  }

  function handleActionClick(action: TransactionActionType) {
    if (action === "make_offer") {
      setOfferModalOpen(true);
    } else if (action === "schedule_viewing") {
      setViewingModalOpen(true);
    } else if (action === "buyer_assistance") {
      setBuyerAssistanceOpen(true);
    } else if (action === "request_inspection") {
      setInspectionModalOpen(true);
    } else {
      void executeDirectAction(action);
    }
  }

  async function executeDirectAction(action: TransactionActionType, payload?: Record<string, unknown>) {
    if (!workspace) return;
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(workspace.id)}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      const data = (await res.json()) as { workspace?: WorkspaceType };
      if (data.workspace) setWorkspace(data.workspace);
    } catch {
      // Ignore transient error
    }
  }

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center rounded-3xl border border-navy/10 bg-white p-8">
        <p className="text-sm font-medium text-navy/60">Loading transaction workspace…</p>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-3 rounded-3xl border border-navy/10 bg-white p-8 text-center">
        <p className="text-sm font-bold text-danger">{error ?? "Workspace unavailable"}</p>
        <Link href="/conversations" className="text-xs font-bold text-navy underline">
          Return to inbox
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[85vh] max-w-5xl flex-col overflow-hidden rounded-3xl border border-navy/10 bg-surface shadow-lg">
      {/* Header & Transaction Summary Card */}
      <header className="border-b border-navy/10 bg-white p-3 sm:p-4">
        <div className="mb-2 flex items-center justify-between">
          <Link
            href="/conversations"
            className="flex items-center gap-1 text-xs font-semibold text-navy/70 hover:text-navy"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Inbox
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-wider text-navy/40">
            Workspace ID: {workspace.id}
          </span>
        </div>

        <TransactionSummaryCard
          workspace={workspace}
          onOpenConnect={() => setConnectSheetOpen(true)}
          onToggleTrustPanel={() => setTrustPanelOpen(true)}
        />

        {deal && (
          <div className="mt-3">
            <DealSummaryCard deal={deal} onOpenReviewModal={() => setReviewModalOpen(true)} />
          </div>
        )}
      </header>

      {/* Main Conversation Stream */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6">
        <ConversationTimeline
          timeline={workspace.timeline}
          messages={workspace.messages}
          currentUserId={currentUserId}
        />
      </main>

      {/* Action Bar & Message Composer */}
      <footer className="border-t border-navy/10 bg-white p-4">
        <TransactionActionBar
          availableActions={workspace.availableActions}
          onActionClick={handleActionClick}
        />

        <form onSubmit={(e) => void handleSendMessage(e)} className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message or select a transaction action above…"
            className="flex-1 rounded-full border border-navy/10 bg-surface px-4 py-2.5 text-sm font-medium text-navy placeholder:text-navy/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
          <button
            type="submit"
            disabled={!messageInput.trim() || sending}
            className="pressable flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-white disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </footer>

      {/* Unified Connect Sheet */}
      <ConnectActionSheet
        workspace={workspace}
        open={connectSheetOpen}
        onClose={() => setConnectSheetOpen(false)}
        onTriggerAction={(actionName) => handleActionClick(actionName as TransactionActionType)}
      />

      {/* Embedded Trust Panel Modal */}
      <TrustPanelModal
        trustPanel={workspace.trustPanel}
        sellerName={workspace.seller.fullName}
        open={trustPanelOpen}
        onClose={() => setTrustPanelOpen(false)}
      />

      {/* Offer Modal */}
      <OfferModal
        open={offerModalOpen}
        listingTitle={workspace.listing.title}
        listingPrice={workspace.listing.price}
        onClose={() => setOfferModalOpen(false)}
        onSubmitOffer={async (amount, terms) => {
          await fetch(`/api/conversations/${encodeURIComponent(workspace.id)}/offers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "submit", amount, terms }),
          });
          await refreshWorkspace();
        }}
      />

      {/* Viewing Modal */}
      <ViewingModal
        open={viewingModalOpen}
        listingTitle={workspace.listing.title}
        onClose={() => setViewingModalOpen(false)}
        onSubmitViewing={async (date, time, meetingPoint, notes) => {
          await fetch(`/api/conversations/${encodeURIComponent(workspace.id)}/viewings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date, time, meetingPoint, notes }),
          });
          await refreshWorkspace();
        }}
      />

      {/* Buyer Assistance Modal */}
      <BuyerAssistanceModal
        open={buyerAssistanceOpen}
        onClose={() => setBuyerAssistanceOpen(false)}
        onSubmitAssistance={async (serviceType, notes) => {
          await fetch(`/api/conversations/${encodeURIComponent(workspace.id)}/buyer-assistance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ serviceType, notes }),
          });
          await refreshWorkspace();
        }}
      />

      {/* Inspection Request Modal */}
      <InspectionRequestModal
        open={inspectionModalOpen}
        onClose={() => setInspectionModalOpen(false)}
        onSubmitInspection={async (inspectionType: InspectionType, preferredDate: string, notes?: string) => {
          await fetch(`/api/conversations/${encodeURIComponent(workspace.id)}/inspections`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inspectionType, preferredDate, notes }),
          });
          await refreshWorkspace();
        }}
      />
      {/* Gated Review Modal */}
      {deal && (
        <GatedReviewModal
          open={reviewModalOpen}
          dealId={deal.id}
          targetName={workspace.seller.fullName}
          onClose={() => setReviewModalOpen(false)}
          onSubmitReview={async (rating, feedback) => {
            await fetch(`/api/deals/${encodeURIComponent(deal.id)}/reviews`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                reviewerRole: currentUserId === workspace.buyerId ? "buyer" : "seller",
                targetUserId: currentUserId === workspace.buyerId ? workspace.seller.id : workspace.buyerId,
                rating,
                feedback,
              }),
            });
            await refreshWorkspace();
          }}
        />
      )}
    </div>
  );
}
