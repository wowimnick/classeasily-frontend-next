"use client";

import React from "react";
import styled, { keyframes } from "styled-components";

const pulse = keyframes`
  0%, 100% { background-position: 200% 0; }
  50% { background-position: -200% 0; }
`;

export const Skel = styled.div`
  height: ${(p) => p.$h || "14px"};
  width: ${(p) => p.$w || "100%"};
  max-width: ${(p) => p.$maxW || "none"};
  border-radius: ${(p) => p.$r || "6px"};
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const BreadcrumbRow = styled.div`
  margin-bottom: 16px;
`;

const HubHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
`;

const TabRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const TableHead = styled.div`
  display: flex;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #e5e7eb;
`;

const TableRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #f3f4f6;
`;

const Col = styled.div`
  flex: ${(p) => p.$flex || 1};
  min-width: 0;
`;

/** Hub: breadcrumb, title, usage, tabs, table body */
export function MarketingHubSkeleton() {
  return (
    <div aria-hidden data-testid="marketing-hub-skeleton">
      <BreadcrumbRow>
        <Skel $h="12px" $w="180px" $r="4px" />
      </BreadcrumbRow>
      <HubHeader>
        <div>
          <Skel $h="22px" $w="200px" $r="6px" style={{ marginBottom: 8 }} />
          <Skel $h="12px" $w="120px" $r="4px" />
        </div>
        <Skel $h="32px" $w="100px" $r="6px" />
      </HubHeader>
      <Skel $h="14px" $w="85%" $r="4px" style={{ marginBottom: 16 }} />
      <TabRow>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skel key={i} $h="36px" $w="96px" $r="8px" />
        ))}
      </TabRow>
      <TableHead>
        <Col $flex={1.2}>
          <Skel $h="10px" $w="45%" $r="4px" />
        </Col>
        <Col $flex={0.8}>
          <Skel $h="10px" $w="50%" $r="4px" />
        </Col>
        <Col $flex={0.6}>
          <Skel $h="10px" $w="40%" $r="4px" />
        </Col>
        <Col $flex={0.9}>
          <Skel $h="10px" $w="55%" $r="4px" />
        </Col>
      </TableHead>
      {Array.from({ length: 7 }).map((_, i) => (
        <TableRow key={i}>
          <Col $flex={1.2}>
            <Skel $h="14px" $w="72%" $r="4px" />
          </Col>
          <Col $flex={0.8}>
            <Skel $h="14px" $w="60%" $r="4px" />
          </Col>
          <Col $flex={0.6}>
            <Skel $h="22px" $w="52px" $r="10px" />
          </Col>
          <Col $flex={0.9}>
            <Skel $h="14px" $w="70%" $r="4px" />
          </Col>
        </TableRow>
      ))}
    </div>
  );
}

const EditorTop = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 20px;
`;

const EditorGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr minmax(260px, 320px);
  gap: 20px;
  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const PreviewBlock = styled.div`
  min-height: 380px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 16px;
  background: #fafafa;
`;

/** Campaign editor initial load */
export function MarketingEditorSkeleton() {
  return (
    <div aria-hidden style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 20px" }}>
      <EditorTop>
        <Skel $h="32px" $w="72px" $r="6px" />
        <Skel $h="22px" $w="160px" $r="6px" style={{ flex: 1, minWidth: 120 }} />
        <Skel $h="32px" $w="88px" $r="6px" />
        <Skel $h="32px" $w="120px" $r="6px" />
        <Skel $h="32px" $w="100px" $r="6px" />
      </EditorTop>
      <EditorGrid>
        <div>
          <Skel $h="14px" $w="40%" $r="4px" style={{ marginBottom: 12 }} />
          <Skel $h="36px" $w="100%" $r="8px" style={{ marginBottom: 12 }} />
          <Skel $h="120px" $w="100%" $r="8px" style={{ marginBottom: 12 }} />
          <PreviewBlock>
            <Skel $h="12px" $w="30%" $r="4px" style={{ marginBottom: 16 }} />
            <Skel $h="200px" $w="100%" $r="8px" />
          </PreviewBlock>
        </div>
        <div>
          <Skel $h="14px" $w="50%" $r="4px" style={{ marginBottom: 12 }} />
          <Skel $h="40px" $w="100%" $r="8px" style={{ marginBottom: 10 }} />
          <Skel $h="40px" $w="100%" $r="8px" style={{ marginBottom: 10 }} />
          <Skel $h="80px" $w="100%" $r="8px" style={{ marginBottom: 10 }} />
          <Skel $h="36px" $w="100%" $r="8px" />
        </div>
      </EditorGrid>
    </div>
  );
}

const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
`;

const TemplateCardSkel = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  background: #fff;
`;

/** Skeleton cards while template list loads */
export function TemplateGridSkeleton({ count = 4 }) {
  return (
    <TemplateGrid aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <TemplateCardSkel key={i}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <Skel $h="22px" $w="22px" $r="4px" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Skel $h="14px" $w="75%" $r="4px" style={{ marginBottom: 8 }} />
              <Skel $h="12px" $w="45%" $r="4px" />
            </div>
          </div>
          <Skel $h="12px" $w="90%" $r="4px" style={{ marginTop: 12 }} />
        </TemplateCardSkel>
      ))}
    </TemplateGrid>
  );
}

const SendingBlock = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px 16px;
  background: #fafafa;
`;

/** Skeleton for Sending tab first paint */
export function SendingPanelSkeleton() {
  return (
    <div aria-hidden style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SendingBlock>
        <Skel $h="12px" $w="40%" $r="4px" style={{ marginBottom: 10 }} />
        <Skel $h="72px" $w="100%" $r="8px" />
        <Skel $h="80px" $w="100%" $r="8px" style={{ marginTop: 10 }} />
        <Skel $h="32px" $w="100px" $r="6px" style={{ marginTop: 12, marginLeft: "auto" }} />
      </SendingBlock>
      <SendingBlock>
        <Skel $h="36px" $w="100%" $r="8px" style={{ maxWidth: 400 }} />
      </SendingBlock>
      <SendingBlock>
        <Skel $h="36px" $w="100%" $r="8px" />
        <Skel $h="36px" $w="100%" $r="8px" style={{ marginTop: 8 }} />
      </SendingBlock>
    </div>
  );
}

/** Placeholder rows for marketing tables while loading */
export function generateMarketingTableSkeletonRows(count = 8) {
  return Array.from({ length: count }, (_, i) => ({ id: `__sk__${i}`, __skeleton: true }));
}
