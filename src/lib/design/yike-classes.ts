/**
 * Canonical YDS Tailwind bundles — browse cards, wizard panels, form controls.
 * Pair with utilities in `src/app/globals.css` (`.yike-listing-card`, etc.).
 */

/** Property / vehicle / electronics grid cards */
export const YIKE_LISTING_CARD =
  "group card-lift relative flex h-full flex-col overflow-hidden yike-listing-card";

/** Home hero verticals, seller category rows */
export const YIKE_MARKETPLACE_TILE = "yike-marketplace-tile";

/** Listing engine step panels (matches ListingDetailPanel) */
export const YIKE_WIZARD_PANEL = "yike-panel overflow-hidden";

/** Text inputs, selects, textareas in listing wizard */
export const YIKE_FIELD_CONTROL = "yike-field-control yike-focus";

/** Radio / filter chip in wizard */
export const YIKE_CHOICE_CHIP = "yike-choice-chip pressable min-h-[48px] px-5 py-2.5 text-xs md:text-sm flex items-center justify-center gap-2";

export const YIKE_CHOICE_CHIP_SELECTED = "yike-choice-chip--selected font-black";
