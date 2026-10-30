import { NIGERIAN_STATES } from "@/lib/constants";

export const SELLER_PROFILE_REVIEW_CONFIG = {
  /** Auto-approve only at or above this confidence (0–1). */
  autoApproveMinConfidence: 0.85,
  minAgeYears: 18,
  minAddressLength: 8,
  minNameParts: 2,
} as const;

export type ProfileReviewRecommendation = "approve" | "review";

export type ProfileReviewReasonCode =
  | "email_not_verified"
  | "phone_not_verified"
  | "profile_incomplete"
  | "duplicate_phone"
  | "duplicate_email"
  | "prior_rejection"
  | "invalid_dob"
  | "underage"
  | "invalid_state"
  | "short_address"
  | "weak_name"
  | "account_banned"
  | "policy_sensitive"
  | "provider_unavailable"
  | "provider_invalid_output"
  | "low_confidence";

export type ProfileReviewInput = {
  userId: string;
  fullName: string | null;
  email: string | null;
  emailVerified: boolean;
  phone: string | null;
  phoneVerified: boolean;
  dateOfBirth: string;
  residentialAddress: string;
  residentialState: string;
  occupation: string | null;
  isBanned: boolean;
  priorRejection: boolean;
  duplicatePhoneUserIds: string[];
  duplicateEmailUserIds: string[];
};

export type ProfileReviewResult = {
  recommendation: ProfileReviewRecommendation;
  confidence: number;
  reasonCodes: ProfileReviewReasonCode[];
  modelVersion: string;
  schemaValid: boolean;
  providerError: boolean;
};

export type LlmReviewPayload = {
  recommendation: ProfileReviewRecommendation;
  confidence: number;
  reasonCodes?: ProfileReviewReasonCode[];
};

const ALLOWED_LLM_REASONS = new Set<ProfileReviewReasonCode>([
  "policy_sensitive",
  "low_confidence",
  "weak_name",
  "short_address",
]);

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function ageFromDob(dob: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob.trim());
  if (!match) return null;
  const birth = new Date(`${dob}T12:00:00Z`);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const m = today.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }
  return age;
}

/** Deterministic evidence review (always runs). */
export function evaluateSellerProfileRules(
  input: ProfileReviewInput
): ProfileReviewResult {
  const reasonCodes: ProfileReviewReasonCode[] = [];
  let confidence = 1;

  if (input.isBanned) {
    reasonCodes.push("account_banned");
    confidence = 0;
  }
  if (!input.emailVerified) {
    reasonCodes.push("email_not_verified");
    confidence = Math.min(confidence, 0.2);
  }
  if (!input.phoneVerified) {
    reasonCodes.push("phone_not_verified");
    confidence = Math.min(confidence, 0.2);
  }
  if (
    !input.dateOfBirth?.trim() ||
    !input.residentialAddress?.trim() ||
    !input.residentialState?.trim()
  ) {
    reasonCodes.push("profile_incomplete");
    confidence = Math.min(confidence, 0.3);
  }

  const age = ageFromDob(input.dateOfBirth);
  if (age === null) {
    reasonCodes.push("invalid_dob");
    confidence = Math.min(confidence, 0.25);
  } else if (age < SELLER_PROFILE_REVIEW_CONFIG.minAgeYears) {
    reasonCodes.push("underage");
    confidence = Math.min(confidence, 0.1);
  }

  const stateNorm = input.residentialState.trim().toLowerCase();
  if (
    input.residentialState.trim() &&
    !NIGERIAN_STATES.some((s) => s.toLowerCase() === stateNorm)
  ) {
    reasonCodes.push("invalid_state");
    confidence = Math.min(confidence, 0.4);
  }

  if (
    input.residentialAddress.trim().length > 0 &&
    input.residentialAddress.trim().length <
      SELLER_PROFILE_REVIEW_CONFIG.minAddressLength
  ) {
    reasonCodes.push("short_address");
    confidence = Math.min(confidence, 0.55);
  }

  const nameParts = (input.fullName ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (nameParts.length < SELLER_PROFILE_REVIEW_CONFIG.minNameParts) {
    reasonCodes.push("weak_name");
    confidence = Math.min(confidence, 0.7);
  }

  if (input.priorRejection) {
    reasonCodes.push("prior_rejection");
    confidence = Math.min(confidence, 0.45);
  }

  const phoneDupes = input.duplicatePhoneUserIds.filter((id) => id !== input.userId);
  if (phoneDupes.length > 0) {
    reasonCodes.push("duplicate_phone");
    confidence = Math.min(confidence, 0.15);
  }

  const emailDupes = input.duplicateEmailUserIds.filter((id) => id !== input.userId);
  if (emailDupes.length > 0) {
    reasonCodes.push("duplicate_email");
    confidence = Math.min(confidence, 0.15);
  }

  const recommendation: ProfileReviewRecommendation =
    confidence >= SELLER_PROFILE_REVIEW_CONFIG.autoApproveMinConfidence &&
    reasonCodes.length === 0
      ? "approve"
      : "review";

  return {
    recommendation,
    confidence: clampConfidence(confidence),
    reasonCodes,
    modelVersion: "rules-v1",
    schemaValid: true,
    providerError: false,
  };
}

export function parseLlmReviewPayload(raw: unknown): LlmReviewPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const recommendation = obj.recommendation;
  const confidence = obj.confidence;
  if (recommendation !== "approve" && recommendation !== "review") return null;
  if (typeof confidence !== "number" || !Number.isFinite(confidence)) return null;
  const reasonCodes: ProfileReviewReasonCode[] = [];
  if (Array.isArray(obj.reasonCodes)) {
    for (const code of obj.reasonCodes) {
      if (typeof code === "string" && ALLOWED_LLM_REASONS.has(code as ProfileReviewReasonCode)) {
        reasonCodes.push(code as ProfileReviewReasonCode);
      }
    }
  }
  return {
    recommendation,
    confidence: clampConfidence(confidence),
    reasonCodes,
  };
}

