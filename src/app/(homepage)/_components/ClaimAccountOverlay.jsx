"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  Suspense,
} from "react";
import styled, { createGlobalStyle } from "styled-components";
import {
  Modal,
  Button,
  Typography,
  Form,
  Input,
  Result,
  ConfigProvider,
  Alert,
} from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, CheckCircle, KeyRound } from "lucide-react";
import { Drawer } from "vaul";
import { useSearchParams, useRouter } from "next/navigation";
import message from "@/lib/message";

import { useAuthModal } from "@/context/AuthContext";
import { theme } from "@/components/theme";
import { userService } from "@/services/apiService";

const { Title, Paragraph } = Typography;

// --- GLOBAL STYLES ---
const ModalGlobalStyle = createGlobalStyle`
  .no-padding-modal .ant-modal-content {
    padding: 0 !important;
  }
`;

// --- STYLED COMPONENTS ---

const StyledModal = styled(Modal)`
  .ant-modal-container {
    padding: 0 !important;
  }
`;

const ContentWrapper = styled.div`
  padding: 2rem 1.5rem;
  text-align: center;
`;

const IconWrapper = styled.span`
  color: #999;
  display: flex;
  align-items: center;
`;

const EmojiHeader = styled(motion.div)`
  font-size: 48px;
  line-height: 1;
  margin-bottom: 16px;
  display: inline-block;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
`;

const SuccessBloom = styled(motion.div)`
  width: 72px;
  height: 72px;
  background: #52c41a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: white;
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
`;

const StyledForm = styled(Form)`
  text-align: left;
  margin-top: 24px;

  .ant-form-item {
    margin-bottom: 1rem;
  }
  .ant-input-affix-wrapper,
  .ant-input-password,
  .ant-input {
    padding: 0 11px;
    height: 48px;
    border-radius: 12px;
    border: 1px solid #e8e8e8;

    /* Default font size for desktop */
    font-size: 14px;

    /* Force 16px on mobile to prevent iOS zoom on focus */
    @media (max-width: 768px) {
      font-size: 16px !important;
    }

    &:hover,
    &.ant-input-affix-wrapper-focused,
    &.ant-input-password-focused,
    &:focus {
      border-color: #ff385c;
      box-shadow: 0 0 0 2px rgba(255, 56, 92, 0.1);
    }
  }
`;

// --- ANIMATION HELPERS ---
const useElementSize = () => {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, size];
};

