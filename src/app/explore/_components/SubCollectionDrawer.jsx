"use client";

import React, { useMemo, useCallback, lazy, memo, Suspense } from "react";
import styled from "styled-components";
import { Drawer } from "vaul";
import { X } from "lucide-react";

const IconFallback = (props) => (
  <div {...props} style={{ width: 16, height: 16, ...props.style }} />
);
const lazyIconCache = new Map();
function getLazyIcon(iconName) {
  const key = iconName || "Layers";
  if (!lazyIconCache.has(key)) {
    lazyIconCache.set(
      key,
      lazy(() =>
        import("lucide-react").then((module) => ({
          default: module[key] || module.Layers,
        })),
      ),
    );
  }
  return lazyIconCache.get(key);
}

const ChipIcon = memo(({ iconName, ...props }) => {
  const IconComponent = getLazyIcon(iconName);
  return (
    <Suspense fallback={<IconFallback {...props} />}>
      <IconComponent {...props} />
    </Suspense>
  );
});

const Overlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1100;
`;

const Content = styled(Drawer.Content)`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 88vh;
  background: #fff;
  border-radius: 16px 16px 0 0;
  z-index: 1101;
  display: flex;
  flex-direction: column;
  outline: none;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 8px 12px 0;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px 10px;
  border-bottom: 1px solid #f0f0f0;
`;

const CloseBtn = styled.button`
  border: none;
  background: transparent;
  padding: 8px;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: #f5f5f5;
  }
`;

const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px 120px;
`;

const ChipGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const Chip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 999px;
  border: ${({ $selected }) =>
    $selected ? "2px solid #111" : "1px solid #d4d4d8"};
  background: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  color: #111;
  &:hover {
    border-color: #71717a;
  }
`;

const Footer = styled.div`
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const ClearBtn = styled.button`
  border: none;
  background: none;
  font-size: 15px;
  font-weight: 600;
  color: #52525b;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
`;

const ApplyBtn = styled.button`
  flex: 1;
  max-width: 240px;
  margin-left: auto;
  padding: 14px 18px;
  border-radius: 12px;
  border: none;
  background: #111;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
`;

export default function SubCollectionDrawer({
  open,
  onOpenChange,
  subCollections = [],
  selectedSubs = [],
  onToggle,
  onClearAll,
  resultCount = 0,
}) {
  const selectedSet = useMemo(() => new Set(selectedSubs), [selectedSubs]);

  const handleToggle = useCallback(
    (slug) => {
      const next = new Set(selectedSet);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      onToggle?.([...next]);
    },
    [selectedSet, onToggle],
  );

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Overlay />
        <Content aria-labelledby="sub-coll-drawer-title">
          <TitleRow>
            <Title id="sub-coll-drawer-title">Filters</Title>
            <Drawer.Close asChild>
              <CloseBtn type="button" aria-label="Close filters">
                <X size={22} />
              </CloseBtn>
            </Drawer.Close>
          </TitleRow>
          <ScrollArea>
            <div style={{ marginBottom: 12, fontWeight: 600, fontSize: 15 }}>
              Experience type
            </div>
            <ChipGrid>
              {subCollections.map((c) => {
                const slug = c.slug || c.key;
                const sel = selectedSet.has(slug);
                return (
                  <Chip
                    key={slug}
                    type="button"
                    $selected={sel}
                    aria-pressed={sel}
                    onClick={() => handleToggle(slug)}
                  >
                    {c.icon_name ? (
                      <ChipIcon iconName={c.icon_name} size={16} strokeWidth={2} />
                    ) : null}
                    {c.name}
                  </Chip>
                );
              })}
            </ChipGrid>
          </ScrollArea>
          <Footer>
            <ClearBtn type="button" onClick={onClearAll}>
              Clear all
            </ClearBtn>
            <ApplyBtn type="button" onClick={() => onOpenChange?.(false)}>
              Show {resultCount} results
            </ApplyBtn>
          </Footer>
        </Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
