// Session 3B: presentational view of the accepted upload.
// Source: .agents/docs/implementation-plan.md - section 3.6.
//
// Shows the object URL from useImageUpload at the fixed 600x400 stage size.
// The normalized canvas in `asset.canvas` remains authoritative for the
// Phase 4 texture; the URL exists only for this <img>. The image is never a
// drop target - replacement always goes through "Change Image".

import { useRef } from "react";

import { CHANGE_IMAGE_FADE_MS } from "../../lib/constants.js";
import { IMAGE_FILE_INPUT_ACCEPT } from "../../lib/image.js";
import { CrossfadeImage } from "./CrossfadeImage.jsx";

// `onFileSelected` receives the replacement File. The parent runs it through
// the same upload pipeline as the drop zone, so validation is shared.
//
// `isButtonHidden` fades the button out (lens drag, lock; LensStage also sets it
// from the trigger zone through the snap). The button stays
// mounted so the fade can run; while hidden it takes no pointer or focus input.
export function UploadedImage({
  asset,
  onFileSelected,
  isButtonHidden = false,
}) {
  // Hidden native picker. "Change Image" opens it directly, so the current
  // image stays on screen and the stage is untouched until a file is chosen.
  const inputRef = useRef(null);

  const handleChangeClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];
    // Reset the value so picking the same file again still fires `change`.
    // Cancelling the picker fires no `change`, so the current image is kept.
    event.target.value = "";
    if (file) onFileSelected(file);
  };

  return (
    <div className="relative h-[400px] w-[600px]">
      {/* Fades the new asset in once loaded; a replacement crossfades over the
          previous image, so nothing pops or blanks. */}
      <CrossfadeImage src={asset.url} alt="Uploaded image" />
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_FILE_INPUT_ACCEPT}
        onChange={handleInputChange}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />
      {/* Absolutely positioned fully BELOW the image: `top-full` places its top
          edge at the image's bottom edge, `mt-2` adds a small gap, so the button
          sits outside the image bounds. It is not part of the image's layout, so
          fading it out causes no layout shift. The wrapper has no overflow
          clipping, and main's overflow-y-auto makes the area below scrollable.
          Text plus icon (no box); turns yellow on hover/focus. z-30 keeps the button
          clickable above LensStage's lens handle (z-10) when the lens is nearby. */}
      <button
        type="button"
        onClick={handleChangeClick}
        aria-hidden={isButtonHidden}
        tabIndex={isButtonHidden ? -1 : undefined}
        className={[
          "absolute top-full flex items-center gap-2 font-body left-1/2 z-30 mt-4 -translate-x-1/2 cursor-pointer px-3 py-1 text-sm text-muted transition-[opacity,color] ease-stage hover:text-shader-yellow focus-visible:text-shader-yellow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shader-yellow",
          // Fade, not unmount: no layout change (absolutely positioned).
          isButtonHidden ? "pointer-events-none opacity-0" : "opacity-100",
        ].join(" ")}
        style={{ transitionDuration: `${CHANGE_IMAGE_FADE_MS}ms` }}
      >
        {/* Refresh icon (lucide "refresh-cw" style). Inherits the text color
            through currentColor, so it follows the hover/focus color. */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M8 16H3v5" />
        </svg>
        Change Image
      </button>
    </div>
  );
}
