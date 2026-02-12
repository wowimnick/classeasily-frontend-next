/**
 * Saves and restores scroll position when navigating to a class and back.
 * - Homepage: window scroll (scrollY).
 * - Explore: scrollTop of the ClassGridWrapper (in-page scroll).
 */

const STORAGE_PREFIX = "scrollRestore_";

let scrollGetterRef = null;

/**
 * Register a function that returns the current scroll position (number).
 * Only one getter is active at a time. Call the returned cleanup to unregister.
 * @param {() => number} getScrollPosition
 * @returns {() => void} cleanup
 */
export function registerScrollGetter(getScrollPosition) {
  scrollGetterRef = getScrollPosition;
  return () => {
    scrollGetterRef = null;
  };
}

/**
 * Save current scroll position for the given path (pathname + search).
 * Call this right before navigating to a class page.
 * @param {string} pathnameWithSearch - e.g. "/" or "/explore?category=arts"
 */
export function saveBeforeNavigate(pathnameWithSearch) {
  if (typeof window === "undefined" || !pathnameWithSearch) return;
  const scrollTop =
    scrollGetterRef != null
      ? scrollGetterRef()
      : (typeof window.scrollY === "number" ? window.scrollY : 0);
  try {
    const key = STORAGE_PREFIX + pathnameWithSearch;
    sessionStorage.setItem(key, String(Math.max(0, scrollTop)));
  } catch (_) {}
}

/**
 * Restore scroll for the given path if we have a saved position (e.g. after back).
 * @param {string} pathnameWithSearch - current path + search
 * @param {React.RefObject<HTMLElement | null>} [scrollContainerRef] - for explore use the grid wrapper ref; for homepage pass null/undefined to use window
 */
export function restoreScroll(pathnameWithSearch, scrollContainerRef) {
  if (typeof window === "undefined" || !pathnameWithSearch) return;
  try {
    const key = STORAGE_PREFIX + pathnameWithSearch;
    const saved = sessionStorage.getItem(key);
    if (saved == null) return;
    sessionStorage.removeItem(key);
    const pos = parseInt(saved, 10);
    if (Number.isNaN(pos)) return;

    const apply = () => {
      if (scrollContainerRef?.current) {
        scrollContainerRef.current.scrollTop = pos;
      } else {
        window.scrollTo(0, pos);
      }
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(apply);
    });
  } catch (_) {}
}
