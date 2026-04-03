"use client";

import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { Form, Input, Select, Button, ConfigProvider } from "antd";
import { Drawer } from "vaul";
import { UserPlus, X } from "lucide-react";
import message from "@/lib/message";
import { businessMembershipService } from "@/services/apiService";
import { theme as appTheme } from "@/components/theme";
import { VAUL_OVERLAY_BACKDROP_BLUR } from "@/lib/vaulOverlayBlur";

const { TextArea } = Input;

const C = {
  border: "#e5e7eb",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  sidebarBg: "#f4f5f8",
  white: "#ffffff",
  brand: "#ff385c",
};

const fadeIn = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;

const Overlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
  ${VAUL_OVERLAY_BACKDROP_BLUR}
`;

const MobileShell = styled(Drawer.Content)`
  background: ${C.white} !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 24px 24px 0 0;
  height: 90%;
  max-height: 90vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
  isolation: isolate;
`;

const DesktopShell = styled(Drawer.Content)`
  right: 8px;
  top: 8px;
  bottom: 8px;
  position: fixed;
  z-index: 1050;
  outline: none;
  width: min(480px, 100vw - 16px);
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: -4px 0 32px rgba(0, 0, 0, 0.14), 0 4px 24px rgba(0, 0, 0, 0.1);
  background: ${C.white} !important;
  isolation: isolate;
`;

const ThumbStrip = styled.div`
  flex-shrink: 0;
  background: #f1f5f9;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 0 6px;
  border-bottom: 1px solid ${C.border};
`;

const DrawerHandle = styled(Drawer.Handle)`
  width: 40px;
  height: 5px;
  background: #cbd5e1;
  border-radius: 999px;
  margin: 0;
  flex-shrink: 0;
`;

const Header = styled.div`
  flex-shrink: 0;
  padding: 16px 20px;
  border-bottom: 1px solid ${C.border};
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  background: ${C.white};
`;

const TitleBlock = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
`;

const TitleIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, ${C.brand} 0%, #ff6b8a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
`;

const TitleText = styled.div`
  font-size: 17px;
  font-weight: 700;
  color: ${C.textPrimary};
  line-height: 1.25;
`;

const Subtitle = styled.div`
  font-size: 13px;
  color: ${C.textSecondary};
  margin-top: 4px;
  line-height: 1.4;
`;

const CloseBtn = styled.button`
  background: ${C.sidebarBg};
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${C.textSecondary};
  flex-shrink: 0;
  &:hover {
    background: ${C.border};
    color: ${C.textPrimary};
  }
`;

const BodyScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 20px 8px;
  animation: ${fadeIn} 0.25s ease-out;
  background: ${C.white};
`;

const Footer = styled.div`
  flex-shrink: 0;
  padding: 14px 20px 20px;
  border-top: 1px solid ${C.border};
  background: ${C.white};
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
`;

const FormRoot = styled(Form)`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: ${C.white};
  .ant-form-item-label > label {
    font-weight: 600;
    font-size: 13px;
    color: ${C.textPrimary};
  }
  .ant-input,
  .ant-input-affix-wrapper,
  .ant-select-selector {
    border-radius: 12px !important;
  }
`;

export default function AddMemberDrawer({ open, onClose, products, onSaved }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
    } else {
      const t = setTimeout(() => setShouldRender(false), 280);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleFinish = async (values) => {
    setSaving(true);
    try {
      const email = (values.email || "").trim();
      if (!email) {
        message.error("Email is required");
        setSaving(false);
        return;
      }
      const res = await businessMembershipService.manualAddMember({
        product_id: values.product_id,
        email,
        first_name: (values.first_name || "").trim(),
        last_name: (values.last_name || "").trim(),
        notes: (values.notes || "").trim() || undefined,
      });
      if (res.success) {
        message.success("Member added");
        form.resetFields();
        onSaved?.();
        onClose?.();
      } else {
        message.error(res.error || "Failed to add member");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose?.();
  };

  if (!shouldRender) return null;

  const drawerBody = (
    <ConfigProvider theme={{ token: { colorPrimary: appTheme.token.colorPrimary } }}>
      <FormRoot form={form} layout="vertical" onFinish={handleFinish} requiredMark="optional">
        <Header>
          <TitleBlock>
            <div style={{ minWidth: 0 }}>
              <TitleText>Add member</TitleText>
              <Subtitle>Offline or complimentary roster — no signup email.</Subtitle>
            </div>
          </TitleBlock>
          <CloseBtn type="button" onClick={handleCancel} aria-label="Close">
            <X size={18} />
          </CloseBtn>
        </Header>
        <BodyScroll>
          <Form.Item name="product_id" label="Plan" rules={[{ required: true, message: "Select a plan" }]}>
            <Select placeholder="Select plan" options={products.map((p) => ({ value: p.id, label: p.name }))} size="middle" />
          </Form.Item>
          <Form.Item name="first_name" label="First name">
            <Input placeholder="First name" size="middle" autoComplete="given-name" />
          </Form.Item>
          <Form.Item name="last_name" label="Last name">
            <Input placeholder="Last name" size="middle" autoComplete="family-name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: "Email is required" }, { type: "email", message: "Enter a valid email" }]}
          >
            <Input type="email" placeholder="email@example.com" size="middle" autoComplete="email" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} placeholder="Optional internal notes" />
          </Form.Item>
        </BodyScroll>
        <Footer>
          <Button size="middle" onClick={handleCancel} disabled={saving} style={{ borderRadius: 12, minWidth: 100 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" size="middle" loading={saving} style={{ borderRadius: 12, minWidth: 120, fontWeight: 600 }}>
            {saving ? "Adding…" : "Add member"}
          </Button>
        </Footer>
      </FormRoot>
    </ConfigProvider>
  );

  return isMobile ? (
    <Drawer.Root open={open} onOpenChange={(v) => !v && handleCancel()} snapPoints={[1]} activeSnapPoint={1} dismissible>
      <Drawer.Portal>
        <Overlay />
        <MobileShell>
          <ThumbStrip>
            <DrawerHandle />
          </ThumbStrip>
          {drawerBody}
        </MobileShell>
      </Drawer.Portal>
    </Drawer.Root>
  ) : (
    <Drawer.Root open={open} onOpenChange={(v) => !v && handleCancel()} direction="right" dismissible handleOnly>
      <Drawer.Portal>
        <Overlay />
        <DesktopShell style={{ "--initial-transform": "calc(100% + 8px)" }}>{drawerBody}</DesktopShell>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
