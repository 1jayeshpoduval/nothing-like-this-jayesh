// Session 4B: image anchor + fluted lens on the stage.
// Source: .agents/docs/implementation-plan.md - sections 4.1-4.7.
//
// The lens is always rendered. `isEnabled` decides its state:
// - disabled (no image yet): rests at its position, muted, no glow, not
//   draggable, no keyboard input - it reads as present but inactive.
// - enabled (image uploaded): glows, drag and arrow-key input are live.
// - snapping (lens held in the trigger zone): the lens eases to full cover
//   over LENS_SNAP_MS (useLensDrag). Drag and keyboard input are off until the
//   handoff.
// - locked (alignment latched, transition/interactive3d): still drawn at its
//   aligned position, but no drag, keyboard, or pointer input. pointer-events
//   are off so the lenticular canvas beneath receives orbit input.
// - lens hidden (the lenticular crossfade has started): opacity fades 1 -> 0
//   over the same duration and easing as the canvas fade-in (lib/crossfade.js).
//   The lens stays mounted at opacity 0, so the anchor it wraps is never
//   remounted.
// The anchor content (drop zone, uploaded image, or the lenticular stage) is
// passed in as `renderImageSlot` so this component stays unaware of the flow.
// It receives `{ isButtonHidden }`, true while the lens is dragged or locked,
// so the image's "Change image" button can fade out.
//
// Layout (plan 4.1, image-anchored): the stage root IS the 600x400 image
// slot - StageFrame keeps it centered in the viewport at all times. The lens
// handle - a 600x400 box filled by FlutedLenticularLens - rests at
// translate(restX, 0), where restX is responsive (computeLensRestX): its left
// edge sits LENS_SLIVER_PX inside the viewport's right edge, so only that
// sliver shows at every viewport width. It is dragged across the image to
// translate(0, 0). The resting lens overflows the image anchor to the right;
// main's overflow-hidden clips it at the viewport edge without moving the
// image. The lens surface is a
// transparent SVG-filter overlay (components/experience/FlutedLenticularLens):
// it flutes whatever sits behind it via backdrop-filter, so the photo
// distorts under the lens while the black canvas beyond the photo shows only
// the ridge highlights. No GPU pipeline is involved.

import { useMemo, useState } from "react";

import { FlutedLenticularLens } from "./FlutedLenticularLens.jsx";
import { LensHint } from "./LensHint.jsx";
import { SnapTrail } from "./SnapTrail.jsx";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion.js";
import { useLensDrag } from "../../hooks/useLensDrag.js";
import { useStageGeometry } from "../../hooks/useStageGeometry.js";
import { getCrossfadeMs } from "../../lib/crossfade.js";
import {
  IMAGE_HEIGHT,
  IMAGE_WIDTH,
  LENS_HEIGHT,
  LENS_MIN_X,
  LENS_SNAP_MS,
  LENS_WIDTH,
} from "../../lib/constants.js";

// Plate look per state. Disabled: no glow, but still clearly visible - a
// light border, a 1 px outline ring so the plate separates from the page
// background, and a moderate opacity (kept well above the old 0.4 so it is
// readable on a dim screen while staying distinct from the enabled glow).
// Enabled states follow plan 4.6 / 4.7.
const plateStateClassName = ({
  isEnabled,
  isDragging,
  isAligned,
  isSnapping,
}) => {
  if (!isEnabled) {
    return "border-rim/10 opacity-30 shadow-[inset_0_0_0_1px_rgba(232,232,232,0.2),0_0_0_1px_rgba(232,232,232,0.3)]";
  }
  // Edge stack (all states): inner 1 px line for the plate edge, a crisp 1 px
  // outer ring (0 0 0 1px spread) so the edge reads against pure black, and a
  // soft wide glow. Alphas are raised for low screen brightness.
  if (isDragging) {
    // Drag: shadow deepens (plan 4.7).
    return "border-rim/70 shadow-[inset_0_0_0_1px_rgba(232,232,232,0.35),0_20px_48px_-12px_rgba(0,0,0,0.9),0_0_0_1px_rgba(232,232,232,0.6),0_0_44px_-6px_rgba(232,232,232,0.5)]";
  }
  // Aligned: the rim brightens for the 120 ms hold (plan 4.7). Once the snap
  // starts, SnapTrail carries the feedback, so this glow is dropped (no stacking).
  if (isAligned && !isSnapping) {
    return "border-rim shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6),0_0_0_1px_rgba(255,255,255,0.9),0_0_60px_-2px_rgba(232,232,232,0.8)]";
  }
  // Rest + hover: 1 px inner edge and soft glow (plan 4.6); on hover the glow
  // gains ~10% and the plate lifts 2 px - never a scale change (plan 4.7).
  // The rest shadow must match the `to` keyframe of lens-glow-in in index.css,
  // otherwise the glow jumps when the animation ends. Alphas are toned down
  // from the earlier 0.3/0.5/0.5 so the enabled plate is softer (keep in sync
  // with the keyframe).
  return "border-rim/55 shadow-[inset_0_0_0_1px_rgba(232,232,232,0.2),0_0_0_1px_rgba(232,232,232,0.35),0_0_36px_-6px_rgba(232,232,232,0.35)] hover:-translate-y-0.5 hover:border-rim/80 hover:shadow-[inset_0_0_0_1px_rgba(232,232,232,0.4),0_0_0_1px_rgba(232,232,232,0.7),0_0_44px_-4px_rgba(232,232,232,0.7)]";
};

