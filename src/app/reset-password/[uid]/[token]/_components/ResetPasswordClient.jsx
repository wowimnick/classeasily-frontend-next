"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import { Form, Input, Button, Result, ConfigProvider, Alert } from "antd";
import { Lock, DoorClosed, CheckCheck } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { API_ENDPOINTS } from "@/services/apiService";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";
import { useAuthModal } from "@/context/AuthContext";
import FooterClient from "@/components/homepage/FooterClient";
import ExploreHeader from "@/components/explore/ExploreHeader";

const theme = {
  token: {
    colorPrimary: "#ff385c",
    colorLink: "#ff385c",
    colorPrimaryHover: "#ff1447",
    borderRadius: 12,
    controlHeight: 48,
    fontFamily: "'Proxima Soft', sans-serif",
    colorSuccess: "#00A699",
    colorError: "#FF5A5F",
    colorWarning: "#FFB400",
  },
};

const PageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 60px 20px;
`;

const ContentBox = styled.div`
  background-color: #fff;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.07);
  width: 100%;
  max-width: 650px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #484848;
  margin-bottom: 0.5rem;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #767676;
  text-align: center;
  margin-bottom: 2rem;
`;

const StyledForm = styled(Form)`
  .ant-form-item {
    margin-bottom: 1rem;
  }

  .ant-form-item-has-error + .ant-form-item {
    margin-bottom: 1.5rem;
  }
  .ant-form-item:last-child {
    margin-bottom: 0;
  }

  .ant-input-affix-wrapper,
  .ant-input-password {
    padding: 0 11px;
    height: 48px;
    border-radius: 12px;
    border: 1px solid #e8e8e8;
    font-size: 14px;

    &:hover,
    &.ant-input-affix-wrapper-focused,
    &.ant-input-password-focused {
      border-color: #ff385c;
      box-shadow: 0 0 0 2px rgba(255, 56, 92, 0.1);
    }

    .ant-input {
      height: 46px;
      line-height: 46px;
      font-size: 14px;
      padding-left: 0;
    }

    .ant-input-prefix {
      margin-right: 8px;
      height: 46px;
      display: flex;
      align-items: center;
    }
  }
  .ant-btn-primary {
    height: 48px;
    font-size: 16px;
    font-weight: 600;
  }
  .ant-btn {
    border-radius: 12px;
  }
`;

const IconWrapper = styled.span`
  color: #999;
  display: flex;
  align-items: center;
`;

const ErrorMessage = styled(Alert)`
  margin-bottom: 1rem;
  border-radius: 8px;
  text-align: left;

  .ant-alert-message {
    font-size: 14px;
  }
`;

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`;

