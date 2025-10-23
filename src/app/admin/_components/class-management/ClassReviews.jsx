"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import NumberFlow from "@number-flow/react";
import dayjs from "dayjs";
import {
  Table,
  Card,
  Input,
  Select,
  Button,
  ConfigProvider,
  Avatar,
  Tag,
  Space,
  Tooltip,
  Rate,
  Modal,
  Grid,
  Empty,
  Alert,
  Form,
  Checkbox,
  Radio,
  Typography,
  Spin,
  Skeleton,
  Divider,
  Pagination,
} from "antd";
import message from "@/lib/message";
import {
  Search,
  Star,
  Check,
  X,
  Flag,
  MessageSquare,
  CheckCircle,
  Clock,
  Download,
  Send,
  Eye,
  Edit,
  User as UserIcon,
  Shield,
  ThumbsUp,
  BookOpen,
  FileText,
  Hash,
  TrendingUp,
  TrendingDown,
  Percent,
} from "lucide-react";
import { classManagementService } from "@/services/adminDash";
import { theme as appTheme } from "@/components/theme";
import {
  GlobalLoaderWithInlineStyles,
  GlobalLoaderWithoutInlineStyles,
} from "@/components/common/GlobalLoader";
import { LordIcon } from "@/services/ReactUtils";

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Text, Title, Paragraph } = Typography;

// --- STYLING & THEME (FROM BOOKINGSLIST) ---
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
};

const hexToRgba = (hex, alpha = 1) => {
  if (!hex?.slice) return `rgba(100, 116, 139, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// --- MAIN PAGE COMPONENTS ---
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

const HeaderSubtitle = styled(Paragraph)`
  &&& {
    font-size: 15px;
    color: ${colors.textSecondary};
    margin-top: 4px !important;
    margin-bottom: 0 !important;
  }
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  @media (max-width: 768px) {
    width: 100%;
  }
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
  @media (max-width: 768px) {
    flex: 1;
  }
`;

const ExportButton = styled(Button)`
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  @media (max-width: 768px) {
    flex: 1;
  }
`;

// --- STATS CARDS ---
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
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  .ant-card-body {
    padding: 20px !important;
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
    width: 18px;
    height: 18px;
  }
  @media (max-width: 768px) {
    font-size: 16px !important;
  }
`;
const TableDescription = styled(Paragraph)`
  margin: 0 !important;
  color: ${colors.textSecondary};
  font-size: 14px;
  @media (max-width: 768px) {
    font-size: 13px;
  }
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
  .ant-empty {
    padding: 40px 20px;
  }
`;

// --- DRAWER COMPONENTS ---
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
  max-width: 720px;
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
  color: #717171;
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
  padding: 24px;
  @media (max-width: 768px) {
    padding: 0;
  }
`;
const DrawerHeader = styled.div`
  background-color: white;
  padding: 24px;
  border-bottom: 1px solid ${colors.border};
  display: flex;
  align-items: center;
  gap: 16px;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;
const InfoGroup = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  margin-bottom: 20px;
  &:last-child {
    margin-bottom: 0;
  }
  @media (max-width: 768px) {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
    margin-bottom: 12px;
  }
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

// --- MOBILE/COMMON COMPONENTS ---
const StatusTag = styled(Tag)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  text-transform: capitalize;
`;
const ReviewCard = styled(Card)`
  margin-bottom: 12px;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`;
const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 20px;
  }
  .ant-modal-body {
    padding: 0;
  }
`;

// --- UTILITY FUNCTIONS ---
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return dayjs(dateString).format("MMM D, YYYY");
};

