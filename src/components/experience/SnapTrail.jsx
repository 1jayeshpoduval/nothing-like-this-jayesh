// Snap trail: one lap around the 600x400 image slot, then a fade. The streak
// tapers from a needle-thin, transparent yellow tail to a thick, white-hot head,
// with a white core. It is drawn in two layers:
//   - bloom: a wider copy of the streak, blurred with a CSS blur, behind;
//   - sharp: the streak itself, with a white rim and yellow halo (drop-shadow).
// Timing: lib/constants.js (TRAIL_*). Geometry and per-band values: lib/trail.js.
//
// LensStage renders this only while isSnapping, so it starts on snap and is
// never shown in the lenticular stage. It sits inside the lens handle, so the
// lens crossfade hides it too. It is an absolute overlay with pointer-events-none
// and does not affect layout or scale. The overlay and its SVGs use
// overflow-visible: the bloom and glow extend past the 600x400 slot on purpose.
//
// Reduced motion: no sweep. A static, subtle full-slot ring is held for the
// lap duration, then fades.
//
// The component unmounts once the fade ends (onAnimationEnd on the wrapper).

import { useState } from "react";

import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion.js";
import {
  IMAGE_HEIGHT,
  IMAGE_WIDTH,
  TRAIL_BLOOM_BLUR_PX,
  TRAIL_BLOOM_OPACITY,
  TRAIL_BLOOM_WIDTH_SCALE,
  TRAIL_CORE_GLOW,
  TRAIL_FADE_MS,
  TRAIL_LAP_MS,
  TRAIL_MID_COLOR,
  TRAIL_REDUCED_OPACITY,
  TRAIL_REDUCED_STROKE_PX,
} from "../../lib/constants.js";
import {
  TRAIL_PERIMETER,
  TRAIL_RECT,
  getTrailBands,
} from "../../lib/trail.js";

// Geometry is constant, so the bands are built once at module load.
// The bloom bands are the same streak at a wider stroke (see TRAIL_BLOOM_WIDTH_SCALE).
const TRAIL_BANDS = getTrailBands();
const BLOOM_BANDS = getTrailBands(TRAIL_BLOOM_WIDTH_SCALE);
const VIEW_BOX = `0 0 ${IMAGE_WIDTH} ${IMAGE_HEIGHT}`;
const BLOOM_BLUR = `blur(${TRAIL_BLOOM_BLUR_PX}px)`;

// Fades the whole overlay after the lap. The sweep keyframes are in index.css.
const wrapperStyle = {
  animation: `snap-trail-fade ${TRAIL_FADE_MS}ms ease-out ${TRAIL_LAP_MS}ms forwards`,
};

// One full-slot SVG layer, stacked over the wrapper. `overflow-visible` lets the
// stroke and its glow spill past the viewBox instead of being clipped at it.
const TrailLayer = ({ filter, opacity, style, children }) => (
  <svg
    className="absolute inset-0 h-full w-full overflow-visible"
    viewBox={VIEW_BOX}
    aria-hidden="true"
    style={{ filter, opacity, ...style }}
  >
    {children}
  </svg>
);

// One band of the streak: a dash on the rect, swept by the shared keyframes.
// The dash array and start offset come from getTrailBands (lib/trail.js).
const TrailBand = ({ dashArray, startOffset, width, color, opacity }) => (
  <rect
    {...TRAIL_RECT}
    fill="none"
    stroke={color}
    strokeOpacity={opacity}
    strokeWidth={width}
    style={{
      strokeDasharray: dashArray,
      // The dash starts at -offset. Animating the offset from `startOffset` to
      // `startOffset - perimeter` moves the band through a full lap.
      "--trail-start": `${startOffset}px`,
      animation: `snap-trail-sweep ${TRAIL_LAP_MS}ms linear forwards`,
    }}
  />
);

// Both sweep layers: the blurred bloom behind, then the sharp streak on top.
// --trail-perimeter is inherited by each band's keyframes (index.css).
const SweepTrail = () => {
  const sweepStyle = { "--trail-perimeter": `${TRAIL_PERIMETER}px` };
  return (
    <>
      <TrailLayer
        filter={BLOOM_BLUR}
        opacity={TRAIL_BLOOM_OPACITY}
        style={sweepStyle}
      >
        {/* Bands run tail -> head, core last, so later bands paint on top. */}
        {BLOOM_BANDS.map((band, index) => (
          <TrailBand key={index} {...band} />
        ))}
      </TrailLayer>
      <TrailLayer filter={TRAIL_CORE_GLOW} style={sweepStyle}>
        {TRAIL_BANDS.map((band, index) => (
          <TrailBand key={index} {...band} />
        ))}
      </TrailLayer>
    </>
  );
};

// Reduced motion: a static full-slot ring in the trail's bright yellow, with the
// same bloom and glow as the sweep (no animation).
const ReducedTrailRing = () => {
  const ring = (strokeWidth) => (
    <rect
      {...TRAIL_RECT}
      fill="none"
      stroke={TRAIL_MID_COLOR}
      strokeWidth={strokeWidth}
    />
  );
  return (
    <>
      <TrailLayer filter={BLOOM_BLUR} opacity={TRAIL_REDUCED_OPACITY * TRAIL_BLOOM_OPACITY}>
        {ring(TRAIL_REDUCED_STROKE_PX * TRAIL_BLOOM_WIDTH_SCALE)}
      </TrailLayer>
      <TrailLayer filter={TRAIL_CORE_GLOW} opacity={TRAIL_REDUCED_OPACITY}>
        {ring(TRAIL_REDUCED_STROKE_PX)}
      </TrailLayer>
    </>
  );
};

export function SnapTrail() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isDone, setIsDone] = useState(false);

  if (isDone) return null;

  // animationend bubbles from the sweep bands too; only the fade ends the trail.
  const handleAnimationEnd = (event) => {
    if (event.animationName === "snap-trail-fade") setIsDone(true);
  };

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 overflow-visible"
      style={wrapperStyle}
      onAnimationEnd={handleAnimationEnd}
    >
      {prefersReducedMotion ? <ReducedTrailRing /> : <SweepTrail />}
    </div>
  );
}
