import { DOWNLOAD_BUTTON_FADE_MS } from "../../lib/constants.js";

// Presentational "Download Opposite Image" button shown under the lenticular
// effect. Classes mirror the "Change Image" button in UploadedImage.jsx so the
// two read as one control set. The click handler is injected; the download
// logic lives in src/lib/download.js.
//
// `isVisible` fades the button in (opacity 0 -> 1). While hidden it stays
// mounted but takes no pointer or focus input, as in UploadedImage.
export function DownloadOppositeButton({ onClick, isVisible = false }) {
  return (
    // Absolutely positioned below the 600x400 stage (top-full + mt-4), the same
    // placement as "Change Image". It is outside the stage's layout, so it
    // causes no layout shift.
    <button
      type="button"
      onClick={onClick}
      aria-hidden={!isVisible}
      tabIndex={isVisible ? undefined : -1}
      className={[
        "absolute top-full left-1/2 z-30 mt-4 flex -translate-x-1/2 cursor-pointer items-center gap-2 px-3 py-1 font-body text-sm text-muted transition-[opacity,color] ease-stage hover:text-shader-yellow focus-visible:text-shader-yellow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shader-yellow motion-reduce:transition-none",
        // Fade, not unmount: no layout change (absolutely positioned).
        isVisible ? "opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
      style={{ transitionDuration: `${DOWNLOAD_BUTTON_FADE_MS}ms` }}
    >
      {/* Download icon (lucide "arrow-down-to-line" style). Inherits the text
          color through currentColor, so it follows the hover/focus color. */}
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
        <path d="M12 17V3" />
        <path d="m6 11 6 6 6-6" />
        <path d="M19 21H5" />
      </svg>
      Download Opposite Image
    </button>
  );
}
