/** Enquiry reference — YK-9D8FK2 style (readable, unique enough for support). */

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomRefToken(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)]!;
  }
  return out;
}

/** @deprecated city/area no longer embedded — kept for call-site compatibility. */
export function leadCityCode(city: string, area?: string): string {
  const raw = (area || city || "NG").replace(/[^a-zA-Z]/g, "").toUpperCase();
  if (raw.length >= 3) return raw.slice(0, 4);
  const cityRaw = city.replace(/[^a-zA-Z]/g, "").toUpperCase();
  return (cityRaw.slice(0, 4) || "NG").padEnd(3, "X").slice(0, 4);
}

/** Unique enquiry reference e.g. YK-9D8FK2 */
export function generateLeadReference(_city?: string, _area?: string): string {
  return `YK-${randomRefToken(6)}`;
}
