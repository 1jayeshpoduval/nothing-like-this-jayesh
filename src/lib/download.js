// Image download helpers for the lenticular stage.
// Pure browser logic: no React imports.
//
// The opposite image is a same-origin bundled asset. Fetching it as a blob and
// pointing an anchor at an object URL makes the `download` attribute apply, so
// the browser saves the file instead of navigating to it.

import { OPPOSITE_IMAGE_URL } from "./opposites.js";

// Filename taken from the URL path, ignoring any query string or hash.
// e.g. "/images/airport-interior-lights.webp" -> "airport-interior-lights.webp".
export const getFileNameFromUrl = (url) => {
  const { pathname } = new URL(url, window.location.href);
  return decodeURIComponent(pathname.slice(pathname.lastIndexOf("/") + 1));
};

// Downloads the file at `url` under its own name. A failed fetch throws, and
// the error propagates to the caller (the click handler).
export const downloadFile = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed (${response.status}): ${url}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = getFileNameFromUrl(url);
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  // Revoke after the click is handled. Revoking synchronously can cancel the
  // download in some browsers.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
};

// Downloads the opposite image for an upload. Uses the per-asset URL when
// present, otherwise falls back to the bundled opposite.
export const downloadOppositeImage = (asset) =>
  downloadFile(asset?.oppositeUrl ?? OPPOSITE_IMAGE_URL);