export function mergeProfileReviewResults(
  rules: ProfileReviewResult,
  llm: ProfileReviewResult | null
): ProfileReviewResult {
  if (!llm) return rules;
  if (llm.providerError || !llm.schemaValid) {
    return {
      recommendation: "review",
      confidence: 0,
      reasonCodes: [...new Set([...rules.reasonCodes, ...llm.reasonCodes])],
      modelVersion: llm.modelVersion,
      schemaValid: false,
      providerError: true,
    };
  }
  const reasonCodes = [...new Set([...rules.reasonCodes, ...llm.reasonCodes])];
  const confidence = Math.min(rules.confidence, llm.confidence);
  const recommendation: ProfileReviewRecommendation =
    rules.recommendation === "review" ||
    llm.recommendation === "review" ||
    confidence < SELLER_PROFILE_REVIEW_CONFIG.autoApproveMinConfidence
      ? "review"
      : "approve";
  return {
    recommendation,
    confidence,
    reasonCodes,
    modelVersion: `${rules.modelVersion}+${llm.modelVersion}`,
    schemaValid: rules.schemaValid && llm.schemaValid,
    providerError: rules.providerError || llm.providerError,
  };
}

export function sellerAiReviewEnabled(): boolean {
  return (
    process.env.YIKE_SELLER_AI_REVIEW === "true" &&
    Boolean(process.env.OPENAI_API_KEY?.trim())
  );
}

