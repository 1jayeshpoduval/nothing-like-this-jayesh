// Presentational image that fades a new `src` in over the previous one.
//
// - Initial upload: the new image starts at opacity 0 and fades to 1 once it has
//   loaded (no pop).
// - Replacement ("Change image"): the previous image stays on screen underneath
//   until the new one has loaded, then the new one fades in over it. The old
//   layer is removed when that fade ends, so there is no blank frame.
// - prefers-reduced-motion: no animation; the new image appears as soon as it
//   has loaded and the old one is removed at once.
// Only opacity is animated, and both layers are absolutely positioned, so
// nothing reflows.

import { useState } from "react";

import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion.js";
import { IMAGE_FADE_MS } from "../../lib/constants.js";

// Both layers fill the parent (which sets the 600x400 size).
const LAYER_CLASS = "absolute inset-0 h-full w-full object-cover";

export function CrossfadeImage({ src, alt }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  // `current` is the src being shown; `previous` is the layer still visible
  // underneath while the new one fades in (null when there is nothing to keep).
  const [layers, setLayers] = useState({ current: src, previous: null });
  // The src that has finished loading. Comparing it to `src` avoids resetting
  // state on every change.
  const [loadedSrc, setLoadedSrc] = useState(null);

  // Adjust state during render when `src` changes (React's documented pattern
  // for prop-driven state). React re-runs this render with the new state before
  // committing, so the stale output below is never painted.
  if (layers.current !== src) {
    setLayers({
      current: src,
      previous: prefersReducedMotion ? null : layers.current,
    });
  }

  // Once the new layer's fade ends, drop the old layer. Guarded so a late event
  // from an earlier src cannot remove the layer that is now current.
  const handleFadeEnd = () => {
    setLayers((state) =>
      state.current === src ? { ...state, previous: null } : state,
    );
  };

  const isLoaded = loadedSrc === src;

  // Before load: hidden, so the previous layer (or the canvas) shows through.
  // After load: animate 0 -> 1 with the shared stage easing, unless reduced motion
  // is on, in which case it is shown at full opacity straight away.
  const incomingStyle = !isLoaded
    ? { opacity: 0 }
    : prefersReducedMotion
      ? undefined
      : { animation: `image-fade-in ${IMAGE_FADE_MS}ms var(--ease-stage)` };

  // Both layers are one keyed array, so React matches them by src across
  // renders. The outgoing <img> is therefore the same DOM node that was the
  // incoming one, not a remount: no reload and no flash.
  return [
    // Outgoing layer: stays at full opacity beneath the incoming one.
    layers.previous !== null && (
      <img
        key={layers.previous}
        src={layers.previous}
        alt=""
        aria-hidden="true"
        className={LAYER_CLASS}
      />
    ),
    // Incoming layer: keyed by src, so each new image mounts fresh at opacity 0.
    <img
      key={src}
      src={src}
      alt={alt}
      className={LAYER_CLASS}
      style={incomingStyle}
      onLoad={() => setLoadedSrc(src)}
      onAnimationEnd={handleFadeEnd}
    />,
  ];
}
