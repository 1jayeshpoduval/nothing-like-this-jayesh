// Fluted lenticular lens - SVG filter parameter logic.
//
// Pure string/number builders for FlutedLenticularLens.jsx: the periodic
// vertical-stripe displacement map (an feImage data URI), the CSS ridge
// highlight gradient, and the filter region. No React and no DOM access.
// The lens overlay owns no image content - it only distorts whatever sits
// behind it (backdrop-filter) and paints its own ridge highlights.
//
// The flute wave is deliberately deterministic and periodic (a repeating
// cosine ramp, not feTurbulence noise): flutes must stay evenly spaced so
// the ridge highlights line up with the distortion.

// --- Tunables ---

// Ridges across the lens width (pitch = width / fluteCount; ~12 px on the
// 600 px stage lens). Raise for finer flutes, lower for broader ones.
export const FLUTE_COUNT = 90;

// feDisplacementMap `scale`: total horizontal sway in CSS px across one
// ridge (displacement / 2 to each side). Kept light on purpose - the look
// is subtle refraction, not a funhouse mirror.
export const FLUTE_DISPLACEMENT = 2;

// Filter region headroom per side, as a fraction of the lens box. The
// region must exceed the displacement margin (displacement / 2) so pixels
// displaced near the visible edge sample real backdrop instead of the
// transparent area outside the filter input.
export const FLUTE_REGION_OVERSHOOT = 0.05;

// The filter region spans the lens box times this ratio per dimension.
const REGION_RATIO = 1 + 2 * FLUTE_REGION_OVERSHOOT;

// Intrinsic size of the generated map image. feImage stretches it over the
// filter region; the height is arbitrary because the wave is constant
// along y (vertical flutes). A generous width keeps rasterised maps crisp
// when a browser renders the SVG at its intrinsic size first.
const MAP_WIDTH = 1200;
const MAP_HEIGHT = 8;

// One flute period of the displacement wave: a cosine ramp sampled at
// eighths (0 -> 1 -> 0), so the linear interpolation between gradient stops
// approximates a smooth sine. Values are gray levels 0..1; the R channel
// drives the horizontal sway and FlutedLenticularLens pins G/B to neutral
// (feColorMatrix) so nothing drifts vertically.
const FLUTE_WAVE_STOPS = [
  [0, 0],
  [0.125, 0.1464],
  [0.25, 0.5],
  [0.375, 0.8536],
  [0.5, 1],
  [0.625, 0.8536],
  [0.75, 0.5],
  [0.875, 0.1464],
  [1, 0],
];

const waveStopColor = (value) => {
  const byte = Math.round(value * 255);
  return `rgb(${byte}, ${byte}, ${byte})`;
};

// Explicit filter region (objectBoundingBox percentages) around the lens
// box: the overshoot keeps displaced edge samples inside the filter input.
export const buildFlutedFilterRegion = () => {
  const over = FLUTE_REGION_OVERSHOOT * 100;
  return {
    x: `${-over}%`,
    y: `${-over}%`,
    width: `${100 + 2 * over}%`,
    height: `${100 + 2 * over}%`,
  };
};

// Data URI for the feImage displacement map: a repeating cosine ramp that
// alternates left/right refraction per flute. feImage's default subregion is
// the whole filter region (filter-effects-1 section 9.4 special case;
// verified in Chromium - explicit width="100%" would bind to the bounding
// box instead, so the component deliberately omits the subregion
// attributes). The map therefore carries fluteCount * REGION_RATIO periods
// to land exactly fluteCount ridges on the visible lens box - which also
// keeps it in phase with the CSS ridge highlights (those span the lens box).
export const buildFluteDisplacementMap = ({ fluteCount }) => {
  const period = Number((MAP_WIDTH / (fluteCount * REGION_RATIO)).toFixed(4));
  const stops = FLUTE_WAVE_STOPS.map(
    ([offset, value]) =>
      `<stop offset="${offset}" stop-color="${waveStopColor(value)}"/>`,
  ).join("");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${MAP_WIDTH}" height="${MAP_HEIGHT}" viewBox="0 0 ${MAP_WIDTH} ${MAP_HEIGHT}" preserveAspectRatio="none">` +
    `<defs><linearGradient id="f" gradientUnits="userSpaceOnUse" spreadMethod="repeat" x1="0" y1="0" x2="${period}" y2="0">${stops}</linearGradient></defs>` +
    `<rect width="${MAP_WIDTH}" height="${MAP_HEIGHT}" fill="url(#f)"/>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

// CSS ridge highlights for the overlay that sits above the filtered layer
// (deliberately outside the filter, so the ridges and rim are never
// distorted). One ridge per period: a soft rim-colored crest (#e8e8e8, the
// --color-rim token) then a faint trough shadow. Stop positions are
// fractions of one flute period (100 / fluteCount % of the lens width);
// repeating-linear-gradient tiles them across the lens.
export const buildFluteHighlightGradient = ({ fluteCount }) => {
  const periodPct = 100 / fluteCount;
  const at = (fraction) => `${(periodPct * fraction).toFixed(4)}%`;
  return [
    "repeating-linear-gradient(90deg,",
    `rgba(232, 232, 232, 0) ${at(0)},`,
    `rgba(232, 232, 232, 0.12) ${at(0.2)},`,
    `rgba(232, 232, 232, 0.03) ${at(0.45)},`,
    `rgba(0, 0, 0, 0.16) ${at(0.7)},`,
    `rgba(232, 232, 232, 0) ${at(1)})`,
  ].join(" ");
};
