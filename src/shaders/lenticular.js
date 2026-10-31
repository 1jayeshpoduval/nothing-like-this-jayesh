// Lenticular TSL node graph for the Session 2A spike.
//
// Shader logic copied verbatim from:
//   https://github.com/wass08/r3f-lenticular-material
//   src/components/LenticularMaterial.jsx
// MIT License — Copyright (c) 2025 Wassim SAMAD
//
// The band/ridge maths is intentionally unchanged: uv.x is repeated across
// `nbDivisions` columns, a step() at the half-column splits the surface into
// interleaved A/B strips, and the same repeated UV drives a triangular
// (tent-wave) z displacement that forms the lenticular ridges.

import {
  mix,
  positionLocal,
  step,
  texture,
  uniform,
  uv,
  vec3,
} from "three/tsl";

// Builds the color/position node pair for the lenticular material and returns
// the uniform handles so the caller can update values after mount.
export const createLenticularNodes = (textureA, textureB, nbDivisions, height) => {
  const uniforms = {
    uNbDivisions: uniform(nbDivisions),
    uHeight: uniform(height),
  };
  const texA = texture(textureA);
  const texB = texture(textureB);

  const repeatedUvs = uv().x.mul(uniforms.uNbDivisions).fract();
  const linedUvs = step(0.5, repeatedUvs);

  return {
    uniforms,
    nodes: {
      colorNode: mix(texA, texB, linedUvs),
      positionNode: positionLocal.add(
        vec3(
          0,
          0,
          mix(uniforms.uHeight.negate(), uniforms.uHeight, repeatedUvs.x)
        )
      ),
    },
  };
};
