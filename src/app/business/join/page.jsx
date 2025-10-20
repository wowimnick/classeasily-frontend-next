// app/business/join/page.jsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styled, { keyframes } from "styled-components";
import { Button, Result, Typography, Avatar } from 'antd';
import message from '@/lib/message';
import { Building, UserCheck, Mail, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

// Dynamically import components that might have SSR issues
const Header = dynamic(() => import("@/components/header/Header"), {
  ssr: false,
});
const Footer = dynamic(() => import("@/components/homepage/Footer"), {
  ssr: false,
});
const GlobalLoaderWithoutInlineStyles = dynamic(
  () =>
    import("@/components/common/GlobalLoader").then(
      (mod) => mod.GlobalLoaderWithoutInlineStyles
    ),
  { ssr: false }
);

import { useAuthModal } from "@/context/AuthContext";
import { theme } from "@/components/theme";

// Lazy load axios instance only on client
let axiosInstance;
if (typeof window !== "undefined") {
  axiosInstance = require("@/lib/axiosInstance").default;
}

// Styled components
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const PageContainer = styled.div`
  display: flex;
  margin-top: -6rem;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 24px;
  padding-top: 120px;
  position: relative;
  overflow: hidden;
  color: white;
  text-align: center;

  @media (max-width: 768px) {
    padding: 8px;
    padding-top: 100px;
  }
`;

const BackgroundMedia = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
`;

const VideoBackground = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;

  @media (max-width: 768px) {
    display: none;
  }
`;

const ImageBackground = styled.div`
  width: 100%;
  height: 100%;
  background-image: url(/assets/homepageMobile.webp);
  background-size: cover;
  background-position: center;
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

const InvitationCard = styled(motion.div)`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 550px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 48px;
  animation: ${fadeIn} 0.8s ease-out;

  @media (max-width: 576px) {
    padding: 32px 12px;
  }
`;

const ContainerHeader = styled.div`
  margin-bottom: 32px;
  animation: ${slideUp} 0.6s ease-out;
`;

const InfoGrid = styled.div`
  display: grid;
  gap: 16px;
  text-align: left;
  margin: 32px 0;
  animation: ${slideUp} 0.7s ease-out 0.1s;
  animation-fill-mode: both;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  color: #e5e7eb;

  svg {
    flex-shrink: 0;
    color: ${theme.token.colorPrimary};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 32px;
  animation: ${slideUp} 0.8s ease-out 0.2s;
  animation-fill-mode: both;

  .ant-btn-primary {
    background: ${theme.token.colorPrimary};
    border-color: ${theme.token.colorPrimary};
    &:hover {
      background: ${theme.token.colorPrimaryHover};
      border-color: ${theme.token.colorPrimaryHover};
    }
  }

  .ant-btn-default {
    background: transparent;
    border-color: rgba(255, 255, 255, 0.5);
    color: white;
    &:hover {
      border-color: white;
      background: rgba(255, 255, 255, 0.1);
    }
  }
`;

const CenteredSpinner = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: white;
  font-size: 16px;
`;

function JoinBusinessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openLoginModal } = useAuthModal();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invitationDetails, setInvitationDetails] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const token = searchParams.get("token");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkIsMobile = () => setIsMobile(window.innerWidth <= 768);
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !isMounted) return;

    if (!token) {
      setError("No invitation token was provided. The link may be incorrect.");
      setLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        if (!axiosInstance) {
          throw new Error("API client not initialized");
        }

        const response = await axiosInstance.get(
          `/business/validate-invitation/?token=${token}`
        );
        setInvitationDetails(response.data);

        if (typeof localStorage !== "undefined") {
          localStorage.setItem(
            "prefillEmailForRegistration",
            response.data.invited_email
          );
        }
      } catch (err) {
        setError(
          err.response?.data?.detail ||
            "This invitation link is invalid, expired, or has already been used."
        );
      } finally {
        setTimeout(() => setLoading(false), 1000);
      }
    };

    validateToken();
  }, [token, isMounted]);

  const onAuthSuccess = () => {
    if (typeof window === "undefined" || typeof localStorage === "undefined")
      return;

    const storedToken = localStorage.getItem("pendingInvitationToken");
    if (storedToken) {
      localStorage.removeItem("pendingInvitationToken");
      router.push(`/business/accept-invite?token=${storedToken}`);
    } else {
      message.error("Could not find invitation token after login.");
      router.push("/");
    }
  };

  const handleLogin = () => {
    if (typeof window === "undefined" || typeof localStorage === "undefined")
      return;

    localStorage.setItem("pendingInvitationToken", token);
    openLoginModal(onAuthSuccess);
  };

  const renderContent = () => {
    if (!isMounted) {
      return (
        <CenteredSpinner>
          <GlobalLoaderWithoutInlineStyles />
        </CenteredSpinner>
      );
    }

    if (loading) {
      return (
        <CenteredSpinner>
          <GlobalLoaderWithoutInlineStyles />
          <Typography.Text style={{ color: "white" }}>
            Verifying your invitation...
          </Typography.Text>
        </CenteredSpinner>
      );
    }

    if (error) {
      return (
        <Result
          status="error"
          title={
            <Typography.Title level={3} style={{ color: "white" }}>
              Invitation Error
            </Typography.Title>
          }
          subTitle={
            <Typography.Text style={{ color: "rgba(255,255,255,0.8)" }}>
              {error}
            </Typography.Text>
          }
          extra={
            <Button type="primary" onClick={() => router.push("/")}>
              Go to Homepage
            </Button>
          }
          style={{
            background: "rgba(0,0,0,0.3)",
            borderRadius: "16px",
            padding: "48px",
          }}
        />
      );
    }

    if (invitationDetails) {
      return (
        <AnimatePresence>
          <InvitationCard
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <ContainerHeader>
              <Avatar
                size={80}
                src={invitationDetails.business_image_medium_url}
                icon={<Building size={40} />}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  color: theme.token.colorPrimary,
                  marginBottom: 24,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                }}
              />
              <Typography.Title
                level={2}
                style={{ color: "white", marginBottom: 8 }}
              >
                You're Invited to Join a Team
              </Typography.Title>
              <Typography.Paragraph
                style={{ color: "#d1d5db", fontSize: "16px" }}
              >
                <b>{invitationDetails.inviter_name}</b> has invited you to join
                their team on ClassEasily.
              </Typography.Paragraph>
            </ContainerHeader>

            <InfoGrid>
              <InfoRow>
                <Building size={20} />
                <Typography.Text style={{ color: "#d1d5db" }}>
                  Business:
                </Typography.Text>
                <Typography.Text
                  strong
                  style={{ color: "white", marginLeft: "auto" }}
                >
                  {invitationDetails.business_name}
                </Typography.Text>
              </InfoRow>
              <InfoRow>
                <UserCheck size={20} />
                <Typography.Text style={{ color: "#d1d5db" }}>
                  Your Role:
                </Typography.Text>
                <Typography.Text
                  strong
                  style={{ color: "white", marginLeft: "auto" }}
                >
                  {invitationDetails.role_name}
                </Typography.Text>
              </InfoRow>
              <InfoRow>
                <Mail size={20} />
                <Typography.Text style={{ color: "#d1d5db" }}>
                  Invited Email:
                </Typography.Text>
                <Typography.Text
                  strong
                  style={{ color: "white", marginLeft: "auto" }}
                >
                  {invitationDetails.invited_email}
                </Typography.Text>
              </InfoRow>
            </InfoGrid>

            <Typography.Paragraph style={{ color: "#d1d5db", marginTop: 32 }}>
              To accept, please log in or create an account with the email
              address above.
            </Typography.Paragraph>

            <ButtonGroup>
              <Button type="primary" size="large" onClick={handleLogin}>
                Log In / Register to Accept <ArrowRight size={16} />
              </Button>
            </ButtonGroup>
          </InvitationCard>
        </AnimatePresence>
      );
    }
    return null;
  };

  return (
    <>
      <Header />
      <PageContainer>
        <BackgroundMedia>
          {!isMobile && isMounted && (
            <VideoBackground
              autoPlay
              loop
              muted
              playsInline
              poster="/assets/videos/1.png"
            >
              <source src="/assets/videos/Classes.mp4" type="video/mp4" />
            </VideoBackground>
          )}
          <ImageBackground />
        </BackgroundMedia>
        {renderContent()}
      </PageContainer>
      <Footer />
    </>
  );
}

export default function JoinBusinessPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
          }}
        >
          <GlobalLoaderWithoutInlineStyles />
        </div>
      }
    >
      <JoinBusinessContent />
    </Suspense>
  );
}
