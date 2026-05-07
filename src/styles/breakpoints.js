/**
 * Shared layout breakpoints (explore + class detail + header).
 * Use with styled-components: `${down(BP.MOBILE)} { ... }`
 * For JS matchMedia, use `mq.*` strings with hooks from `@/styles/breakpoints-hooks`.
 */
export const BP = {
  XS: 375,
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1440,
  WIDE: 1920,
  /** Narrower desktop: card grid column tweak */
  EXPLORE_NARROW: 1100,
  /** Card grid gap / min column breakpoint */
  EXPLORE_WIDE_GRID: 1400,
};

/** @param {number} maxWidthInclusive */
export function down(maxWidthInclusive) {
  return `@media (max-width: ${maxWidthInclusive}px)`;
}

/** @param {number} minWidthExclusive — output is min-width (value + 1)px */
export function up(minWidthExclusive) {
  return `@media (min-width: ${minWidthExclusive + 1}px)`;
}

/** @param {number} minWidthInclusive @param {number} maxWidthInclusive */
export function between(minWidthInclusive, maxWidthInclusive) {
  return `@media (min-width: ${minWidthInclusive}px) and (max-width: ${maxWidthInclusive}px)`;
}

/** Named ranges aligned to the production-hardening plan */
export const media = {
  mobile: down(BP.MOBILE),
  tablet: between(BP.MOBILE + 1, BP.TABLET),
  desktop: between(BP.TABLET + 1, BP.DESKTOP - 1),
  wide: up(BP.DESKTOP),
  tabletDown: down(BP.TABLET),
  desktopUp: up(BP.TABLET),
};

/**
 * matchMedia query strings (client-only consumption via hooks).
 */
export const mq = {
  mobile: `(max-width: ${BP.MOBILE}px)`,
  /** Same as former `(min-width: 769px)` desktop explore bar */
  desktopBar: `(min-width: ${BP.MOBILE + 1}px)`,
  /** Same as former `min-width: 1049px` / split layout */
  exploreMapSplit: `(min-width: ${BP.TABLET + 1}px)`,
  tabletDown: `(max-width: ${BP.TABLET}px)`,
  desktopUp: `(min-width: ${BP.TABLET + 1}px)`,
};
