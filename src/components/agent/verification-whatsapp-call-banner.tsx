import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { AgentVerification } from "@/types/database";
import {
  agentVerificationCallInstructions,
  yikeVerificationWhatsAppLink,
  VERIFICATION_WHATSAPP_NUMBER,
} from "@/lib/agent-verification";

export function VerificationWhatsAppCallBanner({
  verification,
}: {
  verification?: AgentVerification | null;
}) {
  const { title, body, showWhatsAppLink } =
    agentVerificationCallInstructions(verification);

  return (
    <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left">
      <div className="flex items-start gap-3">
        <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
        <div>
          <h2 className="font-bold text-navy">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-navy/80">{body}</p>
          <p className="mt-2 text-xs text-muted">
            Yike official WhatsApp: +{VERIFICATION_WHATSAPP_NUMBER}
          </p>
        </div>
      </div>
      {showWhatsAppLink && (
        <Link
          href={yikeVerificationWhatsAppLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="pressable inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white"
        >
          <MessageCircle className="h-4 w-4" />
          Open WhatsApp
        </Link>
      )}
    </div>
  );
}
