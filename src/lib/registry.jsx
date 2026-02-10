// src/lib/registry.jsx

"use client";

import React, { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { ServerStyleSheet, StyleSheetManager } from "styled-components";

export default function StyledComponentsRegistry({ children }) {
  // Only create stylesheet once with lazy initial state
  // x-ref: https://reactjs.org/docs/hooks-reference.html#lazy-initial-state
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement();
    // NOTE: `getStyleElement` clears the sheet instance, so we don't need to manually clear it.
    return <>{styles}</>;
  });

  if (typeof window !== "undefined") {
    // This is the client-side case, where we just render the children.
    // The styles will be handled by styled-components' client-side runtime.
    return <>{children}</>;
  }

  // This is the server-side case.
  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>
      {children}
    </StyleSheetManager>
  );
}
