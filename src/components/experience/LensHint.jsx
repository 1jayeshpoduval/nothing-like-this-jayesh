// Hint label beside the lens's resting position.
//
// It is a sibling of the draggable lens handle (rendered by LensStage inside
// the image anchor), not a child, so it never moves when the lens is dragged.
// Its box spans from the anchor's left edge to `restX` (the lens's resting x)
// and right-aligns the text, so the label sits just to the left of where the
// lens starts.
//
// Animations (defined in index.css):
// - on mount: `animate-hint-fade-in`, a slow fade after a short delay.
// - when `isFadingOut`: `animate-hint-fade-out`, a quick fade. When it ends,
//   `onFadeOutEnd` fires so the parent can unmount this component.

import { LENS_HEIGHT } from "../../lib/constants.js";

// Must match the @keyframes name of `--animate-hint-fade-out` in index.css.
const HINT_FADE_OUT_ANIMATION_NAME = "hint-fade-out";

export function LensHint({ restX, isFadingOut, onFadeOutEnd }) {
  const handleAnimationEnd = (event) => {
    if (isFadingOut && event.animationName === HINT_FADE_OUT_ANIMATION_NAME) {
      onFadeOutEnd();
    }
  };

  return (
    <div
      className="pointer-events-none absolute top-0 flex items-center justify-end pr-4"
      style={{ left: 0, width: restX, height: LENS_HEIGHT }}
    >
      <p
        role="status"
        aria-live="polite"
        className={[
          "font-body whitespace-nowrap",
          isFadingOut ? "animate-hint-fade-out" : "animate-hint-fade-in",
        ].join(" ")}
        onAnimationEnd={handleAnimationEnd}
      >
        <span className="text-sm text-rim">Place lens on the image</span>
      </p>
    </div>
  );
}
