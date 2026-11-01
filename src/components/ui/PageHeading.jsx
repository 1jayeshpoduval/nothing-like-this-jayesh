// Page-level heading and subtitle shown above the experience stage.
// Presentational only. The <header> is in normal flow inside App's centered
// flex column, so it is vertically centered together with the stage. It is
// pointer-events-none so it never blocks the drop zone or the lens.
// Fonts: the heading uses font-display (--font-display token in index.css);
// the subtitle uses font-body (--font-body, LTSuperior Medium).
//
// `isLenticularActive`: true from the moment the lenticular crossfade starts
// (the same event that starts the visual transition). The heading then wipes
// left-to-right from "Discover..." to "Rotate image..." (the outgoing line
// is wiped away from the left, the incoming line is revealed from the left, with
// a fade). Both wipes start together with no delay, so the heading and the lens
// transition run in sync. Both lines stay mounted in the same grid cell, so the
// heading never changes size or jumps. The wipe runs only on a change, not on
// mount. Under prefers-reduced-motion the switch is instant.

import { useState } from "react";

const HEADING_TEXT = "Discover the opposite of an image";
const HEADING_SWAP_TEXT = "Rotate image to see its opposite";

// Wipe geometry (clip-path inset: top right bottom left). The vertical and
// horizontal overhang keeps ascenders, descenders and glyph overhangs from being
// clipped at the box edge. Keep in sync with the heading-wipe keyframes in
// index.css.
// Resting visible line: the whole line is revealed.
const CLIP_VISIBLE = "inset(-0.4em -0.2em)";
// Resting hidden line after a wipe-out: left edge has moved to the right edge.
const CLIP_WIPED_OUT = "inset(-0.4em -0.2em -0.4em 100%)";

// Shared layout for both lines. motion-reduce:animate-none makes the switch
// instant for users who prefer reduced motion.
const LINE_BASE_CLASSES =
  "col-start-1 row-start-1 w-full text-center motion-reduce:animate-none";

// Wipe-in: incoming line revealed left-to-right, starts with the crossfade
// with no delay (see index.css).
const LINE_ENTER_CLASSES = "animate-heading-wipe-in";
// Wipe-out: outgoing line wiped away left-to-right (see index.css).
const LINE_EXIT_CLASSES = "animate-heading-wipe-out";

export function PageHeading({ isLenticularActive = false }) {
  // Track the last readiness value so the wipe only runs after a real change.
  // On mount the lines render in their resting state with no animation.
  // This is the React-documented pattern for adjusting state on a prop change.
  const [prevActive, setPrevActive] = useState(isLenticularActive);
  const [hasSwapped, setHasSwapped] = useState(false);
  if (prevActive !== isLenticularActive) {
    setPrevActive(isLenticularActive);
    setHasSwapped(true);
  }

  const lineClasses = (isVisible) => {
    // Visible line fades in with the wipe-in; hidden line fades out with the wipe-out.
    const motion = !hasSwapped
      ? ""
      : isVisible
        ? LINE_ENTER_CLASSES
        : LINE_EXIT_CLASSES;
    return `${LINE_BASE_CLASSES} ${isVisible ? "opacity-100" : "opacity-0"} ${motion}`;
  };

  // Resting clip-path, used on mount and under reduced motion. During an
  // animation the keyframes take precedence.
  const lineStyle = (isVisible) => ({
    clipPath: isVisible ? CLIP_VISIBLE : CLIP_WIPED_OUT,
  });

  // The h1 is the single heading. Both lines are stacked in one grid cell
  // (col-start-1 row-start-1). Only the current text is in the sr-only span,
  // so screen readers announce it once. aria-live="polite" announces the new
  // text after the swap. The visual lines are aria-hidden.
  return (
    <header className="pointer-events-none w-full px-6 text-center">
      {/* Flex column with gap-6 (24px) enforces the heading/subtitle spacing. */}
      <div className="mx-auto flex flex-col items-center gap-4">
        <h1 className="grid w-full font-display text-[50px] font-semibold leading-[1.05] tracking-[-0.04em] text-white">
          <span className="sr-only" aria-live="polite" aria-atomic="true">
            {isLenticularActive ? HEADING_SWAP_TEXT : HEADING_TEXT}
          </span>
          <span
            aria-hidden="true"
            className={lineClasses(!isLenticularActive)}
            style={lineStyle(!isLenticularActive)}
          >
            {HEADING_TEXT}
          </span>
          <span
            aria-hidden="true"
            className={lineClasses(isLenticularActive)}
            style={lineStyle(isLenticularActive)}
          >
            {HEADING_SWAP_TEXT}
          </span>
        </h1>
        {/* Stays mounted in both states so the header height never changes.
            When the lens is active it fades out, drops slightly and blurs, and
            is hidden from assistive tech. Transition runs with the heading wipe
            (no delay). translate-* uses the `translate` CSS property in Tailwind 4. */}
        <p
          className={`font-body leading-relaxed text-muted transition-opacity duration-825ms ease-out motion-reduce:transition-none ${
            isLenticularActive
              ? "pointer-events-none /translate-y-1/2 opacity-0 blur-xs"
              : "translate-y-0 opacity-100 blur-none"
          }`}
          aria-hidden={isLenticularActive}
        >
          Upload an image, then drag the lenticular lens over it to reveal its
          opposite.
        </p>
      </div>
    </header>
  );
}
