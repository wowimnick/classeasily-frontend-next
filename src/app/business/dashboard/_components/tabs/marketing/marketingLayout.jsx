"use client";

import React from "react";
import styled from "styled-components";
import { Divider, Table, Typography } from "antd";
import { motion } from "framer-motion";
import { LordIcon } from "@/services/ReactUtils";

const { Title, Text } = Typography;

/** Opens Plans & billing with email marketing tier picker. */
export const MARKETING_BILLING_PATH =
  "/business/dashboard/settings?tab=plan-billing&email_marketing_modal=1";

// ─── spacing tokens ────────────────────────────────────────────────────────────
export const SPACE = {
  sectionGap: 28,
  itemGap: 16,
  innerGap: 10,
  panelPaddingV: 4,
};

// ─── shared outer shell for each sub-panel ─────────────────────────────────────
export const Panel = styled.div`
  padding: ${SPACE.panelPaddingV}px 0 32px;
  display: flex;
  flex-direction: column;
  gap: ${SPACE.sectionGap}px;
`;

/** Fade-in wrapper for tab panel content (key by active tab for replay). */
export function MarketingTabContent({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/** White card shell matching booking history table sections */
export const MarketingTableSection = styled(motion.div)`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: relative;
  padding: 20px;
`;

/** Ant Design Table styled like DesktopBookingHistory */
export const MarketingStyledTable = styled(Table)`
  .ant-table {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .ant-table-thead > tr > th {
    background-color: #f8fafc !important;
    color: #64748b;
    font-weight: 600;
    font-size: 11px;
    padding: 10px 14px;
    border-bottom: 1px solid #e2e8f0;
    text-transform: uppercase;
    letter-spacing: 0.05em;

    &::before {
      display: none;
    }
  }

  .ant-table-tbody > tr > td {
    vertical-align: middle;
    padding: 12px 14px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 13px;
    color: #1e293b;
  }

  .ant-table-tbody > tr:last-child > td {
    border-bottom: none;
  }

  .ant-table-tbody > tr:hover > td {
    background-color: #f8fafc;
  }

  .ant-pagination {
    margin: 24px 0 0;
  }

  .ant-table-tbody > tr.ant-table-placeholder:hover > td {
    background: white;
  }
`;

const EmptyRoot = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 36px 16px;
  gap: 10px;
`;

const EmptyIconWrap = styled.div`
  opacity: 0.35;
  filter: grayscale(100%);
`;

const EmptyTitle = styled.div`
  color: #64748b;
  font-size: 15px;
  font-weight: 500;
`;

const EmptySub = styled.div`
  color: #94a3b8;
  font-size: 13px;
  max-width: 360px;
  line-height: 1.5;
`;

export function MarketingEmptyState({ title, subtitle }) {
  return (
    <EmptyRoot>
      <EmptyIconWrap>
        <LordIcon
          src="https://cdn.lordicon.com/uoljexdg.json"
          trigger="in"
          colors="primary:#94a3b8"
          style={{ width: 40, height: 40 }}
        />
      </EmptyIconWrap>
      <EmptyTitle>{title}</EmptyTitle>
      {subtitle ? <EmptySub>{subtitle}</EmptySub> : null}
    </EmptyRoot>
  );
}

// ─── labelled section card wrapper (no border — plain spacing separator) ───────
const SectionRoot = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${SPACE.itemGap}px;
`;

const SectionHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 4px;
`;

export function MarketingSection({ title, description, action, children, style }) {
  return (
    <SectionRoot style={style}>
      <SectionHeader>
        <div>
          {title && (
            <Title level={5} style={{ margin: 0 }}>
              {title}
            </Title>
          )}
          {description && (
            <Text type="secondary" style={{ fontSize: 13, display: "block", marginTop: 2 }}>
              {description}
            </Text>
          )}
        </div>
        {action && <div>{action}</div>}
      </SectionHeader>
      {children}
    </SectionRoot>
  );
}

const FieldRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export function MarketingField({ label, hint, children, style }) {
  return (
    <FieldRoot style={style}>
      {label && (
        <Text strong style={{ fontSize: 13 }}>
          {label}
        </Text>
      )}
      {children}
      {hint && (
        <Text type="secondary" style={{ fontSize: 12, marginTop: 2 }}>
          {hint}
        </Text>
      )}
    </FieldRoot>
  );
}

export const SubDivider = styled(Divider)`
  margin: 16px 0 !important;
`;

export const ToolbarRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
`;

export const ToolbarRight = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
`;
