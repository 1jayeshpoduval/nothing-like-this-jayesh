// Fixed geometry, interaction, and choreography values for the lenticular experience.
// Source: .agents/docs/implementation-plan.md — sections 1.4, 4.5, 5.2, 5.3, 6.1, 6.2, 6.3, 7.3.
// Every other module imports these instead of repeating literals.

// --- Section 1.4 fixed geometry and coordinate system ---

// Image slot (normalized upload canvas), 3:2 ratio, in CSS pixels.
export const IMAGE_WIDTH = 600;
export const IMAGE_HEIGHT = 400;

// Fluted lens element, same footprint as the image slot, in CSS pixels.
export const LENS_WIDTH = 600;
export const LENS_HEIGHT = 400;

// Visible sliver of the resting lens, in CSS px, measured from the viewport's
// right edge. At rest the lens's left edge sits LENS_SLIVER_PX inside the right
// edge at every viewport width, so only this much of the lens shows. The rest
// x is viewport-dependent and computed by computeLensRestX (lib/stageGeometry.js).
export const LENS_SLIVER_PX = 32;

// Breathing room kept around the scaled image anchor (plan 1.4). Used by
// computeStageScale: scale = min(1, (viewportWidth - margin) / IMAGE_WIDTH).
export const STAGE_VIEWPORT_MARGIN_PX = 32;

// Lens rest y: top offset 0. The rest x is responsive (see LENS_SLIVER_PX).
export const LENS_REST_Y = 0;

// Lens drag bounds in stage pixels: x runs from 0 (image's left edge) to the
// responsive rest x; y is -80..80. The lens never travels past its rest
// position (section 1.4 / 4.5).
export const LENS_MIN_X = 0;
export const LENS_MIN_Y = -80;
export const LENS_MAX_Y = 80;

// Alignment trigger: lens left offset <= 12 px and abs(y) <= 48 px (section 1.4 / 4.5).
export const LENS_TRIGGER_X = 12;
export const LENS_TRIGGER_Y = 48;

// Alignment must hold this long before onAligned fires; moving out cancels (section 4.5).
export const LENS_SETTLE_MS = 120;

// Arrow-key nudge of the accessible lens handle, in stage pixels (section 4.5).
export const LENS_KEYBOARD_STEP_PX = 10;

// 3D plane in world units (PlaneGeometry 6 x 4) and the stage-pixel scale.
export const PLANE_WIDTH = 6;
export const PLANE_HEIGHT = 4;
export const WORLD_TO_PIXEL = 100; // 1 world unit = 100 CSS px

// Stage composition height. Width is not fixed: the lens rests responsively
// beyond the image's right edge (see LENS_SLIVER_PX). The lens may overhang
// vertically within LENS_MIN_Y..LENS_MAX_Y by design; the box stays 400 px tall.
export const COMPOSITION_HEIGHT = 400;

// --- Camera (sections 1.4 / 5.3) ---

export const CAMERA_FOV = 40;
export const CAMERA_POSITION_Z = 6.5;
export const CAMERA_POSITION = [0, 0, 6.5];
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 100;

// --- Orbit constraints (sections 6.1 / 6.2) ---

// Azimuth clamp drives both the camera and the viewAngle normalization.
export const MAX_AZIMUTH_DEG = 35;
export const MAX_AZIMUTH_RAD = (MAX_AZIMUTH_DEG * Math.PI) / 180;

// Polar clamp keeps the card readable (78..102 deg around the 90 deg horizon).
export const MIN_POLAR_DEG = 78;
export const MAX_POLAR_DEG = 102;
export const MAX_POLAR_DEVIATION_DEG = 12; // plan 2.3 "MAX_POLAR_DEVIATION": 90 - MIN_POLAR_DEG

// --- Controls tuning (section 6.1) ---

export const ORBIT_DAMPING_FACTOR = 0.075;
export const ORBIT_ROTATE_SPEED = 0.5;

// --- Lenticular material (sections 2.1 / 5.4) ---

// Number of lenticular columns across the 6-unit plane (~10 px per column at 600 px).
export const LENTICULAR_FREQUENCY = 60;
// Vertex displacement amplitude in world units (~3.5 px).
export const RIDGE_HEIGHT = 0.035;

// --- Rendering (section 7.7: cap DPR at 2 for both canvases) ---

export const DPR_MAX = 2;

// --- Transition choreography (section 5.2 timeline) ---

// 0-150 ms: lens opacity 1 -> 0 and image scale 1 -> 1.03, in parallel.
export const LENS_FADE_MS = 150;
export const IMAGE_SCALE_UP_MS = 150;
// 120 ms: <Canvas> mounts and compiles (first frame at neutral angle).
export const CANVAS_MOUNT_DELAY_MS = 120;
// 150-650 ms: canvas opacity 0 -> 1 while the DOM image fades 1 -> 0.
export const CANVAS_FADE_MS = 500;
// 650-900 ms: card settles (z -0.25 -> 0), then the lens unmounts.
export const CARD_SETTLE_MS = 250;
// prefers-reduced-motion: skip scale/settle, crossfade only (section 5.2).
export const REDUCED_MOTION_CROSSFADE_MS = 250;

// --- Rotation cue (section 6.3) ---

// Cue entrance starts 250 ms after interactive3d is confirmed.
export const CUE_FADE_IN_DELAY_MS = 250;
// Entrance fade duration (section 6.3 states the entrance timing; no separate duration).
export const CUE_FADE_IN_MS = 250;
// Exit fade after the first meaningful rotation (or the idle timeout below).
export const CUE_FADE_OUT_MS = 200;
// Auto-hide after 5 s of no interaction (section 6.3).
export const CUE_AUTO_HIDE_MS = 5000;

// --- Stage-level fades (section 7.3) ---

// Upload -> lens: 200 ms fade of the hint; the image itself does not move.
export const UPLOAD_LENS_FADE_MS = 200;
// "Change image": 200 ms crossfade back to the upload zone.
export const CHANGE_IMAGE_FADE_MS = 200;
