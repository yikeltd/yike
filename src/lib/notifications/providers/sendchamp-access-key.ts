import { looksLikeSupabaseKey } from "./sendchamp-keys";

export type SendchampAccessKeySource = "SENDCHAMP_API_KEY" | "SENDCHAMP_PUBLIC_KEY";

const DEFAULT_BASE_URL = "https://api.sendchamp.com/api/v1";
const VERIFICATION_CREATE_PATH = "/verification/create";

/** Reject copied .env.example placeholders — they must not win over a real key. */
export function isPlaceholderSendchampKey(key: string): boolean {
  const lower = key.trim().toLowerCase();
  if (!lower || lower.length < 12) return true;
  return (
    /your-sendchamp|your-.*-key|changeme|example|replace-me|xxx+|placeholder/.test(
      lower
    ) || lower === "test"
  );
}

function readEnvKey(name: "SENDCHAMP_API_KEY" | "SENDCHAMP_PUBLIC_KEY"): {
  raw: string | undefined;
  trimmed: string;
  hasOuterWhitespace: boolean;
} {
  const raw = process.env[name];
  if (raw === undefined) {
    return { raw: undefined, trimmed: "", hasOuterWhitespace: false };
  }
  const trimmed = raw.trim();
  return {
    raw,
    trimmed,
    hasOuterWhitespace: raw !== trimmed,
  };
}

function listSendchampAccessKeyCandidates(): Array<{
  source: SendchampAccessKeySource;
  trimmed: string;
}> {
  const api = readEnvKey("SENDCHAMP_API_KEY");
  const pub = readEnvKey("SENDCHAMP_PUBLIC_KEY");
  const raw: Array<{ source: SendchampAccessKeySource; trimmed: string }> = [
    { source: "SENDCHAMP_API_KEY", trimmed: api.trimmed },
    { source: "SENDCHAMP_PUBLIC_KEY", trimmed: pub.trimmed },
  ];

  return raw.filter(({ trimmed }) => {
    if (!trimmed) return false;
    if (looksLikeSupabaseKey(trimmed)) return false;
    if (isPlaceholderSendchampKey(trimmed)) return false;
    return true;
  });
}

/**
 * When both env vars hold the same access key, keep legacy `SENDCHAMP_PUBLIC_KEY` labeling.
 * When they differ (often a truncated shell export vs full `.env.local`), use the longer value.
 */
export function pickSendchampAccessKeyCandidate(
  candidates: Array<{ source: SendchampAccessKeySource; trimmed: string }>
): { key: string; source: SendchampAccessKeySource } | null {
  if (candidates.length === 0) return null;

  const uniqueValues = new Map<string, SendchampAccessKeySource>();
  for (const candidate of candidates) {
    const existing = uniqueValues.get(candidate.trimmed);
    if (!existing || candidate.source === "SENDCHAMP_PUBLIC_KEY") {
      uniqueValues.set(candidate.trimmed, candidate.source);
    }
  }

  if (uniqueValues.size === 1) {
    const [key, source] = uniqueValues.entries().next().value!;
    return { key, source };
  }

  let best = candidates[0]!;
  for (const candidate of candidates.slice(1)) {
    if (candidate.trimmed.length > best.trimmed.length) {
      best = candidate;
      continue;
    }
    if (
      candidate.trimmed.length === best.trimmed.length &&
      candidate.source === "SENDCHAMP_PUBLIC_KEY"
    ) {
      best = candidate;
    }
  }

  return { key: best.trimmed, source: best.source };
}

/**
 * Sendchamp Verify API expects the dashboard **API Access Key** (Bearer).
 * `SENDCHAMP_PUBLIC_KEY` and `SENDCHAMP_API_KEY` are aliases; pick the usable value.
 */
export function resolveSendchampAccessKey(): {
  key: string;
  source: SendchampAccessKeySource;
} | null {
  return pickSendchampAccessKeyCandidate(listSendchampAccessKeyCandidates());
}

export function getSendchampVerificationBaseUrl(): string {
  return process.env.SENDCHAMP_LIVE_BASE_URL?.trim() || DEFAULT_BASE_URL;
}

export function getSendchampVerificationAuthDiagnostic(): {
  sendchampPublicKey: {
    present: boolean;
    trimmedLength: number;
    hasOuterWhitespace: boolean;
  };
  sendchampApiKey: {
    present: boolean;
    trimmedLength: number;
    hasOuterWhitespace: boolean;
  };
  activeKeySource: SendchampAccessKeySource | "none";
  keyShapeHint: "sendchamp_live" | "sendchamp_public" | "other" | "none";
  baseUrl: string;
  verificationCreateEndpoint: string;
  authHeaderFormat: "Bearer <access-key>";
  envHints: string[];
} {
  const pub = readEnvKey("SENDCHAMP_PUBLIC_KEY");
  const api = readEnvKey("SENDCHAMP_API_KEY");
  const resolved = resolveSendchampAccessKey();
  const baseUrl = getSendchampVerificationBaseUrl();
  const hints: string[] = [];

  if (api.trimmed && isPlaceholderSendchampKey(api.trimmed)) {
    hints.push(
      "SENDCHAMP_API_KEY looks like a placeholder — remove it or set your Sendchamp Access key from the dashboard."
    );
  }
  if (pub.trimmed && looksLikeSupabaseKey(pub.trimmed)) {
    hints.push("SENDCHAMP_PUBLIC_KEY looks like a Supabase JWT — use Sendchamp Access key instead.");
  }
  if (resolved?.source === "SENDCHAMP_PUBLIC_KEY" && resolved.key.startsWith("sendchamp_live_")) {
    hints.push(
      "Live Access key is in SENDCHAMP_PUBLIC_KEY — works today, but prefer SENDCHAMP_API_KEY (Sendchamp → Account → APIs & webhooks → Access key)."
    );
  }
  if (!resolved) {
    hints.push("No usable Sendchamp Access key — set SENDCHAMP_API_KEY from app.sendchamp.com.");
  }
  if (
    api.trimmed &&
    pub.trimmed &&
    api.trimmed !== pub.trimmed &&
    api.trimmed.length !== pub.trimmed.length
  ) {
    hints.push(
      "SENDCHAMP_API_KEY and SENDCHAMP_PUBLIC_KEY differ in length — using the longer value. Quote keys in .env.local if they contain `$`, and unset stale SENDCHAMP_* exports in your shell before `npm run dev`."
    );
  }

  let keyShapeHint: "sendchamp_live" | "sendchamp_public" | "other" | "none" = "none";
  if (resolved?.key.startsWith("sendchamp_live_")) keyShapeHint = "sendchamp_live";
  else if (resolved?.key.startsWith("sendchamp_pub")) keyShapeHint = "sendchamp_public";
  else if (resolved) keyShapeHint = "other";

  return {
    sendchampPublicKey: {
      present: pub.trimmed.length > 0,
      trimmedLength: pub.trimmed.length,
      hasOuterWhitespace: pub.hasOuterWhitespace,
    },
    sendchampApiKey: {
      present: api.trimmed.length > 0,
      trimmedLength: api.trimmed.length,
      hasOuterWhitespace: api.hasOuterWhitespace,
    },
    activeKeySource: resolved?.source ?? "none",
    keyShapeHint,
    baseUrl,
    verificationCreateEndpoint: `${baseUrl}${VERIFICATION_CREATE_PATH}`,
    authHeaderFormat: "Bearer <access-key>",
    envHints: hints,
  };
}

export { VERIFICATION_CREATE_PATH };
