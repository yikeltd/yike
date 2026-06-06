/** YK-{CITYCODE}-{SHORTID} e.g. YK-JAHI-442 */
export function leadCityCode(city: string, area?: string): string {
  const raw = (area || city || "NG").replace(/[^a-zA-Z]/g, "").toUpperCase();
  if (raw.length >= 3) return raw.slice(0, 4);
  const cityRaw = city.replace(/[^a-zA-Z]/g, "").toUpperCase();
  return (cityRaw.slice(0, 4) || "NG").padEnd(3, "X").slice(0, 4);
}

export function generateLeadReference(city: string, area?: string): string {
  const code = leadCityCode(city, area);
  const shortId = String(Math.floor(100 + Math.random() * 900));
  return `YK-${code}-${shortId}`;
}
