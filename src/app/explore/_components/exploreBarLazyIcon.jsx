"use client";

import React, { lazy, Suspense, memo } from "react";

const IconFallback = (props) => (
  <div {...props} style={{ width: 16, height: 16, ...props.style }} />
);

const lazyIconCache = new Map();

function getLazyIcon(iconName) {
  if (!iconName) return null;
  if (!lazyIconCache.has(iconName)) {
    lazyIconCache.set(
      iconName,
      lazy(() =>
        import("lucide-react").then((module) => ({
          default: module[iconName] || module.Layers,
        })),
      ),
    );
  }
  return lazyIconCache.get(iconName);
}

export const ExploreBarLazyLucideIcon = memo(({ iconName, ...props }) => {
  const IconComponent = getLazyIcon(iconName);
  if (!IconComponent) return null;
  return (
    <Suspense fallback={<IconFallback {...props} />}>
      <IconComponent {...props} />
    </Suspense>
  );
});
