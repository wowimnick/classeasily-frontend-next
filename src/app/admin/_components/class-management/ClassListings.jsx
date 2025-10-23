"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  Input,
  Select,
  Button,
  ConfigProvider,
  Avatar,
  Dropdown,
  Menu,
  Modal,
  Form,
  Empty,
  Badge,
  Alert,
  Grid,
  Checkbox,
  Typography,
  Spin,
  Tooltip,
  Tag,
  Space,
  Divider,
  Card,
  Skeleton,
  Tabs,
  Rate,
} from "antd";
import message from "@/lib/message";
import {
  Search,
  MoreHorizontal,
  Eye,
  Zap,
  MapPin,
  Star,
  Award,
  Lock,
  Unlock,
  MessageSquare,
  Download,
  List,
  BarChart2,
  CheckCircle,
  XCircle,
  HelpCircle,
  Briefcase,
  DollarSign,
  BookOpen,
  User as UserIcon,
  Tag as TagIcon,
  Calendar,
  ShieldAlert,
  Edit,
} from "lucide-react";
import { classManagementService } from "@/services/adminDash";
import { theme as appTheme } from "@/components/theme";
import { GlobalLoaderWithInlineStyles } from "@/components/common/GlobalLoader";
import { LordIcon } from "@/services/ReactUtils";
import AdminClassEditDrawer from "./AdminClassEditDrawer";

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Text, Title, Paragraph } = Typography;
const { TabPane } = Tabs;

// --- STYLING & THEME (ADAPTED FROM BOOKINGSLIST) ---
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
  @media (max-width: 768px) {
    font-size: 17px;
  }
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  display: block;
  @media (max-width: 768px) {
    font-size: 12px;
  }
`;
const StatFooter = styled.div`
  font-size: 12px;
  color: ${colors.textSecondary};
  margin-top: 4px;
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

// --- MOBILE COMPONENTS ---
const MobileCard = styled(Card)`
  margin-bottom: 12px;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`;
const MobileCardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
const MobileCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;
const MobileCardInfo = styled.div`
  flex: 1;
`;
const ClassName = styled.div`
  font-weight: 600;
  color: ${colors.textPrimary};
  font-size: 15px;
`;
const BusinessName = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
`;
const MobileCardRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid ${colors.border};
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;
const MobileCardLabel = styled.div`
  color: ${colors.textSecondary};
  font-size: 13px;
`;
const MobileCardValue = styled.div`
  font-weight: 500;
  font-size: 13px;
  text-align: right;
  color: ${colors.textPrimary};
`;
const MobileCardFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid ${colors.border};
  gap: 8px;
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
`;
const DrawerTabs = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: 0;
    background-color: white;
    padding: 0 24px;
  }
`;

const TabContentWrapper = styled.div`
  padding: 24px;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const DrawerHeader = styled.div`
  background-color: white;
  padding: 24px;
  border-bottom: 1px solid ${colors.border};
  display: flex;
  align-items: center;
  gap: 16px;
`;

const ClassAvatar = styled(Avatar)`
  width: 60px !important;
  height: 60px !important;
  line-height: 60px !important;
  font-size: 28px !important;
  border-radius: 12px !important;
  flex-shrink: 0;
`;

const InfoGroup = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  margin-bottom: 20px;
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
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const InfoIcon = styled.div`
  color: ${colors.textSecondary};
  svg {
    width: 16px;
    height: 16px;
  }
`;
const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
`;
const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${colors.lightBg};
  border-radius: 12px;
`;

const InfoContent = styled.div``;
const InfoLabel = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
`;
const InfoValue = styled(Paragraph)`
  &.ant-typography {
    font-weight: 500;
    color: ${colors.textPrimary};
    margin-bottom: 0 !important;
  }
`;
const ReviewCard = styled.div`
  background-color: white;
  border: 1px solid ${colors.border};
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
`;
const ReviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;
const ReviewUser = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;
const ReviewResponse = styled.div`
  background-color: ${colors.lightBg};
  padding: 16px;
  border-radius: 12px;
  margin-top: 16px;
  border-left: 4px solid ${colors.primary};
`;
const ReviewFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  font-size: 0.8rem;
  color: ${colors.textTertiary};
`;

// --- UTILITY FUNCTIONS & COMPONENTS ---
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value ?? 0
  );
const getCategoryColor = (category) => category?.color || colors.textSecondary;
const getCategoryName = (category) => category?.name || "Uncategorized";
const capitalizeWords = (str) =>
  !str
    ? "N/A"
    : str.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
