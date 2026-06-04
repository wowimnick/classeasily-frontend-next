"use client";

import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import styled, { ThemeProvider } from "styled-components";
import AdminResponsiveDrawer from "../shared/AdminResponsiveDrawer";

import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  ConfigProvider,
  Tag,
  Space,
  Timeline,
  Divider,
  Grid,
  Empty,
  Avatar,
  Typography,
  Skeleton,
  Alert,
} from "antd";
import { AdminCompactTable } from "../shared/AdminCompactTable";
import message from "@/lib/message";
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
import AdminMetricCards from "../shared/AdminMetricCards";
import { adminColors as colors } from "../shared/adminColors";
import { hexToRgba } from "../shared/adminUtils";
import {
  TableSection,
  TableHeader,
  TableTitle,
  TableDescription,
  FilterBar,
  SearchFilterContainer,
} from "../shared/adminTableStyles";
import {
  ActionButtonsContainer,
  RefreshButton,
} from "../shared/AdminButtons";
import {
  MobileCard,
  MobileCardContent,
  MobileCardRow,
  MobileCardLabel,
  MobileCardFooter,
} from "../shared/adminMobileStyles";

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Title, Text, Paragraph, Link } = Typography;

// --- MAIN PAGE STYLED COMPONENTS ---
const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: #fff;
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

// --- DETAIL DRAWER STYLES ---
const DrawerContent = styled.div`
  flex: 1;
  overflow-y: auto;
  background-color: #fff;
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
    <div>
        <DrawerHeader>
          <UserAvatar src={user_avatar}>{user_name?.[0]}</UserAvatar>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {user_name}
            </Title>
            <Text type="secondary">{user_email}</Text>
          </div>
        </DrawerHeader>

        {Array.isArray(userActivity) && userActivity.length > 0 && (
          <InfoGroup>
            <InfoGroupTitle>
              <Activity />
              Recent activity
            </InfoGroupTitle>
            <Timeline
              items={userActivity.slice(0, 12).map((log) => ({
                color: colors.info,
                children: (
                  <div>
                    <Text strong>
                      {log.action_display || log.action || "Event"}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatDateTime(log.timestamp)}
                    </Text>
                    {log.details != null && log.details !== "" ? (
                      <Paragraph
                        type="secondary"
                        style={{
                          marginTop: 4,
                          marginBottom: 0,
                          fontSize: 13,
                        }}
                      >
                        {typeof log.details === "string"
                          ? log.details
                          : JSON.stringify(log.details)}
                      </Paragraph>
                    ) : null}
                  </div>
                ),
              }))}
            />
          </InfoGroup>
        )}

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
    </div>
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
  onOpenProcessModal,
  processing,
}) => {
  const isMobile = !useBreakpoint().md;
  const isPending = request?.status === "pending";

  const footer = isPending && onOpenProcessModal ? (
    <Space>
      <Button
        type="primary"
        icon={<CheckCircle size={16} />}
        onClick={() => onOpenProcessModal("approve")}
        loading={processing}
        style={{ background: colors.success, borderColor: colors.success }}
      >
        Approve
      </Button>
      <Button
        danger
        icon={<XCircle size={16} />}
        onClick={() => onOpenProcessModal("reject")}
        loading={processing}
      >
        Reject
      </Button>
    </Space>
  ) : null;

  return (
    <AdminResponsiveDrawer
      open={isVisible}
      onClose={onClose}
      title="Verification Details"
      titleIcon={<Shield size={18} style={{ color: colors.primary }} />}
      isMobile={isMobile}
      width="720px"
      footer={footer}
    >
      <DrawerContent style={{ padding: 24 }}>
        <DetailDrawerContent
          request={request}
          userActivity={userActivity}
          isLoading={isLoading}
          onProcessRequest={onProcessRequest}
        />
      </DrawerContent>
    </AdminResponsiveDrawer>
  );
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
  const [statsError, setStatsError] = useState(null);
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
      setVerificationRequests(
        response.success && Array.isArray(response.data) ? response.data : []
      );
    } catch (e) {
      message.error("Error fetching requests");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchText]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    setIsReadyForAnimation(false);
    try {
      const response = await verificationService.getVerificationStats();
      if (response.success) {
        setStats(response.data);
        setTimeout(() => setIsReadyForAnimation(true), 50);
      } else {
        setStatsError(response.error || "Failed to load verification stats.");
      }
    } catch (e) {
      console.error("Failed to fetch stats");
      setStatsError("Failed to load verification stats.");
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
        notes: values.notes ?? "",
        rejection_reason:
          values.decision === "rejected" ? (values.notes ?? "") : "",
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
          <AdminMetricCards
            cards={statCardsData}
            loading={statsLoading}
            isReadyForAnimation={isReadyForAnimation}
          />
          {!statsLoading && statsError ? (
            <Alert
              type="error"
              showIcon
              message="Could not load verification stats"
              description={statsError}
              action={
                <Button size="small" onClick={fetchStats}>
                  Retry
                </Button>
              }
              style={{ marginTop: 12 }}
            />
          ) : null}
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
            <AdminCompactTable
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
          onOpenProcessModal={(decision) => {
            decisionForm.setFieldsValue({ decision: decision === "approve" ? "approved" : "rejected" });
            setIsDetailsDrawerVisible(false);
            setTimeout(() => setIsVerifyModalVisible(true), 300);
          }}
          processing={actionLoading}
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
              key={actionLoading ? "loading" : "idle"}
              type="primary"
              loading={actionLoading}
              onClick={() => decisionForm.submit()}
            >
              Submit Decision
            </Button>,
          ]}
          width={isMobile ? "95vw" : 380}
          centered
          destroyOnClose
        >
          {detailLoading || !selectedRequest ? (
            <div style={{ padding: 16 }}>
              <Skeleton active paragraph={{ rows: 3 }} />
            </div>
          ) : (
            <div style={{ padding: "0 16px 16px" }}>
              <div style={{ marginBottom: 12 }}>
                <Text strong>{selectedRequest.user_name}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {selectedRequest.business_name}
                </Text>
              </div>
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
                  noStyle
                  shouldUpdate={(prev, curr) => prev.decision !== curr.decision}
                >
                  {({ getFieldValue }) =>
                    getFieldValue("decision") === "rejected" ? (
                      <Form.Item
                        name="notes"
                        label="Rejection reason (shown to user)"
                        rules={[
                          {
                            required: true,
                            message: "Please provide a reason for rejection",
                          },
                        ]}
                      >
                        <Input.TextArea
                          rows={2}
                          placeholder="Reason for rejection"
                        />
                      </Form.Item>
                    ) : null
                  }
                </Form.Item>
              </Form>
            </div>
          )}
        </Modal>
      </DashboardWrapper>
    </ConfigProvider>
  );
};

export default UserAccessControl;
