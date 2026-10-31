// Session 3B: upload pipeline hook - validate -> normalize -> resolve pair.
// Source: .agents/docs/implementation-plan.md - sections 3.3 / 3.4.
// React state only; the actual work lives in src/lib/image.js and
// src/lib/opposites.js so the logic stays testable and UI-free.

import { useCallback, useEffect, useRef, useState } from "react";

import {
  IMAGE_ERROR_DECODE_FAILED,
  IMAGE_ERROR_TOO_LARGE,
  IMAGE_ERROR_UNSUPPORTED_TYPE,
  normalizeToStage,
  validateImageFile,
} from "../lib/image.js";
import { resolvePair } from "../lib/opposites.js";

// Human-readable copy for the stable validation codes from src/lib/image.js.
// The codes themselves are preserved on every error record (see below).
const ERROR_MESSAGES = Object.freeze({
  [IMAGE_ERROR_UNSUPPORTED_TYPE]:
    "Unsupported file type. Choose a JPEG, PNG, or WebP image.",
  [IMAGE_ERROR_TOO_LARGE]: "That image is over 10 MB. Choose a smaller file.",
  [IMAGE_ERROR_DECODE_FAILED]: "That image could not be read. Try another file.",
});

// Error record shape: { code, message }. `code` is one of
// "unsupported-type" | "too-large" | "decode-failed" so callers can branch on
// it; `message` is the display copy.
const createUploadError = (code) => ({
  code,
  message: ERROR_MESSAGES[code] ?? code,
});

// Maps a thrown value to an error record. normalizeToStage tags its failures
// with `code: "decode-failed"`; anything unexpected is reported as a decode
// failure rather than swallowed.
const toUploadError = (thrown) =>
  createUploadError(
    thrown && thrown.code ? thrown.code : IMAGE_ERROR_DECODE_FAILED
  );

// Accepts a File, runs validation + normalization + pair lookup, and exposes
// the result for the upload stage. Owns the object URL lifecycle and a
// monotonic request id so a slow decode can never overwrite a newer selection.
export function useImageUpload() {
  const [asset, setAsset] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Monotonically increasing request id: only the latest selectFile()/clear()
  // may write state or keep an object URL. Anything started earlier discards
  // its result when it settles (stale async guard).
  const requestIdRef = useRef(0);
  const objectUrlRef = useRef(null);

  // Idempotent revoke: safe on replace, reset, unmount, and StrictMode's
  // double-invoked effect cleanup.
  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current !== null) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const selectFile = useCallback(
    async (file) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setIsProcessing(true);
      setError(null);

      try {
        // 1. Validate: synchronous MIME/size check, coded errors from src/lib.
        // Runs in this task, so it cannot go stale before the check below.
        const validationCode = validateImageFile(file);
        if (validationCode !== null) {
          setError(createUploadError(validationCode));
          return;
        }

        // 2. Normalize: EXIF-corrected, cover-cropped 600x400 canvas. This is
        // the authoritative image for the Phase 4 texture.
        const canvas = await normalizeToStage(file);

        // 3. Resolve the opposite pair for this file name.
        const pair = resolvePair(file.name);

        // Stale guard: a newer selectFile()/clear() started while decoding.
        if (requestId !== requestIdRef.current) return;

        // Unknown filenames fall back to the default pair by design; log the
        // miss in development only (plan 3.5).
        if (!pair.matched && import.meta.env.DEV) {
          console.warn(
            `[useImageUpload] no pair for "${file.name}"; using default "${pair.pairId}"`
          );
        }

        // Object URL for the <img> only. Created after the stale check so an
        // abandoned request never leaks a URL.
        const url = URL.createObjectURL(file);
        revokeObjectUrl();
        objectUrlRef.current = url;

        setAsset({
          canvas,
          url,
          fileName: file.name,
          pairId: pair.pairId,
          oppositeUrl: pair.oppositeUrl,
          matched: pair.matched,
        });
      } catch (thrown) {
        if (requestId !== requestIdRef.current) return;
        setError(toUploadError(thrown));
      } finally {
        // Only the active request may clear the processing flag.
        if (requestId === requestIdRef.current) setIsProcessing(false);
      }
    },
    [revokeObjectUrl]
  );

  const clear = useCallback(() => {
    // Invalidate any in-flight decode so it cannot repopulate cleared state.
    requestIdRef.current += 1;
    revokeObjectUrl();
    setAsset(null);
    setError(null);
    setIsProcessing(false);
  }, [revokeObjectUrl]);

  // Unmount: revoke the URL and invalidate in-flight work. The revoke is
  // idempotent (no-op when nothing was created yet), so StrictMode's
  // mount -> cleanup -> mount cycle is safe.
  useEffect(
    () => () => {
      requestIdRef.current += 1;
      revokeObjectUrl();
    },
    [revokeObjectUrl]
  );

  return { asset, error, isProcessing, selectFile, clear };
}
