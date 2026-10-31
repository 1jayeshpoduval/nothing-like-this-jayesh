// Lenticular spike scene for Session 2A.
//
// Canvas, camera, renderer, and scene content copied from:
//   https://github.com/wass08/r3f-lenticular-material
//   src/App.jsx and src/components/Experience.jsx
// MIT License — Copyright (c) 2025 Wassim SAMAD
//
// Differences from the reference: the leva control panel is removed (no
// sliders), so the reference defaults are fixed here (texture set
// "evil-angel"; nbDivisions/height are pinned in LenticularPlane.jsx).
// Mouse rotation stays available through OrbitControls.

import { Canvas, extend } from "@react-three/fiber";
import {
  Environment,
  OrbitControls,
  useTexture,
  useVideoTexture,
} from "@react-three/drei";
import * as THREE from "three/webgpu";
import { LenticularPlane } from "./LenticularPlane";

// The Canvas seeds its element catalogue from the plain three namespace,
// which has no node materials — merge the three/webgpu namespace in so
// node-material elements (e.g. <meshStandardNodeMaterial>) resolve.
extend(THREE);

// Reference leva `textureSet` control default — see header comment.
const TEXTURE_SET = "evil-angel";

const SceneContent = () => {
  const videoA = useVideoTexture("spike/textures/mathematics-twerk/twerk-course.mp4");
  const videoB = useVideoTexture(
    "spike/textures/mathematics-twerk/mathematics-numbers.mp4"
  );

  const textureEvilAngelA = useTexture("spike/textures/evil-angel/evil.png");
  const textureEvilAngelB = useTexture("spike/textures/evil-angel/angel.png");

  const textureSummerWinterA = useTexture("spike/textures/summer-winter/summer.png");
  const textureSummerWinterB = useTexture("spike/textures/summer-winter/winter.png");

  const textureA = {
    ["evil-angel"]: textureEvilAngelA,
    ["summer-winter"]: textureSummerWinterA,
    ["mathematics-twerk"]: videoA,
  }[TEXTURE_SET];

  const textureB = {
    ["evil-angel"]: textureEvilAngelB,
    ["summer-winter"]: textureSummerWinterB,
    ["mathematics-twerk"]: videoB,
  }[TEXTURE_SET];

  return (
    <>
      <OrbitControls />
      <Environment preset="sunset" />
      <LenticularPlane textureA={textureA} textureB={textureB} />
    </>
  );
};

export const LenticularScene = () => {
  return (
    <Canvas
      shadows
      camera={{ position: [3, 3, 3], fov: 30 }}
      // WebGPURenderer must be built by an async factory: fiber hands the
      // factory its renderer props (including the Canvas's own canvas) and
      // renders the children only after the returned promise resolves, so
      // init() is awaited before the renderer is handed back.
      gl={async (props) => {
        const renderer = new THREE.WebGPURenderer({
          ...props,
          // Reference renderer config kept from the spike (fiber's defaults
          // already cover antialias/powerPreference).
          alpha: false,
          stencil: false,
        });
        await renderer.init();
        return renderer;
      }}
    >
      <color attach="background" args={["#333"]} />
      <SceneContent />
    </Canvas>
  );
};
