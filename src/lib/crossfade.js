// Shared crossfade duration for the lock -> lenticular handoff.
// Source: .agents/docs/implementation-plan.md - section 5.2.
//
// LenticularStage fades the canvas in and the image out, and LensStage fades
// the lens out, over the same duration. Both call this helper so the two
// fades always share one duration and one easing (--ease-stage).

import {
  CANVAS_FADE_MS,
  REDUCED_MOTION_CROSSFADE_MS,
} from "./constants.js";

export const getCrossfadeMs = (prefersReducedMotion) =>
  prefersReducedMotion ? REDUCED_MOTION_CROSSFADE_MS : CANVAS_FADE_MS;
