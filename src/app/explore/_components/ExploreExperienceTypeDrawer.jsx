"use client";

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Drawer } from "vaul";
import { X } from "lucide-react";
import { ExploreBarLazyLucideIcon } from "./exploreBarLazyIcon.jsx";
import ExploreResultsPrimaryLabel from "./ExploreResultsPrimaryLabel.jsx";

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
  padding: 24px 20px 0;
`;

const SheetTitle = styled.h2`
  margin: 0;
  font-size: 21px;
  font-weight: 700;
  color: #222222;
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

/** Matches desktop DropdownTypeChipFlow — wrap + fit-content pills */
const TypeChipFlow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 8px;
  padding: 20px 22px 12px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
`;

const TypeChip = styled.button`
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-start;
  width: fit-content;
  max-width: 100%;
  padding: 10px 16px;
  border: 1.5px solid #111111;
  border-radius: 9999px;
  background: ${(p) => (p.$selected ? "#111111" : "#ffffff")};
  font-size: 14px;
  line-height: 1.2;
  color: ${(p) => (p.$selected ? "#ffffff" : "#222222")};
  cursor: pointer;
  font-weight: ${(p) => (p.$selected ? 600 : 400)};
  text-align: left;
  transition:
    background 0.15s ease,
    color 0.15s ease;

  svg {
    flex-shrink: 0;
    color: ${(p) => (p.$selected ? "#ffffff" : "inherit")};
  }
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

const PrimaryBtn = styled.button`
  flex: 0 0 auto;
  border: none;
  border-radius: 12px;
  background: #111111;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  padding: 14px 22px;
  cursor: pointer;
  line-height: 1.2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;

  &:disabled {
    opacity: 0.85;
    cursor: wait;
  }
`;

function formatShowResultsLabel(totalCount) {
  if (typeof totalCount !== "number" || Number.isNaN(totalCount)) {
    return "Show results";
  }
  return `Show ${totalCount.toLocaleString()} results`;
}

export default function ExploreExperienceTypeDrawer({
  open,
  onOpenChange,
  collectionsIWant,
  currentCollection,
  onApplyCollection,
  totalClassesCount,
  previewExploreBarCount,
}) {
  const [draftSlug, setDraftSlug] = useState("");
  const [previewCount, setPreviewCount] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setPreviewCount(null);
      setPreviewLoading(false);
      return;
    }
    const match = (collectionsIWant || []).some(
      (c) => c.slug === currentCollection,
    );
    setDraftSlug(match ? currentCollection : "");
  }, [open, currentCollection, collectionsIWant]);

  useEffect(() => {
    if (!open || !previewExploreBarCount) return;

    setPreviewLoading(true);
    const ac = new AbortController();
    const t = setTimeout(() => {
      (async () => {
        try {
          const c = await previewExploreBarCount(
            { collectionSlug: draftSlug || "" },
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
  }, [open, draftSlug, previewExploreBarCount]);

  const list = (collectionsIWant || []).filter((c) => c.slug && !c.is_all);

  const handleShowResults = () => {
    onApplyCollection(draftSlug || "");
    onOpenChange(false);
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Overlay />
        <Sheet aria-describedby={undefined}>
          <Header>
            <SheetTitle>Experience type</SheetTitle>
            <CloseBtn
              type="button"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
            >
              <X size={20} />
            </CloseBtn>
          </Header>
          <TypeChipFlow>
            {list.map((c) => (
              <TypeChip
                key={c.slug}
                type="button"
                $selected={draftSlug === c.slug}
                onClick={() =>
                  setDraftSlug((prev) => (prev === c.slug ? "" : c.slug))
                }
              >
                {c.icon_name ? (
                  <ExploreBarLazyLucideIcon
                    iconName={c.icon_name}
                    size={16}
                    strokeWidth={1.5}
                  />
                ) : null}
                <span>{c.name}</span>
              </TypeChip>
            ))}
          </TypeChipFlow>
          <Footer>
            <ClearLink type="button" onClick={() => setDraftSlug("")}>
              Clear all
            </ClearLink>
            <PrimaryBtn
              type="button"
              onClick={handleShowResults}
              disabled={previewLoading}
              aria-busy={previewLoading}
            >
              <ExploreResultsPrimaryLabel
                loading={previewLoading}
                label={formatShowResultsLabel(previewCount ?? totalClassesCount)}
              />
            </PrimaryBtn>
          </Footer>
        </Sheet>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