/** Optional LLM assist — never trusted without schema validation. */
export async function fetchOptionalLlmSellerReview(
  input: ProfileReviewInput
): Promise<ProfileReviewResult | null> {
  if (!sellerAiReviewEnabled()) return null;

  const apiKey = process.env.OPENAI_API_KEY!.trim();
  const model = process.env.YIKE_SELLER_AI_REVIEW_MODEL?.trim() || "gpt-4o-mini";

  const system = `You assist Yike staff by scoring seller onboarding profiles. Respond with JSON only: {"recommendation":"approve"|"review","confidence":0-1,"reasonCodes":[]}. reasonCodes may only use: policy_sensitive, low_confidence, weak_name, short_address. Missing optional fields are NOT fraud. Never approve duplicate contacts or unverified email/phone — use review with low confidence.`;

  const userPayload = {
    fullName: input.fullName,
    emailVerified: input.emailVerified,
    phoneVerified: input.phoneVerified,
    state: input.residentialState,
    addressLength: input.residentialAddress.length,
    hasOccupation: Boolean(input.occupation?.trim()),
    duplicatePhone: input.duplicatePhoneUserIds.length > 0,
    duplicateEmail: input.duplicateEmailUserIds.length > 0,
    priorRejection: input.priorRejection,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify(userPayload) },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        recommendation: "review",
        confidence: 0,
        reasonCodes: ["provider_unavailable"],
        modelVersion: `openai-${model}`,
        schemaValid: false,
        providerError: true,
      };
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return {
        recommendation: "review",
        confidence: 0,
        reasonCodes: ["provider_invalid_output"],
        modelVersion: `openai-${model}`,
        schemaValid: false,
        providerError: true,
      };
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(content);
    } catch {
      return {
        recommendation: "review",
        confidence: 0,
        reasonCodes: ["provider_invalid_output"],
        modelVersion: `openai-${model}`,
        schemaValid: false,
        providerError: true,
      };
    }

    const parsed = parseLlmReviewPayload(parsedJson);
    if (!parsed) {
      return {
        recommendation: "review",
        confidence: 0,
        reasonCodes: ["provider_invalid_output"],
        modelVersion: `openai-${model}`,
        schemaValid: false,
        providerError: true,
      };
    }

    return {
      recommendation: parsed.recommendation,
      confidence: parsed.confidence,
      reasonCodes: parsed.reasonCodes ?? [],
      modelVersion: `openai-${model}`,
      schemaValid: true,
      providerError: false,
    };
  } catch {
    return {
      recommendation: "review",
      confidence: 0,
      reasonCodes: ["provider_unavailable"],
      modelVersion: "openai-error",
      schemaValid: false,
      providerError: true,
    };
  }
}

export async function runSellerProfileReview(
  input: ProfileReviewInput
): Promise<ProfileReviewResult> {
  const rules = evaluateSellerProfileRules(input);
  const aiEnabled = sellerAiReviewEnabled();

  if (!aiEnabled) {
    return rules;
  }

  const llm = await fetchOptionalLlmSellerReview(input);
  if (!llm) {
    return {
      recommendation: "review",
      confidence: 0,
      reasonCodes: [...rules.reasonCodes, "provider_unavailable"],
      modelVersion: "rules-v1+provider-missing",
      schemaValid: false,
      providerError: true,
    };
  }

  if (llm.providerError || !llm.schemaValid) {
    return {
      recommendation: "review",
      confidence: 0,
      reasonCodes: [...rules.reasonCodes, ...llm.reasonCodes],
      modelVersion: llm.modelVersion,
      schemaValid: false,
      providerError: true,
    };
  }

  return mergeProfileReviewResults(rules, llm);
}

/** Server-side approval gate — mandatory checks + review output. */
export function canAutoApproveSellerProfile(
  review: ProfileReviewResult,
  input: ProfileReviewInput
): boolean {
  if (review.providerError || !review.schemaValid) return false;
  if (review.recommendation !== "approve") return false;
  if (review.confidence < SELLER_PROFILE_REVIEW_CONFIG.autoApproveMinConfidence) {
    return false;
  }
  if (!input.emailVerified || !input.phoneVerified) return false;
  if (input.isBanned || input.priorRejection) return false;
  if (input.duplicatePhoneUserIds.some((id) => id !== input.userId)) return false;
  if (input.duplicateEmailUserIds.some((id) => id !== input.userId)) return false;
  if (
    !input.dateOfBirth?.trim() ||
    !input.residentialAddress?.trim() ||
    !input.residentialState?.trim()
  ) {
    return false;
  }
  const age = ageFromDob(input.dateOfBirth);
  if (age === null || age < SELLER_PROFILE_REVIEW_CONFIG.minAgeYears) return false;
  const stateNorm = input.residentialState.trim().toLowerCase();
  if (!NIGERIAN_STATES.some((s) => s.toLowerCase() === stateNorm)) return false;
  return true;
}
