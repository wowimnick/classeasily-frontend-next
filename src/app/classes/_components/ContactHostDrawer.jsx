"use client";

import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import styled from "styled-components";
import { Drawer } from "vaul";
import { Modal, Form, Input, Button } from "antd";
import { MessageCircle } from "lucide-react";
import message from "@/lib/message";
import { guestMessageService } from "@/services/apiService";

const MODAL_DRAWER_BREAKPOINT = 768;

const theme = {
  textPrimary: "#222222",
  textSecondary: "#717171",
  borderLight: "#e5e7eb",
};

/* Match MobileReserveReviewDrawer exactly */
const DrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1050;
`;

const DrawerContent = styled(Drawer.Content)`
  background: #fff;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  height: 96vh;
  max-height: 96vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1051;
  outline: none;
  min-height: 0;
`;

const DrawerHandle = styled.div`
  width: 40px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

const DrawerBody = styled.div`
  overflow-y: scroll;
  padding: 0 12px 16px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden;
`;

const DrawerFooter = styled.div`
  flex-shrink: 0;
  padding: 8px 12px 12px;
  background: #fff;
  border-top: 1px solid ${theme.borderLight};
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  padding-top: 8px;
  flex-shrink: 0;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: ${theme.textPrimary};
  letter-spacing: -0.01em;
`;

const NextButton = styled.button`
  width: 100%;
  padding: 16px;
  background: #222222;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;

  &:active {
    opacity: 0.95;
    transform: scale(0.99);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const TitleBlock = styled.div`
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
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
  color: ${theme.textSecondary};
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

const ContactHostForm = forwardRef(function ContactHostForm(
  { businessName, onSuccess, initialValues, hideSubmitButton, onSubmittingChange },
  ref
) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useImperativeHandle(ref, () => ({
    submit: () => form.submit(),
    submitting,
  }), [submitting]);

  const onFinish = async (values) => {
    setSubmitting(true);
    onSubmittingChange?.(true);
    const result = await guestMessageService.submitMessage({
      business_id: values.business_id,
      first_name: (values.first_name || "").trim(),
      last_name: (values.last_name || "").trim(),
      email: (values.email || "").trim(),
      message: (values.message || "").trim(),
      ...(values.class_id && { class_id: values.class_id }),
    });
    setSubmitting(false);
    onSubmittingChange?.(false);
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
      id="contact-host-form"
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

      {!hideSubmitButton && (
        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <Button type="primary" htmlType="submit" loading={submitting} block size="middle">
            Send message
          </Button>
        </Form.Item>
      )}
    </Form>
  );
});

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
  const [drawerSubmitting, setDrawerSubmitting] = useState(false);
  const formRef = useRef(null);

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
      <ModalTitle>
        <MessageCircle size={24} color="#ff385c" />
        Ask the host
      </ModalTitle>
      <Subtitle>
        Send a message to {businessName || "the host"}. You don’t need an account — we’ll email you a link to continue the conversation.
      </Subtitle>
    </TitleBlock>
  );

  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerHandle />
            <DrawerBody>
              <HeaderRow>
                <Title>Ask the host</Title>
              </HeaderRow>
              <Subtitle style={{ marginBottom: 24 }}>
                Send a message to {businessName || "the host"}. You don't need an account — we'll email you a link to continue the conversation.
              </Subtitle>
              <ContactHostForm
                ref={formRef}
                key={`${open}-${businessId}`}
                businessName={businessName}
                onSuccess={() => onOpenChange(false)}
                initialValues={initialValues}
                hideSubmitButton
                onSubmittingChange={setDrawerSubmitting}
              />
            </DrawerBody>
            <DrawerFooter>
              <NextButton
                type="button"
                onClick={() => formRef.current?.submit()}
                disabled={drawerSubmitting}
              >
                {drawerSubmitting ? "Sending…" : "Send message"}
              </NextButton>
            </DrawerFooter>
          </DrawerContent>
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
