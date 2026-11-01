// Lenticular scene.
//
// Canvas, camera, renderer, and scene content copied from:
//   https://github.com/wass08/r3f-lenticular-material
//   src/App.jsx and src/components/Experience.jsx
// MIT License — Copyright (c) 2025 Wassim SAMAD
//
// Differences from the reference: the leva control panel is removed (no
// sliders), so the reference defaults are fixed here (nbDivisions/height are
// pinned in LenticularPlane.jsx). Textures come from the uploaded `asset`
// (side A) and its opposite image (side B). Mouse rotation stays available
// through OrbitControls.

import { Canvas, extend } from "@react-three/fiber";
import { Environment, OrbitControls, useTexture } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three/webgpu";
import { OPPOSITE_IMAGE_URL } from "../../lib/opposites";
import {
  CAMERA_FAR,
  CAMERA_FOV,
  CAMERA_NEAR,
  CAMERA_POSITION,
  CAMERA_ZOOM,
  DPR_MAX,
} from "../../lib/constants";
import { LenticularPlane } from "./LenticularPlane";

// The Canvas seeds its element catalogue from the plain three namespace,
// which has no node materials — merge the three/webgpu namespace in so
// node-material elements (e.g. <meshStandardNodeMaterial>) resolve.
extend(THREE);

// `asset` is the upload result from useImageUpload: `canvas` is the
// normalized 600x400 source for side A, `oppositeUrl` the image for side B.
const SceneContent = ({ asset }) => {
  // Side B: the fixed opposite image. Falls back to the shared constant when
  // no asset is present so the hook always receives a valid URL.
  const loadedB = useTexture(asset?.oppositeUrl ?? OPPOSITE_IMAGE_URL);

  // useTexture does not set a colour space, so side B gets sRGB to match side
  // A. The hook's value is never mutated: a clone shares the decoded image
  // source and is owned here, so it is disposed on replace/unmount.
  const textureB = useMemo(() => {
    const texture = loadedB.clone();
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, [loadedB]);

  useEffect(() => {
    return () => textureB.dispose();
  }, [textureB]);

  // Side A: wrap the normalized upload canvas. Recreated only when the canvas
  // changes (i.e. a new upload), never on unrelated re-renders.
  const canvas = asset?.canvas;
  const textureA = useMemo(() => {
    if (!canvas) return null;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, [canvas]);

  // Free the GPU resource of the previous canvas texture on replace/unmount.
  useEffect(() => {
    return () => textureA?.dispose();
  }, [textureA]);

  return (
    <>
      {/* Zoom and pan off so the card cannot leave the slot. Azimuth/polar
          clamps arrive in Session 5C. */}
      <OrbitControls makeDefault enableZoom={false} enablePan={false} />
      <Environment preset="sunset" />
      {textureA && <LenticularPlane textureA={textureA} textureB={textureB} />}
    </>
  );
};

// `onCreated` is forwarded to the R3F Canvas; LenticularStage uses it to start
// the crossfade once the renderer exists. Mouse rotation is plain OrbitControls.
export const LenticularScene = ({ asset, onCreated }) => {
  return (
    <Canvas
      shadows
      onCreated={onCreated}
      // Fixed framing (plan 5.3, see CAMERA_POSITION / CAMERA_ZOOM in constants.js).
      // Zoom maps the card to 600x400 inside the larger 800x600 canvas.
      camera={{
        position: CAMERA_POSITION,
        fov: CAMERA_FOV,
        near: CAMERA_NEAR,
        far: CAMERA_FAR,
        zoom: CAMERA_ZOOM,
      }}
      dpr={[1, DPR_MAX]}
      // WebGPURenderer must be built by an async factory: fiber hands the
      // factory its renderer props (including the Canvas's own canvas) and
      // renders the children only after the returned promise resolves, so
      // init() is awaited before the renderer is handed back.
      gl={async (props) => {
        const renderer = new THREE.WebGPURenderer({
          ...props,
          // Transparent clear (alpha 0) so the page's black shows through and
          // the card hands off seamlessly from the flat image.
          alpha: true,
          stencil: false,
        });
        await renderer.init();
        return renderer;
      }}
    >
      {/* No <color attach="background"> — the canvas stays transparent. */}
      <SceneContent asset={asset} />
    </Canvas>
  );
};
