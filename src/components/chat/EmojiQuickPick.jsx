"use client";

import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import dynamic from "next/dynamic";

const EmojiPickerPopover = dynamic(
  () => import("./EmojiPickerPopover"),
  { ssr: false }
);

/**
 * Quick-pick bar for common emojis + full emoji-mart picker (click smiley).
 * Shows fewer preset emojis on smaller screens, always one row.
 * Message text supports full Unicode emoji.
 */

const Wrap = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
  padding: 4px 0;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const EmojiBtn = styled.button`
  flex-shrink: 0;
  background: none;
  border: none;
  font-size: 20px;
  line-height: 1;
  padding: 6px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s, transform 0.1s;
  &:hover {
    background: rgba(0, 0, 0, 0.06);
    transform: scale(1.15);
  }
  &:active {
    transform: scale(1.05);
  }
  @media (max-width: 480px) {
    font-size: 18px;
    padding: 5px;
  }
`;

const COMMON_EMOJIS = [
  "😀", "😊", "👍", "❤️", "🙏", "✅", "🎉", "👋",
];

const BREAKPOINTS = [
  { maxWidth: 360, count: 4 },
  { maxWidth: 480, count: 5 },
  { maxWidth: 640, count: 6 },
  { maxWidth: 9999, count: 8 },
];

function usePresetEmojiCount() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 640);
  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const count = useMemo(() => {
    const bp = BREAKPOINTS.find((b) => width <= b.maxWidth);
    return bp ? Math.min(bp.count, COMMON_EMOJIS.length) : COMMON_EMOJIS.length;
  }, [width]);
  return count;
}

export default function EmojiQuickPick({ onInsert }) {
  const count = usePresetEmojiCount();
  const emojis = useMemo(() => COMMON_EMOJIS.slice(0, count), [count]);

  if (typeof onInsert !== "function") return null;
  return (
    <Wrap role="group" aria-label="Insert emoji">
      {emojis.map((emoji) => (
        <EmojiBtn
          key={emoji}
          type="button"
          onClick={() => onInsert(emoji)}
          aria-label={`Insert ${emoji}`}
        >
          {emoji}
        </EmojiBtn>
      ))}
      <EmojiPickerPopover onInsert={onInsert} />
    </Wrap>
  );
}
