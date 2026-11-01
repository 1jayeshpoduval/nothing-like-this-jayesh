// Lenticular plane + material for the Session 2A spike.
//
// Plane and material copied from:
//   https://github.com/wass08/r3f-lenticular-material
//   src/components/LenticularMaterial.jsx and src/components/Experience.jsx
// MIT License — Copyright (c) 2025 Wassim SAMAD
//
// The reference leva panel exposed nbDivisions in [10, 90] (step 10) and
// height in [0.001, 0.2] (step 0.001). This spike has no sliders, so the
// divisions are pinned at the reference maximum and the height at the
// reference default.

import { extend } from "@react-three/fiber";
import { useMemo } from "react";
import { MeshStandardNodeMaterial } from "three/webgpu";
import { createLenticularNodes } from "../../shaders/lenticular";
import {
  LENTICULAR_FREQUENCY,
  PLANE_HEIGHT,
  PLANE_WIDTH,
  RIDGE_HEIGHT,
} from "../../lib/constants";

extend({
  MeshStandardNodeMaterial,
});

// Columns and ridge height come from constants.js (see notes there).
const NB_DIVISIONS = LENTICULAR_FREQUENCY;
const LENTICULAR_HEIGHT = RIDGE_HEIGHT;
// 2 segments per column, exactly as the reference (nbDivisions * 2). The count
// must be a multiple of NB_DIVISIONS so every column boundary (the fract() wrap
// where the ridge jumps) falls on a vertex. A non-multiple such as 240 smears
// the ridge across two columns.
const SEGMENTS_X = NB_DIVISIONS * 2;

export const LenticularMaterial = ({
  textureA,
  textureB,
  nbDivisions,
  height,
}) => {
  // The reference builds the TSL graph once and syncs scalar uniforms in an
  // effect (it remounts via `key` on texture changes). This spike pins the
  // scalars, so the graph is simply rebuilt whenever an input changes — same
  // visible behaviour, no post-mount mutation.
  const { nodes } = useMemo(
    () => createLenticularNodes(textureA, textureB, nbDivisions, height),
    [textureA, textureB, nbDivisions, height]
  );

  return <meshStandardNodeMaterial {...nodes} />;
};

export const LenticularPlane = ({ textureA, textureB }) => {
  return (
    <mesh>
      {/* Fixed 6 x 4 world units (1 unit = 100 px), see constants.js. */}
      <planeGeometry args={[PLANE_WIDTH, PLANE_HEIGHT, SEGMENTS_X, 1]} />
      <LenticularMaterial
        textureA={textureA}
        textureB={textureB}
        nbDivisions={NB_DIVISIONS}
        height={LENTICULAR_HEIGHT}
      />
    </mesh>
  );
};
