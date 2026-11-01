// Reduced-motion preference via matchMedia (plan 7.6).
// Reads the query once on mount and stays subscribed so a system change while
// the page is open is picked up without a reload.

import { useEffect, useState } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// Browsers without matchMedia (or SSR) fall back to "no preference".
const readPrefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia(REDUCED_MOTION_QUERY).matches;

export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    readPrefersReducedMotion
  );

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const handleChange = (event) => setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}