const formatStatus = (status) => {
  if (!status) return "N/A";
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

// --- DETAIL DRAWER COMPONENT ---
const ReviewDetailDrawerContent = ({ review, onModerateClick }) => {
  if (!review) return null;
  return (
    <>
      <DrawerHeader>
        <Avatar
          size={60}
          src={review.user?.avatar_thumb_url}
          icon={<UserIcon size={24} />}
        />
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {review.user?.name || "Anonymous"}
          </Title>
          <Text type="secondary">Review for: {review.className}</Text>
        </div>
      </DrawerHeader>
      <>
        <InfoGroup>
          <InfoGroupTitle>
            <Star /> Rating & Status
          </InfoGroupTitle>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Rate disabled value={review.rating} style={{ fontSize: 24 }} />
            <Space>
              <Text strong>Status:</Text>
              <StatusTag
                color={
                  review.status === "approved"
                    ? "success"
                    : review.status === "under_review"
                    ? "warning"
                    : "default"
                }
              >
                {formatStatus(review.status)}
              </StatusTag>
              {review.reported && (
                <StatusTag color="error" icon={<Flag size={14} />}>
                  Reported
                </StatusTag>
              )}
            </Space>
          </Space>
        </InfoGroup>
        <InfoGroup>
          <InfoGroupTitle>
            <FileText /> Review Comment
          </InfoGroupTitle>
          <Paragraph>{review.comment}</Paragraph>
        </InfoGroup>
        {review.business_response && (
          <InfoGroup>
            <InfoGroupTitle>
              <ThumbsUp /> Business Response
            </InfoGroupTitle>
            <Paragraph
              style={{
                background: "#fafbfc",
                padding: 16,
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
              }}
            >
              {review.business_response}
            </Paragraph>
          </InfoGroup>
        )}
        {review.reported && (
          <InfoGroup>
            <InfoGroupTitle>
              <Flag style={{ color: colors.error }} /> Reported Details
            </InfoGroupTitle>
            <Alert
              type="warning"
              showIcon
              message="This review was flagged by the business"
              description={
                <>
                  <strong>Reason:</strong>{" "}
                  {review.report_reason || "No reason provided."}
                </>
              }
            />
          </InfoGroup>
        )}
        <div style={{ padding: "0 20px" }}>
          <Button
            type="primary"
            icon={<Edit size={16} />}
            onClick={onModerateClick}
            block
          >
            Moderate Review
          </Button>
        </div>
      </>
    </>
  );
};

const DetailDrawerModal = ({
  isVisible,
  onClose,
  review,
  isMobile,
  onModerateClick,
}) => {
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
        visible: { scale: 1, opacity: 1 },
        exit: { scale: 0.95, opacity: 0 },
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
          >
            <DrawerHeaderSection>
              <Space align="center" size={12}>
                <MessageSquare size={20} style={{ color: colors.primary }} />
                <span
                  style={{ fontWeight: 700, fontSize: "18px", color: "#222" }}
                >
                  Review Details
                </span>
              </Space>
              <DrawerCloseButton whileTap={{ scale: 0.9 }} onClick={onClose}>
                <X size={20} />
              </DrawerCloseButton>
            </DrawerHeaderSection>
            <DrawerContent>
              <ReviewDetailDrawerContent
                review={review}
                onModerateClick={onModerateClick}
              />
            </DrawerContent>
          </DrawerContainer>
        </DrawerOverlay>
      )}
    </AnimatePresence>
  );
  return createPortal(drawerComponent, document.body);
};

const ClassReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [isModActionModalVisible, setIsModActionModalVisible] = useState(false);
  const [isReadyForAnimation, setIsReadyForAnimation] = useState(false);
  const [modActionForm] = Form.useForm();
  const [reviewStats, setReviewStats] = useState({});
  const [filterParams, setFilterParams] = useState({
    search: "",
    status: "all",
    reported: false,
    rating: 0,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const abortControllerRef = useRef(null);

  const fetchReviews = useCallback(
    async (currentFilters, currentPagination) => {
      setLoading(true);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        const params = {
          page: currentPagination.current,
          page_size: currentPagination.pageSize,
          search: currentFilters.search,
          status:
            currentFilters.status === "all" ? undefined : currentFilters.status,
          reported: currentFilters.reported || undefined,
          rating: currentFilters.rating > 0 ? currentFilters.rating : undefined,
        };
        const response = await classManagementService.getReviews(params, {
          signal,
        });
        if (response.success && response.data) {
          setReviews(response.data.results || []);
          setPagination((prev) => ({
            ...prev,
            total: response.data.count,
            current: currentPagination.current,
          }));
        } else if (!signal.aborted) {
          message.error(response.error || "Failed to fetch reviews");
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          message.error("An error occurred fetching reviews.");
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    []
  );

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setIsReadyForAnimation(false);
    try {
      const response = await classManagementService.getReviewAnalytics();
      if (response.success) {
        setReviewStats(response.data);
        setTimeout(() => setIsReadyForAnimation(true), 50);
      } else {
        message.error(response.error || "Failed to fetch stats.");
      }
    } catch (error) {
      message.error("Error fetching stats");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchReviews(filterParams, pagination);
    }, 300);
    return () => clearTimeout(handler);
  }, [filterParams.search, fetchReviews]);

  useEffect(() => {
    fetchReviews(filterParams, pagination);
  }, [
    filterParams.status,
    filterParams.reported,
    filterParams.rating,
    pagination.current,
    pagination.pageSize,
    fetchReviews,
  ]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleFilterChange = (updates) => {
    setFilterParams((prev) => ({ ...prev, ...updates }));
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const handleModAction = async () => {
    if (!selectedReview) return;
    try {
      const values = await modActionForm.validateFields();
      message.loading({ content: "Saving changes...", key: "modReview" });
      const response = await classManagementService.moderateReview(
        selectedReview.reviewId,
        values
      );
      if (response.success) {
        message.success({
          content: "Review successfully moderated.",
          key: "modReview",
        });
        setIsModActionModalVisible(false);
        fetchReviews(filterParams, pagination);
        fetchStats();
      } else {
        message.error({
          content: response.error || "Failed to moderate review.",
          key: "modReview",
        });
      }
    } catch (error) {
      console.error("Error submitting moderation action:", error);
    }
  };

  const showReviewDetails = (review) => {
    setSelectedReview(review);
    setIsDetailDrawerVisible(true);
  };

  const showModActionModal = (review) => {
    setSelectedReview(review);
    modActionForm.setFieldsValue({
      status: review.status,
    });
    setIsModActionModalVisible(true);
  };

  const refreshData = () => {
    fetchReviews(filterParams, { ...pagination, current: 1 });
    fetchStats();
  };

  const columns = [
    {
      title: "Reviewer",
      dataIndex: ["user", "name"],
      render: (_, review) => (
        <Space>
          <Avatar
            src={review.user?.avatar_thumb_url}
            icon={<UserIcon size={16} />}
          >
            {review.user?.name?.[0]}
          </Avatar>
          <div>
            <Text strong>{review.user?.name || "Anonymous"}</Text>
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              {review.user?.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Class/Business",
      render: (_, r) => (
        <div>
          <Text>{r.className}</Text>
          <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
            {r.businessName}
          </Text>
        </div>
      ),
    },
    {
      title: "Rating",
      dataIndex: "rating",
      render: (rating) => <Rate disabled allowHalf value={rating} />,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status, record) => (
        <Space direction="vertical" size={4}>
          <StatusTag
            color={
              status === "approved"
                ? "success"
                : status === "under_review"
                ? "warning"
                : "default"
            }
          >
            {formatStatus(status)}
          </StatusTag>
          {record.reported && (
            <StatusTag color="error" icon={<Flag size={14} />}>
              Reported
            </StatusTag>
          )}
        </Space>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      render: (date) => formatDate(date),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Button
          icon={<Eye size={14} />}
          onClick={() => showReviewDetails(record)}
        >
          Details
        </Button>
      ),
    },
  ];

  const renderReviewCard = (review) => (
    <Card key={review.reviewId} style={{ marginBottom: 12 }}>
      <Space align="start" style={{ marginBottom: 12, width: "100%" }}>
        <Avatar src={review.user?.avatar_thumb_url} size={40} />
        <div style={{ flex: 1 }}>
          <Text strong>{review.user?.name || "Anonymous"}</Text>
          <Text type="secondary" style={{ display: "block" }}>
            {review.className}
          </Text>
        </div>
        <Rate disabled value={review.rating} style={{ fontSize: 16 }} />
      </Space>
      <Paragraph ellipsis={{ rows: 3 }}>{review.comment}</Paragraph>
      <Divider style={{ margin: "12px 0" }} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Space>
          <StatusTag
            color={review.status === "approved" ? "success" : "warning"}
          >
            {formatStatus(review.status)}
          </StatusTag>
          {review.reported && (
            <StatusTag color="error" icon={<Flag size={14} />}>
              Reported
            </StatusTag>
          )}
        </Space>
        <Button size="small" onClick={() => showReviewDetails(review)}>
          Details
        </Button>
      </div>
    </Card>
  );

  const statCardsData = [
    {
      title: "Total Reviews",
      value: reviewStats.total,
      icon: MessageSquare,
      color: colors.info,
    },
    {
      title: "Approved",
      value: reviewStats.approved,
      icon: CheckCircle,
      color: colors.success,
    },
    {
      title: "Pending",
      value: reviewStats.underReview,
      icon: Clock,
      color: colors.warning,
    },
    {
      title: "Reported",
      value: reviewStats.reported,
      icon: Flag,
      color: colors.error,
    },
    {
      title: "Avg. Rating",
      value: reviewStats.averageRating,
      icon: Star,
      color: "#f59e0b",
    },
    {
      title: "Avg. Mod Time",
      value: reviewStats.avgModerationTimeDisplay,
      icon: Send,
      color: "#8b5cf6",
    },
  ];

  const StatSkeleton = () => <Skeleton active paragraph={{ rows: 2 }} />;

  return (
    <ConfigProvider theme={appTheme}>
      <DashboardWrapper>
        <DashboardHeader>
          <div>
            <PageTitle>Review Moderation</PageTitle>
            <HeaderSubtitle>
              Monitor and manage user reviews to ensure platform quality.
            </HeaderSubtitle>
          </div>
          <ActionButtonsContainer>
            <ExportButton icon={<Download size={16} />} disabled>
              {!isMobile && "Export Data"}
            </ExportButton>
            <RefreshButton
              icon={
                <LordIcon
                  src="https://cdn.lordicon.com/valwmkhs.json"
                  colors="primary:#666,secondary:#666"
                  size="20px"
                  trigger="hover"
                />
              }
              onClick={refreshData}
              loading={statsLoading || loading}
            >
              {!isMobile && "Refresh"}
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
            <Shield size={20} color={colors.primary} /> Moderation Overview
          </Text>
        </div>

        <StatsGrid>
          {statCardsData.map((stat, index) => (
            <StatCard key={index}>
              {statsLoading ? (
                <StatSkeleton />
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
                    {stat.title === "Avg. Rating" ? (
                      <NumberFlow
                        value={
                          isReadyForAnimation ? parseFloat(stat.value) || 0 : 0
                        }
                        duration={800}
                        numberFormatOptions={{
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }}
                      />
                    ) : stat.title === "Avg. Mod Time" ? (
                      stat.value || "N/A"
                    ) : (
                      <NumberFlow
                        value={
                          isReadyForAnimation ? parseInt(stat.value) || 0 : 0
                        }
                        duration={800}
                      />
                    )}
                  </StatValue>
                </>
              )}
            </StatCard>
          ))}
        </StatsGrid>

        <Divider />

        <TableSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <TableHeader>
            <TableTitle>
              <BookOpen /> All Reviews
            </TableTitle>
            <TableDescription>
              Search, filter, and moderate all reviews on the platform.
            </TableDescription>
          </TableHeader>
          <FilterBar>
            <SearchFilterContainer>
              <Input
                placeholder="Search user, class, content..."
                allowClear
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                style={{ width: isMobile ? "100%" : 300 }}
              />
              <Select
                value={filterParams.status}
                style={{ width: isMobile ? "100%" : 150 }}
                onChange={(val) => handleFilterChange({ status: val })}
              >
                <Option value="all">All Statuses</Option>
                <Option value="approved">Approved</Option>
                <Option value="under_review">Under Review</Option>
                <Option value="hidden">Hidden</Option>
              </Select>
              <Select
                value={filterParams.rating}
                style={{ width: isMobile ? "100%" : 150 }}
                onChange={(val) => handleFilterChange({ rating: val })}
              >
                <Option value={0}>All Ratings</Option>
                {[5, 4, 3, 2, 1].map((r) => (
                  <Option key={r} value={r}>
                    {r} Star{r > 1 ? "s" : ""}
                  </Option>
                ))}
              </Select>
              <Checkbox
                checked={filterParams.reported}
                onChange={(e) =>
                  handleFilterChange({ reported: e.target.checked })
                }
              >
                Reported Only
              </Checkbox>
            </SearchFilterContainer>
          </FilterBar>

          {isMobile ? (
            <div style={{ padding: "8px" }}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 5 }} />
              ) : (
                <>
                  {reviews.length > 0 ? (
                    reviews.map(renderReviewCard)
                  ) : (
                    <Empty description="No reviews found" />
                  )}
                  <Pagination
                    style={{ textAlign: "center", marginTop: 20 }}
                    current={pagination.current}
                    pageSize={pagination.pageSize}
                    total={pagination.total}
                    onChange={(page, pageSize) =>
                      setPagination((p) => ({ ...p, current: page, pageSize }))
                    }
                  />
                </>
              )}
            </div>
          ) : (
            <StyledTable
              columns={columns}
              dataSource={reviews}
              rowKey="reviewId"
              loading={{
                spinning: loading,
                indicator: <GlobalLoaderWithInlineStyles />,
              }}
              pagination={pagination}
              onChange={(p) => setPagination(p)}
              scroll={{ x: "max-content" }}
            />
          )}
        </TableSection>

        <DetailDrawerModal
          isVisible={isDetailDrawerVisible}
          onClose={() => setIsDetailDrawerVisible(false)}
          review={selectedReview}
          isMobile={isMobile}
          onModerateClick={() => {
            setIsDetailDrawerVisible(false);
            showModActionModal(selectedReview);
          }}
        />

        <StyledModal
          title="Moderate Review"
          open={isModActionModalVisible}
          onCancel={() => setIsModActionModalVisible(false)}
          footer={[
            <Button
              key="back"
              onClick={() => setIsModActionModalVisible(false)}
            >
              Cancel
            </Button>,
            <Button
              key="submit"
              type="primary"
              loading={loading}
              onClick={handleModAction}
            >
              Save Status
            </Button>,
          ]}
          width={600}
          centered
          destroyOnClose
        >
          {selectedReview && (
            <div style={{ padding: "24px 32px" }}>
              <Form
                form={modActionForm}
                layout="vertical"
                onFinish={handleModAction}
                initialValues={{ status: selectedReview.status }}
              >
                <Form.Item
                  name="status"
                  label="Review Status"
                  rules={[{ required: true }]}
                >
                  <Radio.Group>
                    <Radio.Button value="approved">Approve</Radio.Button>
                    <Radio.Button value="under_review">
                      Under Review
                    </Radio.Button>
                    <Radio.Button value="hidden">Hide</Radio.Button>
                  </Radio.Group>
                </Form.Item>
                <Alert
                  type="info"
                  showIcon
                  message="Change the review's visibility. This does not affect the business response."
                />
              </Form>
            </div>
          )}
        </StyledModal>
      </DashboardWrapper>
    </ConfigProvider>
  );
};

export default ClassReviews;
