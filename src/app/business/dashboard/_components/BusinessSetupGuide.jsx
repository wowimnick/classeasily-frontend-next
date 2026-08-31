"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Card,
  Typography,
  Progress,
  Collapse,
  Button,
  Space,
  theme,
  Tooltip,
  Badge,
} from "antd";
import {
  CheckCircleFilled,
  CreditCardOutlined,
  EditOutlined,
  AppstoreAddOutlined,
  SolutionOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  RocketOutlined,
  QuestionCircleOutlined,
  CloseOutlined,
  GlobalOutlined,
  CodeOutlined,
  BugOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { businessService } from "@/services/apiService";
import styled, { ThemeProvider } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";

const { Title, Text } = Typography;

// --- FIX: Styled-components now correctly reference the theme provided by ThemeProvider ---
const GuideWrapper = styled(motion.div)`
  position: fixed;
  z-index: 3;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: ${(props) => (props.$isExpanded ? "default" : "pointer")};
  background: ${(props) => props.theme.token.colorPrimary};
  color: white;

  @media (max-width: 480px) {
    &.expanded-state {
      width: calc(100vw - 32px) !important;
      right: 16px !important;
      left: 16px !important;
    }
  }
`;

const CollapsedContent = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;

const ExpandedContent = styled(motion.div)`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  overflow: hidden;
`;

const StyledCard = styled(Card)`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: transparent;
  border: none;

  .ant-card-head {
    flex-shrink: 0;
    padding: 12px 16px;
    min-height: auto;
    border-bottom: 1px solid #f0f2f5;
    background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%);
  }

  .ant-card-body {
    flex-grow: 1;
    overflow: hidden;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
`;

const StatusBadge = styled.div`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${(props) =>
    props.$completed
      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
      : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"};
  color: white;
  flex-shrink: 0;
`;

const ProgressSection = styled.div`
  padding: 16px;
  border-bottom: 1px solid #f0f2f5;
  background: linear-gradient(135deg, #fafbfc 0%, #ffffff 100%);
  flex-shrink: 0;
`;

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const ProgressText = styled(Text)`
  font-size: 13px;
  font-weight: 500;
  color: #374151;
`;

const ProgressSubtext = styled(Text)`
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
  display: block;
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 2px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

const StyledCollapse = styled(Collapse)`
  border: none;
  background: transparent;

  .ant-collapse-item {
    border: none !important;
  }
  .ant-collapse-header {
    padding: 12px 16px !important;
    align-items: center !important;
    background: #fafbfc;
    font-weight: 500;
    transition: background 0.2s ease;
    &:hover {
      background: #f3f4f6;
    }
  }
  .ant-collapse-content {
    border-top: none;
    background: white;
  }
  .ant-collapse-content-box {
    padding: 0 !important;
  }
`;

const StepItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f2f5;
  transition: background 0.2s ease;
  min-height: 60px;

  &:hover {
    background: rgba(59, 130, 246, 0.02);
  }
  &:last-child {
    border-bottom: none;
  }
`;

const StepContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-grow: 1;
  min-width: 0;
`;

const StepIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) =>
    props.$completed
      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
      : "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)"};
  color: ${(props) => (props.$completed ? "white" : "#6b7280")};
  flex-shrink: 0;
  transition: background 0.2s ease;
  svg {
    width: 16px;
    height: 16px;
  }
`;

const StepText = styled.div`
  flex-grow: 1;
  min-width: 0;
`;

const StepLabel = styled(Text)`
  font-size: 13px;
  font-weight: 500;
  color: ${(props) => (props.$completed ? "#6b7280" : "#374151")};
  text-decoration: ${(props) => (props.$completed ? "line-through" : "none")};
  display: block;
  line-height: 1.4;
`;

const ActionButton = styled(Button)`
  font-size: 12px;
  height: 28px;
  padding: 0 12px;
  border-radius: 6px;
  font-weight: 500;
  flex-shrink: 0;
`;

const CompletionSection = styled.div`
  padding: 20px 16px;
  text-align: center;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border-top: 1px solid #d1fae5;
  flex-shrink: 0;
`;

const CompletionIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  color: white;
  svg {
    width: 24px;
    height: 24px;
  }
`;

const CompletionTitle = styled(Title)`
  &.ant-typography {
    font-size: 16px;
    font-weight: 600;
    color: #059669;
    margin: 0 0 4px 0 !important;
  }
`;

const CompletionText = styled(Text)`
  font-size: 13px;
  color: #065f46;
`;

const MobileGuideOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  z-index: 1020;
`;

const MobileGuideContainer = styled(motion.div)`
  position: fixed;
  right: 16px;
  bottom: 16px;
  width: calc(100vw - 32px);
  max-width: 380px;
  height: min(85vh, 580px);
  background: ${(props) => props.theme.token.colorBgContainer};
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1030;
`;

const MobileExpandableButton = styled(motion.div)`
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1010;
  cursor: pointer;
`;

const ExpandableButtonContent = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.theme.token.colorPrimary};
  border-radius: 50px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  width: 56px;
  height: 56px;
  user-select: none;
