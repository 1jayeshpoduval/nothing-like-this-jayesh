// Session 3B: presentational drop zone for the upload stage.
// Source: .agents/docs/implementation-plan.md - section 3.2.
//
// react-dropzone@20 owns drag/drop, the file picker, and drop validation;
// no custom drag handlers here. Files (including dropzone-rejected ones) are
// passed straight to `onFileSelected` so validation and its coded errors
// ("unsupported-type", "too-large", "decode-failed") stay in src/lib/image.js.

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

// MIME -> extension map for both the dropzone checks and the native picker.
const ACCEPTED_IMAGE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

// The `error` prop may be the hook's { code, message } record or a plain
// display string; render whichever the caller passed.
const errorTextOf = (error) =>
  (typeof error === "string" ? error : error?.message) ?? "";

export function UploadZone({ onFileSelected, error, isProcessing = false }) {
  // Accept everything the dropzone hands over and let the hook validate: an
  // accepted file, or the first rejected one (e.g. a GIF) so it can report the
  // proper coded error instead of failing silently.
  const handleDrop = useCallback(
    (acceptedFiles, fileRejections) => {
      const file = acceptedFiles[0] ?? fileRejections[0]?.file;
      if (file) onFileSelected(file);
    },
    [onFileSelected]
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
        "flex h-[400px] w-[600px] flex-col border border-dashed transition-transform duration-200",
        isDragActive
          ? "scale-[1.01] border-accent"
          : "border-muted/50 hover:border-accent/60",
        isProcessing ? "opacity-50" : "",
      ].join(" ")}
    >
      <input {...getInputProps()} />

      <button
        type="button"
        onClick={open}
        disabled={isProcessing}
        className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span className="text-lg text-rim">
          {isDragActive
            ? "Drop to use this image"
            : isProcessing
              ? "Preparing image\u2026"
              : "Drop an image"}
        </span>
        <span className="text-sm text-muted">or click to browse</span>
      </button>

      {/* Inline error below the copy, announced politely. */}
      <p
        role="status"
        aria-live="polite"
        className="min-h-5 px-4 pb-4 text-sm text-accent"
      >
        {errorText}
      </p>
    </div>
  );
}
