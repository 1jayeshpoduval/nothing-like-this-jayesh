// Session 4B: experience entry point - the stage is always shown. Before an
// upload the 600x400 anchor is the drop zone and the lens is visible but
// disabled (muted, no glow, not draggable). After an upload the anchor is the
// image and the lens is enabled (glowing, draggable). StageFrame centers the
// anchor; LensStage rests the fluted lens beside it. The lens may overflow the
// viewport edge and is clipped there - the image never moves when the lens
// changes state.
// The lens is FlutedLenticularLens (components/experience/FlutedLenticularLens),
// a transparent SVG-filter overlay - it flutes the photo behind it and shows
// only its ridge highlights over the black canvas.
// The Session 2A lenticular spike (components/three/LenticularScene) is not
// mounted here; it returns in Session 5 once the stage machine wires the 3D
// scene to the upload asset.
import { useCallback } from "react";

import { LensStage } from "./components/experience/LensStage.jsx";
import { StageFrame } from "./components/experience/StageFrame.jsx";
import { UploadedImage } from "./components/experience/UploadedImage.jsx";
import { UploadZone } from "./components/experience/UploadZone.jsx";
import { useImageUpload } from "./hooks/useImageUpload.js";

export function App() {
  const { asset, error, isProcessing, selectFile, clear } = useImageUpload();

  // Session 5B replaces this with the lens -> 3D transition. Until then the
  // hook locks the drag (hasAligned) and the lens holds its aligned position.
  const handleAligned = useCallback(() => {
    console.info("[App] lens aligned - 3D transition arrives in Session 5B.");
  }, []);

  const isEnabled = Boolean(asset);

  // Anchor content: the drop zone until an image is accepted, then the image.
  const imageSlot = isEnabled ? (
    <UploadedImage asset={asset} onChangeImage={clear} />
  ) : (
    <UploadZone
      onFileSelected={selectFile}
      error={error}
      isProcessing={isProcessing}
    />
  );

  return (
    // overflow-hidden clips the stage - including the resting lens beside the
    // centered image - at the viewport edge on narrow screens instead of
    // creating a horizontal scrollbar or shifting the image.
    <main className="relative flex h-svh w-full items-center justify-center overflow-hidden bg-canvas">
      <StageFrame>
        {/* Keyed on the upload state: clearing the image remounts the lens,
            resetting it to its rest position and clearing any alignment latch. */}
        <LensStage
          key={isEnabled ? "uploaded" : "empty"}
          isEnabled={isEnabled}
          imageSlot={imageSlot}
          onAligned={handleAligned}
        />
      </StageFrame>
    </main>
  );
}
