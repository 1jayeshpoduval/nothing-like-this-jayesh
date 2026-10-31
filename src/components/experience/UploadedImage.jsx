// Session 3B: presentational view of the accepted upload.
// Source: .agents/docs/implementation-plan.md - section 3.6.
//
// Shows the object URL from useImageUpload at the fixed 600x400 stage size.
// The normalized canvas in `asset.canvas` remains authoritative for the
// Phase 4 texture; the URL exists only for this <img>. The image is never a
// drop target - replacement always goes through "Change image".

export function UploadedImage({ asset, onChangeImage }) {
  return (
    <div className="relative h-[400px] w-[600px]">
      <img
        src={asset.url}
        alt="Uploaded image"
        className="h-full w-full object-cover"
      />
      {/* z-30 keeps the button clickable above LensStage's lens handle (z-10)
          when the lens covers the image, e.g. after alignment. */}
      <button
        type="button"
        onClick={onChangeImage}
        className="absolute top-3 right-3 z-30 cursor-pointer border border-rim/30 bg-canvas/80 px-4 py-2 text-sm text-rim transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Change image
      </button>
    </div>
  );
}
