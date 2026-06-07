"use client";

import { MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

function SheetBackdrop({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm rounded-2xl border border-navy/10 bg-white p-5 shadow-float-lg dark:bg-elevated"
      >
        {children}
      </div>
    </div>
  );
}

export function CallWhatsAppFallbackSheet({
  open,
  onClose,
  onContinueWhatsApp,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onContinueWhatsApp: () => void;
  loading?: boolean;
}) {
  return (
    <SheetBackdrop open={open} onClose={onClose}>
      <p className="text-lg font-bold text-navy">Contact via WhatsApp</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        This property is currently available through WhatsApp inquiry.
      </p>
      <div className="mt-5 flex flex-col gap-2">
        <Button
          type="button"
          fullWidth
          onClick={onContinueWhatsApp}
          disabled={loading}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          {loading ? "Opening…" : "Continue on WhatsApp"}
        </Button>
        <Button type="button" variant="outline" fullWidth onClick={onClose}>
          Cancel
        </Button>
      </div>
    </SheetBackdrop>
  );
}

export function CallConfirmSheet({
  open,
  onClose,
  onCallNow,
  onContinueWhatsApp,
  propertyTitle,
  agentName,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onCallNow: () => void;
  onContinueWhatsApp: () => void;
  propertyTitle: string;
  agentName: string;
  loading?: boolean;
}) {
  return (
    <SheetBackdrop open={open} onClose={onClose}>
      <p className="text-lg font-bold text-navy">Call Agent</p>
      <p className="mt-2 text-sm text-muted">
        <span className="font-semibold text-navy">Property:</span>{" "}
        {propertyTitle}
      </p>
      <p className="mt-1 text-sm text-muted">
        <span className="font-semibold text-navy">Agent:</span> {agentName}
      </p>
      <div className="mt-5 flex flex-col gap-2">
        <Button type="button" fullWidth onClick={onCallNow} disabled={loading}>
          <Phone className="mr-2 h-4 w-4" />
          Call Now
        </Button>
        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={onContinueWhatsApp}
          disabled={loading}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Continue on WhatsApp
        </Button>
      </div>
    </SheetBackdrop>
  );
}
