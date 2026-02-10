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

  // Use same wrapper on server and client to avoid hydration mismatch.
  // On server: sheet is the style sheet instance to collect styles.
  // On client: sheet is undefined so StyleSheetManager just passes through.
  const sheet =
    typeof window === "undefined" ? styledComponentsStyleSheet.instance : undefined;
  return (
    <StyleSheetManager sheet={sheet}>
      {children}
    </StyleSheetManager>
  );
}
