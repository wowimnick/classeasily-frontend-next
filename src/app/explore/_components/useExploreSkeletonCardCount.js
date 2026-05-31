"use client";

import { useCallback, useEffect, useState } from "react";
import { mq } from "@/styles/breakpoints";
import { useMediaQuery } from "@/styles/breakpoints-hooks";
import { computeExploreSkeletonCount } from "./exploreSkeletonCount";

const DEFAULT_COUNT = 12;

export function useExploreSkeletonCardCount(rootRef) {
  const isTabletDown = useMediaQuery(mq.tabletDown);
  const [count, setCount] = useState(DEFAULT_COUNT);

  const update = useCallback(() => {
    const el = rootRef?.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setCount(computeExploreSkeletonCount(width, height, isTabletDown));
  }, [rootRef, isTabletDown]);

  useEffect(() => {
    const el = rootRef?.current;
    if (!el) return undefined;

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [rootRef, update]);

  return count;
}
