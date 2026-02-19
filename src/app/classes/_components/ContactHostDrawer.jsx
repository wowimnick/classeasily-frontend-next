"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Drawer } from "vaul";
import { Modal, Form, Input, Button } from "antd";
import { MessageCircle, X } from "lucide-react";
import message from "@/lib/message";
import { guestMessageService } from "@/services/apiService";

const MODAL_DRAWER_BREAKPOINT = 768;

const DrawerHandle = styled.div`
  width: 40px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

const DrawerHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px 16px;
  flex-shrink: 0;
`;

const DrawerTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #222;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #717171;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover { background: #f5f5f5; color: #222; }
`;

const DrawerScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding: 0 24px 24px;
  padding-bottom: max(24px, env(safe-area-inset-bottom));
`;

const TitleBlock = styled.div`
  margin-bottom: 24px;
`;

const Title = styled.h2`
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 600;
  color: #222;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 15px;
  color: #717171;
  line-height: 1.5;
`;

const NameRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  @media (max-width: 400px) {
    grid-template-columns: 1fr;
  }
`;

const DrawerRoot = styled(Drawer.Content)`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 16px 16px 0 0;
  z-index: 1051;
  outline: none;
  display: flex;
  flex-direction: column;
  max-height: min(90dvh, 90vh);
  min-height: min(50dvh, 50vh);
`;

const DrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1050;
`;

function ContactHostForm({ businessName, onSuccess, initialValues }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values) => {
    setSubmitting(true);
    const result = await guestMessageService.submitMessage({
      business_id: values.business_id,
      first_name: (values.first_name || "").trim(),
      last_name: (values.last_name || "").trim(),
      email: (values.email || "").trim(),
      message: (values.message || "").trim(),
      ...(values.class_id && { class_id: values.class_id }),
    });
    setSubmitting(false);
    if (result.success) {
      message.success("Message sent! Check your email for a link to view and reply.");
      form.resetFields();
      onSuccess?.();
    } else {
      message.error(result.error || "Something went wrong.");
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      initialValues={initialValues}
      onFinish={onFinish}
      style={{ marginTop: 8 }}
    >
      <Form.Item name="business_id" hidden>
        <Input type="hidden" />
      </Form.Item>
      <Form.Item name="class_id" hidden>
        <Input type="hidden" />
      </Form.Item>

      <NameRow>
        <Form.Item
          name="first_name"
          label="First name"
          rules={[{ required: true, message: "Required" }]}
        >
          <Input placeholder="First name" maxLength={150} />
        </Form.Item>
        <Form.Item name="last_name" label="Last name">
          <Input placeholder="Last name" maxLength={150} />
        </Form.Item>
      </NameRow>

      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true, message: "Required" },
          { type: "email", message: "Enter a valid email" },
        ]}
      >
        <Input type="email" placeholder="you@example.com" />
      </Form.Item>

      <Form.Item
        name="message"
        label="Message"
        rules={[{ required: true, message: "Required" }]}
      >
        <Input.TextArea
          placeholder="Your question or message..."
          rows={4}
          maxLength={5000}
          showCount
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
        <Button type="primary" htmlType="submit" loading={submitting} block size="large">
          Send message
        </Button>
      </Form.Item>
    </Form>
  );
}

export default function ContactHostDrawer({
  open,
  onOpenChange,
  businessId,
  businessName,
  classId,
  classTitle,
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth <= MODAL_DRAWER_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleClose = () => onOpenChange(false);

  const initialValues = {
    business_id: businessId,
    class_id: classId || undefined,
  };

  if (!mounted) return null;

  const title = (
    <TitleBlock>
      <Title>
        <MessageCircle size={24} color="#ff385c" />
        Ask the host
      </Title>
      <Subtitle>
        Send a message to {businessName || "the host"}. You don’t need an account — we’ll email you a link to continue the conversation.
      </Subtitle>
    </TitleBlock>
  );

  const formContent = (
    <ContactHostForm
      businessName={businessName}
      onSuccess={() => onOpenChange(false)}
      onCancel={handleClose}
    />
  );

  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <DrawerOverlay />
          <DrawerRoot>
            <DrawerHandle />
            <DrawerHeaderRow>
              <DrawerTitle>
                <MessageCircle size={22} color="#ff385c" />
                Ask the host
              </DrawerTitle>
              <CloseBtn type="button" onClick={() => onOpenChange(false)} aria-label="Close">
                <X size={20} />
              </CloseBtn>
            </DrawerHeaderRow>
            <DrawerScroll>
              <Subtitle style={{ marginBottom: 24 }}>
                Send a message to {businessName || "the host"}. You don’t need an account — we’ll email you a link to continue the conversation.
              </Subtitle>
              <ContactHostForm
                key={`${open}-${businessId}`}
                businessName={businessName}
                onSuccess={() => onOpenChange(false)}
                initialValues={initialValues}
              />
            </DrawerScroll>
          </DrawerRoot>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      width={520}
      centered
      title={title}
      footer={null}
      destroyOnClose
      styles={{ body: { paddingTop: 0 } }}
    >
      <ContactHostForm
        key={`${open}-${businessId}`}
        businessName={businessName}
        onSuccess={() => onOpenChange(false)}
        initialValues={initialValues}
      />
    </Modal>
  );
}
