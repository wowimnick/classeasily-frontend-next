"use client";

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Drawer } from "vaul";
import { X, Check } from "lucide-react";
import { exploreTimePreferencesList } from "./exploreTimePreferences";
import ExploreResultsPrimaryLabel from "./ExploreResultsPrimaryLabel.jsx";
import { ExploreShowResultsButton } from "@/components/explore/ExploreShowResultsButton";

const Overlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1100;
`;

const Sheet = styled(Drawer.Content)`
  background: #fff;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  min-height: 42vh;
  max-height: 85vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1101;
  outline: none;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.08);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 24px;
  padding-top: 32px;
`;

const SheetTitle = styled.h2`
  margin: 0;
  font-size: 21px;
  font-weight: 600;
  color: #000000;
`;

const CloseBtn = styled.button`
  border: none;
  background: transparent;
  padding: 4px;
  cursor: pointer;
  color: #717171;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const IntroSubtitle = styled.p`
  margin: 0;
  padding: 10px 22px 4px;
  font-size: 13px;
  line-height: 1.45;
  color: #000000;
`;

const TimeOptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0 22px 12px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
`;

const TimeOptionRow = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  text-align: left;
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  min-height: 48px;
`;

const TimeRowCheckbox = styled.span`
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  border: 1px solid #0a0a0a;
  background: ${({ $checked }) => ($checked ? "#000000" : "#ffffff")};
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.06),
    0 2px 6px rgba(0, 0, 0, 0.07);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  transition:
    background 0.15s ease,
    box-shadow 0.15s ease;

  ${({ $checked }) =>
    $checked
      ? `
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.14),
      0 4px 10px rgba(0, 0, 0, 0.16);
  `
      : ""}
`;

const TimeOptionText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
`;

const TimeOptionLabel = styled.span`
  font-size: 17px;
  font-weight: 500;
  color: #000000;
  line-height: 1.25;
`;

const TimeOptionSub = styled.span`
  font-size: 15px;
  font-weight: 300;
  color: #000000;
  line-height: 1.35;
`;

const Footer = styled.div`
  border-top: 1px solid #ebebeb;
  padding: 20px 22px;
  padding-bottom: max(20px, env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
`;

const ClearLink = styled.button`
  border: none;
  background: none;
  padding: 12px 4px;
  font-size: 16px;
  font-weight: 500;
  color: #000000;
  cursor: pointer;
  flex-shrink: 0;
  line-height: 1.2;
`;

function formatShowResultsLabel(totalCount) {
  if (typeof totalCount !== "number" || Number.isNaN(totalCount)) {
    return "Show results";
  }
  return `Show ${totalCount.toLocaleString()} results`;
}

export default function ExploreTimeOfDayDrawer({
  open,
  onOpenChange,
  selectedTimePreferenceIds,
  onApplyTimePreferences,
  totalClassesCount,
  previewExploreBarCount,
}) {
  const [draft, setDraft] = useState([]);
  const [previewCount, setPreviewCount] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setPreviewCount(null);
      setPreviewLoading(false);
      return;
    }
    setDraft([...(selectedTimePreferenceIds || [])]);
  }, [open, selectedTimePreferenceIds]);

  useEffect(() => {
    if (!open || !previewExploreBarCount) return;

    setPreviewLoading(true);
    const ac = new AbortController();
    const t = setTimeout(() => {
      (async () => {
        try {
          const c = await previewExploreBarCount(
            { timePreferenceIds: draft },
            ac.signal,
          );
          if (!ac.signal.aborted) setPreviewCount(c);
        } catch (e) {
          if (e?.name === "AbortError" || e?.name === "CanceledError") return;
          if (!ac.signal.aborted) setPreviewCount(null);
        } finally {
          if (!ac.signal.aborted) setPreviewLoading(false);
        }
      })();
    }, 300);

    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [open, draft, previewExploreBarCount]);

  const toggle = (id) => {
    setDraft((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleShowResults = () => {
    onApplyTimePreferences(draft);
    onOpenChange(false);
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Overlay />
        <Sheet aria-describedby={undefined}>
          <Header>
            <SheetTitle>Time of day</SheetTitle>
            <CloseBtn
              type="button"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
            >
              <X size={20} />
            </CloseBtn>
          </Header>
          <TimeOptionList>
            {exploreTimePreferencesList.map((t) => {
              const selected = draft.includes(t.id);
              return (
                <TimeOptionRow
                  key={t.id}
                  type="button"
                  onClick={() => toggle(t.id)}
                >
                  <TimeOptionText>
                    <TimeOptionLabel>{t.label}</TimeOptionLabel>
                    <TimeOptionSub>{t.sub}</TimeOptionSub>
                  </TimeOptionText>
                  <TimeRowCheckbox $checked={selected} aria-hidden>
                    {selected ? (
                      <Check size={14} strokeWidth={3} aria-hidden />
                    ) : null}
                  </TimeRowCheckbox>
                </TimeOptionRow>
              );
            })}
          </TimeOptionList>
          <Footer>
            <ClearLink type="button" onClick={() => setDraft([])}>
              Clear all
            </ClearLink>
            <ExploreShowResultsButton
              type="button"
              onClick={handleShowResults}
              disabled={previewLoading}
              aria-busy={previewLoading}
            >
              <ExploreResultsPrimaryLabel
                loading={previewLoading}
                label={formatShowResultsLabel(previewCount ?? totalClassesCount)}
              />
            </ExploreShowResultsButton>
          </Footer>
        </Sheet>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
