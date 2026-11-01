// Session 5A: error boundary for the 3D scene (plan 5.6).
//
// Catches renderer/shader failures thrown while the Canvas tree renders (e.g.
// WebGPU init or TSL compile errors) and renders a flat fallback so the
// prototype does not dead-end: the uploaded image, the opposite image as a
// hover/tap crossfade, and a short message.

import { Component, useState } from "react";
import { OPPOSITE_IMAGE_URL } from "../../lib/opposites";

// Flat stand-in for the 3D card. Hover (pointer devices) or tap (toggles a
// latched state) reveals the opposite image over the uploaded one.
const FlatFallback = ({ asset }) => {
  const [isTapped, setIsTapped] = useState(false);
  const oppositeSrc = asset?.oppositeUrl ?? OPPOSITE_IMAGE_URL;

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        aria-pressed={isTapped}
        aria-label="Show opposite image"
        onClick={() => setIsTapped((value) => !value)}
        className="group relative aspect-[3/2] w-full max-w-[600px] cursor-pointer overflow-hidden"
      >
        <img
          src={asset?.url}
          alt="Uploaded image"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Tailwind's group-hover is gated to hover-capable pointers, so touch
            devices rely on the tap latch instead. */}
        <img
          src={oppositeSrc}
          alt="Opposite image"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 motion-reduce:duration-[250ms] ${
            isTapped ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        />
      </button>
      <p className="text-sm text-rim">3D view is unavailable in this browser</p>
    </div>
  );
};

// Class component: React only exposes error boundaries through lifecycle
// methods. Receives the upload `asset` so the fallback can show both images.
export class SceneErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // Logged once for diagnosis; the fallback is the recovery strategy.
    console.error("[SceneErrorBoundary] 3D scene failed; showing flat fallback.", error);
    // Optional: lets the parent know the 3D scene is gone (e.g. to finish a transition).
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return <FlatFallback asset={this.props.asset} />;
    }
    return this.props.children;
  }
}
