"use client";

import { useSyncExternalStore } from "react";
import { BP, mq } from "@/styles/breakpoints";

function subscribe(query, callback) {
  if (typeof window === "undefined") return () => {};
  const m = window.matchMedia(query);
  m.addEventListener("change", callback);
  return () => m.removeEventListener("change", callback);
}

function getSnapshot(query) {
  if (typeof window === "undefined") return false;
  return window.matchMedia(query).matches;
}

export function useMediaQuery(query) {
  return useSyncExternalStore(
    (cb) => subscribe(query, cb),
    () => getSnapshot(query),
    () => false,
  );
}

export function useIsMobile() {
  return useMediaQuery(mq.mobile);
}

/** Between 769px and 1024px inclusive upper bound */
export function useIsTablet() {
  return useMediaQuery(
    `(min-width: ${BP.MOBILE + 1}px) and (max-width: ${BP.TABLET}px)`,
  );
}

/** min-width 769px — desktop explore bar, etc. */
export function useIsDesktopOrWider() {
  return useMediaQuery(mq.desktopBar);
}

/** Two-column explore + map */
export function useIsExploreMapSplitDesktop() {
  return useMediaQuery(mq.exploreMapSplit);
}
