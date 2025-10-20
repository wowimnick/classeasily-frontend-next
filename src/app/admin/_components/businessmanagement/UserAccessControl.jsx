"use client";

import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import styled, { ThemeProvider } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { Table, Card, Button, Modal, Form, Input, Select, ConfigProvider, Tag, Space, Timeline, Divider, Grid, Empty, Avatar, Typography, Skeleton,  } from 'antd';
import message from '@/lib/message';
import {
  Activity,
  User,
  Search,
  Eye,
  RefreshCw,
  Clock,
  UserCheck,
  Check,
  X,
  Shield,
  Briefcase,
  Home,
  Mail,
  Phone,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Building,
  CheckCircle,
  BarChart2,
  XCircle,
  Hash,
  Info,
} from "lucide-react";
import { verificationService, auditService } from "@/services/adminDash"; // Adjust path
import { theme as appTheme } from "@/components/theme"; // Adjust path
import {
  GlobalLoaderWithInlineStyles,
  GlobalLoaderWithoutInlineStyles,
} from "@/components/common/GlobalLoader";

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Title, Text, Paragraph, Link } = Typography;

// --- THEME COLORS ---
const colors = {
  primary: "#ff385c",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  lightBg: "#f8fafc",
  border: "#f1f5f9",
  textPrimary: "#334155",
  textSecondary: "#64748b",
  textTertiary: "#94a3b8",
};

const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// --- MAIN PAGE STYLED COMPONENTS ---
const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: #fff;
  box-shadow: inset 0px -1px 11px 1px #0000000d;
  min-height: 100vh;
  @media (max-width: 768px) {
    padding: 16px;
    gap: 0;
  }
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #222222;
  margin: 0;
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const HeaderSubtitle = styled(Text)`
  font-size: 15px;
  color: ${colors.textSecondary};
  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const RefreshButton = styled(Button)`
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  border: 1px solid ${colors.border};
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  &:hover {
    color: ${colors.primary};
    border-color: ${colors.primary};
    box-shadow: 0 0 0 2px rgba(255, 56, 92, 0.1);
    transform: translateY(-1px);
  }
`;

// --- STATS CARDS (FROM BOOKINGSLIST) ---
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
`;

const StatCard = styled(Card)`
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
  transition: all 0.2s ease;
  min-height: 160px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .ant-card-body {
    padding: 12px !important;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;

    @media (max-width: 768px) {
      padding: 16px !important;
    }
  }
`;

const StatCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const IconContainer = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.background || "#f1f5f9"};
  color: ${(props) => props.color || colors.textSecondary};
  svg {
    width: 18px;
    height: 18px;
  }

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const StatValue = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin-bottom: 4px;
  display: flex;
  align-items: baseline;

  @media (max-width: 768px) {
    font-size: 17px;
  }
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  display: flex;
  align-items: center;
  gap: 6px;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const StatFooter = styled.div`
  font-size: 12px;
  color: ${colors.textSecondary};
`;

// --- TABLE SECTION ---
const TableSection = styled(motion.div)`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
  border: 1px solid ${colors.border};
`;

const TableHeader = styled.div`
  padding: 20px 24px 16px;
  border-bottom: 1px solid ${colors.border};
  background: white;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const TableTitle = styled(Title).attrs({ level: 4 })`
  margin: 0 0 4px 0 !important;
  color: ${colors.textPrimary};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  svg {
    color: ${colors.primary};
  }
`;

const TableDescription = styled(Paragraph)`
  margin: 0 !important;
  color: ${colors.textSecondary};
  font-size: 14px;
`;

const FilterBar = styled.div`
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  border-bottom: 1px solid ${colors.border};
  @media (max-width: 768px) {
    padding: 16px;
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchFilterContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }
`;

const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    background: #fafbfc;
    border-bottom: 1px solid ${colors.border};
    font-weight: 600;
    color: ${colors.textPrimary};
    font-size: 13px;
    padding: 16px 24px;
  }
  .ant-table-tbody > tr > td {
    padding: 16px 24px;
    border-bottom: 1px solid ${colors.border};
    font-size: 14px;
  }
  .ant-table-tbody > tr:hover > td {
    background: #fafcff;
  }
`;

const VerificationTag = styled(Tag)`
  font-weight: 600;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  text-transform: capitalize;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: none;
`;

// --- MOBILE CARD STYLES ---
const MobileCard = styled(Card)`
  margin-bottom: 12px;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  .ant-card-body {
    padding: 16px !important;
  }
`;

const MobileCardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MobileCardRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MobileCardLabel = styled(Text)`
  font-size: 12px;
  color: ${colors.textSecondary};
  font-weight: 500;
`;

const MobileCardFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid ${colors.border};
`;

// --- DETAIL DRAWER STYLES ---
const DrawerOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1050;
  @media (max-width: 768px) {
    padding: 0;
    align-items: flex-end;
  }
`;

const DrawerContainer = styled(motion.div)`
  width: 100%;
  max-width: 800px;
  background: white;
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  @media (max-width: 768px) {
    height: auto;
    max-height: 85vh;
    border-radius: 24px 24px 0 0;
  }
`;

const DragHandle = styled(motion.div)`
  display: none;
  width: 40px;
  height: 5px;
  background: #d1d1d1;
  border-radius: 2.5px;
  margin: 12px auto 0;
  cursor: grab;
  @media (max-width: 768px) {
    display: block;
  }
`;

const DrawerCloseButton = styled(motion.button)`
  position: absolute;
  top: 16px;
  right: 16px;
  background: #f0f0f0;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  &:hover {
    background: #e0e0e0;
  }
`;

const DrawerHeaderSection = styled.header`
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
`;

const DrawerContent = styled.div`
  flex: 1;
  overflow-y: auto;
  background-color: ${colors.lightBg};
`;

const DrawerHeader = styled.div`
  background-color: white;
  padding: 24px;
  border-bottom: 1px solid ${colors.border};
  display: flex;
  align-items: center;
  gap: 16px;
`;

const UserAvatar = styled(Avatar)`
  width: 60px;
  height: 60px;
  font-size: 28px;
  background: ${colors.primary};
  color: white;
`;

const InfoGroup = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  margin: 20px;
`;

const InfoGroupTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  svg {
    width: 18px;
    height: 18px;
    color: ${colors.primary};
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ContactIcon = styled.div`
  width: 36px;
  height: 36px;
  background: ${hexToRgba(colors.primary, 0.1)};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  svg {
    color: ${colors.primary};
  }
