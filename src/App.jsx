// Session 5B: experience entry point. Stage flow (plan 1.1):
// upload -> lens -> transition -> interactive3d. "Change image" opens the file
// picker in place and swaps the image; it stays on the lens stage.
// - upload / lens: LensStage. Before an upload the anchor is the drop zone and
//   the lens is disabled; after an upload the anchor is the image and the lens
//   is live. Lens alignment calls beginTransition.
// - transition / interactive3d: LensStage stays mounted (locked, no input). Its
//   anchor swaps to LenticularStage in the same 600x400 slot, so the lens stays
//   visible while the canvas loads. It fades out in step with the lenticular
//   crossfade (beginCrossfade), then stays mounted at opacity 0.
// StageFrame centers the anchor in every stage.
// The lens is FlutedLenticularLens (components/experience/FlutedLenticularLens),
// a transparent SVG-filter overlay.
import { useCallback } from "react";

import { LensStage } from "./components/experience/LensStage.jsx";
import { LenticularStage } from "./components/experience/LenticularStage.jsx";
import { StageFrame } from "./components/experience/StageFrame.jsx";
import { TopScreenShader } from "./components/experience/TopScreenShader.jsx";
import { UploadedImage } from "./components/experience/UploadedImage.jsx";
import { UploadZone } from "./components/experience/UploadZone.jsx";
import { Navbar } from "./components/ui/Navbar.jsx";
import { PageHeading } from "./components/ui/PageHeading.jsx";
import { useExperienceStage, EXPERIENCE_STAGE } from "./hooks/useExperienceStage.js";
import { useImageUpload } from "./hooks/useImageUpload.js";

export function App() {
  const { asset, error, isProcessing, selectFile } = useImageUpload();
  const {
    stage,
    isLensHidden,
    beginTransition,
    beginCrossfade,
    completeTransition,
  } = useExperienceStage(asset);

  // Lens alignment hands the current asset to the stage machine. The hook
  // ignores repeated calls for the same asset, so a double trigger is safe.
  const handleAligned = useCallback(() => {
    beginTransition(asset);
  }, [asset, beginTransition]);

  const isEnabled = Boolean(asset);
  const is3dStage =
    stage === EXPERIENCE_STAGE.TRANSITION ||
    stage === EXPERIENCE_STAGE.INTERACTIVE_3D;

  // Anchor content: the drop zone until an image is accepted, then the image.
  // After the lock it is the lenticular stage, in the same slot.
  // Receives `isButtonHidden` from LensStage (lens drag or lock). The lenticular
  // stage has no "Change image" button, so only the uploaded image uses it.
  // A replacement file goes straight to selectFile: the asset swaps in place,
  // and the stage stays on lens (no return to the upload stage).
  const renderImageSlot = ({ isButtonHidden }) => {
    if (is3dStage) {
      return (
        <LenticularStage
          asset={asset}
          onReady={completeTransition}
          onCrossfadeStart={beginCrossfade}
        />
      );
    }
    if (isEnabled) {
      return (
        <UploadedImage
          asset={asset}
          onFileSelected={selectFile}
          isButtonHidden={isButtonHidden}
        />
      );
    }
    return (
      <UploadZone
        onFileSelected={selectFile}
        error={error}
        isProcessing={isProcessing}
      />
    );
  };

  return (
    // overflow-x-hidden clips the stage - including the resting lens beside the
    // centered image - at the viewport edge on narrow screens instead of
    // creating a horizontal scrollbar or shifting the image. overflow-y-auto lets
    // the centered group scroll on short viewports rather than clipping its top.
    // The group is centered with m-auto (not justify-center), which keeps the
    // top reachable when the content is taller than the viewport.
    // The Navbar is fixed to the viewport, so main reserves its height with
    // pt-22 (matches NAVBAR_HEIGHT_CLASS, h-22, in Navbar.jsx). Padding is outside
    // the m-auto centering box, so the centered group centers in the space below
    // the navbar.
    <main className="relative flex h-svh w-full flex-col overflow-x-hidden overflow-y-auto bg-canvas pt-22">
      {/* Top navigation bar with the centered logo. */}
      <Navbar />
      {/* Decoration band at the top. Absolute and pointer-events-none, so it is
          not a flex child; z-0 keeps it below the interactive group. */}
      <TopScreenShader />
      {/* Heading, subtitle and stage as one centered flex column. w-full keeps
          the group horizontally centered, which StageFrame's lens rest geometry
          relies on. m-auto centers it vertically within main. z-10 keeps the
          interactive stage above the decoration band. */}
      <div className="relative z-10 m-auto flex w-full flex-col items-center gap-10 py-8">
        {/* Driven by isLensHidden, which flips on the same event that starts the
            lenticular crossfade (beginCrossfade), not on its completion. The
            heading wipe therefore starts with the visual transition. */}
        <PageHeading isLenticularActive={isLensHidden} />
        <StageFrame>
          {/* Keyed on the upload state: clearing the image remounts the lens,
              resetting it to its rest position and clearing any alignment latch.
              It stays mounted through the lock, so the lens remains visible
              until the lenticular crossfade hides it. */}
          <LensStage
            key={isEnabled ? "uploaded" : "empty"}
            isEnabled={isEnabled}
            isLocked={is3dStage}
            isLensHidden={isLensHidden}
            renderImageSlot={renderImageSlot}
            onAligned={handleAligned}
          />
        </StageFrame>
      </div>
    </main>
  );
}
