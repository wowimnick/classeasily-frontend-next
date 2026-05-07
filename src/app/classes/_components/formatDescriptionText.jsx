"use client";

import React from "react";

/**
 * Renders plain text with **double-asterisk** pairs as <strong>.
 */
export function renderTextWithBold(text) {
  if (text == null || text === "") return null;
  const s = String(text);
  const parts = s.split(/\*\*/);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i}>{part}</strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}
