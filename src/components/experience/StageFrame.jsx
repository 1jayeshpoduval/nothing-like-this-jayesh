// Session 4B: fixed-size stage frame for the lens composition.
// Source: .agents/docs/implementation-plan.md - sections 1.4 / 4.3.
//
// Post-upload layout fix: the frame anchors on the IMAGE slot (600x400), not
// on the full image+lens composition. The image stays centered in the viewport
// before and after upload (and during drag), while the resting lens beside it
// overflows the viewport's right edge, leaving only LENS_SLIVER_PX visible -
// clipped by main's overflow-hidden, never reflowed or scrolled into view.
// The anchor scales uniformly to fit (computeStageScale, lib/stageGeometry).
// Only the CSS transform is scaled - the anchor's layout box is never reflowed
// (plan 7.3). Scale and lens rest x are recomputed on every viewport resize and
// published through StageGeometryContext so useLensDrag can convert pointer
// deltas back to stage pixels and track the rest position.

import { useEffect, useMemo, useState } from "react";

import { StageGeometryContext } from "../../hooks/useStageGeometry.js";
import { IMAGE_HEIGHT, IMAGE_WIDTH } from "../../lib/constants.js";
import { computeStageGeometry } from "../../lib/stageGeometry.js";

// clientWidth excludes the scrollbar, so the scaled anchor can never create
// horizontal page scroll even when one appears. The fit and the lens rest are
// both derived from this width; the lens overflows the viewport by design and
// is clipped instead of shrinking the centered image to make room for it.
const measureViewportWidth = () => document.documentElement.clientWidth;

export function StageFrame({ children }) {
  // Lazy initializer measures synchronously so the first paint is already
  // scaled; the ResizeObserver covers scrollbar/layout changes that fire no
  // window resize event, the listener covers the rest.
  const [viewportWidth, setViewportWidth] = useState(measureViewportWidth);

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(measureViewportWidth());
    updateViewportWidth();
    const observer = new ResizeObserver(updateViewportWidth);
    observer.observe(document.documentElement);
    window.addEventListener("resize", updateViewportWidth);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateViewportWidth);
    };
  }, []);

  // Memoized so the context value keeps its identity between unrelated renders.
  const geometry = useMemo(
    () => computeStageGeometry(viewportWidth),
    [viewportWidth]
  );
  const { scale } = geometry;

  return (
    <StageGeometryContext.Provider value={geometry}>
      <div className="flex h-full w-full items-center justify-center">
        {/* Sizer box matches the scaled IMAGE anchor, so flex centering keeps
            the image at the viewport center while the lens overflows beside
            it. */}
        <div
          style={{
            width: IMAGE_WIDTH * scale,
            height: IMAGE_HEIGHT * scale,
          }}
        >
          {/* Fixed anchor; transform-only scaling (plan 7.3). */}
          <div
            style={{
              width: IMAGE_WIDTH,
              height: IMAGE_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </StageGeometryContext.Provider>
  );
}
