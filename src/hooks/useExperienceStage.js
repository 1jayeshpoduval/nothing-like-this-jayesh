// Session 5B: experience stage state machine.
// Source: .agents/docs/implementation-plan.md - sections 1.1 / 1.5 / 5.2.
//
// Stages: upload -> lens -> transition -> interactive3d.
// - `upload` is derived from asset presence (no asset).
// - Once an asset exists, the stage comes from an internal phase.
// - The phase is tagged with the asset it belongs to. A different asset (or
//   none) reads as the default "lens" phase, so a new upload never inherits a
//   stale transition.
// - `isLensHidden` is set when the lenticular crossfade starts. The lens stays
//   mounted (and visible) from lock until then, then fades out with the
//   crossfade. It is always true once the stage is interactive3d.
// Transitions are one-way; resetToUpload is the only way back.

import { useCallback, useRef, useState } from "react";

export const EXPERIENCE_STAGE = Object.freeze({
  UPLOAD: "upload",
  LENS: "lens",
  TRANSITION: "transition",
  INTERACTIVE_3D: "interactive3d",
});

const INITIAL_PHASE = Object.freeze({
  forAsset: null,
  phase: EXPERIENCE_STAGE.LENS,
  isLensHidden: false,
});

export function useExperienceStage(asset) {
  const [phaseState, setPhaseState] = useState(INITIAL_PHASE);
  // Synchronous mirror of phaseState. Guards read this ref so that two calls in
  // the same tick (for example, a double-fired alignment) cannot both start a
  // transition before React has re-rendered.
  const phaseRef = useRef(INITIAL_PHASE);

  const commitPhase = useCallback((next) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  // Starts the transition for `nextAsset`. No-op without an asset, and no-op
  // once a transition has already started for that asset (double-trigger lock).
  const beginTransition = useCallback(
    (nextAsset) => {
      if (!nextAsset) return;
      const current = phaseRef.current;
      if (
        current.forAsset === nextAsset &&
        current.phase !== EXPERIENCE_STAGE.LENS
      ) {
        return;
      }
      commitPhase({
        forAsset: nextAsset,
        phase: EXPERIENCE_STAGE.TRANSITION,
        isLensHidden: false,
      });
    },
    [commitPhase]
  );

  // Called when the lenticular crossfade starts (canvas fading in). Only valid
  // from `transition`. The lens fades out on the same timing from here on.
  const beginCrossfade = useCallback(() => {
    const current = phaseRef.current;
    if (current.phase !== EXPERIENCE_STAGE.TRANSITION || current.isLensHidden) {
      return;
    }
    commitPhase({ ...current, isLensHidden: true });
  }, [commitPhase]);

  // Called when the 3D scene is ready. Only valid from `transition`. The lens
  // is hidden here too, in case the crossfade start was ever skipped.
  const completeTransition = useCallback(() => {
    const current = phaseRef.current;
    if (current.phase !== EXPERIENCE_STAGE.TRANSITION) return;
    commitPhase({
      forAsset: current.forAsset,
      phase: EXPERIENCE_STAGE.INTERACTIVE_3D,
      isLensHidden: true,
    });
  }, [commitPhase]);

  // Returns to the lens phase. The caller clears the asset, so the stage then
  // reads as `upload`.
  const resetToUpload = useCallback(() => {
    commitPhase(INITIAL_PHASE);
  }, [commitPhase]);

  // Phase belonging to the current asset; any other asset reads as "lens".
  const isCurrent = phaseState.forAsset === asset;
  const phase = isCurrent ? phaseState.phase : EXPERIENCE_STAGE.LENS;
  const stage = asset ? phase : EXPERIENCE_STAGE.UPLOAD;
  const isLensHidden = isCurrent && phaseState.isLensHidden;

  return {
    stage,
    isLensHidden,
    beginTransition,
    beginCrossfade,
    completeTransition,
    resetToUpload,
  };
}
