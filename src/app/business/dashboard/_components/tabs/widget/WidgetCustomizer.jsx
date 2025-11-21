"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import styled, { keyframes } from "styled-components";
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  Select,
  Button,
  ColorPicker,
  Tooltip,
  Skeleton,
  Tabs,
  Typography,
  Alert,
  ConfigProvider,
  Modal,
  Menu,
  Divider,
} from "antd";
import message from "@/lib/message";
import {
  Copy,
  Code,
  Eye,
  Palette,
  Layout as LayoutIcon,
  Shield,
  BookOpen,
  WholeWord,
  ArrowLeft,
  Settings,
  Zap,
  CreditCard,
  Info,
} from "lucide-react";
import { theme } from "@/components/theme";
import { LordIcon } from "@/services/ReactUtils";
import { businessService } from "@/services/apiService";

const { Title, Paragraph, Text } = Typography;

// =============================================================================
// --- CONFIGURATION & CONSTANTS ---
// =============================================================================

const WIDGET_SCRIPT_URL = process.env.NEXT_PUBLIC_WIDGET_SCRIPT_URL;
const THEME_COLOR = "#ff385c";

const PRESETS = {
  default: {
    primary: "rgba(255, 56, 92, 1)",
    background: "rgba(248, 250, 252, 1)",
    cardBackground: "rgba(255, 255, 255, 1)",
    textPrimary: "rgba(51, 65, 85, 1)",
    textSecondary: "rgba(100, 116, 139, 1)",
    textOnPrimary: "rgba(255, 255, 255, 1)",
    border: "rgba(226, 232, 240, 1)",
  },
  corporate: {
    primary: "rgba(59, 130, 246, 1)",
    background: "rgba(243, 244, 246, 1)",
    cardBackground: "rgba(255, 255, 255, 1)",
    textPrimary: "rgba(17, 24, 39, 1)",
    textSecondary: "rgba(75, 85, 99, 1)",
    textOnPrimary: "rgba(255, 255, 255, 1)",
    border: "rgba(209, 213, 219, 1)",
  },
  playful: {
    primary: "rgba(16, 185, 129, 1)",
    background: "rgba(240, 253, 250, 1)",
    cardBackground: "rgba(255, 255, 255, 1)",
    textPrimary: "rgba(6, 78, 59, 1)",
    textSecondary: "rgba(4, 120, 87, 1)",
    textOnPrimary: "rgba(255, 255, 255, 1)",
    border: "rgba(110, 231, 183, 1)",
  },
};

const DEFAULT_CONFIG = {
  ...PRESETS.default,
  borderRadiusPreset: "large",
  layoutStyle: "comfortable",
  version: "normal",
  classLayout: "grid",
  densityPreset: "comfortable",
  buttonText: "Book Now",
  view: "inline",
  specificClassId: null,
  allowed_widget_origins: "",
};

