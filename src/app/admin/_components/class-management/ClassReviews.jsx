"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import styled from "styled-components";
import {
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
import { AdminCompactTable } from "../shared/AdminCompactTable";
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
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { classManagementService } from "@/services/adminDash";
import { theme as appTheme } from "@/components/theme";
import {
  GlobalLoaderWithInlineStyles,
  GlobalLoaderWithoutInlineStyles,
} from "@/components/common/GlobalLoader";
import AdminMetricCards from "../shared/AdminMetricCards";
import AdminResponsiveDrawer from "../shared/AdminResponsiveDrawer";
import { adminColors as colors } from "../shared/adminColors";
import { hexToRgba, formatDate } from "../shared/adminUtils";
import {
  TableSection,
  TableHeader,
  TableTitle,
  TableDescription,
  FilterBar,
  SearchFilterContainer,
} from "../shared/adminTableStyles";
import { ActionButtonsContainer, RefreshButton } from "../shared/AdminButtons";

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Text, Title, Paragraph } = Typography;

// --- MAIN PAGE COMPONENTS ---
const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  background-color: #fff;
  @media (max-width: 768px) {
    padding: 16px;
    gap: 0;
  }
`;

const ContentLayer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  font-size: 22px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin: 0;
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const DrawerTopBar = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  background: white;
`;

const DrawerScrollBody = styled.div`
  flex: 1;
  overflow-y: auto;
  background: #fff;
`;

const DrawerHeaderSection = styled.div`
  background: white;
  padding: 20px 24px;
  border-bottom: 1px solid ${colors.border};
  display: flex;
  align-items: center;
  gap: 16px;
`;

