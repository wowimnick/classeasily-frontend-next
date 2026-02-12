"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  registerScrollGetter,
  restoreScroll,
} from "@/lib/scrollRestoration";

/**
 * Registers window scroll getter and restores scroll when returning to homepage (/) from a class page.
 * Only active when pathname is "/".
 */
export default function ScrollRestorationHome() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    if (!isHome) return;
    const unregister = registerScrollGetter(
      () => (typeof window !== "undefined" ? window.scrollY : 0)
    );
    return unregister;
  }, [isHome]);

  useEffect(() => {
    if (!isHome) return;
    restoreScroll("/", null);
    // Only run once when we're on homepage (restore saved position after back)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHome]);

  return null;
}
