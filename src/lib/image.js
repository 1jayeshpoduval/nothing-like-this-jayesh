// Upload validation and normalization for the lenticular experience.
// Source: .agents/docs/implementation-plan.md — section 2.2 / Session 3A.
// Pure browser-library logic: no React or three.js imports here.

import { IMAGE_HEIGHT, IMAGE_WIDTH } from "./constants.js";

// --- Allowed upload types (section 2.2) ---

export const IMAGE_MIME_JPEG = "image/jpeg";
export const IMAGE_MIME_PNG = "image/png";
export const IMAGE_MIME_WEBP = "image/webp";

export const ALLOWED_IMAGE_MIME_TYPES = Object.freeze([
  IMAGE_MIME_JPEG,
  IMAGE_MIME_PNG,
  IMAGE_MIME_WEBP,
]);

// Hard upload cap: 10 MB. Larger files are rejected before any decode work.
export const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024;

// Validation error codes returned by validateImageFile.
export const IMAGE_ERROR_UNSUPPORTED_TYPE = "unsupported-type";
export const IMAGE_ERROR_TOO_LARGE = "too-large";

// Decode/normalization failure code, also set as `error.code` on the thrown Error.
export const IMAGE_ERROR_DECODE_FAILED = "decode-failed";

// Builds the coded error thrown by normalizeToStage so callers can branch on
// `error.code` instead of parsing the message.
const createDecodeError = () =>
  Object.assign(new Error(IMAGE_ERROR_DECODE_FAILED), {
    code: IMAGE_ERROR_DECODE_FAILED,
  });

// Synchronous MIME/size check. Returns null when the file is acceptable,
// otherwise "unsupported-type" (missing/empty/unknown MIME, e.g. GIF, SVG,
// text) or "too-large" (over MAX_IMAGE_FILE_SIZE). Never decodes the file.
export const validateImageFile = (file) => {
  if (!file || !file.type || !ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    return IMAGE_ERROR_UNSUPPORTED_TYPE;
  }
  if (file.size > MAX_IMAGE_FILE_SIZE) {
    return IMAGE_ERROR_TOO_LARGE;
  }
  return null;
};

// Decodes the file (respecting EXIF orientation) and draws it cover-cropped
// into a fixed IMAGE_WIDTH x IMAGE_HEIGHT canvas. The bitmap is always closed;
// decode failures and zero/invalid dimensions throw an Error with
// `code: "decode-failed"`. The returned canvas is the normalized stage image.
export const normalizeToStage = async (file) => {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Rejecting createImageBitmap = unreadable/corrupt input; rethrow as coded error.
    throw createDecodeError();
  }

  try {
    const { width, height } = bitmap;
    // NaN, 0, or negative dimensions would make the cover-crop scale meaningless.
    if (!(width > 0) || !(height > 0)) {
      throw createDecodeError();
    }

    const canvas = document.createElement("canvas");
    canvas.width = IMAGE_WIDTH;
    canvas.height = IMAGE_HEIGHT;

    const context = canvas.getContext("2d");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    // Cover crop: scale up the smaller ratio so the stage is fully covered,
    // then center the overflow. Never distorts: one uniform scale factor.
    const scale = Math.max(IMAGE_WIDTH / width, IMAGE_HEIGHT / height);
    const drawWidth = width * scale;
    const drawHeight = height * scale;
    const dx = (IMAGE_WIDTH - drawWidth) / 2;
    const dy = (IMAGE_HEIGHT - drawHeight) / 2;

    context.drawImage(bitmap, dx, dy, drawWidth, drawHeight);
    return canvas;
  } finally {
    bitmap.close();
  }
};
