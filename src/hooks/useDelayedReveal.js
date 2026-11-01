// Delayed visibility flag: turns true `delayMs` after `isReady` becomes true.
// Once revealed it stays revealed (the stage flow is one-way). The timer is
// cleared on unmount or when `isReady` changes before it fires.

import { useEffect, useState } from "react";

export function useDelayedReveal(isReady, delayMs) {
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    if (!isReady) return undefined;
    const timer = setTimeout(() => setIsRevealed(true), delayMs);
    return () => clearTimeout(timer);
  }, [isReady, delayMs]);

  return isRevealed;
}
