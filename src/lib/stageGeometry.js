// Responsive stage geometry: stage scale and the lens rest position.
// Source: .agents/docs/implementation-plan.md - sections 1.4 / 4.3.
//
// Pure functions only (no React, no DOM). `viewportWidth` is the measured
// layout width of the viewport in CSS px (document clientWidth, which excludes
// any scrollbar, so it matches the right edge the lens is clipped against).

import {
  IMAGE_WIDTH,
  LENS_SLIVER_PX,
  STAGE_VIEWPORT_MARGIN_PX,
} from "./constants.js";

// Uniform scale of the 600 px image anchor: shrinks to fit the viewport minus
// margin and never grows past 1.
export const computeStageScale = (viewportWidth) =>
  Math.min(1, (viewportWidth - STAGE_VIEWPORT_MARGIN_PX) / IMAGE_WIDTH);

// Lens rest x in stage px, so that the lens's left edge sits LENS_SLIVER_PX
// inside the viewport's right edge.
//
// Derivation: StageFrame centers the scaled image, so the image's screen-left
// edge is viewportWidth / 2 - IMAGE_WIDTH * scale / 2. The lens's screen-left
// edge is that plus restX * scale (the anchor is scaled). Setting it equal to
// viewportWidth - LENS_SLIVER_PX and solving for restX gives:
//   restX = (viewportWidth / 2 - LENS_SLIVER_PX) / scale + IMAGE_WIDTH / 2
export const computeLensRestX = (viewportWidth, scale) =>
  (viewportWidth / 2 - LENS_SLIVER_PX) / scale + IMAGE_WIDTH / 2;

// Scale and rest x for one viewport width, computed together so they never
// disagree.
export const computeStageGeometry = (viewportWidth) => {
  const scale = computeStageScale(viewportWidth);
  return { scale, restX: computeLensRestX(viewportWidth, scale) };
};
