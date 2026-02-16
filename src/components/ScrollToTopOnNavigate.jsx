"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Scrolls to top on forward navigation (link click, router.push).
 * Does NOT scroll when the user presses the browser back/forward button,
 * so scroll position is preserved when returning to a previous page.
 */
export default function ScrollToTopOnNavigate() {
  const pathname = usePathname();
  const isBackForwardRef = useRef(false);

  // Detect back/forward: when user uses browser back/forward, popstate fires before pathname updates.
  useEffect(() => {
    const onPopState = () => {
      isBackForwardRef.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // On pathname change: scroll to top only for forward navigation (not back/forward).
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isBackForwardRef.current) {
      isBackForwardRef.current = false;
      return;
    }

    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
