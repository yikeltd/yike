"use client";

import { useEffect, useState } from "react";
import { ContactButtons } from "./contact-buttons";
import type { ListingType, PaymentPeriod } from "@/types/database";

/**
 * Mobile sticky WhatsApp bar — only after the in-page primary CTA leaves the viewport.
 * Avoids duplicating primary CTAs (Design Excellence Sprint).
 */
export function StickyContactBar({
  propertyId,
  title,
  area,
  city,
  listingType,
  propertyType,
  bedrooms,
  agentId,
  agentName,
  price,
  paymentPeriod,
  phone,
  whatsapp,
  observeAnchorId = "listing-primary-cta",
}: {
  propertyId: string;
  title: string;
  area: string;
  city: string;
  listingType: ListingType;
  propertyType?: string | null;
  bedrooms?: number;
  agentId: string;
  agentName: string;
  price: number;
  paymentPeriod: PaymentPeriod;
  phone?: string | null;
  whatsapp?: string | null;
  /** Element id for the above-fold primary CTA to observe */
  observeAnchorId?: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!agentId) return;
    const el = document.getElementById(observeAnchorId);
    if (!el) {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        setShow(!entry.isIntersecting);
      },
      { root: null, threshold: 0, rootMargin: "-8px 0px 0px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [agentId, observeAnchorId]);

  if (!agentId || !show) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-[var(--bottom-nav-stack)] z-30 mx-auto max-w-lg px-3 lg:hidden"
      role="region"
      aria-label="Contact seller"
    >
      <div className="detail-contact-bar p-2.5">
        <ContactButtons
          propertyId={propertyId}
          title={title}
          area={area}
          city={city}
          listingType={listingType}
          propertyType={propertyType}
          bedrooms={bedrooms}
          agentId={agentId}
          agentName={agentName}
          price={price}
          paymentPeriod={paymentPeriod}
          phone={phone}
          whatsapp={whatsapp}
          layout="detail"
          placement="sticky"
        />
      </div>
    </div>
  );
}
