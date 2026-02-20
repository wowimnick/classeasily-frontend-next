"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import styled, { keyframes } from "styled-components";
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
  Typography,
  Tooltip,
  Tag,
  Space,
  Divider,
  Card,
  Skeleton,
  List,
  message,
  Grid,
  Rate,
  Checkbox,
  Popover,
  Popconfirm,
  Badge,
} from "antd";
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
  LogIn,
  BookOpen,
  User as UserIcon,
  Tag as TagIcon,
  Calendar,
  ShieldAlert,
  Edit,
  List as ListIcon,
  FileText,
  X,
  Layers,
  CheckCircle,
  HelpCircle,
  XCircle,
  Briefcase,
  DollarSign,
  Plus,
} from "lucide-react";
import { classManagementService, userAdminService } from "@/services/adminDash";
import { useAuthStore } from "@/lib/auth-client";
import { theme as appTheme } from "@/components/theme";
import { GlobalLoaderWithInlineStyles } from "@/components/common/GlobalLoader";
import { LordIcon } from "@/services/ReactUtils";
import AdminClassEditDrawer from "./AdminClassEditDrawer";
import { Drawer } from "vaul";
import moment from "moment";
import { motion } from "framer-motion";

const { Option } = Select;
const { useBreakpoint } = Grid;
const { Text, Title, Paragraph } = Typography;

// --- STYLING & THEME ---
const colors = {
  primary: "#ff385c",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  lightBg: "#f8fafc",
  border: "#f1f5f9",
  textPrimary: "#1f2937",
  textSecondary: "#6b7280",
  textTertiary: "#94a3b8",
};

