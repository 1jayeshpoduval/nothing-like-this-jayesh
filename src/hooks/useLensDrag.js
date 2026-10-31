// Session 4B: drag math for the fluted lens handle.
// Source: .agents/docs/implementation-plan.md - sections 1.4 / 4.5.
//
// Scale handling (plan 1.4): StageFrame scales the image-anchored stage with
// one CSS transform, while use-gesture reports pointer movement in screen
// pixels. Every delta is divided by the stage scale before it is applied
// in stage pixels, so dragging stays accurate at any viewport size. The scale
// is the value LensStage passes down (StageFrame publishes it through
// StageGeometryContext); when none is provided the hook measures the handle's
// rendered width instead (rect.width / LENS_WIDTH, plan 1.4). The scale is
// snapshotted at drag start so a mid-drag resize can never make the deltas
// jump.
//
// Responsive rest (lib/stageGeometry): the rest x (`restX`) depends on the
// viewport width, so travel is stored as a progress fraction - 0 at rest,
// 1 at the image's left edge - and x is derived from the live restX on every
// render. The lens therefore keeps its relative position when the viewport
// resizes, and progress stays correct against the new rest.
//
// The returned `bind` carries the use-gesture pointer handlers, an `onKeyDown`
// handler for arrow-key nudges, and the handle `ref` used for scale
// measurement - spreading `{...bind}` on the lens handle gives drag and
// keyboard control at once. The handle's ARIA attributes (tabIndex, role,
// aria-valuenow) are rendered by LensStage.
//
// Alignment (plan 4.5): x <= LENS_TRIGGER_X and abs(y) <= LENS_TRIGGER_Y must
// hold continuously for LENS_SETTLE_MS before `onAligned` fires exactly once;
// leaving the zone cancels the pending timer. Once aligned, drag and keyboard
// input are ignored and the lens holds position (no spring-back).

import { useEffect, useRef, useState } from "react";
import { useDrag } from "@use-gesture/react";

import {
  LENS_KEYBOARD_STEP_PX,
  LENS_MAX_Y,
  LENS_MIN_X,
  LENS_MIN_Y,
  LENS_SETTLE_MS,
  LENS_TRIGGER_X,
  LENS_TRIGGER_Y,
  LENS_WIDTH,
} from "../lib/constants.js";

// Primary-button drags only (explicit form of use-gesture's default
// `pointer.buttons = 1`). The library's own arrow-key handling is disabled:
// those deltas are screen-space, while keyboard nudges here move
// LENS_KEYBOARD_STEP_PX in stage pixels regardless of the visual scale.
const DRAG_CONFIG = { pointer: { buttons: 1, keys: false } };

// Arrow-key nudges in stage pixels: Left/Right adjust x, Up/Down adjust y.
const KEYBOARD_DELTAS = {
  ArrowLeft: [-LENS_KEYBOARD_STEP_PX, 0],
  ArrowRight: [LENS_KEYBOARD_STEP_PX, 0],
  ArrowUp: [0, -LENS_KEYBOARD_STEP_PX],
  ArrowDown: [0, LENS_KEYBOARD_STEP_PX],
};

// Rest travel: progress 0 (x = restX), y = 0.
const REST_TRAVEL = { progress: 0, y: 0 };

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const isInTriggerZone = ({ x, y }) =>
  x <= LENS_TRIGGER_X && Math.abs(y) <= LENS_TRIGGER_Y;

// Travel progress <-> stage-px x, for the current rest x. x must already be
// clamped to 0..restX before xToProgress is called.
const progressToX = (progress, restX) => (1 - progress) * restX;
const xToProgress = (x, restX) => 1 - x / restX;

// Screen px -> stage px divisor (see the scale handling note above).
const resolveDragScale = (providedScale, element) => {
  if (typeof providedScale === "number" && providedScale > 0) {
    return providedScale;
  }
  const width = element ? element.getBoundingClientRect().width : 0;
  return width > 0 ? width / LENS_WIDTH : 1;
};

