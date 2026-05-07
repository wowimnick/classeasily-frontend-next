"use client";

import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import styled from "styled-components";
import { Drawer } from "vaul";
import { Modal, Form, Input, Button } from "antd";
import { MessageCircle } from "lucide-react";
import message from "@/lib/message";
import { guestMessageService } from "@/services/apiService";

const MODAL_DRAWER_BREAKPOINT = 768;
/** Same band as ClassPageClient `Z_CLASS_HOST_AND_POLICIES` — above peek bar (900) and header popovers */
const Z_CONTACT_HOST_STACK = 5000;

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
  z-index: ${Z_CONTACT_HOST_STACK};
`;

const DrawerContent = styled(Drawer.Content)`
  background: #fff;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  height: 88vh;
  max-height: 88vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: ${Z_CONTACT_HOST_STACK + 1};
  outline: none;
  min-height: 0;
`;

const DrawerHandle = styled.div`
  width: 40px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  margin: 8px auto 6px;
  flex-shrink: 0;
`;

const DrawerBody = styled.div`
  overflow-y: scroll;
  padding: 0 10px 12px;
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
  margin-bottom: 12px;
  padding-top: 4px;
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
  font-size: 14px;
  color: ${theme.textPrimary};
  line-height: 1.5;
  text-align: center;
`;

/* Match MobileReserveReviewDrawer InfoCard exactly */
const InfoCard = styled.div`
  background: #fff;
  border: 1px solid ${theme.borderLight};
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  margin-bottom: 14px;
  flex-shrink: 0;
`;

const CardSection = styled.div`
  padding: 10px;
  border-bottom: 1px solid ${theme.borderLight};
  &:last-child {
    border-bottom: none;
  }
`;

/* Form in drawer: black text, same spacing as review drawer */
const DrawerFormWrap = styled.div`
  .ant-form {
    margin-top: 0;
  }
  .ant-form-item-label > label {
    color: ${theme.textPrimary} !important;
    font-weight: 600;
    font-size: 15px;
  }
  .ant-input,
  .ant-input-affix-wrapper input,
  .ant-input-textarea textarea {
    color: ${theme.textPrimary} !important;
    font-size: 16px;
  }
  .contact-message-textarea.ant-input-textarea textarea {
    font-size: 16px !important;
  }
  @media (min-width: 769px) {
    .ant-input,
    .ant-input-affix-wrapper input {
      font-size: 14px;
    }
    .contact-message-textarea.ant-input-textarea textarea {
      font-size: 16px !important;
    }
  }
  .ant-input::placeholder,
  .ant-input-textarea textarea::placeholder {
    color: #9ca3af;
  }
`;

/* Input font-size: 16px mobile, 14px desktop (used in modal); message box always 16px */
const FormFieldSizes = styled.div`
  .ant-input,
  .ant-input-affix-wrapper input,
  .ant-input-textarea textarea {
    font-size: 16px;
  }
  .contact-message-textarea.ant-input-textarea textarea {
    font-size: 16px !important;
  }
  @media (min-width: 769px) {
    .ant-input,
    .ant-input-affix-wrapper input {
      font-size: 14px;
    }
    .contact-message-textarea.ant-input-textarea textarea {
      font-size: 16px !important;
    }
  }
`;

const NameRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  @media (max-width: 768px) {
    gap: 0;
  }
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
          className="contact-message-textarea"
          placeholder="Your question or message..."
          rows={hideSubmitButton ? 3 : 4}
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
      <Subtitle style={{ marginTop: 24 }}>
        Send a message to {businessName || "the host"}. You don’t need an account — we’ll email you a link to continue the conversation.
      </Subtitle>
    </TitleBlock>
  );

  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange} repositionInputs={false}>
        <Drawer.Portal>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerHandle />
            <DrawerBody>
              <HeaderRow>
                <Title>Ask the host</Title>
              </HeaderRow>
              <InfoCard>
                <CardSection>
                  <Subtitle>
                    Send a message to {businessName || "the host"}. You don't need an account — we'll email you a link to continue the conversation.
                  </Subtitle>
                </CardSection>
                <CardSection>
                  <DrawerFormWrap>
                    <ContactHostForm
                      ref={formRef}
                      key={`${open}-${businessId}`}
                      businessName={businessName}
                      onSuccess={() => onOpenChange(false)}
                      initialValues={initialValues}
                      hideSubmitButton
                      onSubmittingChange={setDrawerSubmitting}
                    />
                  </DrawerFormWrap>
                </CardSection>
              </InfoCard>
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
      zIndex={Z_CONTACT_HOST_STACK}
      title={title}
      footer={null}
      destroyOnClose
      styles={{
        body: { padding: "8px 24px 24px" },
      }}
    >
      <FormFieldSizes>
        <ContactHostForm
          key={`${open}-${businessId}`}
          businessName={businessName}
          onSuccess={() => onOpenChange(false)}
          initialValues={initialValues}
        />
      </FormFieldSizes>
    </Modal>
  );
}