`;

const BusinessSetupGuide = ({ sideMenuRef, initialOpen = false, hasWidgetAccess = false }) => {
  const { token, theme: antdTheme } = theme.useToken();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(initialOpen);

  // Fetch setup status locally in this component
  const [setupStatus, setSetupStatus] = useState(null);
  const [setupLoading, setSetupLoading] = useState(true);

  const fetchSetupStatus = useCallback(async () => {
    setSetupLoading(true);
    try {
      const response = await businessService.fetchMyBusinessOverview();

      if (response.success && response.data?.setup_progress) {
        setSetupStatus(response.data.setup_progress);
      } else {
        setSetupStatus(null);
      }
    } catch (err) {
      console.error("BusinessSetupGuide: failed to fetch setup status", err);
      setSetupStatus(null);
    } finally {
      setSetupLoading(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchSetupStatus();
  }, [fetchSetupStatus]);

  useEffect(() => {
    const onFocus = () => fetchSetupStatus();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchSetupStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const item = window.localStorage.getItem("businessSetupGuideExpanded");
      if (item !== null) {
        setIsExpanded(JSON.parse(item));
      }
    } catch (error) {
      console.error("Error reading from localStorage", error);
    }
  }, []);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 480);
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(
        "businessSetupGuideExpanded",
        JSON.stringify(isExpanded)
      );
    } catch (error) {
      console.error("Error writing to localStorage", error);
    }
  }, [isExpanded]);

  const handleNavigate = (path) => {
    router.push(path);
    setIsExpanded(false);
  };

  const handleOpenSettings = (tab, sectionId) => {
    sideMenuRef?.current?.openSettingsDrawer(tab, sectionId);
    setIsExpanded(false);
  };

  const stepsConfig = useMemo(() => {
    const groups = [
      {
        key: "account",
        title: "Account Setup",
        items: [
          {
            id: "profile",
            label: "Complete Your Business Profile",
            isComplete: !!setupStatus?.is_profile_complete,
            icon: <EditOutlined />,
            action: () => handleOpenSettings("general"),
            actionLabel: "Complete",
          },
        ],
      },
      {
        key: "class",
        title: "Service & Scheduling Setup",
        items: [
          {
            id: "createClass",
            label: "Create your first service",
            isComplete: !!setupStatus?.has_created_class,
            icon: <AppstoreAddOutlined />,
            action: () => handleNavigate("/business/dashboard/services"),
            actionLabel: "Create",
          },
        ],
      },
      {
        key: "payouts",
        title: "Payout Setup (required)",
        items: [
          {
            id: "stripe",
            label: "Connect Stripe to accept bookings",
            description:
              "Bookings cannot be accepted until payouts are connected.",
            isComplete: !!setupStatus?.is_stripe_connected,
            icon: <CreditCardOutlined />,
            action: () =>
              handleOpenSettings("preferences", "payout-setup-section"),
            actionLabel: "Connect",
            required: true,
            disabled: false,
          },
        ],
      },
    ];

    if (hasWidgetAccess && setupStatus?.widget_setup) {
      const ws = setupStatus.widget_setup;
      groups.push({
        key: "widget",
        title: "Booking Widget Launch",
        items: [
          {
            id: "widgetDomains",
            label: "Add Your Website Domain",
            isComplete: !!ws.has_widget_domains,
            icon: <GlobalOutlined />,
            action: () => handleNavigate("/business/dashboard/widget?tab=settings"),
            actionLabel: "Add domain",
            disabled: !setupStatus?.is_stripe_connected,
          },
          {
            id: "widgetEmbed",
            label: "Copy Embed Code to Your Site",
            isComplete: !!ws.has_widget_embed_verified,
            icon: <CodeOutlined />,
            action: () => handleNavigate("/business/dashboard/widget?tab=install"),
            actionLabel: "Get code",
            disabled: !ws.has_widget_domains,
          },
          {
            id: "widgetDiagnostics",
            label: "Verify With Diagnostics",
            isComplete: !!ws.has_widget_embed_verified,
            icon: <BugOutlined />,
            action: () => handleNavigate("/business/dashboard/widget?tab=install"),
            actionLabel: "Run check",
            disabled: !ws.has_widget_domains,
          },
        ],
      });
    }

    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupStatus, hasWidgetAccess]);

  const allSubSteps = stepsConfig.flatMap((group) => group.items);
  const completedSubSteps = allSubSteps.filter(
    (step) => step.isComplete
  ).length;
  const totalSubSteps = allSubSteps.length;
  const progressPercent =
    totalSubSteps > 0
      ? Math.round((completedSubSteps / totalSubSteps) * 100)
      : 0;
  const isFullyComplete = progressPercent === 100;

  const collapseItems = useMemo(() => {
    return stepsConfig.map((group) => {
      const panelSteps = group.items || [];
      const completedPanelSteps = panelSteps.filter(
        (step) => step.isComplete
      ).length;
      const allPanelStepsComplete = panelSteps.every((step) => step.isComplete);

      return {
        key: group.key,
        label: (
          <Space>
            {allPanelStepsComplete ? (
              <CheckCircleFilled
                style={{ color: token.colorSuccess, fontSize: "16px" }}
              />
            ) : (
              <InfoCircleOutlined
                style={{ color: token.colorPrimary, fontSize: "16px" }}
              />
            )}
            <Text strong style={{ color: "#374151" }}>
              {group.title}
            </Text>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              ({completedPanelSteps}/{panelSteps.length})
            </Text>
          </Space>
        ),
        children: (
          <div>
            {group.items.map((step) => (
              <StepItem key={step.id}>
                <StepContent>
                  <StepIcon $completed={step.isComplete}>
                    {step.isComplete ? <CheckCircleFilled /> : step.icon}
                  </StepIcon>
                  <StepText>
                    <StepLabel $completed={step.isComplete}>
                      {step.label}
                      {step.required && !step.isComplete ? " · Required" : ""}
                    </StepLabel>
                    {step.description && !step.isComplete ? (
                      <Text
                        style={{
                          display: "block",
                          fontSize: "12px",
                          color: "#b45309",
                          lineHeight: 1.4,
                          marginTop: 2,
                        }}
                      >
                        {step.description}
                      </Text>
                    ) : null}
                  </StepText>
                </StepContent>
                {!step.isComplete &&
                  (step.disabled ? (
                    <Tooltip title="Complete previous steps to unlock">
                      <ActionButton type="primary" size="small" disabled={true}>
                        {step.actionLabel}
                      </ActionButton>
                    </Tooltip>
                  ) : (
                    <ActionButton
                      type="primary"
                      size="small"
                      onClick={step.action}
                      disabled={false}
                    >
                      {step.actionLabel}
                    </ActionButton>
                  ))}
              </StepItem>
            ))}
          </div>
        ),
      };
    });
  }, [stepsConfig, token]);

  const contentVariants = {
    hidden: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { delay: 0.1, duration: 0.2 },
    },
  };

  const ExpandedGuideView = (
    <ExpandedContent
      key="expanded"
      variants={contentVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <StyledCard
        title={
          <HeaderContent>
            <HeaderLeft>
              <Title
                level={5}
                style={{ margin: 0, color: "#374151", fontSize: "16px" }}
              >
                Setup Guide
              </Title>
              <StatusBadge $completed={isFullyComplete}>
                {isFullyComplete ? "Complete" : "In Progress"}
              </StatusBadge>
            </HeaderLeft>

            <Space>
              <Button
                type="text"
                icon={<QuestionCircleOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push("/business/help/");
                }}
                size="small"
                style={{ color: "#6b7280" }}
                title="Get Help"
              />
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                size="small"
                style={{ color: "#6b7280" }}
              />
            </Space>
          </HeaderContent>
        }
        bordered={false}
      >
        <ProgressSection>
          <ProgressHeader>
            <ProgressText>
              {completedSubSteps} of {totalSubSteps} steps completed
            </ProgressText>
            <Text
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: token.colorPrimary,
              }}
            >
              {progressPercent}%
            </Text>
          </ProgressHeader>
          <Progress
            percent={progressPercent}
            strokeColor={token.colorSuccess}
            trailColor="#f0f2f5"
            size={[null, 8]}
            showInfo={false}
          />
          <ProgressSubtext>
            {setupStatus?.is_stripe_connected
              ? "Complete all steps to finish setup"
              : "Bookings cannot be accepted until Stripe payouts are connected"}
          </ProgressSubtext>
        </ProgressSection>

        <ScrollableContent>
          {isFullyComplete ? (
            <CompletionSection>
              <CompletionIcon>
                <RocketOutlined />
              </CompletionIcon>
              <CompletionTitle>All Set Up!</CompletionTitle>
              <CompletionText>
                Your business is ready to welcome students and start growing.
              </CompletionText>
            </CompletionSection>
          ) : (
            <StyledCollapse
              items={collapseItems}
              defaultActiveKey={
                setupStatus?.is_stripe_connected
                  ? ["account", "class", "payouts"]
                  : ["payouts", "account", "class"]
              }
              accordion={false}
              ghost
            />
          )}
        </ScrollableContent>
      </StyledCard>
    </ExpandedContent>
  );

  const CollapsedGuideIcon = (
    <CollapsedContent
      key="collapsed"
      variants={contentVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <Badge dot={!isFullyComplete} color={token.colorWarning}>
        <QuestionCircleOutlined style={{ fontSize: "24px", color: "white" }} />
      </Badge>
    </CollapsedContent>
  );

  // --- FIX: Wrap the entire output in ThemeProvider ---
  return (
    <ThemeProvider theme={antdTheme}>
      {isMobile ? (
        <AnimatePresence>
          {isExpanded ? (
            <React.Fragment key="mobile-guide-expanded">
              <MobileGuideOverlay
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { duration: 0.2 } },
                }}
                initial="hidden"
                animate="visible"
                exit="hidden"
                onClick={() => setIsExpanded(false)}
              />
              <MobileGuideContainer
                variants={{
                  hidden: {
                    opacity: 0,
                    y: 50,
                    scale: 0.9,
                    transition: { duration: 0.2, ease: "easeOut" },
                  },
                  visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: {
                      type: "spring",
                      damping: 25,
                      stiffness: 300,
                      duration: 0.4,
                    },
                  },
                }}
                initial="hidden"
                animate="visible"
                exit="hidden"
                style={{ transformOrigin: "bottom right" }}
              >
                {ExpandedGuideView}
              </MobileGuideContainer>
            </React.Fragment>
          ) : (
            <MobileExpandableButton
              key="mobile-guide-collapsed"
              variants={{
                hidden: {
                  scale: 0,
                  opacity: 0,
                  transition: { duration: 0.2, ease: "easeIn" },
                },
                visible: {
                  scale: 1,
                  opacity: 1,
                  transition: {
                    type: "spring",
                    damping: 15,
                    stiffness: 300,
                    delay: 0.1,
                  },
                },
              }}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={() => setIsExpanded(true)}
            >
              <ExpandableButtonContent>
                {CollapsedGuideIcon}
              </ExpandableButtonContent>
            </MobileExpandableButton>
          )}
        </AnimatePresence>
      ) : (
        <GuideWrapper
          $isExpanded={isExpanded}
          className={isExpanded ? "expanded-state" : "collapsed-state"}
          variants={{
            collapsed: {
              width: 56,
              height: 56,
              borderRadius: "50%",
              bottom: 24,
              right: 24,
            },
            expanded: {
              width: 380,
              height: "min(85vh, 580px)",
              borderRadius: 12,
              bottom: 20,
              right: 20,
            },
          }}
          initial={initialOpen ? "expanded" : "collapsed"}
          animate={isExpanded ? "expanded" : "collapsed"}
          transition={{ type: "spring", damping: 20, stiffness: 150 }}
          onClick={!isExpanded ? () => setIsExpanded(true) : undefined}
        >
          <AnimatePresence mode="wait">
            {isExpanded ? ExpandedGuideView : CollapsedGuideIcon}
          </AnimatePresence>
        </GuideWrapper>
      )}
    </ThemeProvider>
  );
};

export default BusinessSetupGuide;
