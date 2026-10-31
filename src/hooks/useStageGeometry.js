// Stage geometry shared from StageFrame to the lens components and drag math.
// Source: .agents/docs/implementation-plan.md - section 1.4.
//
// StageFrame scales the image-anchored stage with one CSS transform and
// computes the viewport-dependent lens rest x (see lib/stageGeometry.js).
// Anything doing pointer math (useLensDrag) needs both values, so StageFrame
// publishes them through this context and LensStage passes them down.

import { createContext, useContext } from "react";

import { IMAGE_WIDTH } from "../lib/constants.js";

// Isolated default (no StageFrame mounted, e.g. a LensStage in tests): unit
// scale, with the lens resting flush against the image's right edge.
export const StageGeometryContext = createContext({
  scale: 1,
  restX: IMAGE_WIDTH,
});

export function useStageGeometry() {
  return useContext(StageGeometryContext);
}
