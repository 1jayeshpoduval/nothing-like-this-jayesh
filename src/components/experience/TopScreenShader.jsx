// Decorative "Fluted Aurora" band pinned to the top of the screen.
// Presentational only: the shader parameters live in lib/constants.js and the
// reduced-motion preference is read via usePrefersReducedMotion.
//
// The band is aria-hidden and pointer-events-none, so it never blocks the lens
// drag or the drop zone. The parent (App) is responsible for stacking it below
// the interactive stage.
import { Aurora, FlutedGlass, Shader } from "shaders/react";

import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion.js";
import {
  TOP_SHADER_AURORA,
  TOP_SHADER_FLUTED_GLASS,
  TOP_SHADER_REDUCED_MOTION_SPEED,
} from "../../lib/constants.js";

export function TopScreenShader() {
  const prefersReducedMotion = usePrefersReducedMotion();
  // Only the Aurora animates; FlutedGlass is static at these settings, so
  // freezing the Aurora speed is enough to stop all motion.
  const auroraSpeed = prefersReducedMotion
    ? TOP_SHADER_REDUCED_MOTION_SPEED
    : TOP_SHADER_AURORA.speed;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-0"
    >
      <Shader className="h-full w-full">
        <Aurora {...TOP_SHADER_AURORA} speed={auroraSpeed} />
        <FlutedGlass {...TOP_SHADER_FLUTED_GLASS} />
      </Shader>
    </div>
  );
}
