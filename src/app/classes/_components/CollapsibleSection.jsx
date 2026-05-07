"use client";

import React from "react";
import styled from "styled-components";
import { Collapse } from "antd";
import { ChevronDown } from "lucide-react";
import { renderTextWithBold } from "./formatDescriptionText";

const StyledCollapse = styled(Collapse)`
  background: transparent !important;
  border: none !important;

  .ant-collapse-item {
    border-bottom: none !important;
    margin-bottom: 0;
  }

  .ant-collapse-item-active {
    border-bottom: 1px solid #f0f0f0 !important;
  }

  .ant-collapse-item:not(:first-child) {
    border-top: 1px solid #f0f0f0 !important;
  }

  .ant-collapse-header {
    padding: 14px 0 !important;
    align-items: center !important;
    font-weight: 600 !important;
    font-size: 16px !important;
    color: #111 !important;
  }

  .ant-collapse-content-box {
    padding: 0 0 16px 0 !important;
  }

  @media (max-width: 768px) {
    .ant-collapse-header {
      padding: 16px 0 14px !important;
    }

    .ant-collapse-content-box {
      padding: 4px 0 22px !important;
    }
  }
`;

const BodyText = styled.div`
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  white-space: pre-line;

  strong {
    font-weight: 600;
    color: #111;
  }
`;

/**
 * Collapsible block: title (include one leading emoji in copy from the API), body supports **bold**.
 */
export default function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}) {
  return (
    <StyledCollapse
      bordered={false}
      expandIcon={({ isActive }) => (
        <ChevronDown
          size={18}
          style={{
            transform: isActive ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            color: "#52525b",
          }}
        />
      )}
      defaultActiveKey={defaultOpen ? ["panel"] : []}
      items={[
        {
          key: "panel",
          label: title,
          children: (
            <BodyText>{renderTextWithBold(children)}</BodyText>
          ),
        },
      ]}
    />
  );
}
