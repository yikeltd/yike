const SPAM_PATTERNS = [
  /\b(cheap|hot|urgent|call now|last last)\b.*\b(cheap|hot|urgent|call now|!!!+)\b/gi,
  /!{3,}/g,
  /🔥|💥|⚡/g,
];

export function hasSpammyTitle(title: string): boolean {
  const t = title.trim();
  if (t.length < 4) return true;
  if (/^(cheap|hot|urgent|call)/i.test(t) && /!{2,}/.test(t)) return true;
  return SPAM_PATTERNS.some((p) => p.test(t));
}

/** Soft cleanup — does not aggressively rewrite. */
export function softenListingTitle(title: string): string {
  let t = title.trim().replace(/\s+/g, " ");
  t = t.replace(/!{2,}/g, "!");
  t = t.replace(/\b(CHEAP|HOT|URGENT|CALL NOW)\b/gi, (m) =>
    m.charAt(0).toUpperCase() + m.slice(1).toLowerCase()
  );
  return t.slice(0, 120);
}

export function suggestListingTitle(input: {
  property_type?: string | null;
  bedrooms?: number;
  area?: string;
  city?: string;
}): string | null {
  const parts: string[] = [];
  if (input.bedrooms && input.bedrooms > 0) {
    parts.push(`${input.bedrooms} Bedroom`);
  }
  if (input.property_type) {
    const pt = input.property_type.replace(/_/g, " ");
    parts.push(pt.charAt(0).toUpperCase() + pt.slice(1));
  }
  const place = input.area || input.city;
  if (place) parts.push(`in ${place}`);
  if (parts.length < 2) return null;
  return parts.join(" ");
}
