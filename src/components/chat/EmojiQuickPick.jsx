"use client";

import React from "react";
import styled from "styled-components";
import dynamic from "next/dynamic";

const EmojiPickerPopover = dynamic(
  () => import("./EmojiPickerPopover"),
  { ssr: false }
);

/**
 * Quick-pick bar for common emojis + full emoji-mart picker (click smiley).
 * Message text supports full Unicode emoji.
 */

const Wrap = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  padding: 4px 0;
`;

const EmojiBtn = styled.button`
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

export default function EmojiQuickPick({ onInsert }) {
  if (typeof onInsert !== "function") return null;
  return (
    <Wrap role="group" aria-label="Insert emoji">
      {COMMON_EMOJIS.map((emoji) => (
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