export function useLensDrag({ onAligned, scale, restX }) {
  const [travel, setTravel] = useState(REST_TRAVEL);
  const [isDragging, setIsDragging] = useState(false);
  // Latched once onAligned fires; from then on drag/keyboard input is ignored.
  const [hasAligned, setHasAligned] = useState(false);

  // Derived each render, so the lens follows restX when the viewport resizes.
  const position = {
    x: progressToX(travel.progress, restX),
    y: travel.y,
  };

  const onAlignedRef = useRef(onAligned);
  const hasAlignedRef = useRef(false);
  // Position, effective scale and rest x snapshotted when a drag starts.
  const dragOriginRef = useRef({ x: restX, y: 0, scale: 1, restX });
  // use-gesture's cancel() for the in-flight drag, invoked on window blur.
  const cancelDragRef = useRef(null);
  const handleRef = useRef(null);

  useEffect(() => {
    onAlignedRef.current = onAligned;
  }, [onAligned]);

  // Plan 4.5: window blur must end an in-flight drag - the matching pointerup
  // may never arrive after focus leaves the page mid-drag.
  useEffect(() => {
    const cancelActiveDrag = () => cancelDragRef.current?.();
    window.addEventListener("blur", cancelActiveDrag);
    return () => window.removeEventListener("blur", cancelActiveDrag);
  }, []);

  const isAligned = isInTriggerZone(position);

  // Settle timer (plan 4.5): the trigger zone must hold for LENS_SETTLE_MS
  // before onAligned fires exactly once. Re-entering restarts the full hold;
  // the cleanup cancels the pending timer whenever the lens leaves the zone,
  // unmounts, or StrictMode re-runs the effect.
  useEffect(() => {
    if (hasAligned || !isAligned) return undefined;
    const timer = setTimeout(() => {
      hasAlignedRef.current = true;
      setHasAligned(true);
      onAlignedRef.current?.();
    }, LENS_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [isAligned, hasAligned]);

  const dragHandler = (state) => {
    const { first, last, movement } = state;

    // Release bookkeeping runs before the aligned guard so an in-flight drag
    // that settles mid-press still ends cleanly.
    if (last) {
      cancelDragRef.current = null;
      setIsDragging(false);
    }
    if (hasAlignedRef.current) return;

    if (first) {
      cancelDragRef.current = state.cancel;
      dragOriginRef.current = {
        x: position.x,
        y: position.y,
        scale: resolveDragScale(scale, handleRef.current),
        restX,
      };
      setIsDragging(true);
    }

    const origin = dragOriginRef.current;
    // Clamp in stage px against the snapshotted rest x, then store as progress.
    const nextX = clamp(
      origin.x + movement[0] / origin.scale,
      LENS_MIN_X,
      origin.restX
    );
    const nextY = clamp(
      origin.y + movement[1] / origin.scale,
      LENS_MIN_Y,
      LENS_MAX_Y
    );
    const nextTravel = {
      progress: xToProgress(nextX, origin.restX),
      y: nextY,
    };
    // Bailing out on an unchanged clamped position avoids a pointless render.
    setTravel((prev) =>
      prev.progress === nextTravel.progress && prev.y === nextTravel.y
        ? prev
        : nextTravel
    );
  };

  const handleKeyDown = (event) => {
    if (hasAlignedRef.current) return;
    const delta = KEYBOARD_DELTAS[event.key];
    if (!delta) return;
    // Keep arrow keys from scrolling the page while the handle has focus.
    event.preventDefault();
    setTravel((prev) => {
      const nextX = clamp(
        progressToX(prev.progress, restX) + delta[0],
        LENS_MIN_X,
        restX
      );
      const nextY = clamp(prev.y + delta[1], LENS_MIN_Y, LENS_MAX_Y);
      const nextProgress = xToProgress(nextX, restX);
      return nextProgress === prev.progress && nextY === prev.y
        ? prev
        : { progress: nextProgress, y: nextY };
    });
  };

  // useDrag's bind() returns the pointer handlers for the handle element;
  // merged with keyboard support and the measurement ref (see file header).
  const bindDrag = useDrag(dragHandler, DRAG_CONFIG);
  const bind = {
    ...bindDrag(),
    onKeyDown: handleKeyDown,
    ref: handleRef,
  };

  return {
    position,
    isDragging,
    progress: travel.progress,
    isAligned,
    hasAligned,
    bind,
  };
}
