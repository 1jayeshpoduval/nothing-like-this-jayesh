// Session 3B: experience entry point - upload stage (upload -> image).
// The Session 2A lenticular spike (components/three/LenticularScene) is not
// mounted here; it returns in Session 5 once the stage machine wires the 3D
// scene to the upload asset.
import { UploadZone } from "./components/experience/UploadZone.jsx";
import { UploadedImage } from "./components/experience/UploadedImage.jsx";
import { useImageUpload } from "./hooks/useImageUpload.js";

export function App() {
  const { asset, error, isProcessing, selectFile, clear } = useImageUpload();

  return (
    <main className="flex h-svh w-full flex-col items-center justify-center gap-6 bg-canvas">
      {asset ? (
        <UploadedImage asset={asset} onChangeImage={clear} />
      ) : (
        <UploadZone
          onFileSelected={selectFile}
          error={error}
          isProcessing={isProcessing}
        />
      )}
    </main>
  );
}
