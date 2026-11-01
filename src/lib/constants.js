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
export const LENS_SLIVER_PX = 100;

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

// Alignment must hold this long before the magnetic snap starts; moving out cancels (section 4.5).
export const LENS_SETTLE_MS = 120;

// Magnetic snap: the lens eases to full cover (x 0, y 0) over this duration
// (ease-out). Drag and keyboard input are ignored while it runs; onAligned
// fires when it ends. Under reduced motion the snap is instant.
export const LENS_SNAP_MS = 200;

// Arrow-key nudge of the accessible lens handle, in stage pixels (section 4.5).
export const LENS_KEYBOARD_STEP_PX = 10;

// 3D plane in world units (PlaneGeometry 6 x 4) and the stage-pixel scale.
export const PLANE_WIDTH = 6;
export const PLANE_HEIGHT = 4;
export const WORLD_TO_PIXEL = 100; // 1 world unit = 100 CSS px

// Lenticular canvas overlay, larger than the 600x400 card so tilted corners have
// headroom. The card stays centered on the same point; the canvas overflows the
// card visibly (no overflow clipping on the wrapper), so nothing clips at the
// canvas edge while the card rotates.
export const CANVAS_OVERFLOW_W = 800;
export const CANVAS_OVERFLOW_H = 600;

// Stage composition height. Width is not fixed: the lens rests responsively
// beyond the image's right edge (see LENS_SLIVER_PX). The lens may overhang
// vertically within LENS_MIN_Y..LENS_MAX_Y by design; the box stays 400 px tall.
export const COMPOSITION_HEIGHT = 400;

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

// Number of lenticular columns across the 6-unit plane. 90 is the reference
// maximum (wass08 leva range 10..90); fewer columns visibly lose image quality.
export const LENTICULAR_FREQUENCY = 210;
// Column pitch in world units: 6 / 90 = 0.0667 (6.7 px at 100 px/unit).
export const LENTICULAR_PITCH = PLANE_WIDTH / LENTICULAR_FREQUENCY;
// Peak vertex displacement (+/- this value along z), in world units.
// Ridge height is tied to the column pitch, not the plane width, because the
// visible flip depends on the per-column slope (2 * height / pitch). The previous
// value 0.3 on 50 columns (pitch 0.12) gave height/pitch = 2.5, i.e. slope 5.0.
// Keeping that ratio on 90 columns gives 2.5 * 0.0667 = 0.1667, so the flip stays
// as visible as before. Tune here if the reveal is too strong or too weak.
export const RIDGE_HEIGHT = 2 * LENTICULAR_PITCH;

// --- Camera (sections 1.4 / 5.3) ---

export const CAMERA_FOV = 30;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 100;

// Camera distance for exact vertical fill of the card. At distance d the vertical
// view height is 2 * d * tan(fov / 2). Setting that equal to PLANE_HEIGHT (4 units)
// gives d = PLANE_HEIGHT / (2 * tan(fov / 2)) ~= 5.495 at fov 40. The card is
// 600x400 (aspect 1.5), so it fills the frame vertically with no extra reach term.
export const CAMERA_POSITION_Z =
  PLANE_HEIGHT / (2 * Math.tan((CAMERA_FOV * Math.PI) / 360));
export const CAMERA_POSITION = [0, 0, CAMERA_POSITION_Z];

// Camera zoom so the card still maps to exactly 100 px per world unit inside the
// larger CANVAS_OVERFLOW_H canvas. At zoom 1 the view spans PLANE_HEIGHT (4 units)
// over the canvas height; the 600 px canvas must span 6 units, so zoom = 4 / 6.
// Zoom widens the view without moving the camera (distance and fov unchanged).
export const CAMERA_ZOOM = (PLANE_HEIGHT * WORLD_TO_PIXEL) / CANVAS_OVERFLOW_H;

// --- Rendering (section 7.7: cap DPR at 2 for both canvases) ---

export const DPR_MAX = 2;

// --- Transition choreography (section 5.2 timeline) ---

// Lock -> lenticular handoff: the image does not scale. The lens stays visible
// until the canvas is ready, then its opacity fades 1 -> 0 over the same
// duration and easing as the canvas fade 0 -> 1 (see lib/crossfade.js).
// 120 ms: <Canvas> mounts and compiles (first frame at neutral angle).
export const CANVAS_MOUNT_DELAY_MS = 120;
// Canvas opacity 0 -> 1 while the DOM image and the lens fade 1 -> 0.
// Opacity is the only animated property in the handoff: no scale or z settle.
export const CANVAS_FADE_MS = 500;
// prefers-reduced-motion: crossfade only, with a shorter fade (section 5.2).
export const REDUCED_MOTION_CROSSFADE_MS = 250;

// --- Stage-level fades (section 7.3) ---

// Upload -> lens: 200 ms fade of the hint; the image itself does not move.
export const UPLOAD_LENS_FADE_MS = 200;
// "Change image": 200 ms crossfade back to the upload zone.
export const CHANGE_IMAGE_FADE_MS = 200;
// Newly accepted image (drop, picker, or Change image): opacity 0 -> 1 once it
// has loaded, over the stage easing (components/experience/CrossfadeImage).
// Reduced motion skips the fade.
export const IMAGE_FADE_MS = 500;