const AnimatedModalContent = ({ children }) => {
  const [ref, { height }] = useElementSize();
  return (
    <motion.div
      animate={{ height: height || "auto" }}
      style={{ overflow: "hidden" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <div ref={ref}>{children}</div>
    </motion.div>
  );
};

// --- CONTENT COMPONENT ---
function ClaimAccountContent({ uid, token, triggerClose }) {
  const { openLoginModal } = useAuthModal();
  const [form] = Form.useForm();

  const [status, setStatus] = useState("input");
  const [errorMsg, setErrorMsg] = useState("");

  const handleClaim = async (values) => {
    setStatus("submitting");
    setErrorMsg("");

    try {
      await userService.confirmPasswordReset({
        uid: uid,
        token: token,
        new_password1: values.password,
        new_password2: values.confirmPassword,
      });

      setStatus("success");
      message.success("Account claimed successfully!");
    } catch (error) {
      console.error("Claim error:", error);
      const detail =
        error.detail ||
        error.password1 ||
        error.token ||
        "Failed to set password. Link may be invalid or expired.";

      setErrorMsg(Array.isArray(detail) ? detail[0] : detail);
      setStatus("error");
    }
  };

  const handleLoginClick = () => {
    triggerClose();
    setTimeout(() => {
      openLoginModal();
    }, 300);
  };

  const handleRetry = () => {
    setStatus("input");
    setErrorMsg("");
  };

  return (
    <ContentWrapper>
      <AnimatePresence mode="wait">
        {status === "input" || status === "submitting" ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
            transition={{ duration: 0.3 }}
          >
            {/* Friendly Emoji Header */}
            <EmojiHeader
              initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              🔑
            </EmojiHeader>

            <Title level={2} style={{ marginBottom: 8, fontSize: "1.75rem" }}>
              Here are your keys!
            </Title>
            <Paragraph style={{ color: "#666", fontSize: "15px" }}>
              Your business profile setup is complete. <br />
              Create a secure password to unlock your dashboard.
            </Paragraph>

            {errorMsg && (
              <Alert
                message={errorMsg}
                type="error"
                showIcon
                style={{ marginBottom: 16, textAlign: "left" }}
              />
            )}

            <StyledForm form={form} onFinish={handleClaim} layout="vertical">
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: "Required" },
                  {
                    pattern: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
                    message: "8+ chars, 1 letter, 1 number",
                  },
                ]}
              >
                <Input.Password
                  prefix={
                    <IconWrapper>
                      <Lock size={18} />
                    </IconWrapper>
                  }
                  placeholder="Create Password"
                  size="middle"
                />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Required" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value)
                        return Promise.resolve();
                      return Promise.reject("Passwords don't match");
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={
                    <IconWrapper>
                      <Lock size={18} />
                    </IconWrapper>
                  }
                  placeholder="Confirm Password"
                  size="middle"
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={status === "submitting"}
                style={{ marginTop: 8, height: "48px", borderRadius: "12px" }}
              >
                Claim My Account
              </Button>
            </StyledForm>
          </motion.div>
        ) : null}

        {status === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 18, stiffness: 150 }}
            style={{ padding: "12px 0" }}
          >
            <SuccessBloom
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.1,
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
            >
              <CheckCircle size={36} strokeWidth={3} />
            </SuccessBloom>
            <Title level={3}>You're In!</Title>
            <Paragraph style={{ color: "#666", fontSize: "16px" }}>
              Your password has been set and your keys are ready.
            </Paragraph>
            <div style={{ marginTop: 24 }}>
              <Button
                type="primary"
                block
                size="large"
                onClick={handleLoginClick}
                style={{ height: "48px", borderRadius: "12px" }}
              >
                Sign In Now
              </Button>
            </div>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Result
              status="error"
              title="Claim Failed"
              subTitle={errorMsg}
              extra={[
                <Button type="primary" key="retry" onClick={handleRetry}>
                  Try Again
                </Button>,
                <Button key="close" onClick={triggerClose}>
                  Close
                </Button>,
              ]}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </ContentWrapper>
  );
}

// --- OVERLAY/DRAWER CONTROLLER ---
function ClaimAccountOverlayInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Extract params
  const mode = searchParams.get("mode");
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  useEffect(() => {
    // Only open if mode is claim-account and we have the required tokens
    if (mode === "claim-account" && uid && token) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [mode, uid, token]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Cleanup URL params
    const params = new URLSearchParams(searchParams.toString());
    params.delete("mode");
    params.delete("uid");
    params.delete("token");
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  if (!isOpen) return null;

  return (
    <ConfigProvider theme={theme}>
      <ModalGlobalStyle />
      {isMobile ? (
        <Drawer.Root
          open={isOpen}
          onOpenChange={(open) => !open && handleClose()}
          disablePreventScroll={false}
        >
          <Drawer.Portal>
            <Drawer.Overlay
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.4)",
                zIndex: 1000,
              }}
            />
            <Drawer.Content
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: "white",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                zIndex: 1001,
                outline: "none",
                // Handles keyboard resizing viewport
                maxHeight: "96vh",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 4,
                  background: "#ddd",
                  borderRadius: 2,
                  margin: "12px auto",
                  flexShrink: 0,
                }}
              />
              <AnimatedModalContent>
                <ClaimAccountContent
                  uid={uid}
                  token={token}
                  triggerClose={handleClose}
                />
              </AnimatedModalContent>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      ) : (
        <StyledModal
          open={isOpen}
          onCancel={handleClose}
          footer={null}
          centered
          width={440}
          closable={false}
          className="no-padding-modal"
          maskClosable={false}
        >
          <AnimatedModalContent>
            <ClaimAccountContent
              uid={uid}
              token={token}
              triggerClose={handleClose}
            />
          </AnimatedModalContent>
        </StyledModal>
      )}
    </ConfigProvider>
  );
}

export default function ClaimAccountOverlay() {
  return (
    <Suspense fallback={null}>
      <ClaimAccountOverlayInner />
    </Suspense>
  );
}