const FONT_OPTIONS = [
  {
    label: "Proxima Soft (Default)",
    value:
      '"ProximaSoft", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  {
    label: "Inter",
    value:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  {
    label: "System Default",
    value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  { label: "Lato", value: '"Lato", sans-serif' },
  { label: "Montserrat", value: '"Montserrat", sans-serif' },
  { label: "Roboto", value: '"Roboto", sans-serif' },
];

const shimmerAnimation = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

// =============================================================================
// --- STYLED COMPONENTS (Existing & Intro Page) ---
// =============================================================================

const CustomizerWrapper = styled.div`
  padding: 0;
  background-color: #f8fafc;
  overflow-y: auto;
  height: -webkit-fill-available;
`;

const DashboardWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 16px;

  @media (min-width: 768px) {
    padding: 80px 24px;
  }
`;

const CustomizerViewWrapper = styled.div`
  padding: 12px;

  @media (min-width: 1406px) {
    padding: 24px;
  }
`;

const HeroSection = styled.div`
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
`;

const HeroTitle = styled(Title)`
  &&& {
    font-size: 48px;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 24px;
    color: #0a2540;
  }
`;

const HeroSubtitle = styled(Paragraph)`
  &&& {
    font-size: 20px;
    line-height: 1.5;
    color: #425466;
    margin-bottom: 40px;
  }
`;

const HeroButtons = styled.div`
  display: flex;
  gap: 16px;
  justify-content: flex-start;
  flex-wrap: wrap;
`;

const PrimaryButton = styled(Button)`
  &&& {
    background: ${THEME_COLOR};
    border: none;
    height: 48px;

    &:hover {
      background: #e63253;
    }
  }
`;

const FeatureWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const FeatureLordIconContainer = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f063;
  box-shadow: -1px 6px 10px 0px #18161629;

  margin-bottom: -40px; /* This is key for the overlap effect */
  position: relative;
  z-index: 1;
`;

const SecondaryButton = styled(Button)`
  &&& {
    background: transparent;
    border: 1px solid #e3e8ee;
    color: #425466;
    height: 48px;

    &:hover {
      background: #f6f9fc;
      border-color: #f7d4da;
    }
  }
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 350px;
  background: linear-gradient(135deg, #fff 0%, #fef0f2 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  color: ${THEME_COLOR};

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -50%;
    width: 200%;
    height: 1px;
    background: linear-gradient(90deg, transparent, #f7d4da, transparent);
    animation: ${shimmerAnimation} 4s infinite;
  }

  @media (max-width: 900px) {
    display: none;
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
  margin-top: 80px;

  @media (max-width: 900px) {
    display: none;
  }
`;

const FeatureCard = styled(Card)`
  &&& {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-radius: 16px;
    transition: all 0.3s ease;
    border: none;
    padding-top: 30px; /* Increased padding for the overlapping icon */
    width: 100%;

    .ant-card-body {
      padding-top: 0;
    }
  }
`;

const FeatureIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: ${(props) => props.bg || "#fef0f2"};
  color: ${(props) => props.color || THEME_COLOR};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

// =============================================================================
// --- STYLED COMPONENTS (New Customizer Layout) ---
// =============================================================================

const DesktopCustomizerLayout = styled.div`
  display: flex;
  gap: 24px;
  align-items: flex-start;
  height: calc(100vh - 150px);
`;

const SettingsPanel = styled.div`
  width: 100%;
  flex-shrink: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 16px;
  border: 1px solid #e6ebf1;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
  overflow: hidden;

  @media (min-width: 1406px) {
    max-width: 480px;
  }
`;

const PreviewPanel = styled.div`
  flex: 1 1 0;
  height: 100%;
  position: sticky;
  top: 24px;
  min-width: 0; /* Important for flexbox shrinking */
`;

const PreviewContainer = styled(Card)`
  display: flex;
  flex-direction: column;
  border: 1px solid #e6ebf1;
  border-radius: 16px;
  height: fit-content;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);

  .ant-card-body {
    flex-grow: 1;
    overflow: hidden; /* Hide scrollbars of the card itself */
    padding: 24px;
    display: flex;
    flex-direction: column;
  }
`;

const SettingsHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid #e6ebf1;
  flex-shrink: 0;
`;

const SettingsContent = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 24px;
`;

const SettingsFooter = styled.div`
  padding: 16px 24px;
  box-shadow: rgb(0 0 0 / 5%) 0px -20px 20px 0px;
  border-top: 1px solid #e6ebf1;
  background: #fafbfc;
  flex-shrink: 0;
  z-index: 3;
`;

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #0a2540;
`;

const CustomizerCard = styled(Card)`
  &&& {
    border: 1px solid #e6ebf1;
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    margin-bottom: 20px;
    background-color: #ffffff;

    .ant-card-body {
      padding: 20px;
    }
  }
`;

const CustomizerCardNoPadding = styled(Card)`
  &&& {
    border: 1px solid #e6ebf1;
    border-radius: 12px;
    margin-bottom: 20px;
    .ant-card-body {
      padding: 0;
    }
  }
`;

const FormSection = styled.div`
  .ant-form-item {
    margin-bottom: 16px;

    .ant-form-item-label > label {
      font-weight: 500;
      color: #374151;
      font-size: 13px;
    }
  }

  .ant-input,
  .ant-select-selector,
  .ant-input-number {
    border: 1px solid #d1d5db;
    &:hover {
      border-color: #9ca3af;
    }
  }
  .ant-switch.ant-switch-checked {
    background-color: ${THEME_COLOR};
  }
`;

const PreviewHeader = styled.div`
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #425466;
  font-weight: 500;
  font-size: 16px;
`;

const WidgetFrame = styled.div`
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 600px;
  border: 1px solid #e2e8f0;
  padding: 16px;
  width: 100%;
  height: 100%;
  flex-grow: 1;

  > div {
    height: 100%;
    width: 100%;
    background: #fff !important;
  }
`;

const ScalableWidgetWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow: hidden;
`;

const PreviewSkeleton = styled.div`
  height: 100%;
  flex-grow: 1;
  background: #f8fafc;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #e2e8f0;
  min-height: 600px;
`;

const CodeArea = styled.pre`
  background-color: #f6f9fc;
  padding: 24px;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier,
    monospace;
  font-size: 14px;
  color: #0a2540;
  border-top: 1px solid #e6ebf1;
`;

const SaveButton = styled(Button)`
  &&& {
    background: ${THEME_COLOR};
    border: none;
    width: 30%;
    &:hover {
      background: #e63253;
    }
  }
`;

const SaveStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${(props) => (props.$hasChanges ? "#f59e0b" : "#10b981")};
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;

  svg {
    animation: ${(props) =>
      props.$saving ? "spin 1s linear infinite" : "none"};
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const PresetButtonsContainer = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const MobilePreviewButton = styled(Button)`
  &&& {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    height: 48px;
    background: ${THEME_COLOR};
    border: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 8px;

    &:hover {
      background: #e63253;
    }
  }
`;

// =============================================================================
// --- HELPER COMPONENTS ---
// =============================================================================

const PreviewDisplay = ({
  loading,
  scriptLoaded,
  widgetContainerRef,
  config,
  widgetApiKey,
}) => {
  if (loading || !scriptLoaded || !widgetApiKey) {
    return (
      <PreviewSkeleton>
        <div
          style={{
            width: "100%",
            height: "100%",
            padding: "16px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            fontFamily: "system-ui, sans-serif",
            lineHeight: 1.5,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "16px",
              border: "1px solid #eaf0f6",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              display: "flex",
              flexDirection: "column",
              flex: 1,
              overflow: "hidden",
            }}
          >
            {/* Progress Bar */}
            <div style={{ padding: "24px 10%", position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  top: "35px",
                  left: "25%",
                  right: "25%",
                  height: "1px",
                  backgroundColor: "#e2e8f0",
                }}
              ></div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    zIndex: 1,
                    background: "#fff",
                    padding: "0 8px",
                  }}
                >
                  <div
                    style={{
                      height: "24px",
                      width: "24px",
                      borderRadius: "50%",
                      backgroundColor: "rgb(255, 56, 92)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    1
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#374151",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Select Date
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    zIndex: 1,
                    background: "#fff",
                    padding: "0 8px",
                  }}
                >
                  <div
                    style={{
                      height: "24px",
                      width: "24px",
                      borderRadius: "50%",
                      backgroundColor: "#e2e8f0",
                      color: "#64748b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    2
                  </div>
                  <div style={{ fontSize: "13px", color: "#9ca3af" }}>
                    Payment
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    zIndex: 1,
                    background: "#fff",
                    padding: "0 8px",
                  }}
                >
                  <div
                    style={{
                      height: "24px",
                      width: "24px",
                      borderRadius: "50%",
                      backgroundColor: "#e2e8f0",
                      color: "#64748b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    3
                  </div>
                  <div style={{ fontSize: "13px", color: "#9ca3af" }}>
                    Confirmation
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div
              style={{
                flex: 1,
                padding: "16px 32px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "24px",
              }}
            >
              {/* Title */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    height: "28px",
                    width: "180px",
                    borderRadius: "6px",
                    backgroundColor: "#e2e8f0",
                  }}
                ></div>
                <div
                  style={{
                    height: "16px",
                    width: "320px",
                    borderRadius: "4px",
                    backgroundColor: "#f1f5f9",
                  }}
                ></div>
              </div>
              {/* Cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "20px",
                  width: "100%",
                  alignSelf: "stretch",
                }}
              >
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      backgroundColor: "#fff",
                      borderRadius: "16px",
                      border: "1px solid #eaf0f6",
                      padding: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        paddingTop: "60%",
                        backgroundColor: "#f1f5f9",
                        borderRadius: "12px",
                      }}
                    ></div>
                    <div
                      style={{
                        height: "18px",
                        width: "60%",
                        borderRadius: "4px",
                        backgroundColor: "#e2e8f0",
                        marginTop: "4px",
                      }}
                    ></div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <div
                        style={{
                          height: "12px",
                          width: "100%",
                          borderRadius: "4px",
                          backgroundColor: "#f1f5f9",
                        }}
                      ></div>
                      <div
                        style={{
                          height: "12px",
                          width: "90%",
                          borderRadius: "4px",
                          backgroundColor: "#f1f5f9",
                        }}
                      ></div>
                      <div
                        style={{
                          height: "12px",
                          width: "95%",
                          borderRadius: "4px",
                          backgroundColor: "#f1f5f9",
                        }}
                      ></div>
                    </div>
                    <div
                      style={{
                        height: "16px",
                        width: "45%",
                        borderRadius: "4px",
                        backgroundColor: "rgba(255, 56, 92, 0.1)",
                        marginTop: "auto",
                      }}
                    ></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 24px",
                borderTop: "1px solid #eaf0f6",
                marginTop: "auto",
              }}
            >
              <div
                style={{
                  height: "40px",
                  width: "70px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              ></div>
              <div
                style={{
                  height: "40px",
                  width: "80px",
                  borderRadius: "8px",
                  backgroundColor: "rgb(255, 56, 92)",
                }}
              ></div>
            </div>
          </div>
        </div>
      </PreviewSkeleton>
    );
  }

  const containerStyle = {
    width: config.view === "inline" ? "100%" : "auto",
    height: config.view === "inline" ? "100%" : "auto",
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: config.background || "#f8fafc",
        padding: config.view === "modal" ? "24px" : "0",
        borderRadius: "12px",
      }}
    >
      <div ref={widgetContainerRef} style={containerStyle} />
      {config.view === "modal" && (
        <Paragraph
          type="secondary"
          style={{
            marginTop: "24px",
            textAlign: "center",
            maxWidth: "300px",
            fontSize: "13px",
          }}
        >
          This is a preview of the button your visitors will see. Clicking it
          opens the booking widget in a pop-up.
        </Paragraph>
      )}
    </div>
  );
};

// =============================================================================
// --- WIDGET DASHBOARD (INTRODUCTION VIEW) ---
// =============================================================================

const WidgetDashboard = ({ onCustomizeClick }) => (
  <DashboardWrapper>
    <Row gutter={[80, 40]} align="middle">
      <Col xs={24} md={12}>
        <HeroSection>
          <HeroTitle level={1}>
            Embed booking widgets anywhere on your website
          </HeroTitle>
          <HeroSubtitle>
            Turn website visitors into paying customers with our customizable
            booking widget. Works with any website builder and matches your
            brand perfectly.
          </HeroSubtitle>
          <HeroButtons>
            <PrimaryButton
              type="primary"
              size="middle"
              icon={<Settings size={18} />}
              onClick={onCustomizeClick}
            >
              Start customizing
            </PrimaryButton>
            <SecondaryButton size="middle" icon={<BookOpen size={18} />}>
              View documentation
            </SecondaryButton>
          </HeroButtons>
        </HeroSection>
      </Col>
      <Col xs={24} md={12}>
        <IconContainer>
          <LordIcon
            src="https://cdn.lordicon.com/zuitvaic.json"
            trigger="in"
            delay="1500"
            state="in-reveal"
            colors="primary:#ee6d66,secondary:#e83a30"
            style={{ width: "250px", height: "250px" }}
          />
        </IconContainer>
      </Col>
    </Row>

    <FeaturesGrid>
      <FeatureWrapper>
        {/* <FeatureLordIconContainer bg="linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)">
          <LordIcon
            src="https://cdn.lordicon.com/wsbmifnf.json" // A "zap" or "boost" icon
            trigger="in"
            colors="primary:#ee6d66,secondary:#f24c00"
            style={{ width: "50px", height: "50px" }}
          />
        </FeatureLordIconContainer> */}
        <FeatureCard>
          <Title level={4} style={{ marginTop: 0, marginBottom: "8px" }}>
            Easy Integration
          </Title>
          <Paragraph>
            Copy and paste a single line of code. No complex development needed.
          </Paragraph>
        </FeatureCard>
      </FeatureWrapper>

      <FeatureWrapper>
        {/* <FeatureLordIconContainer bg="linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)">
          <LordIcon
            src="https://cdn.lordicon.com/nwfpiryp.json"
            trigger="in"
            delay="1500"
            state="in-dynamic"
            style={{ width: "50px", height: "50px" }}
          />
        </FeatureLordIconContainer> */}
        <FeatureCard>
          <Title level={4} style={{ marginTop: 0, marginBottom: "8px" }}>
            Brand Customization
          </Title>
          <Paragraph>
            Control every aspect of your widget's appearance to ensure perfect
            brand alignment.
          </Paragraph>
        </FeatureCard>
      </FeatureWrapper>

      <FeatureWrapper>
        {/* <FeatureLordIconContainer bg="linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)">
          <LordIcon
            src="https://cdn.lordicon.com/cullmoil.json"
            trigger="in"
            colors="primary:#ebe6ef,secondary:#3a3347,tertiary:#ee6d66,quaternary:#ffc738"
            style={{ width: "50px", height: "50px" }}
          />
        </FeatureLordIconContainer> */}
        <FeatureCard>
          <Title level={4} style={{ marginTop: 0, marginBottom: "8px" }}>
            Secure Payments
          </Title>
          <Paragraph>
            Enterprise-grade security powered by Stripe. Give your customers
            confidence.
          </Paragraph>
        </FeatureCard>
      </FeatureWrapper>
    </FeaturesGrid>
  </DashboardWrapper>
);

// =============================================================================
// --- CUSTOMIZER VIEW ---
// =============================================================================

const CustomizerView = ({ onBack }) => {
  const [form] = Form.useForm();
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [businessClasses, setBusinessClasses] = useState([]);
  const [widgetApiKey, setWidgetApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1406 : false
  );
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [activeMenuKey, setActiveMenuKey] = useState("customize");
  const [widgetScale, setWidgetScale] = useState(1);

  const widgetContainerRef = useRef(null);
  const widgetInstanceRef = useRef(null);
  const draftSaveTimeoutRef = useRef(null);
  const colorChangeTimeoutRef = useRef(null);
  const previewPanelRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1406);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const scriptId = "classeasily-widget-script";
    if (document.getElementById(scriptId)) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = WIDGET_SCRIPT_URL;
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => message.error("Failed to load widget script.");
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const fetchBusinessData = async () => {
      setLoading(true);
      try {
        console.log("Here!");
        const response = await businessService.getWidgetConfig();
        if (response.success) {
          const {
            classes,
            config: savedConfig,
            widget_api_key,
          } = response.data;
          setWidgetApiKey(widget_api_key);
          const processedConfig = {
            ...savedConfig,
            allowed_widget_origins: Array.isArray(
              savedConfig.allowed_widget_origins
            )
              ? savedConfig.allowed_widget_origins.join("\n")
              : "",
          };
          const mergedConfig = { ...DEFAULT_CONFIG, ...processedConfig };
          mergedConfig.layoutStyle =
            mergedConfig.densityPreset === "compact"
              ? "compact"
              : "comfortable";
          setBusinessClasses(classes || []);
          form.setFieldsValue(mergedConfig);
          setConfig(mergedConfig);
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        message.error(error.message || "Could not load your settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchBusinessData();
  }, [form]);

  useEffect(() => {
    return () => {
      if (draftSaveTimeoutRef.current)
        clearTimeout(draftSaveTimeoutRef.current);
      if (colorChangeTimeoutRef.current)
        clearTimeout(colorChangeTimeoutRef.current);
    };
  }, []);

  const handleValuesChange = (changedValues, allValues) => {
    let newConfig = { ...config, ...allValues };
    if ("layoutStyle" in changedValues) {
      const isCompact = changedValues.layoutStyle === "compact";
      newConfig.version = isCompact ? "compact" : "normal";
      newConfig.classLayout = isCompact ? "list" : "grid";
      newConfig.densityPreset = isCompact ? "compact" : "comfortable";
      form.setFieldsValue({
        version: newConfig.version,
        classLayout: newConfig.classLayout,
        densityPreset: newConfig.densityPreset,
      });
    }
    Object.keys(newConfig).forEach((key) => {
      if (typeof newConfig[key] === "object" && newConfig[key]?.toRgbString) {
        newConfig[key] = newConfig[key].toRgbString();
      }
    });
    const isColorChange = Object.keys(changedValues).some((key) =>
      Object.keys(PRESETS.default).includes(key)
    );
    const updateState = (finalConfig) => {
      setConfig(finalConfig);
      setHasUnsavedChanges(true);
      saveDraftToLocalStorage(finalConfig);
    };
    if (isColorChange) {
      if (colorChangeTimeoutRef.current)
        clearTimeout(colorChangeTimeoutRef.current);
      colorChangeTimeoutRef.current = setTimeout(
        () => updateState(newConfig),
        300
      );
    } else {
      updateState(newConfig);
    }
  };

  const loadPreset = (presetName) => {
    const preset = PRESETS[presetName];
    if (!preset) return;
    const newConfig = { ...config, ...preset };
    setConfig(newConfig);
    form.setFieldsValue(newConfig);
    setHasUnsavedChanges(true);
    saveDraftToLocalStorage(newConfig);
  };

  const saveDraftToLocalStorage = (configToSave) => {
    if (draftSaveTimeoutRef.current) clearTimeout(draftSaveTimeoutRef.current);
    draftSaveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(
        "widget_customizer_draft",
        JSON.stringify(configToSave)
      );
    }, 100);
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      await form.validateFields();
      const response = await businessService.updateWidgetConfig({ ...config });
      if (response.success) {
        setHasUnsavedChanges(false);
        message.success("Widget settings saved successfully!");
        localStorage.removeItem("widget_customizer_draft");
      } else {
        throw new Error(response.error);
      }
    } catch (info) {
      message.error(
        info instanceof Error
          ? `Save failed: ${info.message}`
          : "Please correct the errors before saving."
      );
    } finally {
      setSaving(false);
    }
  };

  const {
    primary,
    background,
    cardBackground,
    textPrimary,
    textSecondary,
    textOnPrimary,
    border,
    fontFamily,
    version,
    classLayout,
    borderRadiusPreset,
    densityPreset,
    specificClassId,
    view,
    buttonText,
  } = config;

  const themeOverride = useMemo(
    () => ({
      colors: {
        primary,
        background,
        cardBackground,
        textPrimary,
        textSecondary,
        textOnPrimary,
        border,
      },
      ...(fontFamily && {
        typography: { fontFamily: { body: fontFamily, heading: fontFamily } },
      }),
    }),
    [
      primary,
      background,
      cardBackground,
      textPrimary,
      textSecondary,
      textOnPrimary,
      border,
      fontFamily,
    ]
  );

  const settingsOverride = useMemo(
    () => ({
      version,
      classLayout,
      borderRadiusPreset,
      densityPreset,
      aspectRatioPreset: "landscape",
    }),
    [version, classLayout, borderRadiusPreset, densityPreset]
  );

  useEffect(() => {
    const mountWidget = () => {
      if (
        scriptLoaded &&
        !loading &&
        widgetApiKey &&
        widgetContainerRef.current &&
        window.ClassEasilyWidget
      ) {
        if (widgetInstanceRef.current) widgetInstanceRef.current.unmount();
        widgetInstanceRef.current = window.ClassEasilyWidget.mount(
          widgetContainerRef.current,
          {
            widgetApiKey,
            themeOverride,
            settingsOverride,
            specificClassId,
            view,
            buttonText,
          }
        );
      }
    };
    const timer = setTimeout(
      mountWidget,
      isMobile && isPreviewModalVisible ? 50 : 0
    );
    return () => {
      clearTimeout(timer);
      if (widgetInstanceRef.current) {
        widgetInstanceRef.current.unmount();
        widgetInstanceRef.current = null;
      }
    };
  }, [
    scriptLoaded,
    loading,
    widgetApiKey,
    themeOverride,
    settingsOverride,
    specificClassId,
    view,
    buttonText,
    isMobile,
    isPreviewModalVisible,
  ]);

  const embedCode = useMemo(() => {
    if (!widgetApiKey) return "<!-- API Key is loading... -->";
    const dataAttrs = [
      'class="classeasily-widget"',
      `data-widget-api-key="${widgetApiKey}"`,
      `data-view="${view}"`,
      `data-text="${buttonText}"`,
      `data-theme='${JSON.stringify(themeOverride)}'`,
      `data-version="${settingsOverride.version}"`,
      `data-class-layout="${settingsOverride.classLayout}"`,
      `data-border-radius="${settingsOverride.borderRadiusPreset}"`,
      `data-density="${settingsOverride.densityPreset}"`,
    ];
    if (specificClassId) dataAttrs.push(`data-class-id="${specificClassId}"`);
    return `<div ${dataAttrs.join(
      " "
    )}></div>\n\n<script src="${WIDGET_SCRIPT_URL}" async defer></script>`;
  }, [
    view,
    buttonText,
    themeOverride,
    settingsOverride,
    specificClassId,
    widgetApiKey,
  ]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    message.success("Embed code copied to clipboard!");
  };

  const menuItems = [
    { key: "customize", icon: <Palette size={16} />, label: "Customize" },
    { key: "installation", icon: <Code size={16} />, label: "Installation" },
    { key: "security", icon: <Shield size={16} />, label: "Security" },
  ];

  const renderCustomizeContent = () => (
    <>
      <CustomizerCard>
        <SectionTitle>Theme Presets</SectionTitle>
        <PresetButtonsContainer>
          <Button onClick={() => loadPreset("default")}>Default</Button>
          <Button onClick={() => loadPreset("corporate")}>Corporate</Button>
          <Button onClick={() => loadPreset("playful")}>Playful</Button>
        </PresetButtonsContainer>
      </CustomizerCard>
      <CustomizerCard>
        <SectionTitle>Custom Colors</SectionTitle>
        <FormSection>
          <Row gutter={16}>
            <Col xs={12}>
              <Form.Item
                name="primary"
                label="Primary"
                tooltip="Main brand color for buttons and highlights."
              >
                <ColorPicker format="rgb" size="middle" />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item
                name="background"
                label="Background"
                tooltip="Background color for the entire widget."
              >
                <ColorPicker format="rgb" size="middle" />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item
                name="cardBackground"
                label="Card"
                tooltip="Background for content boxes."
              >
                <ColorPicker format="rgb" size="middle" />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item
                name="textPrimary"
                label="Primary Text"
                tooltip="Color for titles and headings."
              >
                <ColorPicker format="rgb" size="middle" />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item
                name="textSecondary"
                label="Secondary Text"
                tooltip="Color for descriptions and labels."
              >
                <ColorPicker format="rgb" size="middle" />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item
                name="textOnPrimary"
                label="Text on Primary"
                tooltip="Text color on top of the primary color."
              >
                <ColorPicker format="rgb" size="middle" />
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item
                name="border"
                label="Borders"
                tooltip="Color for separators and outlines."
              >
                <ColorPicker format="rgb" size="middle" />
              </Form.Item>
            </Col>
          </Row>
        </FormSection>
      </CustomizerCard>
      <CustomizerCard>
        <SectionTitle>Typography & Styling</SectionTitle>
        <FormSection>
          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item name="fontFamily" label="Font Family">
                <Select options={FONT_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="borderRadiusPreset" label="Border Radius">
                <Select
                  options={[
                    { value: "sharp", label: "Sharp (0px)" },
                    { value: "minimal", label: "Minimal (4px)" },
                    { value: "rounded", label: "Rounded (8px)" },
                    { value: "large", label: "Large (16px)" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </FormSection>
      </CustomizerCard>
      <CustomizerCard>
        <SectionTitle>Layout & Behavior</SectionTitle>
        <FormSection>
          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item name="layoutStyle" label="Layout Style">
                <Select
                  options={[
                    { value: "comfortable", label: "Comfortable" },
                    { value: "compact", label: "Compact" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="view" label="Display Mode">
                <Select
                  options={[
                    { value: "inline", label: "Inline" },
                    { value: "modal", label: "Modal Button" },
                  ]}
                />
              </Form.Item>
            </Col>
            {config.view === "modal" && (
              <Col xs={24} sm={12}>
                <Form.Item name="buttonText" label="Button Text">
                  <Input />
                </Form.Item>
              </Col>
            )}
            <Col span={24}>
              <Form.Item
                name="specificClassId"
                label="Feature a Specific Class (Optional)"
              >
                <Select
                  loading={loading}
                  placeholder="Show all classes by default"
                  allowClear
                >
                  {businessClasses.map((c) => (
                    <Select.Option key={c.classId} value={c.classId}>
                      {c.title}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </FormSection>
      </CustomizerCard>
    </>
  );

  const renderInstallationContent = () => (
    <>
      <CustomizerCardNoPadding
        title="Embed Code"
        extra={<Button icon={<Copy size={14} />} onClick={copyToClipboard} />}
      >
        <CodeArea>{embedCode}</CodeArea>
      </CustomizerCardNoPadding>
      <CustomizerCardNoPadding
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <BookOpen size={16} /> Installation Guide
          </div>
        }
      >
        <Tabs
          style={{ padding: "0 16px" }}
          defaultActiveKey="1"
          items={[
            {
              key: "1",
              label: "HTML",
              children: (
                <Paragraph style={{ padding: "16px" }}>
                  Paste this code snippet into your website's HTML where you
                  want the widget to appear.
                </Paragraph>
              ),
            },
            {
              key: "2",
              label: "WordPress",
              children: (
                <div style={{ padding: "16px" }}>
                  <ol style={{ paddingLeft: 20 }}>
                    <li>Go to the page or post.</li>
                    <li>Add a new "Custom HTML" block.</li>
                    <li>Paste the "Embed Code".</li>
                  </ol>
                </div>
              ),
            },
            {
              key: "3",
              label: "Squarespace/Wix",
              children: (
                <Paragraph style={{ padding: "16px" }}>
                  Use the "Embed" or "Custom Code" block and paste the "Embed
                  Code" into it.
                </Paragraph>
              ),
            },
          ]}
        />
      </CustomizerCardNoPadding>
    </>
  );

  const renderSecurityContent = () => (
    <CustomizerCard>
      <SectionTitle>Domain Allowlist</SectionTitle>
      <Alert
        message="Critical security feature"
        description="Only domains listed below can display your booking widget. This prevents unauthorized usage. Enter each domain on a new line."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      <FormSection>
        <Form.Item name="allowed_widget_origins" label="Allowed Domains">
          <Input.TextArea
            rows={4}
            placeholder="www.my-business.com&#10;booking.my-business.com"
          />
        </Form.Item>
      </FormSection>
    </CustomizerCard>
  );

  const sharedSettingsPanel = (isMobilePanel = false) => (
    <SettingsPanel>
      <SettingsHeader>
        <Button
          shape="circle"
          icon={<ArrowLeft size={16} />}
          onClick={onBack}
        />
        <Title level={4} style={{ margin: 0 }}>
          Widget Settings
        </Title>
      </SettingsHeader>
      <Menu
        onClick={(e) => setActiveMenuKey(e.key)}
        selectedKeys={[activeMenuKey]}
        mode="horizontal"
        items={menuItems}
        style={{
          padding: "0 16px",
          borderBottom: "1px solid #e6ebf1",
          boxShadow: "rgb(0 0 0 / 2%) 0px 20px 20px",
        }}
      />
      <SettingsContent>
        {loading ? (
          <Skeleton active paragraph={{ rows: 15 }} style={{ padding: "0" }} />
        ) : (
          <Form
            form={form}
            layout="vertical"
            onValuesChange={handleValuesChange}
            initialValues={config}
          >
            {activeMenuKey === "customize" && renderCustomizeContent()}
            {activeMenuKey === "installation" && renderInstallationContent()}
            {activeMenuKey === "security" && renderSecurityContent()}
          </Form>
        )}
      </SettingsContent>
      <SettingsFooter>
        <SaveStatus $saving={saving} $hasChanges={hasUnsavedChanges}>
          {saving ? (
            <>
              <Settings size={16} /> Saving...
            </>
          ) : hasUnsavedChanges ? (
            <>
              <Info size={16} /> Unsaved changes
            </>
          ) : (
            <>
              <Eye size={16} /> All changes saved
            </>
          )}
        </SaveStatus>
        <SaveButton
          type="primary"
          block
          onClick={handleSaveChanges}
          disabled={saving || !hasUnsavedChanges}
          loading={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </SaveButton>
      </SettingsFooter>
    </SettingsPanel>
  );

  if (isMobile) {
    return (
      <>
        {sharedSettingsPanel(true)}
        <MobilePreviewButton
          type="primary"
          icon={<Eye size={18} />}
          onClick={() => setIsPreviewModalVisible(true)}
        >
          Show Preview
        </MobilePreviewButton>
        <Modal
          title={
            <PreviewHeader style={{ marginBottom: 0, paddingLeft: 12 }}>
              <Eye size={16} /> Live Preview
            </PreviewHeader>
          }
          open={isPreviewModalVisible}
          onCancel={() => setIsPreviewModalVisible(false)}
          footer={null}
          width="100%"
          style={{ maxWidth: "100vw", top: 0, margin: 0, padding: "24px 6px" }}
          styles={{
            body: { height: "fit-content", padding: 0 },
            content: { height: "100%", borderRadius: 12 },
          }}
          destroyOnClose
        >
          <WidgetFrame>
            <PreviewDisplay
              loading={loading}
              scriptLoaded={scriptLoaded}
              widgetContainerRef={widgetContainerRef}
              config={config}
              widgetApiKey={widgetApiKey}
            />
          </WidgetFrame>
        </Modal>
      </>
    );
  }

  return (
    <DesktopCustomizerLayout>
      {sharedSettingsPanel(false)}
      <PreviewPanel ref={previewPanelRef}>
        <PreviewContainer>
          <PreviewHeader>
            <Eye size={16} /> Live Preview
          </PreviewHeader>
          <ScalableWidgetWrapper>
            <div
              style={{
                width: "100%",
                height: "100%",
                transform: `scale(${widgetScale})`,
                transformOrigin: "top center",
              }}
            >
              <WidgetFrame>
                <PreviewDisplay
                  loading={loading}
                  scriptLoaded={scriptLoaded}
                  widgetContainerRef={widgetContainerRef}
                  config={config}
                  widgetApiKey={widgetApiKey}
                />
              </WidgetFrame>
            </div>
          </ScalableWidgetWrapper>
        </PreviewContainer>
      </PreviewPanel>
    </DesktopCustomizerLayout>
  );
};

// =============================================================================
// --- MAIN COMPONENT & VIEW CONTROLLER ---
// =============================================================================

const WidgetCustomizer = () => {
  const [currentView, setCurrentView] = useState("dashboard");

  return (
    <ConfigProvider theme={theme}>
      <CustomizerWrapper>
        {currentView === "dashboard" ? (
          <WidgetDashboard
            onCustomizeClick={() => setCurrentView("customizer")}
          />
        ) : (
          <CustomizerViewWrapper>
            <CustomizerView onBack={() => setCurrentView("dashboard")} />
          </CustomizerViewWrapper>
        )}
      </CustomizerWrapper>
    </ConfigProvider>
  );
};

export default WidgetCustomizer;
