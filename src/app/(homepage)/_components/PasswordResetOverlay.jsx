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
  Skeleton,
} from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, XCircle } from "lucide-react";
import { Drawer } from "vaul";
import { useSearchParams, useRouter } from "next/navigation";
import message from "@/lib/message";

import axiosInstance from "@/lib/axiosInstance";
import { theme } from "@/components/theme";
import { useAuthModal } from "@/context/AuthContext";

const { Title, Text, Paragraph } = Typography;

const ModalGlobalStyle = createGlobalStyle`
  .no-padding-modal .ant-modal-content {
    padding: 0 !important;
  }
`;

const StyledModal = styled(Modal)`
  .ant-modal-container {
    padding: 0 !important;
  }
`;

/**
 * Animation Helpers
 */
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

const ContentWrapper = styled.div`
  padding: 1.5rem;
  text-align: center;
`;

const StyledForm = styled(Form)`
  text-align: left;
  margin-top: 24px;
  .ant-form-item-label {
    padding-bottom: 4px;
  }

  .ant-input-affix-wrapper,
  .ant-input-password,
  .ant-input {
    @media (max-width: 768px) {
      font-size: 16px !important;
    }
  }
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

function PasswordResetContent({ uid, token, triggerClose }) {
  const [form] = Form.useForm();
  const router = useRouter();
  const { openLoginModal } = useAuthModal();
  const [status, setStatus] = useState("form"); // form, success, error
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleConfirmReset = async (values) => {
    setLoading(true);
    setErrorMsg("");

    const payload = {
      uid,
      token,
      new_password1: values.password1,
      new_password2: values.password2,
    };

    try {
      await axiosInstance.post("/auth/password/reset/confirm/", payload);
      setStatus("success");
      message.success("Password reset successfully!");
    } catch (err) {
      let msg = "Failed to reset password. The link may be expired.";
      if (err.response?.data) {
        const data = err.response.data;
        msg = data.detail || data.new_password1?.[0] || data.token?.[0] || msg;
      }
      setErrorMsg(msg);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContentWrapper>
      <AnimatePresence mode="wait">
        {status === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
          >
            <Lock
              size={48}
              style={{ marginBottom: 16, color: theme.token.colorPrimary }}
            />
            <Title level={3} style={{ marginBottom: 4 }}>
              Set New Password
            </Title>
            <Paragraph type="secondary">
              Choose a strong new password for your account.
            </Paragraph>

            <StyledForm
              form={form}
              layout="vertical"
              onFinish={handleConfirmReset}
              requiredMark={false}
            >
              <Form.Item
                name="password1"
                label="New Password"
                rules={[
                  { required: true, message: "Required" },
                  { min: 8, message: "Min 8 characters" },
                  {
                    pattern: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
                    message: "Must include letters and numbers",
                  },
                ]}
              >
                <Input.Password
                  prefix={
                    <Lock
                      size={16}
                      style={{ color: "#bfbfbf", marginRight: 8 }}
                    />
                  }
                  placeholder="Enter new password"
                />
              </Form.Item>

              <Form.Item
                name="password2"
                label="Confirm New Password"
                dependencies={["password1"]}
                rules={[
                  { required: true, message: "Please confirm" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password1") === value)
                        return Promise.resolve();
                      return Promise.reject(
                        new Error("Passwords do not match")
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={
                    <Lock
                      size={16}
                      style={{ color: "#bfbfbf", marginRight: 8 }}
                    />
                  }
                  placeholder="Confirm new password"
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                style={{ marginTop: 8 }}
              >
                Reset Password
              </Button>
              <Button
                type="link"
                block
                onClick={triggerClose}
                disabled={loading}
                style={{ color: "#8c8c8c" }}
              >
                Cancel
              </Button>
            </StyledForm>
          </motion.div>
        )}

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
              <Unlock size={36} strokeWidth={2} />
            </SuccessBloom>
            <Title level={3}>All set!</Title>
            <Paragraph type="secondary">
              Your password has been updated successfully. You can now log in
              with your new credentials.
            </Paragraph>
            <Button
              type="primary"
              block
              size="large"
              style={{ marginTop: 16 }}
              onClick={() => {
                triggerClose();
                openLoginModal();
              }}
            >
              Log In Now
            </Button>
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
              title="Reset Failed"
              subTitle={errorMsg}
              extra={[
                <Button
                  type="primary"
                  key="retry"
                  onClick={() => setStatus("form")}
                >
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

function PasswordResetOverlayInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const uid = searchParams.get("reset_uid");
  const token = searchParams.get("reset_token");
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (uid && token) setIsOpen(true);
    else setIsOpen(false);
  }, [uid, token]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleFinalCleanup = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("reset_uid");
    params.delete("reset_token");
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const triggerClose = () => {
    setIsOpen(false);
    setTimeout(handleFinalCleanup, 500);
  };

  if (!uid || !token) return null;

  return (
    <ConfigProvider theme={theme}>
      <ModalGlobalStyle />
      {isMobile ? (
        <Drawer.Root
          open={isOpen}
          repositionInputs={false}
          onOpenChange={(open) => !open && triggerClose()}
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
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 4,
                  background: "#ddd",
                  borderRadius: 2,
                  margin: "12px auto",
                }}
              />
              <AnimatedModalContent>
                <PasswordResetContent
                  uid={uid}
                  token={token}
                  triggerClose={triggerClose}
                />
              </AnimatedModalContent>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      ) : (
        <StyledModal
          open={isOpen}
          onCancel={triggerClose}
          footer={null}
          centered
          width={440}
          closable={false}
          className="no-padding-modal"
          afterClose={handleFinalCleanup}
        >
          <AnimatedModalContent>
            <PasswordResetContent
              uid={uid}
              token={token}
              triggerClose={triggerClose}
            />
          </AnimatedModalContent>
        </StyledModal>
      )}
    </ConfigProvider>
  );
}

export default function PasswordResetOverlay() {
  return (
    <Suspense fallback={null}>
      <PasswordResetOverlayInner />
    </Suspense>
  );
}
