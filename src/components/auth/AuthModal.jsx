"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useLayoutEffect,
} from "react";
import styled from "styled-components";
import { Modal, Form, Input, Button, Steps, ConfigProvider, Alert } from "antd";
import message from "@/lib/message";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Phone, ArrowLeft, ArrowRight } from "lucide-react";
import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import dynamic from "next/dynamic";
import { Drawer } from "vaul";
import { VAUL_OVERLAY_BACKDROP_BLUR } from "@/lib/vaulOverlayBlur";
import { useRouter } from "next/navigation";

// Better Auth imports
import {
  signInWithDjango,
  signUpWithDjango,
  signInWithGoogle,
  signOutFull,
} from "@/lib/auth-client";

// Load Google OAuth only when modal is visible
const GoogleOAuthWrapper = dynamic(() => import("./GoogleOAuthWrapper"), {
  ssr: false,
  loading: () => null,
});

import axiosInstance from "@/lib/axiosInstance";
import { theme } from "@/components/theme";

const { Step } = Steps;

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
      <div ref={ref}>
        <div style={{ border: "1px solid transparent", margin: "-1px" }}>
          {children}
        </div>
      </div>
    </motion.div>
  );
};

const DesktopModalContent = styled(motion.div)`
  padding: 1.5rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

// Vaul Drawer Styles
const StyledDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
  ${VAUL_OVERLAY_BACKDROP_BLUR}
`;

const StyledDrawerContent = styled(Drawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  height: auto;
  max-height: 90vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
  padding-bottom: env(safe-area-inset-bottom);
`;

const DrawerHandle = styled.div`
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

const DrawerBody = styled.div`
  width: 100%;
  overflow-y: auto;
  padding: 1.5rem;
  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #484848;
  text-align: center;
  margin-bottom: 0.5rem;
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #767676;
  text-align: center;
  margin: 0 0 2rem;
  @media (max-width: 768px) {
    font-size: 14px;
    margin-bottom: 1.5rem;
  }
`;

const StyledForm = styled(Form)`
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
    font-size: 16px !important;

    &:hover,
    &.ant-input-affix-wrapper-focused,
    &.ant-input-password-focused,
    &:focus {
      border-color: #ff385c;
      box-shadow: 0 0 0 2px rgba(255, 56, 92, 0.1);
    }
  }
  .ant-input-affix-wrapper > input.ant-input {
    font-size: 16px !important;
    height: 100%;
  }
  @media (max-width: 768px) {
    .ant-input-affix-wrapper,
    .ant-input-password,
    .ant-input {
      height: 44px !important;
    }
  }
`;

const OrDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
  color: #767676;
  font-size: 14px;
  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #e8e8e8;
  }
  span {
    padding: 0 1rem;
  }
`;

const ErrorMessage = styled(Alert)`
  margin: 1rem 0;
  border-radius: 8px;
