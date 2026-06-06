"use client";

import { ContactButtons } from "./contact-buttons";

export function StickyContactBar({
  propertyId,
  title,
  area,
  city,
  listingType,
  propertyType,
  bedrooms,
  agentId,
  phone,
  whatsapp,
}: {
  propertyId: string;
  title: string;
  area: string;
  city: string;
  listingType: string;
  propertyType?: string | null;
  bedrooms?: number;
  agentId?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
}) {
  if (!phone && !whatsapp) return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-lg px-3">
      <div className="glass shadow-float-lg rounded-2xl border border-gold/20 p-2.5">
        <ContactButtons
          propertyId={propertyId}
          title={title}
          area={area}
          city={city}
          listingType={listingType}
          propertyType={propertyType}
          bedrooms={bedrooms}
          agentId={agentId}
          phone={phone}
          whatsapp={whatsapp}
          layout="detail"
          placement="sticky"
        />
      </div>
    </div>
  );
}
