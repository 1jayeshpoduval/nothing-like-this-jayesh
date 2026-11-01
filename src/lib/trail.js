// Geometry and colour bands for the snap trail (components/experience/SnapTrail).
// Timing and tuning values live in constants.js (TRAIL_*).
//
// The trail is a stroke-dashoffset sweep. Every band is a dash on the slot's
// rectangle, and all bands share one head position that travels clockwise from
// the top-left corner (keyframes in index.css). The speed is uniform along the
// perimeter, unlike a rotating conic gradient, which speeds up at the corners.
//
// A stroke cannot change width or colour along its own length, so the streak is
// built from TRAIL_BANDS non-overlapping bands, each a short arc with its own
// width, colour and opacity:
//   - width: exponential taper, needle-thin (TRAIL_STROKE_MIN_PX) for most of the
//     tail, swelling to TRAIL_STROKE_MAX_PX only near the head;
//   - colour: transparent yellow tail -> bright yellow mid -> white-hot head;
//   - opacity: fades toward the tail so the streak dissolves rather than ends;
//   - core: one short white bar last, so it sits on top at the head.
// Bands are drawn tail -> head, so the head paints last.

import {
  IMAGE_HEIGHT,
  IMAGE_WIDTH,
  TRAIL_BANDS,
  TRAIL_CORE_COLOR,
  TRAIL_CORE_LENGTH_PX,
  TRAIL_CORE_STROKE_PX,
  TRAIL_HEAD_BLOOM_START,
  TRAIL_HEAD_COLOR,
  TRAIL_LENGTH_PX,
  TRAIL_MID_COLOR,
  TRAIL_MID_COLOR_POSITION,
  TRAIL_OPACITY_EXPONENT,
  TRAIL_STROKE_MAX_PX,
  TRAIL_STROKE_EXPONENT,
  TRAIL_STROKE_MIN_PX,
  TRAIL_TAIL_COLOR,
  TRAIL_TAIL_OPACITY,
} from "./constants.js";

// The rect is inset by half the widest stroke so even the head stays inside the slot.
const STROKE_INSET = TRAIL_STROKE_MAX_PX / 2;

// Overlap between neighbouring bands, in CSS px. Butt caps at exact boundaries
// leave hairline seams from anti-aliasing; a sub-pixel overlap hides them.
const BAND_SEAM_OVERLAP_PX = 0.5;

export const TRAIL_RECT = Object.freeze({
  x: STROKE_INSET,
  y: STROKE_INSET,
  width: IMAGE_WIDTH - TRAIL_STROKE_MAX_PX,
  height: IMAGE_HEIGHT - TRAIL_STROKE_MAX_PX,
});

// Perimeter of TRAIL_RECT in user units. One lap moves the head this far.
export const TRAIL_PERIMETER = 2 * (TRAIL_RECT.width + TRAIL_RECT.height);

// Gap after each dash. It must exceed the perimeter so only one copy of a band
// is on the closed path at a time. 2x the perimeter leaves room for any offset.
const TRAIL_DASH_GAP_PX = 2 * TRAIL_PERIMETER;

// "#rrggbb" -> [r, g, b] (0-255).
const hexToRgb = (hex) => {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

// Linear mix of two hex colours at t (0..1), as an rgb() string for SVG.
export const mixHexColors = (from, to, t) => {
  const start = hexToRgb(from);
  const end = hexToRgb(to);
  const [r, g, b] = start.map((channel, index) =>
    Math.round(channel + (end[index] - channel) * t)
  );
  return `rgb(${r} ${g} ${b})`;
};

// A hex colour as an rgb() string for SVG (no mixing).
const hexToCss = (hex) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${r} ${g} ${b})`;
};

// Colour at ramp position t (0 = tail, 1 = head), piecewise-linear over the
// tail -> mid -> head stops. The head stop is held from TRAIL_HEAD_BLOOM_START on.
export const colorAtTrailPosition = (t) => {
  if (t <= TRAIL_MID_COLOR_POSITION) {
    return mixHexColors(
      TRAIL_TAIL_COLOR,
      TRAIL_MID_COLOR,
      t / TRAIL_MID_COLOR_POSITION
    );
  }
  if (t < TRAIL_HEAD_BLOOM_START) {
    const span = TRAIL_HEAD_BLOOM_START - TRAIL_MID_COLOR_POSITION;
    return mixHexColors(
      TRAIL_MID_COLOR,
      TRAIL_HEAD_COLOR,
      (t - TRAIL_MID_COLOR_POSITION) / span
    );
  }
  return hexToCss(TRAIL_HEAD_COLOR);
};

// Opacity at ramp position t: TRAIL_TAIL_OPACITY at the tail rising to 1 at the head.
export const opacityAtTrailPosition = (t) =>
  TRAIL_TAIL_OPACITY +
  (1 - TRAIL_TAIL_OPACITY) * t ** TRAIL_OPACITY_EXPONENT;

// Stroke width at ramp position t: exponential from the tail's minimum to the
// head's maximum. Stays near TRAIL_STROKE_MIN_PX until t is close to 1.
export const widthAtTrailPosition = (t) =>
  TRAIL_STROKE_MIN_PX +
  (TRAIL_STROKE_MAX_PX - TRAIL_STROKE_MIN_PX) * t ** TRAIL_STROKE_EXPONENT;

// One dash on the perimeter. `startOffset` is the stroke-dashoffset at the start
// of the sweep (distance from the head to the band's far edge); the sweep keyframe
// subtracts the perimeter, so the band travels one full lap.
// `dashLength` is the band's arc length.
const makeBand = ({ dashLength, startOffset, width, color, opacity }) => ({
  dashArray: `${dashLength}px ${TRAIL_DASH_GAP_PX}px`,
  startOffset,
  width,
  color,
  opacity,
});

// Bands from tail to head, then the core. Band k covers the distance behind the
// head between `inner` and `outer`, so the bands tile the streak with no gaps.
// Each band's ramp position is its midpoint, so colour, width and opacity step
// smoothly from tail to head.
// `widthScale` multiplies every stroke width (1 for the sharp streak; the bloom
// layer passes TRAIL_BLOOM_WIDTH_SCALE). Geometry and colour are unchanged.
export const getTrailBands = (widthScale = 1) => {
  const bands = Array.from({ length: TRAIL_BANDS }, (_, index) => {
    const inner = ((TRAIL_BANDS - index - 1) / TRAIL_BANDS) * TRAIL_LENGTH_PX;
    const outer = ((TRAIL_BANDS - index) / TRAIL_BANDS) * TRAIL_LENGTH_PX;
    const t = (index + 0.5) / TRAIL_BANDS;
    return makeBand({
      dashLength: outer - inner + BAND_SEAM_OVERLAP_PX,
      startOffset: outer + BAND_SEAM_OVERLAP_PX,
      width: widthAtTrailPosition(t) * widthScale,
      color: colorAtTrailPosition(t),
      opacity: opacityAtTrailPosition(t),
    });
  });

  // White core: a thin bar from the head back, drawn over the thick head band.
  bands.push(
    makeBand({
      dashLength: TRAIL_CORE_LENGTH_PX,
      startOffset: TRAIL_CORE_LENGTH_PX,
      width: TRAIL_CORE_STROKE_PX * widthScale,
      color: TRAIL_CORE_COLOR,
      opacity: 1,
    })
  );

  return bands;
};
