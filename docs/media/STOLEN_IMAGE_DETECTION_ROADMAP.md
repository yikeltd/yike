# Future: Automatic Stolen-Image Detection

**Status:** Roadmap (post-launch)  
**Depends on:** Media Protection fingerprints (`media_assets.sha256|ahash|dhash|phash`)

---

## Objective

Use existing fingerprints to detect reused, cropped, or lightly edited listing images — without blocking legitimate sellers via false positives.

---

## Launch posture (recommended)

Do **not** auto-reject uploads at first.

| Confidence | Signal (illustrative) | Action |
|------------|------------------------|--------|
| High | Exact SHA256 match to another owner’s asset, or pHash distance ≤ 4 | Flag for Lex admin review queue |
| Medium | pHash/dHash distance ≤ 10 to another listing | Allow upload + moderator alert |
| Low | Distance 11–16 | Record analytics only |

Same-seller re-upload of identical photo (draft → publish) should be allowlisted.

---

## Implementation sketch

1. On protect persist, query near-neighbors by `phash` / `sha256`  
2. Insert `media_duplicate_signals` row (no UX block)  
3. Lex Auth / Tech queue: review, dismiss, or escalate listing  
4. Later: tune thresholds on real Nigerian listing corpus  

Reuse `compareFingerprints()` / `isNearDuplicatePhash()` — no schema redesign required beyond a signals table.
