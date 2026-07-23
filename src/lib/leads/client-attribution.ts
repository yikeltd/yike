/** Client-side attribution for WhatsApp / call lead tracking. */

export type LeadClientAttribution = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  referral?: string | null;
  device?: "mobile" | "tablet" | "desktop" | "unknown";
  sourceCampaign?: string | null;
};

function readParam(params: URLSearchParams, key: string): string | null {
  const v = params.get(key)?.trim();
  return v ? v.slice(0, 128) : null;
}

export function detectDeviceType(): LeadClientAttribution["device"] {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "mobile";
  return "desktop";
}

/** Read UTM + referral from the current URL (and document.referrer). */
export function collectLeadClientAttribution(): LeadClientAttribution {
  if (typeof window === "undefined") {
    return { device: "unknown" };
  }

  const params = new URLSearchParams(window.location.search);
  const utmCampaign = readParam(params, "utm_campaign");
  const referral =
    readParam(params, "ref") ||
    readParam(params, "referral") ||
    (document.referrer
      ? (() => {
          try {
            return new URL(document.referrer).hostname.slice(0, 128);
          } catch {
            return null;
          }
        })()
      : null);

  return {
    utmSource: readParam(params, "utm_source"),
    utmMedium: readParam(params, "utm_medium"),
    utmCampaign,
    utmContent: readParam(params, "utm_content"),
    utmTerm: readParam(params, "utm_term"),
    referral,
    device: detectDeviceType(),
    sourceCampaign: utmCampaign,
  };
}