// "Download opposite image": hidden until the lenticular transition completes
// (the crossfade has ended and the R3F scene is live). It then waits this long
// before fading in. Reduced motion skips the wait (0 ms).
export const DOWNLOAD_BUTTON_REVEAL_DELAY_MS = 500;
// Opacity 0 -> 1 fade of the download button, over the stage easing.
export const DOWNLOAD_BUTTON_FADE_MS = 400;

// --- Snap trail (LensStage magnetic lock; components/experience/SnapTrail) ---

// One lap of the streak around the 600x400 slot, linear, starting on snap.
export const TRAIL_LAP_MS = 750;
// Fade-out after the lap (200-300 ms; slightly longer for a smoother exit).
export const TRAIL_FADE_MS = 350;
// Colour ramp from tail (0) to head (1): transparent bright-yellow tail ->
// bright-yellow mid -> white-hot head. Stops are [position, hex] pairs,
// interpolated in lib/trail.js (getTrailBands). The tail's transparency comes
// from TRAIL_TAIL_OPACITY, not from the colour itself.
export const TRAIL_TAIL_COLOR = "#ffd60a";
export const TRAIL_MID_COLOR = "#ffd60a";
// Ramp position of the bright yellow mid stop.
export const TRAIL_MID_COLOR_POSITION = 0.55;
export const TRAIL_HEAD_COLOR = "#ffffff";
// Ramp position where the yellow mid turns into the white head.
export const TRAIL_HEAD_BLOOM_START = 0.9;
// Opacity at the very tail; the tail fades to this value (never fully opaque).
export const TRAIL_TAIL_OPACITY = 0.02;
// Opacity curve exponent: opacity = tail + (1 - tail) * t^exponent. 2 keeps the
// tail faint for most of its length, so the long fade reads as a dissolve.
export const TRAIL_OPACITY_EXPONENT = 2;
// White-hot core drawn on top of the head.
export const TRAIL_CORE_COLOR = "#ffffff";
// Streak length along the perimeter, in CSS px (~36% of a ~1950 px lap).
export const TRAIL_LENGTH_PX = 700;
// Stroke width tapers from needle-thin at the tail to thick at the head, in CSS px:
// width = MIN + (MAX - MIN) * t^EXPONENT. The exponent keeps most of the streak
// thin and lets only the head swell. The slot rect is inset by half the max width
// so the head stays in the slot.
export const TRAIL_STROKE_MIN_PX = 1;
export const TRAIL_STROKE_MAX_PX = 5;
export const TRAIL_STROKE_EXPONENT = 2.2;
// Core: short, thin, white bar at the head (drawn over the thick head band).
export const TRAIL_CORE_LENGTH_PX = 400;
export const TRAIL_CORE_STROKE_PX = 2;
// Glow, sharp layer: one CSS filter string on the streak. A tight white rim plus
// a bright yellow halo (#ffd60a). Two drop-shadows in one filter; separate Tailwind
// drop-shadow classes would overwrite each other (same `filter` property).
export const TRAIL_CORE_GLOW =
  "drop-shadow(0 0 8px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 24px rgba(255, 214, 10, 0.9))";
// Glow, bloom layer: a copy of the streak drawn at this multiple of its width,
// blurred with a CSS blur (cheaper than an SVG feGaussianBlur), behind the sharp one.
export const TRAIL_BLOOM_WIDTH_SCALE = 2.5;
export const TRAIL_BLOOM_BLUR_PX = 16;
export const TRAIL_BLOOM_OPACITY = 0.85;
// Static ring width under prefers-reduced-motion, in CSS px.
export const TRAIL_REDUCED_STROKE_PX = 2;
// Opacity of the static reduced-motion ring (subtle, no sweep).
export const TRAIL_REDUCED_OPACITY = 0.5;
// Number of non-overlapping stroke bands that approximate the taper along the streak.
export const TRAIL_BANDS = 30;

// --- Top screen decoration (components/experience/TopScreenShader) ---
// Saved shader "Fluted Aurora - 2" (Shaders id 4746282), exported as-is. Values
// are spread onto the shader components; the decoration is presentational only.

// Aurora layer (the base of the composition).
export const TOP_SHADER_AURORA = Object.freeze({
  balance: 76,
  colorA: "#fff",
  colorB: "#ffd60a",
  colorC: "#06060d",
  height: 20,
  intensity: 75,
  rayDensity: 10,
  seed: 3,
  speed: -5.2,
});
// Fluted glass pass (requiresChild: applies to the Aurora above it).
export const TOP_SHADER_FLUTED_GLASS = Object.freeze({
  frequency: 40,
  shape: "rounded",
  softness: 1,
  visible: true,
});
// Aurora speed under prefers-reduced-motion. 0 holds the first frame still.
export const TOP_SHADER_REDUCED_MOTION_SPEED = 0;
