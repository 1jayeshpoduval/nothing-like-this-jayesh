// Session 3B: presentational drop zone for the upload stage.
// Source: .agents/docs/implementation-plan.md - section 3.2.
//
// react-dropzone@20 owns drag/drop, the file picker, and drop validation;
// no custom drag handlers here. Files (including dropzone-rejected ones) are
// passed straight to `onFileSelected` so validation and its coded errors
// ("unsupported-type", "too-large", "decode-failed") stay in src/lib/image.js.

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

import { ACCEPTED_IMAGE_TYPES } from "../../lib/image.js";

// The `error` prop may be the hook's { code, message } record or a plain
// display string; render whichever the caller passed.
const errorTextOf = (error) =>
  (typeof error === "string" ? error : error?.message) ?? "";

// Dash pattern for the SVG border, in px: [dash length, gap length]. The native
// `border-dashed` gap is fixed by the browser, so the border is drawn with an
// SVG stroke to control the gap (wider than the native default).
const DASH_PATTERN = "6 7";

export function UploadZone({ onFileSelected, error, isProcessing = false }) {
  // Accept everything the dropzone hands over and let the hook validate: an
  // accepted file, or the first rejected one (e.g. a GIF) so it can report the
  // proper coded error instead of failing silently.
  const handleDrop = useCallback(
    (acceptedFiles, fileRejections) => {
      const file = acceptedFiles[0] ?? fileRejections[0]?.file;
      if (file) onFileSelected(file);
    },
    [onFileSelected],
  );

  // The root stays a pure drop surface: `noClick`/`noKeyboard` hand click and
  // Enter/Space activation to the real <button> below, so the file dialog is
  // opened exactly once per activation.
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleDrop,
    multiple: false,
    accept: ACCEPTED_IMAGE_TYPES,
    disabled: isProcessing,
    noClick: true,
    noKeyboard: true,
  });

  const errorText = errorTextOf(error);

  return (
    <div
      {...getRootProps()}
      aria-busy={isProcessing}
      className={[
        "group relative flex h-100 w-150 flex-col transition-colors duration-100",
        // The stroke colour is driven by `currentColor`, so these text colours
        // drive the dashed border and the copy (idle / hover / keyboard focus / drag).
        // `has-focus-visible` lights up the zone when the inner button is keyboard-focused.
        isDragActive
          ? "scale-[1.01] text-shader-yellow"
          : "text-muted/60 hover:text-shader-yellow has-focus-visible:text-shader-yellow",
        isProcessing ? "opacity-50" : "",
      ].join(" ")}
    >
      {/* Decorative dashed border. pointer-events-none keeps drag/click on the root. */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      >
        <rect
          x="1"
          y="1"
          style={{ width: "calc(100% - 2px)", height: "calc(100% - 2px)" }}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray={DASH_PATTERN}
        />
      </svg>

      <input {...getInputProps()} />

      <button
        type="button"
        onClick={open}
        disabled={isProcessing}
        className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-4 text-center  "
      >
        {/* 12px gap above the copy comes from the button's gap-3. Decorative only. */}
        {/* Dimmed at rest; lights up on zone hover, drag, or keyboard focus (group = root). */}
        <img
          src="/images/dropzone-img.jpg"
          alt=""
          aria-hidden="true"
          draggable={false}
          className={[
            "pointer-events-none h-12 rounded-md w-12 select-none transition-[opacity,filter] duration-100",
            isDragActive
              ? "opacity-100 brightness-100"
              : "opacity-50 brightness-80 group-hover:opacity-100 group-hover:brightness-100 group-has-focus-visible:opacity-100 group-has-focus-visible:brightness-100",
          ].join(" ")}
        />
        {/* Inherits the root's text colour so it fades grey -> white with the zone. */}
        <span className="text-sm font-body transition-colors duration-100">
          {isDragActive
            ? "Drop to use this image"
            : isProcessing
              ? "Preparing image\u2026"
              : "Drop an image here or click to browse"}
        </span>
        {/*  <span className="font-body text-sm text-muted">or click to browse</span> */}
      </button>

      {/* Inline error below the copy, announced politely. */}
      <p
        role="status"
        aria-live="polite"
        className="font-body min-h-5 px-4 pb-4 text-sm text-accent"
      >
        {errorText}
      </p>
    </div>
  );
}