// `renderImageSlot` fills the 600x400 anchor (drop zone before upload, image
// after). `isEnabled` gates drag and keyboard input and the glow.
export function LensStage({
  isEnabled,
  isLocked = false,
  isLensHidden = false,
  renderImageSlot,
  onAligned,
}) {
  // restX is the viewport-dependent rest position; it is also the drag's max x.
  const { scale, restX } = useStageGeometry();

  // Same duration as the lenticular crossfade, so the lens fades out in step.
  const prefersReducedMotion = usePrefersReducedMotion();
  const fadeMs = getCrossfadeMs(prefersReducedMotion);
  // Magnetic snap duration; reduced motion snaps instantly (no ease).
  const snapMs = prefersReducedMotion ? 0 : LENS_SNAP_MS;

  // isAligned / isSnapping come from the same lock signal useLensDrag already
  // exposes (the trigger zone and the magnetic snap that leads to the lock).
  const { position, isDragging, isAligned, isSnapping, bind } = useLensDrag({
    onAligned,
    scale,
    restX,
    snapMs,
  });

  // Only a live, unlocked lens takes drag and keyboard input. `bind` stays
  // attached until the lock; during the snap the hook ignores input, and
  // `isDragEnabled` drops the affordances (cursor, focus, ARIA) at once.
  const isInteractive = isEnabled && !isLocked;
  const isDragEnabled = isInteractive && !isSnapping;

  // Memoized so per-move re-renders only touch the handle transform: identical
  // element identity makes React skip re-rendering the lens surface. Keyed on
  // isEnabled only so the ridge highlights crossfade to the active tone on upload.
  const lensSurfaceNode = useMemo(
    () => <FlutedLenticularLens isActive={isEnabled} />,
    [isEnabled],
  );

  // Hint lifecycle: `hasInteracted` starts the fade-out on the first lens
  // pointerdown, and a lock does too (the lock can come from the keyboard, so
  // there may be no pointerdown). `isHintRemoved` unmounts the hint once that
  // fade ends. Both reset on remount (LensStage is keyed on isEnabled), so the
  // hint returns only with the next upload / lens re-enable.
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isHintRemoved, setIsHintRemoved] = useState(false);

  // Drag-cue nudge: a looping 8 px left move of the resting lens. It stops
  // permanently on the first pointerdown or keydown on the handle, and is also
  // gated off by lock/disable via `isDragEnabled` below. Unlike the hint, a
  // keyboard interaction also stops it (the hint fade is pointer/lock only).
  const [isNudgeActive, setIsNudgeActive] = useState(true);

  const handleLensPointerDown = () => {
    setHasInteracted(true);
    setIsNudgeActive(false);
  };

  const handleLensKeyDown = () => {
    setIsNudgeActive(false);
  };

  const plateClassName = [
    "relative h-full w-full overflow-hidden border",
    // `translate` covers the hover lift (Tailwind 4 animates it through the
    // CSS translate property, not transform). `opacity` animates the
    // enable/disable change.
    "transition-[transform,translate,border-color,box-shadow,opacity] duration-200 ease-stage",
    plateStateClassName({ isEnabled, isDragging, isAligned, isSnapping }),
    // Lens light-up on show (LensStage remounts on upload, so this replays each
    // time the lens becomes live). Starts at the disabled look and ramps to the
    // enabled plate (opacity, border and glow); defined in index.css and runs
    // in step with the ridge crossfade in FlutedLenticularLens. motion-safe skips
    // it under prefers-reduced-motion (the final enabled look shows at once).
    isEnabled && "motion-safe:animate-lens-glow-in",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    // Image anchor: exactly the IMAGE_WIDTH x IMAGE_HEIGHT slot, centered by
    // StageFrame. Children may overflow it (the resting lens beside it); the
    // overflow is clipped at the viewport edge, never here.
    <div
      className="relative"
      style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}
    >
      {/* Drop zone or uploaded image filling the anchor (plan 4.1). */}
      {/* The "Change image" button is hidden while the lens is dragged, and from
          the moment it reaches the trigger zone (isAligned) through the snap and
          the lock (isSnapping, isLocked). Without isAligned/isSnapping the button
          would fade back in on release, before the lock fades it out again. */}
      <div className="absolute top-0 left-0">
        {renderImageSlot({
          isButtonHidden: isDragging || isAligned || isSnapping || isLocked,
        })}
      </div>

      {/* Hint label: a sibling of the lens handle, so it stays put while the
          lens is dragged. Shown only while the lens is live and until the
          first lens pointerdown has faded it out. */}
      {isEnabled && !isHintRemoved && (
        <LensHint
          restX={restX}
          isFadingOut={hasInteracted || isLocked}
          onFadeOutEnd={() => setIsHintRemoved(true)}
        />
      )}

      {/* Lens handle: transform-only positioning (plan 7.3) and cursor per
          state (plan 4.7). When enabled, `bind` supplies pointer drag, arrow-key
          nudges and the scale-measurement ref (see useLensDrag); touch-action
          is disabled on the handle only, never on the page. The capture-phase
          pointerdown marks the first interaction for the hint fade-out without
          interfering with `bind`. When disabled, `bind` is withheld so the lens
          cannot be dragged or keyboard-moved. The capture-phase keydown stops the
          drag-cue nudge (the handle's own onKeyDown comes from `bind`). */}
      <div
        {...(isInteractive
          ? {
              ...bind,
              onPointerDownCapture: handleLensPointerDown,
              onKeyDownCapture: handleLensKeyDown,
            }
          : {})}
        role="slider"
        tabIndex={isDragEnabled ? 0 : -1}
        aria-label="Lens position"
        aria-disabled={!isDragEnabled}
        aria-hidden={isLensHidden}
        aria-valuemin={LENS_MIN_X}
        aria-valuemax={Math.round(restX)}
        aria-valuenow={Math.round(position.x)}
        className={[
          "absolute top-0 left-0 z-10 touch-none select-none",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          // Drag cue: only while the lens is draggable and untouched. motion-safe
          // skips it under prefers-reduced-motion. Removing the class (on the first
          // interaction) drops the nudge at once, so it never resumes.
          isDragEnabled && isNudgeActive && "motion-safe:animate-lens-nudge",
          // Locked lens passes pointer input through to the lenticular canvas.
          isLocked
            ? "pointer-events-none"
            : !isEnabled || isSnapping
              ? "cursor-not-allowed"
              : isDragging
                ? "cursor-grabbing"
                : "cursor-grab",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          width: LENS_WIDTH,
          height: LENS_HEIGHT,
          transform: `translate(${position.x}px, ${position.y}px)`,
          willChange: "transform",
          // The magnetic snap eases the transform to full cover (ease-out).
          // It is only applied while snapping: during drag the transform must
          // track the pointer without lag. Opacity keeps the crossfade timing.
          transition: isSnapping
            ? `transform ${snapMs}ms ease-out, opacity ${fadeMs}ms var(--ease-stage)`
            : `opacity ${fadeMs}ms var(--ease-stage)`,
          // Fades out with the lenticular fade-in (same duration and easing).
          opacity: isLensHidden ? 0 : 1,
        }}
      >
        {/* Lens plate: square panel, inner border and outer glow around the
            lens surface (plan 4.6 / 4.7). Glow is removed while disabled. */}
        <div className={plateClassName}>{lensSurfaceNode}</div>

        {/* Snap trail: mounted only while snapping, so it never persists into
            the lenticular stage. Inside the handle, so the lens fade hides it too. */}
        {isSnapping && <SnapTrail />}
      </div>
    </div>
  );
}