const hexToRgba = (hex, alpha = 1) => {
  if (!hex?.slice) return `rgba(100, 116, 139, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0px); }
`;

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

// --- NEW VAUL DRAWER STYLES ---
const StyledDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
`;
const StyledDrawerContent = styled(Drawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  height: 90%;
  max-height: 90vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
`;
const DrawerHandle = styled.div`
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;
const DesktopDrawerContent = styled(Drawer.Content)`
  right: 8px;
  top: 8px;
  bottom: 8px;
  position: fixed;
  z-index: 1050;
  outline: none;
  width: 680px;
  display: flex;
`;
const DesktopDrawerInner = styled.div`
  background: white;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
`;
const DrawerHeader = styled.div`
  background: white;
  border-bottom: 1px solid ${colors.border};
  padding: 20px 24px;
  border-radius: 16px 16px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;
const DrawerHeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${colors.textPrimary};
  font-size: 20px;
  font-weight: 600;
`;
const CloseButton = styled(Button)`
  padding: 8px;
  height: auto;
  border: none;
  background: none;
  &:hover {
    background: ${colors.border};
  }
`;
const DrawerContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  overflow: hidden;
`;
const HeaderSection = styled.div`
  background-color: white;
  padding: 24px;
  border-bottom: 1px solid ${colors.border};
  display: flex;
  align-items: center;
  gap: 16px;
  animation: ${fadeIn} 0.3s ease-out;
`;
const ClassAvatar = styled(Avatar)`
  width: 60px !important;
  height: 60px !important;
  border-radius: 12px !important;
  flex-shrink: 0;
`;
const ContentBody = styled.div`
  padding: 24px;
  flex: 1;
  overflow-y: auto;
  animation: ${fadeIn} 0.5s 0.1s ease-out both;
`;
const InfoGroup = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  margin-bottom: 20px;
  &:last-child {
    margin-bottom: 0;
  }
`;
const InfoGroupTitle = styled(Title).attrs({ level: 5 })`
  color: ${colors.textPrimary};
  margin-bottom: 16px !important;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 16px !important;
  svg {
    color: ${colors.primary};
    width: 18px;
    height: 18px;
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
const LoaderWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 40px;
`;
const StyledScheduleTable = styled(Table)`
  .ant-table-thead > tr > th {
    background: #fafbfc;
    font-weight: 600;
    font-size: 13px;
  }
`;

// --- MODAL & TABLE STYLES ---
const EnhancedModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 16px;
    overflow: hidden;
  }
  .ant-modal-header {
    border-bottom: 1px solid ${colors.border};
    padding: 20px 24px;
    background: ${colors.lightBg};
  }
  .ant-modal-title {
    font-weight: 600;
    font-size: 18px;
    color: ${colors.textPrimary};
  }
  .ant-modal-body {
    padding: 24px;
  }
  .ant-modal-footer {
    border-top: 1px solid ${colors.border};
    padding: 16px 24px;
  }
`;

const EnhancedStyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    font-weight: 600;
    color: #475569;
    font-size: 13px;
    padding: 16px 20px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    &:first-child {
      border-top-left-radius: 12px;
    }
    &:last-child {
      border-top-right-radius: 12px;
    }
  }
  .ant-table-tbody > tr > td {
    padding: 16px 20px;
    border-bottom: 1px solid ${colors.border};
    font-size: 14px;
    transition: all 0.2s;
  }
  .ant-table-tbody > tr {
    transition: all 0.2s;
    &:hover > td {
      background: #f8fafc;
    }
    &:last-child > td {
      border-bottom: none;
    }
  }
  .ant-table-cell-row-hover {
    background: transparent !important;
  }
  .ant-empty {
    padding: 60px 20px;
  }
  .ant-pagination {
    margin: 24px 24px;
  }
`;

// --- UTILITY FUNCTIONS & COMPONENTS ---
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value ?? 0
  );
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

// --- NEW SCHEDULE TABLE COLUMNS ---
const scheduleColumns = (themeTokens) => [
  {
    title: "Schedule",
    key: "schedule",
    render: (_, record) => (
      <div>
        <Text strong>
          {record.date
            ? moment(record.date).format("ddd, MMM D, YYYY")
            : record.day}
        </Text>
        <Text type="secondary" style={{ display: "block", fontSize: "13px" }}>
          {record.time
            ? moment(record.time, "HH:mm:ss").format("h:mm A")
            : "N/A"}
        </Text>
      </div>
    ),
  },
  {
    title: "Duration",
    dataIndex: "duration",
    key: "duration",
    render: (duration) => `${duration || "N/A"} min`,
  },
  {
    title: "Price",
    dataIndex: "price",
    key: "price",
    render: (price) => (
      <Text strong style={{ color: themeTokens.colorPrimary }}>
        {formatCurrency(price)}
      </Text>
    ),
  },
  {
    title: "Capacity",
    dataIndex: "maxParticipants",
    key: "maxParticipants",
    align: "center",
    render: (p) => p || "N/A",
  },
];

// --- REBUILT DETAIL DRAWER CONTENT ---
const ClassDetailDrawerContent = ({ classData, onShowLockModal }) => {
  const [selectedOptionId, setSelectedOptionId] = useState(
    classData?.options?.[0]?.optionId || null
  );
  const selectedOption = classData?.options?.find(
    (opt) => opt.optionId === selectedOptionId
  );

  return (
    <>
      <HeaderSection>
        <ClassAvatar
          shape="square"
          size={60}
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
      </HeaderSection>
      <ContentBody>
        <InfoGroup>
          <InfoGroupTitle>
            <Zap /> Class Overview
          </InfoGroupTitle>
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

        <InfoGroup>
          <InfoGroupTitle>
            <ListIcon /> Options & Schedules
          </InfoGroupTitle>
          {classData.options?.length > 1 && (
            <Space wrap style={{ marginBottom: "20px" }}>
              {classData.options.map((opt) => (
                <Button
                  key={opt.optionId}
                  type={
                    selectedOptionId === opt.optionId ? "primary" : "default"
                  }
                  onClick={() => setSelectedOptionId(opt.optionId)}
                >
                  {opt.parent_class_title}
                </Button>
              ))}
            </Space>
          )}
          {selectedOption ? (
            <>
              <InfoGrid style={{ marginBottom: "20px" }}>
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
                      {selectedOption.cancellationRefundPercentage}% refund over{" "}
                      {selectedOption.cancellationPolicy === "custom" &&
                      selectedOption.cancellationCustomHours
                        ? `${formatHoursForDisplay(
                            selectedOption.cancellationCustomHours
                          )} notice`
                        : capitalizeWords(selectedOption.cancellationPolicy)}
                    </InfoValue>
                  </InfoContent>
                </InfoItem>
              </InfoGrid>
              <StyledScheduleTable
                dataSource={selectedOption.schedules}
                columns={scheduleColumns(appTheme.token)}
                rowKey="id"
                pagination={{ pageSize: 5, size: "small" }}
                size="middle"
              />
            </>
          ) : (
            <Empty description="No class options have been created yet." />
          )}
        </InfoGroup>

        <InfoGroup>
          <InfoGroupTitle>
            <Star /> Reviews ({classData.reviews?.length || 0})
          </InfoGroupTitle>
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
        </InfoGroup>

        <InfoGroup>
          <InfoGroupTitle>
            <ShieldAlert /> Moderation
          </InfoGroupTitle>
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
            {classData.status === "active" ? "Suspend Class" : "Activate Class"}
          </Button>
        </InfoGroup>
      </ContentBody>
    </>
  );
};

// --- REBUILT DETAIL DRAWER COMPONENT ---
const ClassDetailDrawer = ({
  isVisible,
  onClose,
  classData,
  isLoading,
  onShowLockModal,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  const renderDrawerContent = () => (
    <>
      <DrawerHeader>
        <DrawerHeaderTitle>
          <FileText size={20} />
          <span>Class Details</span>
        </DrawerHeaderTitle>
        <CloseButton icon={<X size={20} />} onClick={onClose} />
      </DrawerHeader>
      <DrawerContentContainer>
        {isLoading ? (
          <LoaderWrapper>
            <GlobalLoaderWithInlineStyles />
          </LoaderWrapper>
        ) : classData ? (
          <ClassDetailDrawerContent
            classData={classData}
            onShowLockModal={onShowLockModal}
          />
        ) : (
          <Empty description="Could not load class details." />
        )}
      </DrawerContentContainer>
    </>
  );

  return (
    <ConfigProvider theme={appTheme}>
      {isMobile ? (
        <Drawer.Root
          open={isVisible}
          onOpenChange={(open) => !open && onClose()}
        >
          <Drawer.Portal>
            <StyledDrawerOverlay />
            <StyledDrawerContent>
              <DrawerHandle />
              {renderDrawerContent()}
            </StyledDrawerContent>
          </Drawer.Portal>
        </Drawer.Root>
      ) : (
        <Drawer.Root
          open={isVisible}
          onOpenChange={(open) => !open && onClose()}
          direction="right"
          dismissible
        >
          <Drawer.Portal>
            <StyledDrawerOverlay />
            <DesktopDrawerContent>
              <DesktopDrawerInner>{renderDrawerContent()}</DesktopDrawerInner>
            </DesktopDrawerContent>
          </Drawer.Portal>
        </Drawer.Root>
      )}
    </ConfigProvider>
  );
};

export default function ClassListings() {
  const router = useRouter();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isEditDrawerVisible, setIsEditDrawerVisible] = useState(false);
  const [classToEdit, setClassToEdit] = useState(null);
  const editDrawerOperation = useRef(null);
  const [filterParams, setFilterParams] = useState({
    search: "",
    status: "all",
    featured: false,
  });
  const [selectedClassDetails, setSelectedClassDetails] = useState(null);
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [isLockModalVisible, setIsLockModalVisible] = useState(false);
  const [classToModify, setClassToModify] = useState(null);
  const [lockForm] = Form.useForm();
  const [allCollections, setAllCollections] = useState([]);
  const [classStats, setClassStats] = useState({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [sortedInfo, setSortedInfo] = useState({});
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // Collection Management State
  const [isCollectionModalVisible, setIsCollectionModalVisible] =
    useState(false);
  const [selectedClassForCollections, setSelectedClassForCollections] =
    useState(null);
  const [collectionForm] = Form.useForm();
  const [collectionSaving, setCollectionSaving] = useState(false);

  // Optimizations for collection lookup
  const collectionsMap = useMemo(() => {
    const map = new Map();
    allCollections.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [allCollections]);

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

  const fetchCollections = useCallback(async () => {
    const res = await classManagementService.getCollections();
    if (res.success) {
      setAllCollections(res.data || []);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchCollections();
  }, [fetchStats, fetchCollections]);

  const handleTableChange = (newPagination, filters, sorter) => {
    const singleSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    setSortedInfo(singleSorter);
    setPagination(newPagination);
  };

  const handleUpdateClassStatus = async (classId, newStatus, reason = "") => {
    const key = "statusUpdate";
    message.loading({ content: "Updating...", key });
    try {
      const response = await classManagementService.updateClassStatus(
        classId,
        newStatus,
        reason
      );
      if (response.success) {
        message.success({ content: "Status updated!", key });
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
          key,
        });
      }
    } catch (error) {
      message.error({ content: "An error occurred", key });
    }
  };

  const handleEditDrawerClose = useCallback(() => {
    if (editDrawerOperation.current) {
      editDrawerOperation.current.cancelled = true;
      editDrawerOperation.current = null;
    }
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
    if (editDrawerOperation.current) {
      editDrawerOperation.current.cancelled = true;
    }
    const operation = { cancelled: false };
    editDrawerOperation.current = operation;

    try {
      setIsEditDrawerVisible(true);
      setDetailsLoading(true);
      setClassToEdit(null);

      const response = await classManagementService.getClassDetails(
        classItem.classId
      );

      if (operation.cancelled) return;

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
      if (!operation.cancelled) {
        message.error("An error occurred while fetching class details.");
        setIsEditDrawerVisible(false);
        setClassToEdit(null);
      }
    } finally {
      if (!operation.cancelled) {
        setDetailsLoading(false);
      }
      if (editDrawerOperation.current === operation) {
        editDrawerOperation.current = null;
      }
    }
  }, []);

  const handleEditSuccess = useCallback(
    (updatedClassData) => {
      fetchClasses(filterParams, pagination, sortedInfo);
      if (
        isDetailDrawerVisible &&
        selectedClassDetails?.classId === updatedClassData.classId
      ) {
        setSelectedClassDetails(updatedClassData);
      }
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
      setSelectedClassDetails(null);

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
    // If we are just activating, do it via confirm (no modal needed usually for simple activation)
    // But since "Suspension" requires a reason, we keep the modal for that logic mostly.
    // However, if the user explicitly clicked "Suspend" in dropdown, we show modal.
    setClassToModify(classItem);
    setIsLockModalVisible(true);
    lockForm.resetFields();
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
    fetchCollections();
  };

  const handleLoginAsOwner = async (ownerId) => {
    try {
      const result = await userAdminService.impersonateUser(ownerId);
      if (result.success && result.data?.user) {
        useAuthStore.setState({
          user: result.data.user,
          isAuthenticated: true,
          isImpersonating: true,
          isLoading: false,
        });
        message.success("Now logged in as business owner. Add schedules, then use the banner to return to admin.");
        router.push("/");
      } else {
        message.error(result.error || "Could not log in as user.");
      }
    } catch (e) {
      console.error("Impersonation error:", e);
      message.error("An unexpected error occurred.");
    }
  };

  // --- Collection Modal Handlers ---
  const openCollectionModal = (record) => {
    setSelectedClassForCollections(record);
    const currentIds = record.collections
      ? record.collections.map((c) => (typeof c === "object" ? c.id : c))
      : [];
    collectionForm.setFieldsValue({ collections: currentIds });
    setIsCollectionModalVisible(true);
  };

  const handleSaveCollections = async () => {
    try {
      const values = await collectionForm.validateFields();
      setCollectionSaving(true);

      const response = await classManagementService.updateClass(
        selectedClassForCollections.classId,
        { collections: values.collections }
      );

      if (response.success) {
        message.success("Collections updated successfully");
        setIsCollectionModalVisible(false);
        refreshData();
      } else {
        message.error(response.error || "Failed to update collections");
      }
    } catch (e) {
      console.error("Save collections error:", e);
    } finally {
      setCollectionSaving(false);
    }
  };

  // --- Render Collections Cell ---
  const renderCollectionsCell = (record) => {
    const classCollections = record.collections || [];

    if (classCollections.length === 0) {
      return (
        <Tooltip title="Click to add to collections">
          <Tag
            style={{
              borderStyle: "dashed",
              background: "transparent",
              cursor: "pointer",
              color: colors.textSecondary,
            }}
            onClick={(e) => {
              e.stopPropagation();
              openCollectionModal(record);
            }}
          >
            <Plus
              size={10}
              style={{ marginRight: 4, verticalAlign: "middle" }}
            />{" "}
            Add
          </Tag>
        </Tooltip>
      );
    }

    // Map IDs to Names safely
    const names = classCollections.map((c) => {
      if (typeof c === "object") return c.name;
      return collectionsMap.get(c) || "Unknown Collection";
    });

    const content = (
      <div style={{ maxWidth: 250 }}>
        <Text
          strong
          style={{
            display: "block",
            marginBottom: 8,
            borderBottom: `1px solid ${colors.border}`,
            paddingBottom: 4,
          }}
        >
          Assigned Collections
        </Text>
        <Space wrap size={[0, 6]}>
          {names.map((name, idx) => (
            <Tag key={idx} color="blue">
              {name}
            </Tag>
          ))}
        </Space>
      </div>
    );

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Popover
          content={content}
          title={null}
          trigger="hover"
          placement="topLeft"
        >
          <div
            style={{ display: "flex", alignItems: "center", cursor: "default" }}
          >
            <Tag
              color="blue"
              style={{
                margin: 0,
                maxWidth: 110,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {names[0]}
            </Tag>
            {names.length > 1 && (
              <Badge
                count={`+${names.length - 1}`}
                style={{
                  backgroundColor: colors.lightBg,
                  color: colors.textSecondary,
                  border: `1px solid ${colors.border}`,
                  marginLeft: 4,
                }}
              />
            )}
          </div>
        </Popover>

        <Button
          type="text"
          size="small"
          icon={<Edit size={14} />}
          style={{ color: colors.textSecondary }}
          onClick={(e) => {
            e.stopPropagation();
            openCollectionModal(record);
          }}
        />
      </div>
    );
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
              backgroundColor: colors.border,
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
      title: "Collections",
      key: "collections",
      width: 190,
      render: (_, record) => renderCollectionsCell(record),
    },
    {
      title: "Price",
      dataIndex: "price_range",
      key: "min_price",
      width: 150,
      sorter: true,
      columnKey: "min_price",
      sortOrder: sortedInfo.columnKey === "min_price" ? sortedInfo.order : null,
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
      key: "average_rating",
      width: 140,
      sorter: true,
      columnKey: "average_rating",
      sortOrder:
        sortedInfo.columnKey === "average_rating" ? sortedInfo.order : null,
      render: (rating, c) =>
        rating > 0 ? (
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
      sorter: true,
      columnKey: "status",
      sortOrder: sortedInfo.columnKey === "status" ? sortedInfo.order : null,
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
              <Menu.Item
                key="3"
                icon={<Layers size={14} />}
                onClick={() => openCollectionModal(record)}
              >
                Manage Collections
              </Menu.Item>
              <Menu.Divider />
              {/* Frictionless Activation vs Modal Suspension */}
              {record.status !== "active" ? (
                <Menu.Item key="4">
                  <Popconfirm
                    title="Activate this class?"
                    description="This will make the class visible to the public."
                    onConfirm={() =>
                      handleUpdateClassStatus(
                        record.classId,
                        "active",
                        "Manual activation via admin list"
                      )
                    }
                    okText="Activate"
                    cancelText="Cancel"
                    placement="left"
                  >
                    <Space>
                      <Unlock size={14} color={colors.success} />
                      <span style={{ color: colors.success }}>Activate</span>
                    </Space>
                  </Popconfirm>
                </Menu.Item>
              ) : (
                <Menu.Item
                  key="4"
                  icon={<Lock size={14} />}
                  danger
                  onClick={() => showLockModal(record)}
                >
                  Suspend
                </Menu.Item>
              )}
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
              backgroundColor: colors.border,
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
          <MobileCardLabel>Collections</MobileCardLabel>
          <MobileCardValue
            style={{ display: "flex", justifyContent: "flex-end" }}
          >
            {renderCollectionsCell(item)}
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
      icon: BookOpen,
      color: colors.primary,
      footer: `${classStats.activeClasses || 0} active`,
    },
    {
      title: "Average Rating",
      value: classStats.averageRating?.toFixed(1) || "0.0",
      icon: Star,
      color: colors.warning,
      footer: `${classStats.totalReviews || 0} reviews (${
        classStats.platformReviews || 0
      } platform + ${classStats.googleReviews || 0} Google)`,
    },
    {
      title: "Categories",
      value: classStats.totalCategories,
      icon: TagIcon,
      color: colors.info,
      footer: `${classStats.totalSubcategories || 0} subcategories`,
    },
    {
      title: "Schedule Warnings",
      value: classStats.scheduleWarningsCount || 0,
      icon: ShieldAlert,
      color:
        classStats.scheduleWarningsCount > 0 ? colors.error : colors.success,
      footer:
        classStats.scheduleWarningsCount > 0
          ? "Classes need attention"
          : "All schedules healthy",
    },
  ];

  const renderScheduleWarnings = () => {
    if (
      !classStats.classesWithLowSchedules ||
      classStats.classesWithLowSchedules.length === 0
    ) {
      return null;
    }
    return (
      <Card
        style={{
          borderRadius: "16px",
          border: `1px solid ${colors.border}`,
          marginTop: "24px",
        }}
        bodyStyle={{ paddingTop: 16 }}
      >
        <Card.Meta
          avatar={
            <IconContainer
              color={colors.warning}
              background={hexToRgba(colors.warning, 0.1)}
            >
              <ShieldAlert size={20} />
            </IconContainer>
          }
          title={
            <Title level={5} style={{ margin: 0 }}>
              Schedule Attention Needed
            </Title>
          }
          description={`${classStats.scheduleWarningsCount} ${
            classStats.scheduleWarningsCount === 1 ? "class is" : "classes are"
          } running out of scheduled dates.`}
        />
        <List
          itemLayout="horizontal"
          dataSource={classStats.classesWithLowSchedules}
          pagination={{ pageSize: 4, size: "small" }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key="view"
                  type="primary"
                  ghost
                  onClick={() =>
                    showClassDetails({
                      classId: item.classId,
                      title: item.title,
                    })
                  }
                >
                  View Class
                </Button>,
                item.ownerId && (
                  <Button
                    key="login-as"
                    icon={<LogIn size={14} />}
                    onClick={() => handleLoginAsOwner(item.ownerId)}
                  >
                    Login as them
                  </Button>
                ),
              ].filter(Boolean)}
              style={{ paddingLeft: 0, paddingRight: 0 }}
            >
              <List.Item.Meta
                title={<Text strong>{item.title}</Text>}
                description={
                  <Space size="middle" wrap>
                    <Text type="secondary">
                      <Briefcase size={12} style={{ marginRight: 4 }} />
                      {item.businessName}
                    </Text>
                    <Text type="secondary">
                      <Calendar size={12} style={{ marginRight: 4 }} />
                      {item.lastScheduleDate
                        ? `Last on ${new Date(
                            item.lastScheduleDate
                          ).toLocaleDateString()}`
                        : "No future dates"}
                    </Text>
                    <Text type="danger" strong>
                      {item.daysRemaining > 0
                        ? `${item.daysRemaining} ${
                            item.daysRemaining === 1 ? "day" : "days"
                          } left`
                        : "Expired"}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
          style={{ marginTop: "8px" }}
        />
      </Card>
    );
  };

  return (
    <ConfigProvider theme={{ token: appTheme }}>
      <DashboardWrapper>
        <DashboardHeader>
          <div>
            <PageTitle>Class Management</PageTitle>
            <HeaderSubtitle>
              Monitor, manage, and moderate all classes across the platform.
            </HeaderSubtitle>
          </div>
          <ActionButtonsContainer>
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

        {!statsLoading && renderScheduleWarnings()}

        <Divider />

        <TableSection>
          <TableHeader>
            <TableTitle>
              <ListIcon /> All Classes
            </TableTitle>
            <TableDescription>
              Search, filter, and take action on individual class listings.
            </TableDescription>
          </TableHeader>
          <FilterBar>
            <SearchFilterContainer>
              <Input
                prefix={
                  <Search size={16} style={{ color: colors.textSecondary }} />
                }
                placeholder="Search classes or businesses..."
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                style={{ width: isMobile ? "100%" : 280 }}
                allowClear
              />
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
            <EnhancedStyledTable
              columns={columns}
              dataSource={classes}
              rowKey="classId"
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} classes`,
              }}
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
          classData={classToEdit}
          onSuccess={handleEditSuccess}
        />

        <ClassDetailDrawer
          isVisible={isDetailDrawerVisible}
          onClose={() => setIsDetailDrawerVisible(false)}
          classData={selectedClassDetails}
          isLoading={detailsLoading}
          onShowLockModal={showLockModal}
        />

        {/* Collection Management Modal */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Layers size={20} color={colors.primary} />
              <span>
                Manage Collections for: {selectedClassForCollections?.title}
              </span>
            </div>
          }
          open={isCollectionModalVisible}
          onCancel={() => setIsCollectionModalVisible(false)}
          onOk={handleSaveCollections}
          confirmLoading={collectionSaving}
          destroyOnClose
        >
          <Form form={collectionForm} layout="vertical">
            <Paragraph type="secondary">
              Assign this class to one or more curated collections (vibes). This
              helps students find classes based on themes like "Date Night" or
              "Beginner Friendly".
            </Paragraph>
            <Form.Item name="collections" label="Select Collections">
              <Select
                mode="multiple"
                placeholder="Select collections..."
                optionFilterProp="children"
                style={{ width: "100%" }}
                showSearch
              >
                {allCollections.map((col) => (
                  <Option key={col.id} value={col.id}>
                    {col.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        <EnhancedModal
          title={
            <Space>
              <Lock size={20} color={colors.error} />
              <span>Confirm Suspension</span>
            </Space>
          }
          open={isLockModalVisible}
          onCancel={() => setIsLockModalVisible(false)}
          footer={[
            <Button
              key="back"
              onClick={() => setIsLockModalVisible(false)}
              size="large"
            >
              Cancel
            </Button>,
            <Button
              key="submit"
              type="primary"
              danger
              onClick={handleLockSubmit}
              size="large"
            >
              Suspend Class
            </Button>,
          ]}
          destroyOnClose
          width={560}
        >
          {classToModify && (
            <Form form={lockForm} layout="vertical">
              <Alert
                message={
                  <span>
                    You are about to <strong>suspend</strong> the class:{" "}
                    <strong>{classToModify.title}</strong>
                  </span>
                }
                type="warning"
                showIcon
                style={{ marginBottom: 20 }}
              />
              <Form.Item
                name="reason"
                label="Reason for Suspension"
                rules={[{ required: true, message: "Please provide a reason" }]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="Enter the reason for this status change..."
                />
              </Form.Item>
            </Form>
          )}
        </EnhancedModal>
      </DashboardWrapper>
    </ConfigProvider>
  );
}
