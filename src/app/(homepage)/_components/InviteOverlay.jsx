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
  Avatar,
  Skeleton,
  Result,
  ConfigProvider,
} from "antd";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building,
  UserCheck,
  Mail,
  ArrowRight,
  Check,
  AlertCircle,
} from "lucide-react";
import { Drawer } from "vaul";
import { useSearchParams, useRouter } from "next/navigation";
import message from "@/lib/message";

import axiosInstance from "@/lib/axiosInstance";
import { useAuthModal } from "@/context/AuthContext";
import { theme } from "@/components/theme";
import { useAuth } from "@/lib/auth-client";

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

/**
 * Styled Components
 */
const ContentWrapper = styled.div`
  padding: 1.5rem;
  text-align: center;
`;

const InfoGrid = styled.div`
  display: grid;
  gap: 12px;
  text-align: left;
  margin: 24px 0;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  min-height: 54px;
  svg {
    flex-shrink: 0;
    color: ${theme.token.colorPrimary};
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

const InviteSkeleton = () => (
  <ContentWrapper>
    <div
      style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}
    >
      <Skeleton.Avatar active size={64} shape="circle" />
    </div>
    <Skeleton active paragraph={{ rows: 2 }} />
    <InfoGrid>
      {[1, 2, 3].map((i) => (
        <Skeleton.Input
          key={i}
          active
          block
          style={{ height: 54, borderRadius: 12, marginBottom: 8 }}
        />
      ))}
    </InfoGrid>
    <Skeleton.Button active block style={{ height: 45 }} />
  </ContentWrapper>
);

function InviteContent({ token, triggerClose }) {
  const { user, isAuthenticated, signOut, refreshUser } = useAuth();
  const { openLoginModal } = useAuthModal();
  const router = useRouter();

  const [status, setStatus] = useState("loading");
  const [details, setDetails] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const validate = async () => {
      try {
        const res = await axiosInstance.get(
          `/business/validate-invitation/?token=${token}`
        );
        setDetails(res.data);
        setStatus("info");
      } catch (err) {
        setErrorMsg(err.response?.data?.detail || "Invalid invitation link.");
        setStatus("error");
      }
    };
    validate();
  }, [token]);

  // Check for email mismatch immediately upon data load or auth change
  useEffect(() => {
    if (status === "info" && isAuthenticated && user && details) {
      if (user.email?.toLowerCase() !== details.invited_email?.toLowerCase()) {
        setStatus("email_mismatch");
      }
    }
  }, [status, isAuthenticated, user, details]);

  const handleSwitchAccount = async () => {
    if (signOut) await signOut();
    openLoginModal();
  };

  const handleAccept = async () => {
    if (!isAuthenticated) {
      localStorage.setItem("pendingInvitationToken", token);
      openLoginModal();
      return;
    }

    setIsSubmitting(true);
    message.loading({ content: "Joining team...", key: "invite-act" });

    try {
      await axiosInstance.post("/business/accept-invitation/", { token });

      if (refreshUser) {
        await refreshUser();
      }

      setStatus("success");
      message.success({ content: "Welcome aboard!", key: "invite-act" });
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to accept invitation.";
      message.error({ content: msg, key: "invite-act" });
      setErrorMsg(msg);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") return <InviteSkeleton />;

  return (
    <ContentWrapper>
      <AnimatePresence mode="wait">
        {status === "info" && (
          <motion.div
            key="info"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
            transition={{ duration: 0.3 }}
          >
            <Avatar
              size={80}
              src={details?.business_image_medium_url}
              icon={<Building />}
              style={{
                marginBottom: 16,
                border: "4px solid #f0f0f0",
                backgroundColor: "#fff",
              }}
            />
            <Title level={3} style={{ marginBottom: 4 }}>
              Team Invitation
            </Title>
            <Paragraph type="secondary">
              <b>{details?.inviter_name}</b> has invited you to join their
              business.
            </Paragraph>

            <InfoGrid>
              <InfoRow>
                <Building size={18} />
                <div style={{ textAlign: "left" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#8c8c8c",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Business
                  </div>
                  <Text strong>{details?.business_name}</Text>
                </div>
              </InfoRow>
              <InfoRow>
                <UserCheck size={18} />
                <div style={{ textAlign: "left" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#8c8c8c",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Your Role
                  </div>
                  <Text strong>{details?.role_name}</Text>
                </div>
              </InfoRow>
              <InfoRow>
                <Mail size={18} />
                <div style={{ textAlign: "left" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#8c8c8c",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Invited Email
                  </div>
                  <Text strong>{details?.invited_email}</Text>
                </div>
              </InfoRow>
            </InfoGrid>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <Button
                key={`btn-${isSubmitting}`}
                type="primary"
                size="large"
                block
                loading={isSubmitting}
                onClick={handleAccept}
                icon={!isAuthenticated && <ArrowRight size={18} />}
              >
                {isAuthenticated ? "Accept Invitation" : "Log In to Accept"}
              </Button>
              <Button
                type="link"
                onClick={triggerClose}
                disabled={isSubmitting}
              >
                Decide Later
              </Button>
            </div>
          </motion.div>
        )}

        {status === "email_mismatch" && (
          <motion.div
            key="mismatch"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Result
              status="warning"
              icon={
                <AlertCircle
                  size={48}
                  color="#faad14"
                  style={{ margin: "0 auto" }}
                />
              }
              title="Wrong Account"
              subTitle={
                <div style={{ marginTop: 12 }}>
                  <Paragraph type="secondary">
                    This invitation was sent to: <br />
                    <Text strong>{details?.invited_email}</Text>
                  </Paragraph>
                  <Paragraph type="secondary">
                    You are currently logged in as: <br />
                    <Text strong>{user?.email}</Text>
                  </Paragraph>
                </div>
              }
              extra={[
                <Button
                  type="primary"
                  key="switch"
                  size="large"
                  block
                  onClick={handleSwitchAccount}
                >
                  Switch Account
                </Button>,
                <Button type="link" key="back" onClick={triggerClose}>
                  Close
                </Button>,
              ]}
            />
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
              <Check size={36} strokeWidth={3} />
            </SuccessBloom>
            <Title level={3}>Welcome aboard!</Title>
            <Paragraph type="secondary">
              You've successfully joined <b>{details?.business_name}</b>.
            </Paragraph>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginTop: 16,
              }}
            >
              <Button
                type="primary"
                block
                size="large"
                onClick={() => router.push("/business/dashboard/overview")}
              >
                Go to Dashboard
              </Button>
              <Button type="link" onClick={triggerClose}>
                Done
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
              title="Invitation Error"
              subTitle={errorMsg}
              extra={<Button onClick={triggerClose}>Close</Button>}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </ContentWrapper>
  );
}

function InviteOverlayInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const isClaimMode = searchParams.get("mode") === "claim-account";
  const rawToken =
    searchParams.get("invite_token") ||
    (!isClaimMode ? searchParams.get("token") : null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (rawToken) setIsOpen(true);
    else setIsOpen(false);
  }, [rawToken]);

  useEffect(() => {
    if (searchParams.get("token")) {
      const params = new URLSearchParams(searchParams.toString());
      const val = params.get("token");
      params.delete("token");
      params.set("invite_token", val);
      router.replace(`/?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleFinalCleanup = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("invite_token");
    params.delete("token");
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const triggerClose = () => {
    setIsOpen(false);
    setTimeout(handleFinalCleanup, 500);
  };

  if (!rawToken && !isOpen) return null;

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
                <InviteContent token={rawToken} triggerClose={triggerClose} />
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
            <InviteContent token={rawToken} triggerClose={triggerClose} />
          </AnimatedModalContent>
        </StyledModal>
      )}
    </ConfigProvider>
  );
}

export default function InviteOverlay() {
  return (
    <Suspense fallback={null}>
      <InviteOverlayInner />
    </Suspense>
  );
}