const DrawerContent = styled.div`
  padding: 24px;
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
const formatStatus = (status) => {
  if (!status) return "N/A";
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

function normalizeAdminGoogleReview(raw) {
  if (!raw?.google_review_id) return null;
  return {
    reviewId: `google:${raw.google_review_id}`,
    review_source: "google",
    user: {
      name: raw.reviewer_name || "Google reviewer",
      avatar_thumb_url: raw.reviewer_avatar_url || null,
      email: null,
    },
    className: "Imported Google review",
    businessName: raw.business_name || null,
    rating: raw.rating,
    comment: raw.comment || "",
    status: "approved",
    reported: false,
    business_response: raw.owner_response || null,
    createdAt: raw.review_date,
  };
}

// --- DETAIL DRAWER COMPONENT ---
const ReviewDetailDrawerContent = ({ review, onModerateClick }) => {
  if (!review) return null;
  const isGoogle = review.review_source === "google";
  return (
    <>
        {isGoogle && (
          <div style={{ padding: "0 20px 16px" }}>
            <Alert
              type="info"
              showIcon
              message="Google review"
              description="This review was imported from Google Business. Visibility is managed in Google Business Profile, not ClassEasily."
            />
          </div>
        )}
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
        {!isGoogle && (
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
        )}
      </>
    
  );
};

const DetailDrawerModal = ({ open, onClose, review, isMobile, onModerateClick }) => {
  const renderContent = () => (
    <>
      {review && (
        <DrawerTopBar style={{ flexWrap: "wrap", gap: 12 }}>
          <Avatar size={44} src={review.user?.avatar_thumb_url} icon={<UserIcon size={18} />} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: colors.textPrimary }}>{review.user?.name || "Anonymous"}</div>
            <div style={{ fontSize: 12, color: colors.textSecondary }}>{review.user?.email}</div>
            <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
              <Space wrap size={6}>
                <span>Review for: <strong>{review.className}</strong></span>
                {review.review_source === "google" ? <Tag color="blue">Google</Tag> : null}
              </Space>
            </div>
          </div>
          <Button type="text" icon={<X size={18} />} onClick={onClose} aria-label="Close" />
        </DrawerTopBar>
      )}
      <DrawerScrollBody>
        <DrawerContent>
          <ReviewDetailDrawerContent review={review} onModerateClick={onModerateClick} />
        </DrawerContent>
      </DrawerScrollBody>
    </>
  );

  return (
    <AdminResponsiveDrawer
      open={open}
      onClose={onClose}
      title="Review Details"
      titleIcon={<MessageSquare size={16} color={colors.primary} />}
      isMobile={isMobile}
      width="720px"
      hideHeader={!!review}
    >
      {renderContent()}
    </AdminResponsiveDrawer>
  );
};

const ClassReviews = () => {
  const [googleReviews, setGoogleReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
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
          include_google: true,
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
          setGoogleReviews(
            (response.data.google_reviews || [])
              .map(normalizeAdminGoogleReview)
              .filter(Boolean)
          );
          setPagination((prev) => ({
            ...prev,
            total: response.data.count,
            current: currentPagination.current,
          }));
        } else if (!signal.aborted) {
          message.error(response.error || "Failed to fetch reviews");
          setGoogleReviews([]);
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
    if (!selectedReview || selectedReview.review_source === "google") return;
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
    setDetailDrawerOpen(true);
  };

  const showModActionModal = (review) => {
    if (review.review_source === "google") return;
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
            <Space wrap size={4}>
              <Text strong>{review.user?.name || "Anonymous"}</Text>
              {review.review_source === "google" ? (
                <Tag color="blue">Google</Tag>
              ) : null}
            </Space>
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
          {r.businessName ? (
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              {r.businessName}
            </Text>
          ) : null}
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
          <Space wrap size={6}>
            <Text strong>{review.user?.name || "Anonymous"}</Text>
            {review.review_source === "google" ? (
              <Tag color="blue">Google</Tag>
            ) : null}
          </Space>
          <Text type="secondary" style={{ display: "block" }}>
            {review.className}
          </Text>
          {review.businessName ? (
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              {review.businessName}
            </Text>
          ) : null}
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

  return (
    <ConfigProvider theme={appTheme}>
      <DashboardWrapper>
        <ContentLayer>
        <DashboardHeader>
          <div>
            <PageTitle>Review Moderation</PageTitle>
            <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>Monitor and moderate user reviews across the platform.</div>
          </div>
          <ActionButtonsContainer>
            <RefreshButton
              icon={<RefreshCw size={15} />}
              onClick={refreshData}
              loading={statsLoading || loading}
            >
              {!isMobile && "Refresh"}
            </RefreshButton>
          </ActionButtonsContainer>
        </DashboardHeader>

        <AdminMetricCards
          cards={statCardsData.map((card) => {
            if (card.title === "Avg. Rating") {
              return {
                ...card,
                value: Number.parseFloat(card.value) || 0,
                numberFormatOptions: {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                },
              };
            }
            if (card.title === "Avg. Mod Time") {
              return { ...card, value: card.value || "N/A" };
            }
            return { ...card, value: Number.parseInt(card.value, 10) || 0 };
          })}
          loading={statsLoading}
          isReadyForAnimation={isReadyForAnimation}
        />

        <TableSection>
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
                prefix={<Search size={14} />}
                placeholder="Search user, class, content..."
                allowClear
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                style={{ width: isMobile ? "100%" : 240 }}
              />
              <Select
                value={filterParams.status}
                style={{ width: isMobile ? "100%" : 140 }}
                onChange={(val) => handleFilterChange({ status: val })}
              >
                <Option value="all">All Statuses</Option>
                <Option value="approved">Approved</Option>
                <Option value="under_review">Under Review</Option>
                <Option value="hidden">Hidden</Option>
              </Select>
              <Select
                value={filterParams.rating}
                style={{ width: isMobile ? "100%" : 130 }}
                onChange={(val) => handleFilterChange({ rating: val })}
              >
                <Option value={0}>All Ratings</Option>
                {[5, 4, 3, 2, 1].map((r) => (
                  <Option key={r} value={r}>
                    {r} Star{r > 1 ? "s" : ""}
                  </Option>
                ))}
              </Select>
              <Button
                type={filterParams.reported ? "primary" : "default"}
                icon={<AlertTriangle size={14} />}
                onClick={() => handleFilterChange({ reported: !filterParams.reported })}
                style={{ borderRadius: 8 }}
              >
                Reported
              </Button>
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
            <AdminCompactTable
              columns={columns}
              dataSource={reviews}
              rowKey="reviewId"
              loading={{
                spinning: loading,
                indicator: <GlobalLoaderWithInlineStyles />,
              }}
              pagination={{ ...pagination, showSizeChanger: false }}
              onChange={(p) => setPagination(p)}
              scroll={{ x: "max-content" }}
            />
          )}
          {!loading && googleReviews.length > 0 && (
            <>
              <Divider style={{ margin: "24px 0 16px" }} />
              <TableHeader style={{ marginBottom: 12 }}>
                <TableTitle>
                  <Star /> Google reviews
                </TableTitle>
                <TableDescription>
                  Imported from Google Business (read-only here). Shows up to 300 matches for your search, rating, and business filters.
                </TableDescription>
              </TableHeader>
              {isMobile ? (
                <div style={{ padding: "8px" }}>
                  {googleReviews.map(renderReviewCard)}
                </div>
              ) : (
                <AdminCompactTable
                  columns={columns}
                  dataSource={googleReviews}
                  rowKey="reviewId"
                  pagination={false}
                  scroll={{ x: "max-content" }}
                />
              )}
            </>
          )}
        </TableSection>

        <DetailDrawerModal
          open={detailDrawerOpen}
          onClose={() => setDetailDrawerOpen(false)}
          review={selectedReview}
          isMobile={isMobile}
          onModerateClick={() => {
            setDetailDrawerOpen(false);
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
              key={`btn-${loading}`}
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
        </ContentLayer>
      </DashboardWrapper>
    </ConfigProvider>
  );
};

export default ClassReviews;
