"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageSection } from "./page-section";

export function FaqSection({
  title = "Common questions",
  subtitle,
  faqs,
}: {
  title?: string;
  subtitle?: string;
  faqs: { q: string; a: string }[];
}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <PageSection title={title} subtitle={subtitle}>
      <div className="space-y-2 px-3 lg:px-0">
        {faqs.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div
              key={faq.q}
              className="overflow-hidden rounded-2xl bg-white shadow-float ring-1 ring-black/[0.04]"
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left lg:px-5"
              >
                <span className="text-sm font-bold text-navy lg:text-base">
                  {faq.q}
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-gold-dark transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
              {isOpen && (
                <div className="border-t border-surface px-4 pb-4 pt-2 text-sm leading-relaxed text-muted lg:px-5">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PageSection>
  );
}
