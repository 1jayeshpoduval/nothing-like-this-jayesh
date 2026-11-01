// Session 5B: inline 600x400 lenticular stage that replaces the lens stage.
// Source: .agents/docs/implementation-plan.md - sections 5.1 / 5.2 / 7.6.
//
// Two layers share the image slot:
// - DOM <img> with the normalized upload, underneath.
// - LenticularScene (R3F canvas) in an opacity-fading wrapper, above.
//
// Timeline (section 5.2). Each step starts when the previous one ends:
// 1. Mount: the image holds at its 600x400 slot. The lens above it stays visible.
// 2. CANVAS_MOUNT_DELAY_MS later: the canvas mounts (immediately under reduced motion).
// 3. Once the canvas reports created (or the scene failed into its fallback):
//    the canvas fades in and the image fades out over fadeMs, and
//    onCrossfadeStart() fires so the parent fades the lens out on the same
//    timing. A slow canvas simply holds the image; there is no spinner.
// 4. Fade end: onReady() fires once. The parent moves the stage to interactive3d.
// 5. DOWNLOAD_BUTTON_REVEAL_DELAY_MS after step 4 (immediately under reduced
//    motion): the "Download opposite image" button fades in. It stays hidden
//    before that.
//
// No scale or z-depth animation is used anywhere in this handoff: the image,
// the canvas wrapper, and the card all stay at their 600x400 size. Only opacity
// changes (plan 7.3). Nothing here touches layout.
//
// Reduced motion (plan 5.2): a crossfade of getCrossfadeMs(true), and the
// canvas mounts immediately.

import { useEffect, useRef, useState } from "react";

import { DownloadOppositeButton } from "./DownloadOppositeButton.jsx";
import { SceneErrorBoundary } from "../three/SceneErrorBoundary.jsx";
import { LenticularScene } from "../three/LenticularScene.jsx";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion.js";
import { useDelayedReveal } from "../../hooks/useDelayedReveal.js";
import { getCrossfadeMs } from "../../lib/crossfade.js";
import { downloadOppositeImage } from "../../lib/download.js";
import {
  CANVAS_MOUNT_DELAY_MS,
  CANVAS_OVERFLOW_H,
  CANVAS_OVERFLOW_W,
  DOWNLOAD_BUTTON_REVEAL_DELAY_MS,
  IMAGE_HEIGHT,
  IMAGE_WIDTH,
} from "../../lib/constants.js";

export function LenticularStage({ asset, onReady, onCrossfadeStart }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const [hasMountDelayElapsed, setHasMountDelayElapsed] = useState(false);
  const [isCanvasCreated, setIsCanvasCreated] = useState(false);
  const [hasSceneFailed, setHasSceneFailed] = useState(false);
  // Set when the crossfade has finished and the R3F scene is live (onReady).
  const [isTransitionComplete, setIsTransitionComplete] = useState(false);

  // Shared with LensStage so the lens fade matches this crossfade exactly.
  const fadeMs = getCrossfadeMs(prefersReducedMotion);

  // Reduced motion mounts the canvas immediately; otherwise after the delay.
  const isCanvasMounted = prefersReducedMotion || hasMountDelayElapsed;
  // A scene that failed also counts as ready: its flat fallback then fades in
  // and the stage completes instead of hanging on the image.
  const isSceneReady = isCanvasCreated || hasSceneFailed;
  const isFading = isCanvasMounted && isSceneReady;

  // Step 2: canvas mount delay. Timer cancelled on unmount.
  useEffect(() => {
    if (prefersReducedMotion) return undefined;
    const timer = setTimeout(
      () => setHasMountDelayElapsed(true),
      CANVAS_MOUNT_DELAY_MS
    );
    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  // Step 3 + 4: crossfade once ready, then report completion once. The effect
  // runs when isFading turns true, and the timer is cleared on unmount.
  // onReady and onCrossfadeStart are read through refs so a new callback
  // identity does not restart the timer.
  const onReadyRef = useRef(onReady);
  const onCrossfadeStartRef = useRef(onCrossfadeStart);
  useEffect(() => {
    onReadyRef.current = onReady;
    onCrossfadeStartRef.current = onCrossfadeStart;
  }, [onReady, onCrossfadeStart]);

  useEffect(() => {
    if (!isFading) return undefined;
    // Starts the lens fade-out in the same effect pass as the canvas fade-in.
    onCrossfadeStartRef.current?.();
    const timer = setTimeout(() => {
      setIsTransitionComplete(true);
      onReadyRef.current?.();
    }, fadeMs);
    return () => clearTimeout(timer);
  }, [isFading, fadeMs]);

  // The download button appears only after the transition completes, plus a
  // short delay for polish. Reduced motion skips the delay.
  const isDownloadVisible = useDelayedReveal(
    isTransitionComplete,
    prefersReducedMotion ? 0 : DOWNLOAD_BUTTON_REVEAL_DELAY_MS
  );

  // Opacity is the only animated property: the image and canvas never scale
  // or move in depth, so the handoff keeps the exact 600x400 slot.
  const imageStyle = {
    opacity: isFading ? 0 : 1,
    transition: `opacity ${fadeMs}ms var(--ease-stage)`,
  };

  const canvasStyle = {
    opacity: isFading ? 1 : 0,
    transition: `opacity ${fadeMs}ms var(--ease-stage)`,
  };

  // Downloads the opposite image (asset.oppositeUrl, else the bundled fallback).
  // Errors propagate: a failed fetch surfaces as an unhandled rejection.
  const handleDownloadOppositeClick = () => {
    downloadOppositeImage(asset);
  };

  return (
    <div
      className="relative"
      style={{
        width: IMAGE_WIDTH,
        height: IMAGE_HEIGHT,
      }}
    >
      {/* Underlay: the normalized upload, held until the canvas is ready. */}
      <img
        src={asset.url}
        alt="Uploaded image"
        className="absolute inset-0 h-full w-full object-cover"
        style={imageStyle}
      />

      {/* Overlay: the canvas mounts after the delay and fades in above the image.
          It is larger than the card (CANVAS_OVERFLOW_W/H) and centered on the
          card's center, so a tilted card has room to extend. No overflow
          clipping here: the corners of the card render into the margin. */}
      <div
        className="absolute z-10 flex items-center justify-center p-0"
        style={{
          ...canvasStyle,
          left: "50%",
          top: "50%",
          width: CANVAS_OVERFLOW_W,
          height: CANVAS_OVERFLOW_H,
          marginLeft: -CANVAS_OVERFLOW_W / 2,
          marginTop: -CANVAS_OVERFLOW_H / 2,
        }}
      >
        {isCanvasMounted && (
          <SceneErrorBoundary asset={asset} onError={() => setHasSceneFailed(true)}>
            <LenticularScene
              asset={asset}
              onCreated={() => setIsCanvasCreated(true)}
            />
          </SceneErrorBoundary>
        )}
      </div>

      {/* Sits under the stage (absolute, top-full), like "Change image". It is
          not part of the stage's layout, so the handoff geometry is unchanged.
          Hidden until the transition completes and the delay has elapsed. */}
      <DownloadOppositeButton
        onClick={handleDownloadOppositeClick}
        isVisible={isDownloadVisible}
      />
    </div>
  );
}
