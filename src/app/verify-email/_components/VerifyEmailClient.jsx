"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Result, Button, ConfigProvider } from "antd";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import confetti from "canvas-confetti";
import axiosInstance from "@/lib/axiosInstance";
import { useAuthModal } from "@/context/AuthContext";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";
import { theme } from "@/components/theme";

const StyledVerifyPageContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 20px;
`;

const StyledResultWrapper = styled.div`
  background-color: #ffffff;
  padding: 40px 50px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  text-align: center;
  max-width: 550px;
  width: 100%;
`;

export default function VerifyEmailClient({ verificationKey }) {
  const router = useRouter();
  const { openLoginModal } = useAuthModal();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!verificationKey) {
        setError("Invalid verification link. No key provided.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      setSuccess(false);
      try {
        const verificationUrl = "/auth/registration/verify-email/";
        const response = await axiosInstance.post(verificationUrl, {
          key: verificationKey,
        });
        if (response.status === 200 && response.data?.detail === "ok") {
          setSuccess(true);
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
            scalar: 0.9,
            drift: 0.1,
            ticks: 300,
            gravity: 0.8,
          });
        } else {
          setError(
            response.data?.detail ||
              "Email verification failed. The link might be invalid or already used."
          );
        }
      } catch (err) {
        console.error(
          "Verification API error:",
          err.response?.data || err.message
        );
        let errorMessage = "An error occurred during verification.";
        if (err.response?.data?.detail) {
          errorMessage = `Verification failed: ${err.response.data.detail}`;
        } else if (
          err.response?.status === 404 ||
          err.response?.status === 400
        ) {
          errorMessage =
            "Email verification failed. The link might be expired, invalid, or already used.";
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    verifyEmail();
  }, [verificationKey]);

  const handleLoginSuccessAndRedirect = () => {
    console.log("Login successful from VerifyEmailPage, redirecting to /");
    router.push("/");
  };

  const handleGoToLogin = () => {
    openLoginModal(handleLoginSuccessAndRedirect);
  };

  const renderContent = () => {
    if (loading) {
      return <GlobalLoaderWithoutInlineStyles />;
    }
    if (success) {
      return (
        <StyledResultWrapper>
          <Result
            status="success"
            icon={<CheckCircleFilled />}
            title="Email Verified Successfully!"
            subTitle="Your account is now active and ready to use. Welcome aboard!"
            extra={[
              <Button type="primary" key="login" onClick={handleGoToLogin}>
                Go to Login
              </Button>,
            ]}
          />
        </StyledResultWrapper>
      );
    }
    return (
      <StyledResultWrapper>
        <Result
          status="error"
          icon={<CloseCircleFilled />}
          title="Email Verification Failed"
          subTitle={
            error ||
            "Could not verify your email. Please check the link or contact support."
          }
          extra={[
            <Button type="primary" key="login" onClick={handleGoToLogin}>
              Go to Login
            </Button>,
          ]}
        />
      </StyledResultWrapper>
    );
  };

  return (
    <ConfigProvider theme={theme}>
      <StyledVerifyPageContainer>{renderContent()}</StyledVerifyPageContainer>
    </ConfigProvider>
  );
}
