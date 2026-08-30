/** Mirrors ClassesDisplay ClassGrid @container explore-cards breakpoints. */
export function exploreGridColumnCount(containerWidth, isStackedLayout) {
  if (isStackedLayout || containerWidth <= 0) return 1;
  if (containerWidth >= 1840) return 6;
  if (containerWidth >= 1576) return 5;
  if (containerWidth >= 1312) return 4;
  if (containerWidth >= 1049) return 3;
  if (containerWidth >= 544) return 2;
  return 1;
}

const EXPLORE_ROW_GAP = 28;

function estimateExploreCardBlockHeight(containerWidth, columns, isStackedLayout) {
  if (isStackedLayout) {
    return 132 + 88 + EXPLORE_ROW_GAP;
  }
  if (containerWidth < 1049 && columns >= 2) {
    return 196 + 88 + EXPLORE_ROW_GAP;
  }
  const colWidth = containerWidth / Math.max(columns, 1);
  return colWidth + 90 + EXPLORE_ROW_GAP;
}

/**
 * Enough skeleton cards to cover the visible card pane (plus one extra row).
 */
export function computeExploreSkeletonCount(
  containerWidth,
  containerHeight,
  isStackedLayout,
) {
  const cols = exploreGridColumnCount(containerWidth, isStackedLayout);
  const blockH = estimateExploreCardBlockHeight(
    containerWidth,
    cols,
    isStackedLayout,
  );
  const rows = Math.max(2, Math.ceil(containerHeight / blockH) + 1);
  return Math.min(60, cols * rows);
}
