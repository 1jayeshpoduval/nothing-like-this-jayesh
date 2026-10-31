// Fluted lenticular lens overlay - SVG filters only, no embedded image.
//
// A transparent plate that distorts whatever sits BEHIND it (backdrop-filter
// driven by a periodic SVG displacement map) plus its own ridge highlights.
// The lens contains no photo and never counter-translates one: drag it over
// the image and the photo flutes through it; rest it beside the image and it
// shows only its ridge highlights over the black canvas.
//
// Filter construction (tunables and builders in src/lib/flutedLens.js):
// - feFlood/feComposite layer the stripe map over a neutral gray, so a
//   browser that cannot load the map degrades to "no displacement"
//   (transparent + the highlight overlay) instead of shifting the backdrop.
// - feImage loads the deterministic vertical-stripe map (a repeating cosine
//   ramp) - regular lenticular flutes, not feTurbulence noise.
// - feColorMatrix pins G/B to 0.5 so the sway is horizontal only.
// - feDisplacementMap applies the flutes; the explicit filter region keeps
//   edge samples from clipping (see buildFlutedFilterRegion).
//
// The ridge highlights are a CSS repeating-linear-gradient sibling OUTSIDE
// the filtered layer, so they stay crisp and are never distorted themselves.

import { useId } from "react";

import {
  buildFluteDisplacementMap,
  buildFluteHighlightGradient,
  buildFlutedFilterRegion,
  FLUTE_COUNT,
  FLUTE_DISPLACEMENT,
} from "../../lib/flutedLens.js";

// `backdrop-filter: url(#svg-filter)` is not paintable everywhere (older
// Safari/Firefox parse backdrop-filter but not the SVG reference). When it
// is unsupported the filtered layer stays fully transparent and only the
// ridge highlights render - the prescribed graceful fallback.
const SUPPORTS_BACKDROP_SVG_FILTER =
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  (CSS.supports("backdrop-filter", "url(#fluted)") ||
    CSS.supports("-webkit-backdrop-filter", "url(#fluted)"));

export function FlutedLenticularLens({
  fluteCount = FLUTE_COUNT,
  displacement = FLUTE_DISPLACEMENT,
}) {
  // useId gives every mounted lens its own filter id; the sanitising keeps
  // the id safe as a CSS url() fragment.
  const filterId = `fluted-lens-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const region = buildFlutedFilterRegion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Filter definitions only; zero-sized so the svg never paints or
          reserves layout (a display:none svg would break the reference). */}
      <svg aria-hidden="true" className="absolute h-0 w-0">
        <defs>
          <filter
            id={filterId}
            x={region.x}
            y={region.y}
            width={region.width}
            height={region.height}
            colorInterpolationFilters="sRGB"
          >
            {/* Neutral gray map: the no-displacement base for browsers where
                feImage cannot load the data-URI stripe map. */}
            <feFlood floodColor="rgb(128, 128, 128)" result="neutral" />
            {/* Deterministic periodic stripe map (see flutedLens.js). The
                subregion attributes stay unset on purpose: feImage's default
                subregion is the whole filter region (filter-effects-1 9.4),
                which is what the map's period math assumes. */}
            <feImage
              href={buildFluteDisplacementMap({ fluteCount })}
              preserveAspectRatio="none"
              result="stripes"
            />
            {/* Stripes over the neutral base; if the map fails to load the
                base survives and the lens simply does not distort. */}
            <feComposite
              in="stripes"
              in2="neutral"
              operator="over"
              result="striped"
            />
            {/* Horizontal flutes only: keep R (the sway), pin G/B to 0.5 so
                feDisplacementMap never drifts vertically. */}
            <feColorMatrix
              in="striped"
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 1"
              result="fluteMap"
            />
            {/* The flutes: sway the backdrop horizontally per ridge. */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="fluteMap"
              scale={displacement}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Filtered layer: paints nothing itself - it only refracts the
          backdrop (the photo behind the lens). */}
      <div
        className="absolute inset-0"
        style={
          SUPPORTS_BACKDROP_SVG_FILTER
            ? {
                backdropFilter: `url(#${filterId})`,
                WebkitBackdropFilter: `url(#${filterId})`,
              }
            : undefined
        }
      />

      {/* Ridge highlights above the filtered layer, so the rim and ridges
          stay crisp and the border is never distorted. */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: buildFluteHighlightGradient({ fluteCount }) }}
      />
    </div>
  );
}
