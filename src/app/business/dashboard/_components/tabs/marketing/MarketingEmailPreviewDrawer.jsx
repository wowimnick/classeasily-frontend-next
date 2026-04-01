"use client";

import React from "react";
import { Drawer, Radio, Typography } from "antd";

const { Text } = Typography;

/**
 * Slide-out email preview with mobile (375px) vs full-width desktop frame.
 */
export default function MarketingEmailPreviewDrawer({
  open,
  onClose,
  srcDoc,
  previewMode,
  onPreviewModeChange,
  footer,
  title = "Email preview",
}) {
  const isMobile = previewMode === "mobile";

  return (
    <Drawer
      title={title}
      placement="right"
      width={isMobile ? 408 : 928}
      onClose={onClose}
      open={open}
      destroyOnClose={false}
      styles={{ body: { paddingTop: 12 } }}
    >
      <Radio.Group
        value={previewMode}
        onChange={(e) => onPreviewModeChange(e.target.value)}
        size="small"
        style={{ marginBottom: 14 }}
        optionType="button"
        buttonStyle="solid"
      >
        <Radio.Button value="mobile">Mobile</Radio.Button>
        <Radio.Button value="desktop">Desktop</Radio.Button>
      </Radio.Group>
      <div
        style={{
          background: "#e2e8f0",
          borderRadius: 12,
          padding: isMobile ? 14 : 10,
          display: "flex",
          justifyContent: "center",
          minHeight: isMobile ? 520 : 480,
        }}
      >
        <div
          style={{
            width: isMobile ? 375 : "100%",
            maxWidth: isMobile ? 375 : "100%",
            flex: isMobile ? "0 0 auto" : "1 1 auto",
            background: "#fff",
            borderRadius: isMobile ? 20 : 8,
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(15, 23, 42, 0.12)",
            border: isMobile ? "1px solid #cbd5e1" : "1px solid #e5e7eb",
          }}
        >
          <iframe
            title="email-preview"
            srcDoc={srcDoc}
            style={{
              width: "100%",
              height: isMobile ? 620 : 540,
              border: "none",
              display: "block",
            }}
            sandbox="allow-same-origin"
          />
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        {footer || (
          <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
            Footer and unsubscribe match your Sending tab settings.
          </Text>
        )}
      </div>
    </Drawer>
  );
}