`;

const TimelineItemDot = styled.div`
  background: ${(props) => props.color};
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 3px solid ${colors.lightBg};
`;

const socialIcons = {
  facebook: <Facebook size={14} />,
  instagram: <Instagram size={14} />,
  twitter: <Twitter size={14} />,
  linkedin: <Linkedin size={14} />,
};

// --- UTILITIES ---
const capitalize = (s) =>
  s && s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
const formatDate = (dateString) =>
  dateString
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(dateString))
    : "N/A";
const formatDateTime = (dateString) =>
  dateString
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(dateString))
    : "N/A";
const getStatusTag = (status) => {
  const statusMap = {
    pending: { color: "gold", icon: <Clock size={12} /> },
    approved: { color: "green", icon: <Check size={12} /> },
    verified: { color: "green", icon: <CheckCircle size={12} /> },
    rejected: { color: "red", icon: <X size={12} /> },
  };
  const config = statusMap[status] || {
    color: "default",
    icon: <Info size={12} />,
  };
  return (
    <VerificationTag color={config.color} icon={config.icon}>
      {capitalize(status)}
    </VerificationTag>
  );
};
// --- DETAIL DRAWER CONTENT ---
const DetailDrawerContent = ({
  request,
  userActivity,
  isLoading,
  onProcessRequest,
}) => {
  if (isLoading || !request) {
    return (
      <div
        style={{
          padding: 40,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "300px",
        }}
      >
        <GlobalLoaderWithoutInlineStyles />
      </div>
    );
  }

  const {
    status,
    user_name,
    user_email,
    user_avatar,
    role,
    role_color,
    business_name,
    business_image_medium_url,
    business_description,
    business_address,
    business_city,
    business_state,
    business_zip,
    business_contact_email,
    business_contact_phone,
    business_website,
    social_media_links,
    reviewer_name,
    reviewed_at,
    notes,
    rejection_reason,
  } = request;

  const fullAddress =
    [business_address, business_city, business_state, business_zip]
      .filter(Boolean)
      .join(", ") || "N/A";

  return (
    <AnimatePresence>
      <motion.div
        key="content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <DrawerHeader>
          <UserAvatar src={user_avatar}>{user_name?.[0]}</UserAvatar>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {user_name}
            </Title>
            <Text type="secondary">{user_email}</Text>
          </div>
        </DrawerHeader>

        <InfoGroup>
          <InfoGroupTitle>
            <UserCheck />
            Verification Request
          </InfoGroupTitle>
          <InfoGrid>
            <Space direction="vertical">
              <Text type="secondary">Status</Text>
              {getStatusTag(status)}
            </Space>
            <Space direction="vertical">
              <Text type="secondary">Applying for Role</Text>
              <Tag color={role_color || "#8b5cf6"}>{role}</Tag>
            </Space>
          </InfoGrid>
        </InfoGroup>

        <InfoGroup>
          <InfoGroupTitle>
            <Briefcase />
            Business Profile Under Review
          </InfoGroupTitle>
          <Space
            align="start"
            size={24}
            style={{ marginBottom: 24, width: "100%" }}
          >
            <Avatar
              src={business_image_medium_url}
              shape="square"
              size={80}
              style={{
                backgroundColor: colors.info,
                fontSize: "2rem",
                borderRadius: "12px",
              }}
            >
              {business_name?.[0]}
            </Avatar>
            <div>
              <Title level={5} style={{ marginTop: 0, marginBottom: 4 }}>
                {business_name || "N/A"}
              </Title>
              <Paragraph type="secondary">
                {business_description || "No description provided."}
              </Paragraph>
            </div>
          </Space>
          <InfoGrid>
            <ContactItem>
              <ContactIcon>
                <Home size={18} />
              </ContactIcon>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Address
                </Text>
                <Text strong style={{ display: "block" }}>
                  {fullAddress}
                </Text>
              </div>
            </ContactItem>
            <ContactItem>
              <ContactIcon>
                <Mail size={18} />
              </ContactIcon>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Contact Email
                </Text>
                <Text strong style={{ display: "block" }}>
                  {business_contact_email || "N/A"}
                </Text>
              </div>
            </ContactItem>
            <ContactItem>
              <ContactIcon>
                <Phone size={18} />
              </ContactIcon>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Contact Phone
                </Text>
                <Text strong style={{ display: "block" }}>
                  {business_contact_phone || "N/A"}
                </Text>
              </div>
            </ContactItem>
            <ContactItem>
              <ContactIcon>
                <Globe size={18} />
              </ContactIcon>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Website
                </Text>
                <Text strong style={{ display: "block" }}>
                  {business_website ? (
                    <Link href={business_website} target="_blank">
                      {business_website}
                    </Link>
                  ) : (
                    "N/A"
                  )}
                </Text>
              </div>
            </ContactItem>
          </InfoGrid>
          {social_media_links &&
            Object.values(social_media_links).some((v) => v) && (
              <div style={{ marginTop: "16px" }}>
                <Text strong>Social Links:</Text>
                <br />
                <Space wrap style={{ marginTop: "8px" }}>
                  {Object.entries(social_media_links).map(
                    ([platform, url]) =>
                      url && (
                        <Button
                          key={platform}
                          icon={socialIcons[platform]}
                          href={url}
                          target="_blank"
                          size="small"
                        >
                          {capitalize(platform)}
                        </Button>
                      )
                  )}
                </Space>
              </div>
            )}
        </InfoGroup>

        {status !== "pending" && (
          <InfoGroup>
            <InfoGroupTitle>
              <CheckCircle />
              Processing Info
            </InfoGroupTitle>
            <Paragraph>
              <strong>Processed By:</strong> {reviewer_name || "N/A"}
            </Paragraph>
            <Paragraph>
              <strong>Processed At:</strong> {formatDateTime(reviewed_at)}
            </Paragraph>
            <Paragraph>
              <strong>Notes / Reason:</strong>{" "}
              {notes || rejection_reason || "N/A"}
            </Paragraph>
          </InfoGroup>
        )}

        {status === "pending" && (
          <div
            style={{
              padding: "0 20px 20px 20px",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Button
              type="primary"
              icon={<UserCheck size={16} />}
              onClick={onProcessRequest}
              size="middle"
            >
              Process This Request
            </Button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// --- DETAIL DRAWER MODAL ---
const DetailDrawerModal = ({
  isVisible,
  onClose,
  request,
  userActivity,
  isLoading,
  onProcessRequest,
}) => {
  const isMobile = !useBreakpoint().md;

  const handleDragEnd = (event, info) => {
    if (info.offset.y > 100 && info.velocity.y > 20) {
      onClose();
    }
  };

  const modalVariants = isMobile
    ? {
        hidden: { y: "100%" },
        visible: {
          y: 0,
          transition: { type: "spring", damping: 30, stiffness: 300 },
        },
        exit: { y: "100%", transition: { duration: 0.2 } },
      }
    : {
        hidden: { scale: 0.95, opacity: 0 },
        visible: {
          scale: 1,
          opacity: 1,
          transition: { duration: 0.2, ease: "easeOut" },
        },
        exit: {
          scale: 0.95,
          opacity: 0,
          transition: { duration: 0.2, ease: "easeIn" },
        },
      };

  const drawerComponent = (
    <AnimatePresence>
      {isVisible && (
        <DrawerOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <DrawerContainer
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            drag={isMobile ? "y" : false}
            dragConstraints={{ top: 0, bottom: 500 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            dragSnapToOrigin
          >
            <DragHandle />
            <DrawerHeaderSection>
              <Space align="center">
                <Shield size={20} style={{ color: colors.primary }} />
                <span
                  style={{ fontWeight: 600, fontSize: "16px", color: "#222" }}
                >
                  Verification Details
                </span>
              </Space>
              <DrawerCloseButton whileTap={{ scale: 0.9 }} onClick={onClose}>
                <X size={20} />
              </DrawerCloseButton>
            </DrawerHeaderSection>
            <DrawerContent>
              <DetailDrawerContent
                request={request}
                userActivity={userActivity}
                isLoading={isLoading}
                onProcessRequest={onProcessRequest}
              />
            </DrawerContent>
          </DrawerContainer>
        </DrawerOverlay>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(drawerComponent, document.body);
};

const UserAccessControl = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailsDrawerVisible, setIsDetailsDrawerVisible] = useState(false);
  const [isVerifyModalVisible, setIsVerifyModalVisible] = useState(false);
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    verified_30d: 0,
    rejected_30d: 0,
  });
  const [isReadyForAnimation, setIsReadyForAnimation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [decisionForm] = Form.useForm();
  const [userActivity, setUserActivity] = useState([]);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...(searchText && { search: searchText }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      };
      const response = await verificationService.getVerificationRequests(
        params
      );
      setVerificationRequests(response.success ? response.data || [] : []);
    } catch (e) {
      message.error("Error fetching requests");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchText]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setIsReadyForAnimation(false);
    try {
      const response = await verificationService.getVerificationStats();
      if (response.success) {
        setStats(response.data);
        setTimeout(() => setIsReadyForAnimation(true), 50);
      }
    } catch (e) {
      console.error("Failed to fetch stats");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refreshAllData = () => {
    fetchData();
    fetchStats();
  };

  const fetchFullRequestAndActivity = async (requestId) => {
    setDetailLoading(true);
    setSelectedRequest(null);
    setUserActivity([]);
    try {
      const detailsResponse = await verificationService.getVerificationRequest(
        requestId
      );
      if (detailsResponse.success) {
        setSelectedRequest(detailsResponse.data);
        if (detailsResponse.data.user) {
          const activityResponse = await auditService.getAuditLogs({
            user: detailsResponse.data.user,
            page_size: 20,
            ordering: "-timestamp",
          });
          setUserActivity(
            activityResponse.success ? activityResponse.data.results || [] : []
          );
        }
      } else {
        message.error("Failed to fetch full request details.");
      }
    } catch (error) {
      message.error("Error fetching details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const showDetails = async (request) => {
    setIsDetailsDrawerVisible(true);
    await fetchFullRequestAndActivity(request.id);
  };

  const showVerify = async (request) => {
    setIsVerifyModalVisible(true);
    decisionForm.resetFields();
    if (!selectedRequest || selectedRequest.id !== request.id) {
      await fetchFullRequestAndActivity(request.id);
    }
  };

  const handleProcessRequestFromDrawer = () => {
    if (selectedRequest) {
      setIsDetailsDrawerVisible(false);
      setTimeout(() => showVerify(selectedRequest), 300);
    }
  };

  const handleSubmitDecision = async () => {
    try {
      const values = await decisionForm.validateFields();
      setActionLoading(true);
      const data = {
        status: values.decision,
        notes: values.notes,
        rejection_reason: values.decision === "rejected" ? values.notes : "",
      };
      const response = await verificationService.processVerification(
        selectedRequest.id,
        data
      );
      if (response.success) {
        message.success(`Request has been ${values.decision}.`);
        setIsVerifyModalVisible(false);
        refreshAllData();
      } else {
        message.error(response.error || "Failed to process request");
      }
    } catch (e) {
      console.error("Validation failed:", e);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      title: "User",
      key: "user",
      width: 250,
      render: (_, r) => (
        <Space>
          <Avatar src={r.user_avatar_thumb_url}>{r.user_name?.[0]}</Avatar>
          <div>
            <Text strong>{r.user_name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {r.user_email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Business",
      key: "business",
      width: 250,
      render: (_, r) => (
        <Space>
          <Avatar
            shape="square"
            src={r.business_avatar}
            style={{ borderRadius: "6px" }}
          >
            {r.business_name?.[0]}
          </Avatar>
          <Text strong>{r.business_name}</Text>
        </Space>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role, r) => <Tag color={r.role_color || "#8b5cf6"}>{role}</Tag>,
    },
    {
      title: "Submitted",
      dataIndex: "submitted_at",
      key: "submitted_at",
      render: formatDate,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: getStatusTag,
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      width: 150,
      render: (_, r) => (
        <Space>
          <Button icon={<Eye size={14} />} onClick={() => showDetails(r)}>
            Details
          </Button>
          {r.status === "pending" && (
            <Button
              type="primary"
              icon={<UserCheck size={14} />}
              onClick={() => showVerify(r)}
            >
              Verify
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const renderRequestCard = (r) => (
    <MobileCard key={r.id}>
      <MobileCardContent>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Space>
            <Avatar src={r.user_avatar_thumb_url}>{r.user_name?.[0]}</Avatar>
            <div>
              <Text strong>{r.user_name}</Text>
              <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                {r.user_email}
              </Text>
            </div>
          </Space>
          {getStatusTag(r.status)}
        </div>
        <MobileCardRow>
          <MobileCardLabel>Business</MobileCardLabel>
          <Text strong>{r.business_name}</Text>
        </MobileCardRow>
        <MobileCardRow>
          <MobileCardLabel>Role</MobileCardLabel>
          <Tag color={r.role_color || "#8b5cf6"}>{r.role}</Tag>
        </MobileCardRow>
        <MobileCardRow>
          <MobileCardLabel>Submitted</MobileCardLabel>
          <Text>{formatDate(r.submitted_at)}</Text>
        </MobileCardRow>
        <MobileCardFooter>
          <Button
            icon={<Eye size={14} />}
            onClick={() => showDetails(r)}
            size="middle"
          >
            Details
          </Button>
          {r.status === "pending" && (
            <Button
              type="primary"
              icon={<UserCheck size={14} />}
              onClick={() => showVerify(r)}
              size="middle"
            >
              Verify
            </Button>
          )}
        </MobileCardFooter>
      </MobileCardContent>
    </MobileCard>
  );

  const statCardsData = [
    {
      title: "Pending Requests",
      icon: Clock,
      value: stats.pending,
      color: colors.warning,
      footer: "Awaiting review",
    },
    {
      title: "Verified (30d)",
      icon: CheckCircle,
      value: stats.verified_30d,
      color: colors.success,
      footer: "In the last 30 days",
    },
    {
      title: "Rejected (30d)",
      icon: XCircle,
      value: stats.rejected_30d,
      color: colors.error,
      footer: "In the last 30 days",
    },
  ];

  return (
    <ConfigProvider theme={appTheme}>
      <DashboardWrapper>
        <DashboardHeader>
          <div>
            <PageTitle>Identity & Business Verification</PageTitle>
            <HeaderSubtitle>
              Review and manage business owner verification requests.
            </HeaderSubtitle>
          </div>
          <ActionButtonsContainer>
            <RefreshButton
              icon={<RefreshCw size={14} />}
              onClick={refreshAllData}
              loading={loading || statsLoading}
            >
              Refresh
            </RefreshButton>
          </ActionButtonsContainer>
        </DashboardHeader>

        <Divider />

        <div style={{ marginBottom: "20px" }}>
          <Text
            style={{
              fontSize: isMobile ? "16px" : "17px",
              fontWeight: 600,
              color: colors.textPrimary,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <BarChart2 size={20} color={colors.primary} />
            Verification Overview
          </Text>
          <StatsGrid>
            {statCardsData.map((stat) => (
              <StatCard key={stat.title}>
                {statsLoading ? (
                  <Skeleton active paragraph={{ rows: 2 }} />
                ) : (
                  <>
                    <div>
                      <StatCardHeader>
                        <IconContainer
                          background={hexToRgba(stat.color, 0.1)}
                          color={stat.color}
                        >
                          <stat.icon size={18} />
                        </IconContainer>
                      </StatCardHeader>
                      <StatLabel>{stat.title}</StatLabel>
                    </div>
                    <StatValue>
                      <NumberFlow
                        value={isReadyForAnimation ? stat.value : 0}
                        duration={800}
                      />
                    </StatValue>
                    <StatFooter>{stat.footer}</StatFooter>
                  </>
                )}
              </StatCard>
            ))}
          </StatsGrid>
        </div>

        <TableSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <TableHeader>
            <TableTitle>
              <Shield size={20} />
              Verification Requests
            </TableTitle>
            <TableDescription>
              Process new requests and view historical verification decisions.
            </TableDescription>
          </TableHeader>
          <FilterBar>
            <SearchFilterContainer>
              <Input
                placeholder="Search user or business..."
                allowClear
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: isMobile ? "100%" : 280 }}
              />
              <Select
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
                style={{ width: isMobile ? "100%" : 180 }}
              >
                <Option value="all">All Statuses</Option>
                <Option value="pending">Pending</Option>
                <Option value="verified">Verified</Option>
                <Option value="rejected">Rejected</Option>
              </Select>
            </SearchFilterContainer>
            {(statusFilter !== "all" || searchText) && (
              <Button
                onClick={() => {
                  setStatusFilter("all");
                  setSearchText("");
                }}
                type="link"
                danger
              >
                Clear Filters
              </Button>
            )}
          </FilterBar>

          {isMobile ? (
            <div style={{ padding: "16px" }}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 4 }} />
              ) : verificationRequests.length > 0 ? (
                verificationRequests.map(renderRequestCard)
              ) : (
                <Empty description="No requests found" />
              )}
            </div>
          ) : (
            <StyledTable
              columns={columns}
              dataSource={verificationRequests}
              rowKey="id"
              loading={{
                spinning: loading,
                indicator: <GlobalLoaderWithInlineStyles />,
              }}
              pagination={{ pageSize: 10, showSizeChanger: false }}
            />
          )}
        </TableSection>

        <DetailDrawerModal
          isVisible={isDetailsDrawerVisible}
          onClose={() => setIsDetailsDrawerVisible(false)}
          request={selectedRequest}
          userActivity={userActivity}
          isLoading={detailLoading}
          onProcessRequest={handleProcessRequestFromDrawer}
        />

        <Modal
          title="Process Verification Request"
          open={isVerifyModalVisible}
          onCancel={() => setIsVerifyModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setIsVerifyModalVisible(false)}>
              Cancel
            </Button>,
            <Button
              key="submit"
              type="primary"
              loading={actionLoading}
              onClick={() => decisionForm.submit()}
            >
              Submit Decision
            </Button>,
          ]}
          width={isMobile ? "95vw" : 500}
          centered
          destroyOnClose
        >
          {detailLoading || !selectedRequest ? (
            <div style={{ padding: 24 }}>
              <Skeleton active paragraph={{ rows: 4 }} />
            </div>
          ) : (
            <>
              <div style={{ padding: "24px 24px 0 24px" }}>
                <Title level={4}>
                  Process Request: {selectedRequest.user_name}
                </Title>
                <Text type="secondary">
                  For Business: {selectedRequest.business_name}
                </Text>
              </div>
              <div style={{ padding: 24 }}>
                <Form
                  form={decisionForm}
                  layout="vertical"
                  onFinish={handleSubmitDecision}
                >
                  <Form.Item
                    name="decision"
                    label="Decision"
                    rules={[
                      { required: true, message: "Please select a decision" },
                    ]}
                  >
                    <Select placeholder="Approve or Reject">
                      <Option value="approved">Approve</Option>
                      <Option value="rejected">Reject</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name="notes"
                    label="Internal Notes / Rejection Reason"
                    rules={[
                      {
                        required: true,
                        message: "Please provide notes for your decision",
                      },
                    ]}
                  >
                    <Input.TextArea
                      rows={4}
                      placeholder="This will be shown to the user if rejected."
                    />
                  </Form.Item>
                </Form>
              </div>
            </>
          )}
        </Modal>
      </DashboardWrapper>
    </ConfigProvider>
  );
};

export default UserAccessControl;
