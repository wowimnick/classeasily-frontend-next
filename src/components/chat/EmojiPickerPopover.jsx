"use client";

import React, { useState, useCallback, useEffect } from "react";
import styled from "styled-components";
import { Popover } from "antd";
import { SmilePlus } from "lucide-react";
import dynamic from "next/dynamic";

const Picker = dynamic(
  () => import("@emoji-mart/react").then((mod) => mod.default),
  { ssr: false, loading: () => <div style={{ width: 352, height: 280, background: "#f8fafc", borderRadius: 12 }} /> }
);

const TriggerBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: #64748b;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  &:hover {
    background: rgba(0, 0, 0, 0.06);
    color: #334155;
  }
  &:focus-visible {
    outline: 2px solid #ff3562;
    outline-offset: 2px;
  }
  @media (max-width: 480px) {
    width: 32px;
    height: 32px;
  }
`;

const PickerWrap = styled.div`
  .emoji-mart {
    border: none !important;
    border-radius: 12px !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12) !important;
  }
  .emoji-mart-bar { border: none !important; }
  .emoji-mart-scroll { max-height: 240px !important; }
`;

export default function EmojiPickerPopover({ onInsert }) {
  const [open, setOpen] = useState(false);
  const [pickerData, setPickerData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    import("@emoji-mart/data")
      .then((m) => {
        if (!cancelled) setPickerData(m.default);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleSelect = useCallback(
    (emoji) => {
      if (typeof onInsert === "function" && emoji?.native) {
        onInsert(emoji.native);
      }
      setOpen(false);
    },
    [onInsert]
  );

  if (typeof onInsert !== "function") return null;

  const pickerContent = pickerData ? (
    <PickerWrap>
      <Picker
        data={pickerData}
        onEmojiSelect={handleSelect}
        theme="light"
        previewPosition="none"
        skinTonePosition="none"
        categories={[
          "frequent",
          "people",
          "nature",
          "foods",
          "activity",
          "places",
          "objects",
          "symbols",
          "flags",
        ]}
      />
    </PickerWrap>
  ) : (
    <div style={{ width: 352, height: 280, background: "#f8fafc", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
      Loading…
    </div>
  );

  return (
    <Popover
      content={pickerContent}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="topLeft"
      arrow={false}
      overlayInnerStyle={{ padding: 0, borderRadius: 12 }}
      overlayStyle={{ maxWidth: "min(352px, calc(100vw - 24px))" }}
    >
      <TriggerBtn type="button" aria-label="Open emoji picker">
        <SmilePlus size={20} />
      </TriggerBtn>
    </Popover>
  );
}
