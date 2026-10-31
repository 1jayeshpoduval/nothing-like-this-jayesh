// Session 4B: image anchor + fluted lens on the stage.
// Source: .agents/docs/implementation-plan.md - sections 4.1-4.7.
//
// The lens is always rendered. `isEnabled` decides its state:
// - disabled (no image yet): rests at its position, muted, no glow, not
//   draggable, no keyboard input - it reads as present but inactive.
// - enabled (image uploaded): glows, drag and arrow-key input are live.
// The anchor content (drop zone or uploaded image) is passed in as `imageSlot`
// so this component stays unaware of the upload flow.
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
import { useLensDrag } from "../../hooks/useLensDrag.js";
import { useStageGeometry } from "../../hooks/useStageGeometry.js";
import {
  IMAGE_HEIGHT,
  IMAGE_WIDTH,
  LENS_HEIGHT,
  LENS_MIN_X,
  LENS_WIDTH,
} from "../../lib/constants.js";

// Plate look per state. Disabled: no glow, muted border, dimmed (the lens
// reads as present but inactive). Enabled states follow plan 4.6 / 4.7.
const plateStateClassName = ({ isEnabled, isDragging, isAligned }) => {
  if (!isEnabled) {
    return "border-rim/10 opacity-40";
  }
  if (isDragging) {
    // Drag: shadow deepens (plan 4.7).
    return "border-rim/40 shadow-[inset_0_0_0_1px_rgba(232,232,232,0.2),0_20px_48px_-12px_rgba(0,0,0,0.9),0_0_36px_-6px_rgba(232,232,232,0.35)]";
  }
  if (isAligned) {
    // Aligned: the rim brightens for the 120 ms hold (plan 4.7).
    return "border-rim/80 shadow-[inset_0_0_0_1px_rgba(232,232,232,0.35),0_0_52px_-4px_rgba(232,232,232,0.55)]";
  }
  // Rest + hover: 1 px inner edge and soft glow (plan 4.6); on hover the glow
  // gains ~10% and the plate lifts 2 px - never a scale change (plan 4.7).
  return "border-rim/25 shadow-[inset_0_0_0_1px_rgba(232,232,232,0.12),0_0_28px_-8px_rgba(232,232,232,0.3)] hover:-translate-y-0.5 hover:border-rim/45 hover:shadow-[inset_0_0_0_1px_rgba(232,232,232,0.2),0_0_34px_-6px_rgba(232,232,232,0.42)]";
};

// `imageSlot` fills the 600x400 anchor (drop zone before upload, image after).
// `isEnabled` gates drag and keyboard input and the glow.
export function LensStage({ isEnabled, imageSlot, onAligned }) {
  // restX is the viewport-dependent rest position; it is also the drag's max x.
  const { scale, restX } = useStageGeometry();
  const { position, isDragging, isAligned, bind } = useLensDrag({
    onAligned,
    scale,
    restX,
  });

  // Memoized so per-move re-renders only touch the handle transform: identical
  // element identity makes React skip re-rendering the lens surface.
  const lensSurfaceNode = useMemo(() => <FlutedLenticularLens />, []);

  // Hint lifecycle: `hasInteracted` starts the fade-out on the first lens
  // pointerdown; `isHintRemoved` unmounts the hint once that fade ends. Both
  // reset on remount (LensStage is keyed on isEnabled), so the hint returns
  // only with the next upload / lens re-enable.
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isHintRemoved, setIsHintRemoved] = useState(false);

  const handleLensPointerDown = () => {
    setHasInteracted(true);
  };

  const plateClassName = [
    "relative h-full w-full overflow-hidden border",
    // `translate` covers the hover lift (Tailwind 4 animates it through the
    // CSS translate property, not transform). `opacity` animates the
    // enable/disable change.
    "transition-[transform,translate,border-color,box-shadow,opacity] duration-200 ease-stage",
    plateStateClassName({ isEnabled, isDragging, isAligned }),
    // Glow ramps up slowly on show (LensStage remounts on upload, so this
    // replays each time the lens becomes live). Defined in index.css.
    isEnabled && "animate-lens-glow-in",
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
      <div className="absolute top-0 left-0">{imageSlot}</div>

      {/* Hint label: a sibling of the lens handle, so it stays put while the
          lens is dragged. Shown only while the lens is live and until the
          first lens pointerdown has faded it out. */}
      {isEnabled && !isHintRemoved && (
        <LensHint
          restX={restX}
          isFadingOut={hasInteracted}
          onFadeOutEnd={() => setIsHintRemoved(true)}
        />
      )}

      {/* Lens handle: transform-only positioning (plan 7.3) and cursor per
          state (plan 4.7). When enabled, `bind` supplies pointer drag, arrow-key
          nudges and the scale-measurement ref (see useLensDrag); touch-action
          is disabled on the handle only, never on the page. The capture-phase
          pointerdown marks the first interaction for the hint fade-out without
          interfering with `bind`. When disabled, `bind` is withheld so the lens
          cannot be dragged or keyboard-moved. */}
      <div
        {...(isEnabled ? { ...bind, onPointerDownCapture: handleLensPointerDown } : {})}
        role="slider"
        tabIndex={isEnabled ? 0 : -1}
        aria-label="Lens position"
        aria-disabled={!isEnabled}
        aria-valuemin={LENS_MIN_X}
        aria-valuemax={Math.round(restX)}
        aria-valuenow={Math.round(position.x)}
        className={[
          "absolute top-0 left-0 z-10 touch-none select-none",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          !isEnabled
            ? "cursor-not-allowed"
            : isDragging
              ? "cursor-grabbing"
              : "cursor-grab",
        ].join(" ")}
        style={{
          width: LENS_WIDTH,
          height: LENS_HEIGHT,
          transform: `translate(${position.x}px, ${position.y}px)`,
          willChange: "transform",
        }}
      >
        {/* Lens plate: square panel, inner border and outer glow around the
            lens surface (plan 4.6 / 4.7). Glow is removed while disabled. */}
        <div className={plateClassName}>{lensSurfaceNode}</div>

      </div>
    </div>
  );
}