const formatHoursForDisplay = (hours) => {
  if (typeof hours !== "number" || isNaN(hours) || hours <= 0) {
    return "";
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (remainingHours === 0) {
    return `${days} ${days === 1 ? "day" : "days"}`;
  }

  if (days === 0) {
    return `${remainingHours} ${remainingHours === 1 ? "hour" : "hours"}`;
  }

  return `${days} ${days === 1 ? "day" : "days"} and ${remainingHours} ${
    remainingHours === 1 ? "hour" : "hours"
  }`;
};
const StatusBadge = ({ status }) => {
  let color, icon, text;
  switch (status) {
    case "active":
      (color = "success"),
        (icon = <CheckCircle size={14} />),
        (text = "Active");
      break;
    case "inactive":
      (color = "default"),
        (icon = <HelpCircle size={14} />),
        (text = "Inactive");
      break;
    case "suspended":
      (color = "error"), (icon = <XCircle size={14} />), (text = "Suspended");
      break;
    default:
      (color = "default"),
        (icon = <HelpCircle size={14} />),
        (text =
          String(status).charAt(0).toUpperCase() + String(status).slice(1));
  }
  return (
    <Tag
      color={color}
      icon={icon}
      style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
    >
      {text}
    </Tag>
  );
};
const scheduleColumns = (themeTokens) => [
  {
    title: "Day",
    dataIndex: "day",
    key: "day",
    width: 120,
    render: (day) => <Text strong>{day || "N/A"}</Text>,
  },
  {
    title: "Time",
    dataIndex: "time",
    key: "time",
    width: 120,
    render: (time) =>
      time
        ? new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "N/A",
  },
  {
    title: "Duration (min)",
    dataIndex: "duration",
    key: "duration",
    width: 120,
  },
  {
    title: "Price",
    dataIndex: "price",
    key: "price",
    width: 120,
    render: (price) => (
      <Text strong style={{ color: themeTokens.colorPrimary }}>
        {formatCurrency(price)}
      </Text>
    ),
  },
  {
    title: "Spots",
    dataIndex: "maxParticipants",
    key: "maxParticipants",
    align: "center",
    width: 80,
  },
];

// --- DETAIL DRAWER ---
const ClassDetailDrawerContent = ({
  classData,
  onShowLockModal,
  onShowMessageModal,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [selectedOptionId, setSelectedOptionId] = useState(
    classData?.options?.[0]?.optionId || null
  );
  const selectedOption = classData?.options?.find(
    (opt) => opt.optionId === selectedOptionId
  );

  return (
    <>
      <DrawerHeader>
        <ClassAvatar
          shape="square"
          src={classData.images?.[0]?.image_medium_url}
        >
          {classData.title?.[0]}
        </ClassAvatar>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {classData.title}
          </Title>
          <Text type="secondary">{classData.business_name}</Text>
        </div>
      </DrawerHeader>
      <DrawerTabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Details" key="details">
          <TabContentWrapper>
            <InfoGroup>
              <InfoGrid>
                <InfoItem>
                  <InfoIcon>
                    <Star />
                  </InfoIcon>
                  <InfoContent>
                    <InfoLabel>Avg. Rating</InfoLabel>
                    <InfoValue>
                      {classData.average_rating.toFixed(1)} (
                      {classData.review_count} reviews)
                    </InfoValue>
                  </InfoContent>
                </InfoItem>
                <InfoItem>
                  <InfoIcon>
                    <DollarSign />
                  </InfoIcon>
                  <InfoContent>
                    <InfoLabel>Price Range</InfoLabel>
                    <InfoValue>
                      {classData.price_range
                        ? classData.price_range.single_price
                          ? formatCurrency(classData.price_range.min)
                          : `${formatCurrency(
                              classData.price_range.min
                            )} - ${formatCurrency(classData.price_range.max)}`
                        : "N/A"}
                    </InfoValue>
                  </InfoContent>
                </InfoItem>
                <InfoItem>
                  <InfoIcon>
                    <TagIcon />
                  </InfoIcon>
                  <InfoContent>
                    <InfoLabel>Category</InfoLabel>
                    <InfoValue>
                      <Tag color={getCategoryColor(classData.category)}>
                        {getCategoryName(classData.category)}
                      </Tag>
                    </InfoValue>
                  </InfoContent>
                </InfoItem>
                <InfoItem>
                  <InfoIcon>
                    <Zap />
                  </InfoIcon>
                  <InfoContent>
                    <InfoLabel>Status</InfoLabel>
                    <InfoValue>
                      <StatusBadge status={classData.status} />
                    </InfoValue>
                  </InfoContent>
                </InfoItem>
              </InfoGrid>
            </InfoGroup>
            <InfoGroup>
              <InfoGroupTitle>
                <BookOpen /> Description
              </InfoGroupTitle>
              <Paragraph style={{ whiteSpace: "pre-line" }}>
                {classData.description || "No description provided."}
              </Paragraph>
            </InfoGroup>
            {classData.features?.length > 0 && (
              <InfoGroup>
                <InfoGroupTitle>
                  <Award /> Features & Amenities
                </InfoGroupTitle>
                <FeatureGrid>
                  {classData.features.map((feature, i) => (
                    <FeatureItem key={i}>
                      <CheckCircle size={18} color={colors.success} />
                      <Text>{feature}</Text>
                    </FeatureItem>
                  ))}
                </FeatureGrid>
              </InfoGroup>
            )}
          </TabContentWrapper>
        </TabPane>
        <TabPane
          tab={`Options & Schedules (${classData.options?.length || 0})`}
          key="schedules"
        >
          <TabContentWrapper>
            {classData.options?.length > 1 && (
              <InfoGroup>
                <InfoGroupTitle>
                  <BarChart2 /> Select an Option
                </InfoGroupTitle>
                <Space wrap>
                  {classData.options.map((opt) => (
                    <Button
                      key={opt.optionId}
                      type={
                        selectedOptionId === opt.optionId
                          ? "primary"
                          : "default"
                      }
                      onClick={() => setSelectedOptionId(opt.optionId)}
                    >
                      {opt.parent_class_title}
                    </Button>
                  ))}
                </Space>
              </InfoGroup>
            )}
            {selectedOption ? (
              <>
                <InfoGroup>
                  <InfoGroupTitle>
                    <TagIcon /> Details for: {selectedOption.parent_class_title}
                  </InfoGroupTitle>
                  <InfoGrid>
                    <InfoItem>
                      <InfoIcon>
                        <UserIcon />
                      </InfoIcon>
                      <InfoContent>
                        <InfoLabel>Level</InfoLabel>
                        <InfoValue>
                          {capitalizeWords(selectedOption.level)}
                        </InfoValue>
                      </InfoContent>
                    </InfoItem>
                    <InfoItem>
                      <InfoIcon>
                        <BookOpen />
                      </InfoIcon>
                      <InfoContent>
                        <InfoLabel>Booking Type</InfoLabel>
                        <InfoValue>
                          {capitalizeWords(selectedOption.booking_type)}
                        </InfoValue>
                      </InfoContent>
                    </InfoItem>
                    <InfoItem>
                      <InfoIcon>
                        <XCircle />
                      </InfoIcon>
                      <InfoContent>
                        <InfoLabel>Cancellation</InfoLabel>
                        <InfoValue>
                          {selectedOption.cancellationRefundPercentage}% refund
                          cancelled over{" "}
                          {selectedOption.cancellationPolicy === "custom" &&
                          selectedOption.cancellationCustomHours
                            ? `${formatHoursForDisplay(
                                selectedOption.cancellationCustomHours
                              )} notice`
                            : capitalizeWords(
                                selectedOption.cancellationPolicy
                              )}
                        </InfoValue>
                      </InfoContent>
                    </InfoItem>
                  </InfoGrid>
                </InfoGroup>
                <InfoGroup>
                  <InfoGroupTitle>
                    <Calendar /> Weekly Schedule
                  </InfoGroupTitle>
                  {selectedOption.schedules?.length > 0 ? (
                    <StyledTable
                      dataSource={selectedOption.schedules}
                      columns={scheduleColumns(appTheme.token)}
                      rowKey="id"
                      pagination={false}
                      size="middle"
                      scroll={{ x: "max-content" }}
                    />
                  ) : (
                    <Empty description="No schedules defined." />
                  )}
                </InfoGroup>
              </>
            ) : (
              <Empty description="No class options have been created yet." />
            )}
          </TabContentWrapper>
        </TabPane>
        <TabPane
          tab={`Reviews (${classData.reviews?.length || 0})`}
          key="reviews"
        >
          <TabContentWrapper>
            {(classData.reviews?.length ?? 0) > 0 ? (
              classData.reviews.map((review) => (
                <ReviewCard key={review.reviewId}>
                  <ReviewHeader>
                    <ReviewUser>
                      <Avatar src={review.user?.avatar_thumb_url}>
                        {review.user?.name?.[0]}
                      </Avatar>
                      <Text strong>{review.user?.name || "Anonymous"}</Text>
                    </ReviewUser>
                    <Rate disabled defaultValue={review.rating} />
                  </ReviewHeader>
                  <Paragraph>{review.comment}</Paragraph>
                  {review.business_response && (
                    <ReviewResponse>
                      <Text strong>Business Response:</Text>
                      <Paragraph
                        style={{ margin: "8px 0 0 0", whiteSpace: "pre-line" }}
                      >
                        {review.business_response}
                      </Paragraph>
                    </ReviewResponse>
                  )}
                  <ReviewFooter>
                    <span>ID: {review.reviewId}</span>
                    <span>
                      Posted: {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </ReviewFooter>
                </ReviewCard>
              ))
            ) : (
              <Empty description="No reviews submitted yet." />
            )}
          </TabContentWrapper>
        </TabPane>
        <TabPane tab="Admin Actions" key="actions">
          <TabContentWrapper>
            <InfoGroup>
              <InfoGroupTitle>
                <ShieldAlert /> Moderation
              </InfoGroupTitle>
              <Space>
                <Button
                  icon={<MessageSquare size={16} />}
                  onClick={() => onShowMessageModal(classData)}
                >
                  Message Business
                </Button>
                <Button
                  icon={
                    classData.status === "active" ? (
                      <Lock size={16} />
                    ) : (
                      <Unlock size={16} />
                    )
                  }
                  onClick={() => onShowLockModal(classData)}
                  danger={classData.status === "active"}
                >
                  {classData.status === "active"
                    ? "Suspend Class"
                    : "Activate Class"}
                </Button>
              </Space>
            </InfoGroup>
          </TabContentWrapper>
        </TabPane>
      </DrawerTabs>
    </>
  );
};

const ClassDetailDrawer = ({
  isVisible,
  onClose,
  classData,
  isLoading,
  isMobile,
  onShowLockModal,
  onShowMessageModal,
}) => {
  const modalVariants = isMobile
    ? {
        hidden: { y: "100%", opacity: 0 },
        visible: {
          y: 0,
          opacity: 1,
          transition: { type: "spring", damping: 30, stiffness: 300 },
        },
        exit: {
          y: "100%",
          opacity: 0,
          transition: { duration: 0.2, ease: "easeIn" },
        },
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
            onDragEnd={(e, i) => i.offset.y > 100 && onClose()}
            dragSnapToOrigin
          >
            <DrawerHeaderSection>
              <Space align="center" size={12}>
                <BookOpen size={20} style={{ color: colors.primary }} />
                <span
                  style={{ fontWeight: 700, fontSize: "18px", color: "#222" }}
                >
                  Class: {classData?.title || ""}
                </span>
              </Space>
            </DrawerHeaderSection>
            <DrawerContent>
              {isLoading ? (
                <div style={{ padding: 40, textAlign: "center" }}>
                  <GlobalLoaderWithInlineStyles />
                </div>
              ) : classData ? (
                <ClassDetailDrawerContent
                  classData={classData}
                  onShowLockModal={onShowLockModal}
                  onShowMessageModal={onShowMessageModal}
                />
              ) : (
                <Empty description="Could not load class details." />
              )}
            </DrawerContent>
          </DrawerContainer>
        </DrawerOverlay>
      )}
    </AnimatePresence>
  );

  return createPortal(drawerComponent, document.body);
};

export default function ClassListings() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isEditDrawerVisible, setIsEditDrawerVisible] = useState(false);
  const [classToEdit, setClassToEdit] = useState(null);
  const editDrawerOperation = useRef(null);
  const [filterParams, setFilterParams] = useState({
    search: "",
    category_id: "all",
    status: "all",
    featured: false,
  });
  const [selectedClassDetails, setSelectedClassDetails] = useState(null);
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [isLockModalVisible, setIsLockModalVisible] = useState(false);
  const [isMessageModalVisible, setIsMessageModalVisible] = useState(false);
  const [classToModify, setClassToModify] = useState(null);
  const [messageForm] = Form.useForm();
  const [lockForm] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [classStats, setClassStats] = useState({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [sortedInfo, setSortedInfo] = useState({});
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const handleFilterChange = (updates) => {
    setFilterParams((prev) => ({ ...prev, ...updates }));
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const fetchClasses = useCallback(
    async (currentFilters, currentPagination, currentSorter) => {
      setLoading(true);
      const params = {
        page: currentPagination.current,
        page_size: currentPagination.pageSize,
        search: currentFilters.search,
        category_id:
          currentFilters.category_id !== "all"
            ? currentFilters.category_id
            : undefined,
        status:
          currentFilters.status !== "all" ? currentFilters.status : undefined,
        featured: currentFilters.featured || undefined,
        ordering: currentSorter.order
          ? `${currentSorter.order === "descend" ? "-" : ""}${
              currentSorter.columnKey
            }`
          : undefined,
      };
      try {
        const response = await classManagementService.getClasses(params);
        if (response.success) {
          setClasses(response.data?.results || []);
          setPagination((prev) => ({
            ...prev,
            total: response.data?.count || 0,
          }));
        } else {
          message.error(response.error || "Failed to fetch classes");
        }
      } catch (error) {
        message.error("An error occurred while fetching classes");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const debouncedFetch = useRef(
    // Simple debounce
    (filters, pagination, sorter) => {
      const handler = setTimeout(() => {
        fetchClasses(filters, pagination, sorter);
      }, 300);
      return () => clearTimeout(handler);
    }
  ).current;

  useEffect(() => {
    debouncedFetch(filterParams, pagination, sortedInfo);
  }, [
    filterParams,
    pagination.current,
    pagination.pageSize,
    sortedInfo,
    debouncedFetch,
  ]);

  const fetchStats = useCallback(() => {
    setStatsLoading(true);
    classManagementService
      .getClassAnalytics()
      .then((res) => res.success && setClassStats(res.data || {}))
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    classManagementService
      .getCategories()
      .then((res) => res.success && setCategories(res.data || []));
    fetchStats();
  }, [fetchStats]);

  const handleTableChange = (newPagination, filters, sorter) => {
    setSortedInfo(sorter);
    setPagination(newPagination);
  };

  const handleUpdateClassStatus = async (classId, newStatus, reason = "") => {
    message.loading({ content: "Updating...", key: "statusUpdate" });
    try {
      const response = await classManagementService.updateClassStatus(
        classId,
        newStatus,
        reason
      );
      if (response.success) {
        message.success({ content: "Status updated!", key: "statusUpdate" });
        setIsLockModalVisible(false);
        fetchClasses(filterParams, pagination, sortedInfo);
        fetchStats();
        if (
          isDetailDrawerVisible &&
          selectedClassDetails?.classId === classId
        ) {
          setSelectedClassDetails((prev) => ({ ...prev, status: newStatus }));
        }
      } else {
        message.error({
          content: response.error || "Failed to update status",
          key: "statusUpdate",
        });
      }
    } catch (error) {
      message.error({ content: "An error occurred", key: "statusUpdate" });
    }
  };

  const handleEditDrawerClose = useCallback(() => {
    // Cancel ongoing operation
    if (editDrawerOperation.current) {
      editDrawerOperation.current.cancelled = true;
      editDrawerOperation.current = null;
    }

    // Reset states immediately
    setIsEditDrawerVisible(false);
    setClassToEdit(null);
    setDetailsLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      if (editDrawerOperation.current) {
        editDrawerOperation.current.cancelled = true;
      }
    };
  }, []);

  const showEditDrawer = useCallback(async (classItem) => {
    // Cancel any existing operation
    if (editDrawerOperation.current) {
      editDrawerOperation.current.cancelled = true;
    }

    // Create new operation tracker
    const operation = { cancelled: false };
    editDrawerOperation.current = operation;

    try {
      // Open drawer immediately and show loading state
      setIsEditDrawerVisible(true);
      setDetailsLoading(true);
      setClassToEdit(null); // Clear previous data immediately

      const response = await classManagementService.getClassDetails(
        classItem.classId
      );

      // Check if operation was cancelled
      if (operation.cancelled) {
        return;
      }

      if (response.success) {
        setClassToEdit(response.data);
      } else {
        message.error(
          response.error || "Failed to fetch class details for editing"
        );
        setIsEditDrawerVisible(false);
        setClassToEdit(null);
      }
    } catch (error) {
      // Only show error if operation wasn't cancelled
      if (!operation.cancelled) {
        message.error("An error occurred while fetching class details.");
        setIsEditDrawerVisible(false);
        setClassToEdit(null);
      }
    } finally {
      // Only update loading state if operation wasn't cancelled
      if (!operation.cancelled) {
        setDetailsLoading(false);
      }

      // Clear operation reference if it's still the current one
      if (editDrawerOperation.current === operation) {
        editDrawerOperation.current = null;
      }
    }
  }, []);

  const handleEditSuccess = useCallback(
    (updatedClassData) => {
      // Refresh the main list
      fetchClasses(filterParams, pagination, sortedInfo);

      // If the detail drawer is open for the same class, update its data
      if (
        isDetailDrawerVisible &&
        selectedClassDetails?.classId === updatedClassData.classId
      ) {
        setSelectedClassDetails(updatedClassData);
      }

      // Refresh stats
      fetchStats();
    },
    [
      filterParams,
      pagination,
      sortedInfo,
      fetchClasses,
      fetchStats,
      isDetailDrawerVisible,
      selectedClassDetails,
    ]
  );

  const showClassDetails = useCallback(async (classItem) => {
    try {
      setIsDetailDrawerVisible(true);
      setDetailsLoading(true);
      setSelectedClassDetails(null); // Clear previous data immediately

      const response = await classManagementService.getClassDetails(
        classItem.classId
      );

      if (response.success) {
        setSelectedClassDetails(response.data);
      } else {
        message.error(response.error || "Failed to fetch details");
        setIsDetailDrawerVisible(false);
      }
    } catch (error) {
      message.error("Error fetching details");
      setIsDetailDrawerVisible(false);
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const showLockModal = (classItem) => {
    setClassToModify(classItem);
    setIsLockModalVisible(true);
    lockForm.resetFields();
  };
  const showMessageModal = (classItem) => {
    setClassToModify(classItem);
    setIsMessageModalVisible(true);
    messageForm.resetFields();
  };
  const handleLockSubmit = async () => {
    if (!classToModify) return;
    try {
      const values = await lockForm.validateFields();
      const newStatus =
        classToModify.status === "active" ? "suspended" : "active";
      handleUpdateClassStatus(classToModify.classId, newStatus, values.reason);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };
  const refreshData = () => {
    fetchClasses(filterParams, { ...pagination, current: 1 }, sortedInfo);
    fetchStats();
  };

  const columns = [
    {
      title: "Class",
      key: "class",
      width: 300,
      fixed: "left",
      render: (_, c) => (
        <Space>
          <Avatar
            shape="square"
            size={48}
            src={c.images?.[0]?.image_thumb_url}
            style={{
              backgroundColor: getCategoryColor(c.category),
              borderRadius: 8,
            }}
          >
            {c.title?.[0]}
          </Avatar>
          <div>
            <Text strong style={{ display: "block" }}>
              {c.title}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {c.business_name || "N/A"}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      width: 180,
      render: (loc) => (
        <Space>
          <MapPin size={14} style={{ color: colors.textSecondary }} />
          <span>{loc || "N/A"}</span>
        </Space>
      ),
    },
    {
      title: "Category",
      key: "category",
      width: 150,
      render: (_, c) => (
        <Tag color={getCategoryColor(c.category)}>
          {getCategoryName(c.category)}
        </Tag>
      ),
    },
    {
      title: "Price",
      dataIndex: "price_range",
      key: "price",
      width: 150,
      sorter: true,
      columnKey: "min_price",
      render: (pr) =>
        pr
          ? pr.single_price
            ? formatCurrency(pr.min)
            : `${formatCurrency(pr.min)} - ${formatCurrency(pr.max)}`
          : "N/A",
    },
    {
      title: "Rating",
      dataIndex: "average_rating",
      key: "rating",
      width: 140,
      sorter: true,
      columnKey: "average_rating",
      render: (rating, c) =>
        rating ? (
          <Space>
            <Star size={14} fill="#ffc107" color="#ffc107" />
            <span>
              {rating.toFixed(1)}{" "}
              <Text type="secondary">({c.review_count})</Text>
            </span>
          </Space>
        ) : (
          <Text type="secondary">No reviews</Text>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (s) => <StatusBadge status={s} />,
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item
                key="1"
                icon={<Eye size={14} />}
                onClick={() => showClassDetails(record)}
              >
                View Details
              </Menu.Item>
              <Menu.Item
                key="2"
                icon={<Edit size={14} />}
                onClick={() => showEditDrawer(record)}
              >
                Edit Class
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                key="3"
                icon={<MessageSquare size={14} />}
                onClick={() => showMessageModal(record)}
              >
                Message Business
              </Menu.Item>
              <Menu.Item
                key="4"
                icon={<Lock size={14} />}
                danger={record.status === "active"}
                onClick={() => showLockModal(record)}
              >
                {record.status === "active" ? "Suspend" : "Activate"}
              </Menu.Item>
            </Menu>
          }
        >
          <Button icon={<MoreHorizontal size={16} />} />
        </Dropdown>
      ),
    },
  ];

  const renderMobileCard = (item) => (
    <MobileCard key={item.classId}>
      <MobileCardContent>
        <MobileCardHeader>
          <Avatar
            shape="square"
            size={48}
            src={item.images?.[0]?.image_thumb_url}
            style={{
              backgroundColor: getCategoryColor(item.category),
              borderRadius: 8,
            }}
          >
            {item.title?.[0]}
          </Avatar>
          <MobileCardInfo>
            <ClassName>{item.title}</ClassName>
            <BusinessName>{item.business_name}</BusinessName>
          </MobileCardInfo>
        </MobileCardHeader>
        <MobileCardRow>
          <MobileCardLabel>Category</MobileCardLabel>
          <MobileCardValue>
            <Tag color={getCategoryColor(item.category)}>
              {getCategoryName(item.category)}
            </Tag>
          </MobileCardValue>
        </MobileCardRow>
        <MobileCardRow>
          <MobileCardLabel>Rating</MobileCardLabel>
          <MobileCardValue>
            <Space align="center">
              <Star size={14} fill="#ffc107" color="#ffc107" />
              <span>
                {item.average_rating?.toFixed(1) || "N/A"} ({item.review_count})
              </span>
            </Space>
          </MobileCardValue>
        </MobileCardRow>
        <MobileCardRow>
          <MobileCardLabel>Status</MobileCardLabel>
          <MobileCardValue>
            <StatusBadge status={item.status} />
          </MobileCardValue>
        </MobileCardRow>
        <MobileCardFooter>
          <Button
            size="middle"
            icon={<Edit size={14} />}
            onClick={() => showEditDrawer(item)}
            style={{ flex: 1 }}
          >
            Edit
          </Button>
          <Button
            type="primary"
            size="middle"
            icon={<Eye size={14} />}
            onClick={() => showClassDetails(item)}
            style={{ flex: 1 }}
          >
            Details
          </Button>
        </MobileCardFooter>
      </MobileCardContent>
    </MobileCard>
  );

  const statCardsData = [
    {
      title: "Total Classes",
      value: classStats.totalClasses,
      icon: List,
      color: colors.info,
      footer: "Platform-wide",
    },
    {
      title: "Active",
      value: classStats.activeClasses,
      icon: CheckCircle,
      color: colors.success,
      footer: "Visible & bookable",
    },
    {
      title: "Featured",
      value: classStats.featuredClasses,
      icon: Award,
      color: "#8b5cf6",
      footer: "Promoted listings",
    },
  ];

  return (
    <ConfigProvider theme={appTheme}>
      <DashboardWrapper>
        <DashboardHeader>
          <div>
            <PageTitle>Class Management</PageTitle>
            <HeaderSubtitle>
              Monitor, manage, and moderate all classes across the platform.
            </HeaderSubtitle>
          </div>
          <ActionButtonsContainer>
            <ExportButton icon={<Download size={16} />}>
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
              loading={loading}
            >
              {!isMobile && "Refresh"}
            </RefreshButton>
          </ActionButtonsContainer>
        </DashboardHeader>

        <Divider />

        <StatsGrid>
          {statCardsData.map((stat) => (
            <StatCard key={stat.title}>
              {statsLoading ? (
                <Skeleton active paragraph={{ rows: 2 }} />
              ) : (
                <>
                  <StatCardHeader>
                    <IconContainer
                      color={stat.color}
                      background={hexToRgba(stat.color, 0.1)}
                    >
                      <stat.icon size={18} />
                    </IconContainer>
                  </StatCardHeader>
                  <StatValue>{stat.value ?? "..."}</StatValue>
                  <div>
                    <StatLabel>{stat.title}</StatLabel>
                    <StatFooter>{stat.footer}</StatFooter>
                  </div>
                </>
              )}
            </StatCard>
          ))}
        </StatsGrid>

        <Divider />

        <TableSection>
          <TableHeader>
            <TableTitle>
              <List /> All Classes
            </TableTitle>
            <TableDescription>
              Search, filter, and take action on individual class listings.
            </TableDescription>
          </TableHeader>
          <FilterBar>
            <SearchFilterContainer>
              <Input
                placeholder="Search classes or businesses"
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                style={{ width: isMobile ? "100%" : 280 }}
                allowClear
              />
              <Select
                value={filterParams.category_id}
                style={{ width: isMobile ? "100%" : 180 }}
                onChange={(val) => handleFilterChange({ category_id: val })}
              >
                <Option value="all">All Categories</Option>
                {categories.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.name}
                  </Option>
                ))}
              </Select>
              <Select
                value={filterParams.status}
                style={{ width: isMobile ? "100%" : 150 }}
                onChange={(val) => handleFilterChange({ status: val })}
              >
                <Option value="all">All Statuses</Option>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="suspended">Suspended</Option>
              </Select>
              <Checkbox
                checked={filterParams.featured}
                onChange={(e) =>
                  handleFilterChange({ featured: e.target.checked })
                }
              >
                Featured Business
              </Checkbox>
            </SearchFilterContainer>
          </FilterBar>

          {isMobile ? (
            <div style={{ padding: "8px" }}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 5 }} />
              ) : classes.length > 0 ? (
                <>
                  {classes.map(renderMobileCard)}
                  {pagination.total > pagination.pageSize && (
                    <div style={{ textAlign: "center", marginTop: "20px" }}>
                      <Button
                        onClick={() =>
                          handleTableChange({
                            ...pagination,
                            current: pagination.current + 1,
                          })
                        }
                        disabled={
                          pagination.current * pagination.pageSize >=
                          pagination.total
                        }
                      >
                        Load More
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <Empty description="No classes found." />
              )}
            </div>
          ) : (
            <StyledTable
              columns={columns}
              dataSource={classes}
              rowKey="classId"
              pagination={pagination}
              onChange={handleTableChange}
              scroll={{ x: "max-content" }}
              loading={{
                spinning: loading,
                indicator: <GlobalLoaderWithInlineStyles />,
              }}
            />
          )}
        </TableSection>

        <AdminClassEditDrawer
          visible={isEditDrawerVisible}
          onClose={handleEditDrawerClose}
          classData={classToEdit} // This will be null while loading, which is handled in the drawer
          onSuccess={handleEditSuccess}
        />

        <ClassDetailDrawer
          isVisible={isDetailDrawerVisible}
          onClose={() => setIsDetailDrawerVisible(false)}
          classData={selectedClassDetails}
          isLoading={detailsLoading}
          isMobile={isMobile}
          onShowMessageModal={showMessageModal}
          onShowLockModal={showLockModal}
        />

        <Modal
          title={`Confirm ${
            classToModify?.status === "active" ? "Suspension" : "Activation"
          }`}
          open={isLockModalVisible}
          onCancel={() => setIsLockModalVisible(false)}
          footer={[
            <Button key="back" onClick={() => setIsLockModalVisible(false)}>
              Cancel
            </Button>,
            <Button
              key="submit"
              type="primary"
              danger={classToModify?.status === "active"}
              onClick={handleLockSubmit}
            >
              {classToModify?.status === "active"
                ? "Suspend Class"
                : "Activate Class"}
            </Button>,
          ]}
          destroyOnClose
        >
          {classToModify && (
            <Form form={lockForm} layout="vertical">
              <Paragraph>
                You are about to{" "}
                <strong>
                  {classToModify.status === "active" ? "suspend" : "activate"}
                </strong>{" "}
                the class: <strong>{classToModify.title}</strong>
              </Paragraph>
              <Form.Item
                name="reason"
                label="Reason (Internal Note)"
                rules={[{ required: true, message: "Please provide a reason" }]}
              >
                <Input.TextArea rows={4} />
              </Form.Item>
            </Form>
          )}
        </Modal>

        <Modal
          title="Message Business"
          open={isMessageModalVisible}
          onCancel={() => setIsMessageModalVisible(false)}
          onOk={() => message.info("Message sending not implemented.")}
          okText="Send Message"
          destroyOnClose
        >
          {classToModify && (
            <Form form={messageForm} layout="vertical">
              <Paragraph>
                Sending message to{" "}
                <strong>{classToModify.business_name}</strong> about class:{" "}
                <strong>{classToModify.title}</strong>
              </Paragraph>
              <Form.Item
                name="message"
                label="Message"
                rules={[{ required: true }]}
              >
                <Input.TextArea rows={6} />
              </Form.Item>
            </Form>
          )}
        </Modal>
      </DashboardWrapper>
    </ConfigProvider>
  );
}
