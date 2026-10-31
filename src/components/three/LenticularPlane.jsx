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

extend({
  MeshStandardNodeMaterial,
});

// Reference control max/default — see header comment.
const NB_DIVISIONS = 90;
const LENTICULAR_HEIGHT = 0.05;

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
      <planeGeometry args={[1, 1, NB_DIVISIONS * 2, 1]} />
      <LenticularMaterial
        textureA={textureA}
        textureB={textureB}
        nbDivisions={NB_DIVISIONS}
        height={LENTICULAR_HEIGHT}
      />
    </mesh>
  );
};
