# Distance Validation Report

**Date:** 2026-07-23  
**Status:** Implemented locally · **Do not commit until founder review**

---

## Constraint

Listings have **no `lat`/`lng` columns** in schema today. Distance uses:

1. User origin: GPS coords when geo granted, else preferred city centroid  
2. Listing origin: city centroid from `CITY_CENTROIDS` (state-disambiguated when possible)

Accuracy is **city-level** (~5–40 km), not street-level — labels use `~` prefix.

---

## Display

Browse cards (property + vehicle) show distance next to the pin line when a marketplace location is set:

```
📍 Osisioma, Aba                    ~2 km
```

Formatting (`formatDistanceKm`):

- &lt; 1 km → `~1 km`  
- &lt; 10 → nearest km  
- &lt; 100 → round to 5 km  
- else → round to 10 km  

Same-city listings show a small local distance (≥ ~2 km) rather than `0 km`, reflecting centroid approximation honesty.

---

## Sample checks

| Origin | Listing city | Approx label |
|--------|--------------|--------------|
| Yola GPS | Yola | ~2 km |
| Yola GPS | Aba | ~730 km |
| Aba centroid | Aba | ~2 km |

Component: `src/components/marketplace/listing-distance-label.tsx`  
Math: `src/lib/marketplace-location/distance.ts` + `centroids.ts`

---

## Future (not in this change)

Optional listing lat/lng migration when agents start capturing map pins — distance helper already accepts coords if added later. Prefer that over inventing fake street precision now.