export default function ResetPasswordClient({ uid, token }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [linkSeemsValid, setLinkSeemsValid] = useState(true);
  const { openLoginModal } = useAuthModal();

  useEffect(() => {
    if (!uid || !token) {
      setError(
        "This password reset link is incomplete or invalid. Please request a new one."
      );
      setLinkSeemsValid(false);
    }
  }, [uid, token]);

  const handleConfirmReset = async (values) => {
    setError("");
    setLoading(true);

    const payload = {
      uid,
      token,
      new_password1: values.password1,
      new_password2: values.password2,
    };

    try {
      await axiosInstance.post(API_ENDPOINTS.PASSWORD_RESET_CONFIRM, payload);
      setSuccess(true);
    } catch (err) {
      console.error(
        "Password reset confirmation error:",
        err.response?.data || err.message
      );
      let errorMessage =
        "Failed to reset password. The link may be invalid/expired, or the new password doesn't meet requirements.";
      if (err.response?.data) {
        const data = err.response.data;
        if (data.new_password2 && Array.isArray(data.new_password2)) {
          errorMessage = `Password Error: ${data.new_password2.join(" ")}`;
        } else if (data.new_password1 && Array.isArray(data.new_password1)) {
          errorMessage = `Password Error: ${data.new_password1.join(" ")}`;
        } else if (data.password2 && Array.isArray(data.password2)) {
          errorMessage = `Password Error: ${data.password2.join(" ")}`;
        } else if (data.password1 && Array.isArray(data.password1)) {
          errorMessage = `Password Error: ${data.password1.join(" ")}`;
        } else if (data.token && Array.isArray(data.token)) {
          errorMessage = "This password reset link is invalid or has expired.";
        } else if (data.uid && Array.isArray(data.uid)) {
          errorMessage = "Invalid user identifier in link.";
        } else if (data.detail) {
          errorMessage = data.detail;
        } else {
          try {
            errorMessage = JSON.stringify(data);
          } catch {
            /* ignore */
          }
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <ConfigProvider theme={theme}>
        <ExploreHeader />
        <PageWrapper>
          <ContentBox>
            <Result
              status="success"
              icon={
                <CheckCheck
                  size={72}
                  style={{ color: theme.token.colorSuccess }}
                />
              }
              title="Password Reset Successful!"
              subTitle="You can now log in using your new password."
              style={{ fontWeight: 600 }}
              extra={[
                <Button type="primary" key="login" onClick={openLoginModal}>
                  Go to Login
                </Button>,
              ]}
            />
          </ContentBox>
        </PageWrapper>
        <Footer />
      </ConfigProvider>
    );
  }

  if (!linkSeemsValid) {
    return (
      <ConfigProvider theme={theme}>
        <ExploreHeader />
        <PageWrapper>
          <ContentBox>
            <Result
              status="error"
              icon={
                <DoorClosed
                  size={72}
                  style={{ color: theme.token.colorError }}
                />
              }
              title="Invalid Link"
              subTitle={error}
              extra={[
                <Button type="primary" key="login" onClick={openLoginModal}>
                  Back to Login
                </Button>,
              ]}
            />
          </ContentBox>
        </PageWrapper>
        <Footer />
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={theme}>
      <ExploreHeader />
      <PageWrapper>
        <ContentBox>
          <Title>Set New Password</Title>
          <Subtitle>Choose a strong new password for your account.</Subtitle>

          {error && <ErrorMessage message={error} type="error" showIcon />}

          {loading ? (
            <LoadingWrapper>
              <GlobalLoaderWithoutInlineStyles />
            </LoadingWrapper>
          ) : (
            <StyledForm
              form={form}
              onFinish={handleConfirmReset}
              layout="vertical"
              autoComplete="off"
            >
              <Form.Item
                name="password1"
                label="New Password"
                rules={[
                  { required: true, message: "Please enter a new password" },
                  { min: 8, message: "Password must be at least 8 characters" },
                  {
                    pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
                    message: "Must include letters and numbers",
                  },
                ]}
                hasFeedback
              >
                <Input.Password
                  prefix={
                    <IconWrapper>
                      <Lock size={18} />
                    </IconWrapper>
                  }
                  placeholder="Enter new password"
                  size="large"
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item
                name="password2"
                label="Confirm New Password"
                dependencies={["password1"]}
                rules={[
                  {
                    required: true,
                    message: "Please confirm your new password",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password1") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error(
                          "The two passwords that you entered do not match!"
                        )
                      );
                    },
                  }),
                ]}
                hasFeedback
              >
                <Input.Password
                  prefix={
                    <IconWrapper>
                      <Lock size={18} />
                    </IconWrapper>
                  }
                  placeholder="Confirm new password"
                  size="large"
                  autoComplete="new-password"
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                style={{ marginTop: "1rem" }}
              >
                Reset Password
              </Button>

              <div
                style={{
                  textAlign: "center",
                  marginTop: "1.5rem",
                  fontSize: "14px",
                }}
              >
                <Button
                  type="link"
                  onClick={openLoginModal}
                  style={{ color: "#767676", padding: 0 }}
                >
                  Back to Login
                </Button>
              </div>
            </StyledForm>
          )}
        </ContentBox>
      </PageWrapper>

      <FooterClient />
    </ConfigProvider>
  );
}