`;

const ForgotPasswordLink = styled.button`
  background: none;
  border: none;
  color: #767676;
  font-size: 14px;
  cursor: pointer;
  padding: 5px 0;
  margin: -0.5rem 0 1rem auto;
  display: block;
  &:hover {
    color: #ff385c;
    text-decoration: underline;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: ${(props) =>
    props.$singleButton ? "flex-end" : "space-between"};
  gap: 1rem;
  margin-top: 1.5rem;
`;

const ToggleText = styled.p`
  text-align: center;
  margin-top: 1.5rem;
  color: #767676;
  font-size: 14px;
  button {
    color: #ff385c;
    background: none;
    border: none;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    margin-left: 4px;
    &:hover {
      text-decoration: underline;
    }
  }
`;

const IconWrapper = styled.span`
  color: #999;
  display: flex;
  align-items: center;
`;

const StyledSteps = styled(Steps)`
  margin-bottom: 2rem;
  @media (max-width: 768px) {
    display: none;
  }
`;

// Forgot Password Component
const ForgotPasswordForm = ({ onSwitchToLogin, formInstance }) => {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [apiError, setApiError] = useState("");

  const handleRequestReset = async (values) => {
    setLoading(true);
    setSuccessMessage("");
    setApiError("");
    try {
      await axiosInstance.post("/auth/password/reset/", {
        email: values.email,
      });
      setSuccessMessage(
        "If an account with that email exists, a password reset link has been sent."
      );
      formInstance.resetFields();
    } catch (error) {
      setApiError(error.response?.data?.detail || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Title>Reset Password</Title>
      <Subtitle>Enter your email to receive reset instructions.</Subtitle>
      {successMessage && (
        <Alert
          message={successMessage}
          type="success"
          showIcon
          style={{ marginBottom: "1rem" }}
        />
      )}
      {apiError && (
        <Alert
          message={apiError}
          type="error"
          showIcon
          style={{ marginBottom: "1rem" }}
        />
      )}
      <StyledForm
        form={formInstance}
        onFinish={handleRequestReset}
        layout="vertical"
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: "Email required" },
            { type: "email", message: "Invalid email" },
          ]}
        >
          <Input
            prefix={
              <IconWrapper>
                <Mail size={18} />
              </IconWrapper>
            }
            placeholder="Your registered email"
            size="large"
            disabled={!!successMessage || loading}
          />
        </Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={loading}
          disabled={!!successMessage}
          key={`btn-${loading}`}
        >
          Send Reset Link
        </Button>
      </StyledForm>
      <ToggleText>
        Remembered your password?{" "}
        <button type="button" onClick={onSwitchToLogin}>
          Sign in
        </button>
      </ToggleText>
    </>
  );
};

// Main AuthModal Component
const AuthModal = ({
  visible,
  onClose,
  defaultMode = "login",
  onLoginSuccessAction,
  onModeChange,
}) => {
  const router = useRouter();
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [forgotPasswordForm] = Form.useForm();

  const [modalView, setModalView] = useState(defaultMode);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  const browserTimezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    []
  );

  const handleModeSwitch = (newMode) => {
    setModalView(newMode);
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const steps = [
    { title: "Account", icon: <Lock size={16} /> },
    { title: "Personal Details", icon: <User size={16} /> },
  ];

  useEffect(() => {
    if (visible) {
      setModalView(defaultMode);
      setCurrentStep(0);
      setFormData({});
      setError("");
      registerForm.resetFields();
      loginForm.resetFields();
    }
  }, [visible, defaultMode, registerForm, loginForm]);

  const handleLogin = async (values) => {
    setError("");
    setLoading(true);
    try {
      await signInWithDjango(values.email, values.password, router);

      message.success("Welcome back!");


      // PostHog: Identify user and capture login event
      posthog.identify(values.email, {
        email: values.email,
      });
      posthog.capture("user_logged_in", {
        method: "email",
      });

      if (typeof window !== "undefined") {
        localStorage.removeItem("prefillEmailForRegistration");
      }

      if (typeof onLoginSuccessAction === "function") {
        onLoginSuccessAction();
      }

      onClose();
    } catch (err) {
      Sentry.captureException(err);
      setError(err.message || "Incorrect email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async (tokenResponse) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("prefillEmailForRegistration");
    }

    const accessToken = tokenResponse?.access_token;
    if (!accessToken) {
      console.error("[Google Auth] No access_token in response:", tokenResponse);
      setError("Google sign-in did not return a token. Try again or use email.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signInWithGoogle(accessToken, router);

      message.success("Welcome!");


      // PostHog: Capture Google login event (identify happens server-side with Google data)
      posthog.capture("user_logged_in", {
        method: "google",
      });

      if (typeof onLoginSuccessAction === "function") {
        onLoginSuccessAction();
      }

      onClose();
    } catch (err) {
      console.error("Google auth error:", err);
      Sentry.captureException(err);
      setError("Google Login Failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Step Navigation & Registration Logic ---

  const handleNextStep = async () => {
    try {
      // Explicitly validate ONLY step 0 fields
      const values = await registerForm.validateFields([
        "email",
        "password",
        "confirmPassword",
      ]);

      setFormData((prev) => ({ ...prev, ...values }));
      setCurrentStep(1);
      setError(""); // Clear previous errors
    } catch (error) {
      // Validation failed - Ant Design handles UI highlights automatically
    }
  };

  const handleRegister = async () => {
    setError("");

    try {
      // Explicitly validate Step 1 fields before submission
      const values = await registerForm.validateFields([
        "firstName",
        "lastName",
        "phone",
      ]);

      const currentFormData = { ...formData, ...values };
      setLoading(true);

      const payload = {
        email: currentFormData.email,
        password1: currentFormData.password,
        password2: currentFormData.confirmPassword,
        first_name: currentFormData.firstName,
        last_name: currentFormData.lastName,
        phone_number: currentFormData.phone,
        user_timezone: browserTimezone,
      };

      await signUpWithDjango(payload);

      // Auto-login after registration
      await signInWithDjango(
        currentFormData.email,
        currentFormData.password,
        router
      );


      // PostHog: Identify new user and capture signup event
      posthog.identify(currentFormData.email, {
        email: currentFormData.email,
        first_name: currentFormData.firstName,
        last_name: currentFormData.lastName,
        phone: currentFormData.phone,
        timezone: browserTimezone,
      });
      posthog.capture("user_signed_up", {
        method: "email",
      });

      message.success("Account created! Please check your email to verify.", 6);

      if (typeof window !== "undefined") {
        localStorage.removeItem("prefillEmailForRegistration");
      }

      onClose();
      setCurrentStep(0);
      setFormData({});
      registerForm.resetFields();
    } catch (errorInfo) {
      // Handle Validation Errors
      if (errorInfo.errorFields) {
        // This is a client-side validation error, Ant Design handles it.
        return;
      }

      // Handle Backend API Errors
      const errorData = errorInfo; // Assuming this is the rejected payload
      let globalErrorMsg = "";

      if (errorData && typeof errorData === "object") {
        // Map backend snake_case keys to frontend form camelCase names
        const fieldMap = {
          first_name: "firstName",
          last_name: "lastName",
          phone_number: "phone",
          email: "email",
          password: "password", // or 'password1' if backend sends that
        };

        const fieldErrors = [];
        let hasFieldErrors = false;

        Object.keys(errorData).forEach((key) => {
          const fieldName = fieldMap[key] || key;
          const errorMsg = Array.isArray(errorData[key])
            ? errorData[key].join(" ")
            : errorData[key];

          // If the key maps to a form field, set it on the form
          if (
            ["firstName", "lastName", "phone", "email", "password"].includes(
              fieldName
            )
          ) {
            fieldErrors.push({
              name: fieldName,
              errors: [errorMsg],
            });
            hasFieldErrors = true;
          } else if (key === "detail" || key === "non_field_errors") {
            globalErrorMsg = errorMsg;
          }
        });

        if (fieldErrors.length > 0) {
          registerForm.setFields(fieldErrors);
          // If the error is on Step 1 (email/password) but we are on Step 2, go back?
          // Usually step 1 fields are validated before step 2, but duplicate email checks happen at submit.
          const hasStep0Error = fieldErrors.some((f) =>
            ["email", "password"].includes(f.name)
          );
          if (hasStep0Error) {
            setCurrentStep(0);
            globalErrorMsg = "Please correct the errors in the previous step.";
          }
        }

        if (!hasFieldErrors && !globalErrorMsg) {
          // Fallback if we couldn't map anything
          globalErrorMsg = "Registration failed. Please try again.";
        }
      } else if (typeof errorData === "string") {
        globalErrorMsg = errorData;
      } else {
        globalErrorMsg = "An unexpected error occurred.";
      }

      if (globalErrorMsg) {
        setError(globalErrorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderLoginForm = () => (
    <>
      <Title>Welcome back</Title>
      <Subtitle>Sign in to continue</Subtitle>
      <StyledForm form={loginForm} onFinish={handleLogin}>
        <Form.Item
          name="email"
          rules={[
            { required: true, message: "Email required" },
            { type: "email", message: "Invalid email" },
          ]}
        >
          <Input
            prefix={
              <IconWrapper>
                <Mail size={18} />
              </IconWrapper>
            }
            placeholder="Email"
            size="large"
            autoComplete="email"
          />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: "Password required" }]}
        >
          <Input.Password
            prefix={
              <IconWrapper>
                <Lock size={18} />
              </IconWrapper>
            }
            placeholder="Password"
            size="large"
            autoComplete="current-password"
          />
        </Form.Item>
        {error && <ErrorMessage message={error} type="error" showIcon />}
        <ForgotPasswordLink
          type="button"
          onClick={(e) => {
            e.preventDefault();
            handleModeSwitch("forgotPassword");
          }}
        >
          Forgot password?
        </ForgotPasswordLink>
        <Button
          key={`btn-${loading}`}
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={Boolean(loading)}
        >
          Sign in
        </Button>
      </StyledForm>
      <OrDivider>
        <span>or continue with</span>
      </OrDivider>
      <GoogleOAuthWrapper
        onSuccess={handleGoogleAuth}
        onError={() => setError("Google login failed.")}
        disabled={loading}
      />
      <ToggleText>
        Don't have an account?{" "}
        <button type="button" onClick={() => handleModeSwitch("register")}>
          Sign up
        </button>
      </ToggleText>
    </>
  );

  const renderRegisterForm = () => (
    <>
      <Title>Create an account</Title>
      <Subtitle>Join our community today</Subtitle>

      {!isMobile && (
        <StyledSteps current={currentStep} size="small">
          {steps.map((item) => (
            <Step key={item.title} title={item.title} icon={item.icon} />
          ))}
        </StyledSteps>
      )}

      {/* Note: We do NOT put onFinish here because we handle steps manually with buttons */}
      <StyledForm
        form={registerForm}
        layout="vertical"
        initialValues={formData}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {currentStep === 0 && (
              <>
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: "Email is required" },
                    { type: "email", message: "Enter a valid email" },
                  ]}
                >
                  <Input
                    prefix={
                      <IconWrapper>
                        <Mail size={18} />
                      </IconWrapper>
                    }
                    placeholder="Email"
                    size="large"
                    autoComplete="email"
                  />
                </Form.Item>
                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: "Password is required" },
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
                    placeholder="Password"
                    size="large"
                    autoComplete="new-password"
                  />
                </Form.Item>
                <Form.Item
                  name="confirmPassword"
                  dependencies={["password"]}
                  rules={[
                    { required: true, message: "Please confirm your password" },
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
                    size="large"
                    autoComplete="new-password"
                  />
                </Form.Item>
              </>
            )}
            {currentStep === 1 && (
              <>
                <Form.Item
                  name="firstName"
                  rules={[
                    { required: true, message: "First name is required" },
                  ]}
                >
                  <Input
                    prefix={
                      <IconWrapper>
                        <User size={18} />
                      </IconWrapper>
                    }
                    placeholder="First Name"
                    size="large"
                    autoComplete="given-name"
                  />
                </Form.Item>
                <Form.Item
                  name="lastName"
                  rules={[{ required: true, message: "Last name is required" }]}
                >
                  <Input
                    prefix={
                      <IconWrapper>
                        <User size={18} />
                      </IconWrapper>
                    }
                    placeholder="Last Name"
                    size="large"
                    autoComplete="family-name"
                  />
                </Form.Item>
                <Form.Item
                  name="phone"
                  rules={[
                    { required: true, message: "Phone number is required" },
                    {
                      pattern: /^[\d\s().+-xX]{7,25}$/,
                      message: "Invalid phone format",
                    },
                  ]}
                >
                  <Input
                    prefix={
                      <IconWrapper>
                        <Phone size={18} />
                      </IconWrapper>
                    }
                    placeholder="Phone"
                    size="large"
                    autoComplete="tel"
                  />
                </Form.Item>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Only show generic errors that don't belong to a specific field */}
        {error && <ErrorMessage message={error} type="error" showIcon />}

        <ButtonGroup $singleButton={currentStep === 0}>
          {currentStep > 0 && (
            <Button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              icon={<ArrowLeft size={16} />}
              disabled={loading}
            >
              Back
            </Button>
          )}
          <Button
            type="primary"
            // Use specific handlers for Next vs Submit to ensure proper scoped validation
            onClick={
              currentStep === steps.length - 1 ? handleRegister : handleNextStep
            }
            loading={loading}
            icon={
              currentStep < steps.length - 1 ? <ArrowRight size={16} /> : null
            }
            iconPosition="end"
            key={`btn-${loading}`}
          >
            {currentStep === steps.length - 1 ? "Create Account" : "Next"}
          </Button>
        </ButtonGroup>
      </StyledForm>
      {currentStep === 0 && (
        <>
          <OrDivider>
            <span>or continue with</span>
          </OrDivider>
          <GoogleOAuthWrapper
            onSuccess={handleGoogleAuth}
            onError={() => setError("Google login failed.")}
            disabled={loading}
          />
        </>
      )}
      <ToggleText>
        Already have an account?{" "}
        <button type="button" onClick={() => handleModeSwitch("login")}>
          Sign in
        </button>
      </ToggleText>
    </>
  );

  const renderContent = () => {
    if (modalView === "login") return renderLoginForm();
    if (modalView === "register") return renderRegisterForm();
    if (modalView === "forgotPassword") {
      return (
        <ForgotPasswordForm
          onSwitchToLogin={() => handleModeSwitch("login")}
          formInstance={forgotPasswordForm}
        />
      );
    }
  };

  if (!mounted) return null;

  if (isMobile) {
    return (
      <ConfigProvider theme={theme}>
        <Drawer.Root
          open={visible}
          onOpenChange={(open) => !open && onClose()}
          repositionInputs={false}
        >
          <Drawer.Portal>
            <StyledDrawerOverlay />
            <StyledDrawerContent>
              <DrawerHandle />
              <DrawerBody>
                <AnimatedModalContent>{renderContent()}</AnimatedModalContent>
              </DrawerBody>
            </StyledDrawerContent>
          </Drawer.Portal>
        </Drawer.Root>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={theme}>
      <Modal
        open={visible}
        onCancel={onClose}
        width={500}
        footer={null}
        centered
        maskClosable={!loading}
        styles={{
          body: { padding: 0 },
          content: { borderRadius: "24px", overflow: "hidden" },
        }}
      >
        <AnimatedModalContent>
          <DesktopModalContent>{renderContent()}</DesktopModalContent>
        </AnimatedModalContent>
      </Modal>
    </ConfigProvider>
  );
};

export default AuthModal;
