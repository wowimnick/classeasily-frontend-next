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
  Result,
  ConfigProvider,
  Skeleton,
} from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { MailCheck, XCircle, Check } from "lucide-react";
import { Drawer } from "vaul";
import { useSearchParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import axiosInstance from "@/lib/axiosInstance";
import { theme } from "@/components/theme";
import { useAuthModal } from "@/context/AuthContext";

const { Title, Paragraph } = Typography;

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

const VerifySkeleton = () => (
  <ContentWrapper>
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
      <Skeleton.Avatar active size={64} shape="circle" />
    </div>
    <Skeleton active paragraph={{ rows: 2 }} />
    <Skeleton.Button active block style={{ height: 45, marginTop: 24 }} />
  </ContentWrapper>
);

function VerifyEmailContent({ verificationKey, triggerClose }) {
  const { openLoginModal } = useAuthModal();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!verificationKey) {
        setStatus("error");
        setErrorMsg("Invalid verification link.");
        return;
      }

      try {
        const response = await axiosInstance.post(
          "/auth/registration/verify-email/",
          { key: verificationKey }
        );

        if (response.status === 200 && response.data?.detail === "ok") {
          setStatus("success");
          fireConfetti();
        } else {
          setStatus("error");
          setErrorMsg(response.data?.detail || "Verification failed.");
        }
      } catch (err) {
        let msg = "An error occurred during verification.";
        if (err.response?.data?.detail) {
          msg = err.response.data.detail;
        } else if (err.response?.status === 404) {
          msg = "Link expired or invalid.";
        }
        setStatus("error");
        setErrorMsg(msg);
      }
    };

    verifyEmail();
  }, [verificationKey]);

  const fireConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: [
        theme.token.colorPrimary,
        theme.token.colorSuccess,
        "#FFB400",
        "#ffffff",
      ],
      zIndex: 2000, 
    });
  };

  const handleLogin = () => {
    triggerClose();
    // Short timeout to allow modal to close before opening login
    setTimeout(() => {
      openLoginModal();
    }, 300);
  };

  if (status === "verifying") return <VerifySkeleton />;

  return (
    <ContentWrapper>
      <AnimatePresence mode="wait">
        {status === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 18, stiffness: 150 }}
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
              <Check size={36} strokeWidth={3} />
            </SuccessBloom>
            <Title level={3}>Email Verified!</Title>
            <Paragraph type="secondary">
              Your account is now active. You can now log in to access all features.
            </Paragraph>
            <Button
              type="primary"
              block
              size="large"
              style={{ marginTop: 16 }}
              onClick={handleLogin}
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
              icon={<XCircle size={64} color="#ff4d4f" />}
              title="Verification Failed"
              subTitle={errorMsg}
              extra={[
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

function VerifyEmailOverlayInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const key = searchParams.get("verify_email_key");
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (key) setIsOpen(true);
    else setIsOpen(false);
  }, [key]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleFinalCleanup = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("verify_email_key");
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const triggerClose = () => {
    setIsOpen(false);
    setTimeout(handleFinalCleanup, 500);
  };

  if (!key && !isOpen) return null;

  return (
    <ConfigProvider theme={theme}>
      <ModalGlobalStyle />
      {isMobile ? (
        <Drawer.Root
          open={isOpen}
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
                <VerifyEmailContent
                  verificationKey={key}
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
            <VerifyEmailContent
              verificationKey={key}
              triggerClose={triggerClose}
            />
          </AnimatedModalContent>
        </StyledModal>
      )}
    </ConfigProvider>
  );
}

export default function VerifyEmailOverlay() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailOverlayInner />
    </Suspense>
  );
}