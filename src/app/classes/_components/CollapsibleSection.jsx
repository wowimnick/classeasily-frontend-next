"use client";

import React from "react";
import styled from "styled-components";
import { Collapse } from "antd";
import { ChevronDown } from "lucide-react";
import { lazy, Suspense, memo } from "react";
import { LordIcon } from "@/services/ReactUtils";

const IconFallback = (props) => (
  <span {...props} style={{ width: 16, height: 16, display: "inline-block" }} />
);

const lazyIconCache = new Map();
function getLazyIcon(iconName) {
  const key = iconName || "Info";
  if (!lazyIconCache.has(key)) {
    lazyIconCache.set(
      key,
      lazy(() =>
        import("lucide-react").then((module) => ({
          default: module[key] || module.Info,
        })),
      ),
    );
  }
  return lazyIconCache.get(key);
}

const SectionIcon = memo(({ iconName, ...props }) => {
  const IconComponent = getLazyIcon(iconName);
  return (
    <Suspense fallback={<IconFallback {...props} />}>
      <IconComponent {...props} />
    </Suspense>
  );
});

const StyledCollapse = styled(Collapse)`
  background: transparent !important;
  border: none !important;

  .ant-collapse-item {
    border-bottom: 1px solid #f0f0f0 !important;
    margin-bottom: 0;
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
`;

const BodyText = styled.div`
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  white-space: pre-line;
`;

/**
 * Renders one collapsible block (Lordicon CDN URL when present, else legacy Lucide name, body text).
 */
export default function CollapsibleSection({
  title,
  lordicon,
  icon,
  defaultOpen = false,
  children,
}) {
  const showLord =
    typeof lordicon === "string" &&
    lordicon.startsWith("https://cdn.lordicon.com/") &&
    lordicon.endsWith(".json");

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
          label: (
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {showLord ? (
                <LordIcon
                  src={lordicon}
                  trigger="hover"
                  colors="primary:#52525b"
                  size="22px"
                  style={{ flexShrink: 0 }}
                />
              ) : icon ? (
                <SectionIcon iconName={icon} size={18} strokeWidth={2} />
              ) : null}
              {title}
            </span>
          ),
          children: <BodyText>{children}</BodyText>,
        },
      ]}
    />
  );
}
