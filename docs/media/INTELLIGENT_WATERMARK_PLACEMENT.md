# Future Enhancement: Context-Aware Intelligent Watermark Placement

**Status:** Designed · **Not enabled in Phase 1**  
**Depends on:** Media Protection Pipeline (`MEDIA_PROTECTION_ARCHITECTURE.md`)

---

## Objective

Improve visible watermark placement by analyzing image content and choosing a low-detail region (sky, pavement, grass, blank wall) instead of always using the bottom-right corner.

Phase 1 keeps adaptive bottom-right placement. This document defines the upgrade path so placement can be swapped without changing upload APIs or storage.

---

## Design goals

- Keep watermarks readable and elegant  
- Avoid plates, entrances, interiors, faces, logos, signage  
- Remain fast (prefer classical CV over heavy AI inference)  
- Fallback to corner strategy if analysis fails  

---

## Module boundary

```
src/lib/media/protection/placement/
  analyze.ts      # edge density / variance maps
  candidates.ts   # scored regions
  select.ts       # pick best + jitter
  index.ts        # PlacementResult { x, y, color }
```

`watermark.ts` accepts an optional `PlacementResult`. If missing or feature flag off → current corner strategy.

---

## Algorithm (v1 — lightweight)

1. Downscale to ≤ 256px long edge grayscale  
2. Compute local variance + Sobel edge density on a grid (e.g. 8×8 cells)  
3. Score cells: low variance + low edges = better  
4. Penalize cells near top-left social-crop zones; prefer lower third / margins with safe inset  
5. Pick best cell; convert to pixel coordinates for watermark anchor  
6. Choose white vs gold from mean luminance in that cell  
7. Apply small deterministic jitter from image UUID  

---

## Configuration

| Flag | Purpose |
|------|---------|
| `ENABLE_INTELLIGENT_WATERMARK_PLACEMENT` | Feature gate (default false) |
| `MEDIA_WM_PLACE_MARGIN_PCT` | Edge margin |
| `MEDIA_WM_PLACE_GRID` | Analysis grid size |
| `MEDIA_WM_PLACE_MAX_MS` | Soft time budget; exceed → fallback |

---

## Fallback

Any analysis error or empty candidate set → Phase 1 bottom-right adaptive watermark. Uploads must never fail solely because placement analysis failed.

---

## Future AI roadmap

- Semantic segmentation (sky/road/wall) when latency budget allows  
- Face / plate detectors as hard avoid zones  
- A/B metrics: crop survival rate on WA/FB previews  

Do not redesign `media_assets` or storage buckets for this upgrade — only add optional JSON placement metadata.
