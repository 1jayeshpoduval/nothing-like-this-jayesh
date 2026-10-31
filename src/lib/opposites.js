// Opposite-image pairing for the lenticular experience.
// Source: .agents/docs/implementation-plan.md — section 2.2 / Session 3A.
//
// Simplified fixed-pair prototype: instead of the original per-filename
// manifest, there is exactly one pair. The uploaded "bright-minimal-interior"
// always resolves to the bundled airport interior opposite.

// The always-opposite image for this prototype, served from public/ at the root.
export const OPPOSITE_IMAGE_URL = "/images/airport-interior-lights.webp";

// Identifier of the single supported pair (the upload the user tests with).
export const DEFAULT_PAIR_ID = "bright-minimal-interior";

// Frozen so callers cannot mutate the shared pair record.
const FIXED_PAIR = Object.freeze({
  pairId: DEFAULT_PAIR_ID,
  oppositeUrl: OPPOSITE_IMAGE_URL,
  matched: true,
});

// Resolves the opposite for an upload. No argument is used: every upload maps
// to the fixed pair (`matched: true`), so no filename normalization or
// manifest lookup is needed in this prototype.
export const resolvePair = () => FIXED_PAIR;
