"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { Drawer as VaulDrawer } from "vaul";
import { VAUL_OVERLAY_BACKDROP_BLUR } from "@/lib/vaulOverlayBlur";
import {
  Form,
  Tabs,
  Tooltip,
  Typography,
  Button,
  Empty,
  Space,
  Avatar,
  Tag,
  Popconfirm,
  Spin,
  DatePicker,
  Divider,
  Input,
  Checkbox,
  Select,
  Modal,
  Table,
  Switch,
  Dropdown,
  Menu,
  Grid,
  Segmented,
  Skeleton, // ADDED: For Skeleton Loader
} from "antd";
import message from "@/lib/message";
import {
  Search,
  Plus,
  Calendar,
  Users,
  Settings,
  Tag as TagIcon,
  ArrowRight,
  DollarSign,
  Trash2,
  EyeIcon,
  EyeOffIcon,
  X,
  AlertTriangle,
  Check,
  SettingsIcon,
  Clock,
  List,
  Image as ImageIcon,
  Info,
  Edit3,
  Filter,
  XCircle,
  Shield,
  History,
  Type,
  ChevronDown,
  Layers,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Star,
  MessageSquare,
  Undo2,
  BookOpen, // Added for Course icon
} from "lucide-react";
import styled, { css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isToday from "dayjs/plugin/isToday";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  businessClassService,
  scheduleService,
  courseService,
} from "@/services/apiService";
import ScheduleEditDrawer from "./ScheduleEditDrawer";
import ClassEditDrawer from "./ClassEditDrawer";
import DeleteClassModal from "./DeleteClassModal";
import CourseScheduleDrawer from "./CourseScheduleDrawer";
import { ClassProvider } from "../newclasses/ClassContext";
import CreateClassPage from "../newclasses/CreateClassPage";
import DashboardBreadcrumb from "../../../DashboardBreadcrumb";

dayjs.extend(isBetween);
dayjs.extend(isToday);
dayjs.extend(weekOfYear);

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { useBreakpoint } = Grid;
import { LordIcon } from "@/services/ReactUtils";

// --- ADDED: Skeleton component for mobile card view ---
const CardSkeleton = () => (
  <ClassCardStyled>
    <CardHeader>
      <Skeleton.Avatar
        active
        shape="square"
        size={48}
        style={{ borderRadius: "8px" }}
      />
      <CardContent style={{ paddingTop: "8px" }}>
        <Skeleton.Input active style={{ width: "60%", height: "20px" }} />
        <Skeleton.Input
          active
          style={{ width: "40%", height: "16px", marginTop: "8px" }}
        />
      </CardContent>
    </CardHeader>
    <CardBody>
      <Skeleton.Input active style={{ width: "120px", height: "24px" }} />
      <Skeleton.Input active style={{ width: "80px", height: "24px" }} />
    </CardBody>
    <CardFooter>
      <Skeleton.Button active style={{ width: "100%", height: "38px" }} />
    </CardFooter>
  </ClassCardStyled>
);

// --- ADDED: Skeleton component for desktop table view ---
const TableSkeleton = () => {
  const skeletonColumns = [
    {
      title: "EXPERIENCE",
      key: "class",
      width: 400,
      render: () => (
        <Space size="middle">
          <Skeleton.Avatar
            active
            shape="square"
            size={56}
            style={{ borderRadius: "8px" }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Skeleton.Input active style={{ width: 150, height: 20 }} />
            <Skeleton.Input active style={{ width: 200, height: 16 }} />
          </div>
        </Space>
      ),
    },
    {
      title: "SCHEDULE",
      key: "schedule",
      width: 350,
      render: () => (
        <Skeleton.Input
          active
          style={{ width: "80%", height: 48, borderRadius: "8px" }}
        />
      ),
    },
    {
      title: "STATUS",
      key: "status",
      width: 150,
      render: () => (
        <Skeleton.Input
          active
          style={{ width: 110, height: 40, borderRadius: "10px" }}
        />
      ),
    },
    {
      title: "ACTIONS",
      key: "actions",
      align: "right",
      width: 200,
      render: () => (
        <Space size="small">
          <Skeleton.Button active style={{ width: 140, height: 36 }} />
          <Skeleton.Button active shape="circle" style={{ width: 36 }} />
        </Space>
      ),
    },
  ];

  return (
    <TableViewWrapper>
      <Table
        rowKey="key"
        pagination={false}
        columns={skeletonColumns}
        dataSource={[...Array(5)].map((_, i) => ({ key: i }))}
      />
    </TableViewWrapper>
  );
};

// --- ADDED: Wrapper for responsive skeleton ---
const ClassManagementSkeleton = () => {
  const screens = useBreakpoint();
  const isMobileView = !screens.md;

  if (isMobileView) {
    return (
      <MobileCardContainer>
        {[...Array(3)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </MobileCardContainer>
    );
  }

  return <TableSkeleton />;
};

const getErrorMessage = (error) => {
  if (error?.response?.data) {
    const data = error.response.data;
    if (typeof data.detail === "string") return data.detail;
    if (typeof data.message === "string") return data.message;
    if (typeof data.error === "string") return data.error;
    if (typeof data === "object" && data !== null) {
      const messages = Object.entries(data).map(([key, value]) => {
        const formattedKey = key
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
        return `${formattedKey}: ${
          Array.isArray(value) ? value.join(", ") : value
        }`;
      });
      if (messages.length > 0) return messages.join("; ");
    }
  }
  if (typeof error?.error === "string") return error.error;
  if (typeof error?.detail === "string") return error.detail;
  if (error?.message) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred. Please try again.";
};

const SCHEDULE_WARNING_THRESHOLD_DAYS = 7;

const needsSchedulesWarning = (lastScheduleDate) => {
  if (!lastScheduleDate) return true;
  return dayjs(lastScheduleDate).isBefore(
    dayjs().add(SCHEDULE_WARNING_THRESHOLD_DAYS, "day"),
  );
};

// --- ADDED: New helper function to format class type info ---
const formatClassType = (bookingType) => {
  const isCourse = bookingType === "Full Course";
  return {
    label: isCourse ? "Course" : "Single Session",
    icon: isCourse ? <BookOpen size={12} /> : <Calendar size={12} />,
    color: isCourse ? "purple" : "cyan",
  };
};

// --- ADDED: New helper function to format schedule text ---
const formatScheduleInfo = (record) => {
  const isCourse = record.options?.[0]?.booking_type === "Full Course";
  if (isCourse) {
    if (!record.last_schedule_date) return "No course schedules set";
    return `Courses run until ${dayjs(record.last_schedule_date).format(
      "MMM YYYY",
    )}`;
  } else {
    if (!record.last_schedule_date) return "No sessions scheduled";
    return `Sessions available until ${dayjs(record.last_schedule_date).format(
      "MMM D, YYYY",
    )}`;
  }
};

const colors = {
  primary: "#ff385c",
  textSecondary: "#64748b",
  warning: "#f59e0b",
};

const PageContainer = styled.div`
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

const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const HeaderTextWrap = styled.div`
  flex: 1;
  min-width: 0;
`;

const HeaderTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #222222;
  margin: 0 0 4px 0;
  line-height: 1.2;
  @media (max-width: 768px) {
    font-size: 22px;
    margin-bottom: 6px;
  }
  @media (max-width: 480px) {
    font-size: 20px;
    margin-bottom: 4px;
  }
`;

const HeaderSubtitle = styled(Text)`
  font-size: 15px;
  color: ${colors.textSecondary};
  display: block;
  line-height: 1.4;
  @media (max-width: 768px) {
    font-size: 14px;
  }
  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }
`;

const StyledSegmented = styled(Segmented)`
  background: #f1f5f9;
  padding: 4px;
  border-radius: 10px;

  .ant-segmented-item {
    border-radius: 8px !important;
    transition:
      background-color 0.2s ease,
      box-shadow 0.2s ease; // More specific transitions
  }

  .ant-segmented-item-selected {
    background: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  // Prevent thumb animation from interfering
  .ant-segmented-thumb {
    transition:
      transform 0.2s ease,
      width 0.2s ease; // Control thumb animation
  }
`;

const StyledSearchInput = styled(Input)`
  width: 300px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);

  &:hover,
  &:focus {
    border-color: #ff385c;
    box-shadow: 0 0 0 2px rgba(255, 56, 92, 0.1);
  }
  .ant-input {
    font-size: 15px;
  }
  .ant-input-prefix {
    color: #9ca3af;
    margin-right: 8px;
  }

  @media (max-width: 768px) {
    width: 100%;
    height: 42px;

    .ant-input {
      font-size: 14px;
    }
  }

  @media (max-width: 480px) {
    height: 40px;

    .ant-input {
      font-size: 13px;
    }
  }
`;

const StyledSelect = styled(Select)`
  .ant-select-selector {
    height: 44px !important;
    border-radius: 12px !important;
    border: 1px solid #e5e7eb !important;
    background: white !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02) !important;
    display: flex;
    align-items: center;
  }

  &:hover .ant-select-selector,
  &.ant-select-focused .ant-select-selector {
    border-color: #ff385c !important;
    box-shadow: 0 0 0 2px rgba(255, 56, 92, 0.1) !important;
  }

  .ant-select-selection-item {
    line-height: 42px !important;
    font-size: 15px;
  }

  @media (max-width: 768px) {
    width: 100% !important;

    .ant-select-selector {
      height: 42px !important;
    }

    .ant-select-selection-item {
      line-height: 40px !important;
      font-size: 14px;
    }
  }

  @media (max-width: 480px) {
    .ant-select-selector {
      height: 40px !important;
    }

    .ant-select-selection-item {
      line-height: 38px !important;
      font-size: 13px;
    }
  }
`;

const ActionButton = styled(Button)`
  height: 44px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 24px;
  font-weight: 500;
  font-size: 15px;
  white-space: nowrap;

  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    width: 100%;
    height: 42px;
    font-size: 14px;
    padding: 0 16px;
  }

  @media (max-width: 480px) {
    height: 40px;
    font-size: 13px;
    padding: 0 12px;
    gap: 6px;

    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const StatusTag = styled(Tag)`
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background-color: ${(props) => (props.$active ? "#ecfdf5" : "#f1f5f9")};
  color: ${(props) => (props.$active ? "#065f46" : "#475569")};
`;

const CustomSwitch = styled.div`
  position: relative;
  width: 44px;
  height: 24px;
  background-color: ${(props) => (props.$checked ? "#10b981" : "#e5e7eb")};
  border-radius: 12px;
  cursor: ${(props) => (props.$disabled ? "not-allowed" : "pointer")};
  transition: background-color 0.3s ease;
  opacity: ${(props) => (props.$disabled ? 0.5 : 1)};

  &:hover {
    background-color: ${(props) =>
      props.$disabled
        ? props.$checked
          ? "#10b981"
          : "#e5e7eb"
        : props.$checked
          ? "#059669"
          : "#d1d5db"};
  }

  &::after {
    content: "";
    position: absolute;
    top: 2px;
    left: ${(props) => (props.$checked ? "22px" : "2px")};
    width: 20px;
    height: 20px;
    background-color: white;
    border-radius: 50%;
    transition: left 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  ${(props) =>
    props.$loading &&
    css`
      &::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }

      &::after {
        opacity: 0.6;
      }

      @keyframes spin {
        to {
          transform: translate(-50%, -50%) rotate(360deg);
        }
      }
    `}
`;

const StyledScheduleDrawerOverlay = styled(VaulDrawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  ${VAUL_OVERLAY_BACKDROP_BLUR}
`;

const StyledScheduleDrawerContent = styled(VaulDrawer.Content)`
  position: fixed;
  top: 5vh;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  z-index: 1001;
  outline: none;

  @media (max-width: 1024px) {
    top: 5vh;
  }
`;

const ScheduleDrawerHandle = styled(VaulDrawer.Handle)`
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 12px auto 0;
  cursor: grab;
  flex-shrink: 0;

  &:active {
    cursor: grabbing;
  }
`;

const TableViewWrapper = styled(motion.div)`
  .ant-table-wrapper {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border: 1px solid #f0f0f0;
  }

  .ant-table {
    border-radius: 16px;
  }

  .ant-table-thead > tr > th {
    background-color: #f8fafc !important;
    color: #64748b;
    font-weight: 600;
    font-size: 11px;
    padding: 10px 14px;
    border-bottom: 2px solid #e2e8f0;
    text-transform: uppercase;
    letter-spacing: 0.05em;

    &::before {
      display: none;
    }
  }

  .ant-table-tbody > tr > td {
    vertical-align: middle;
    padding: 12px 14px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 13px;
    color: #1e293b;
  }
  @media (max-width: 768px) {
    .ant-table-thead > tr > th {
      padding: 8px 12px;
      font-size: 10px;
    }
    .ant-table-tbody > tr > td {
      padding: 10px 12px;
      font-size: 12px;
    }
  }

  .ant-table-tbody > tr:last-child > td {
    border-bottom: none;
  }

  .ant-table-tbody > tr.clickable-row:hover > td {
    background-color: #fafcff;
    cursor: pointer;
  }
`;

const MobileCardContainer = styled(motion.div)`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media (max-width: 480px) {
    gap: 12px;
  }
`;

const ClassCardStyled = styled(motion.div)`
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
`;

const CardHeader = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px;
  align-items: center;

  @media (max-width: 480px) {
    padding: 12px;
    gap: 10px;
  }
`;

const CardContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const CardTitle = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  display: block;
  margin-bottom: 4px;
  line-height: 1.3;
  /* MODIFIED: Added for text truncation */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
    font-size: 15px;
  }

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const CardBody = styled.div`
  padding: 0 16px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    padding: 0 12px 12px;
    gap: 8px;
  }
`;

const CardStats = styled.div`
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: ${colors.textSecondary};
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 12px;
  }

  @media (max-width: 480px) {
    font-size: 12px;
    gap: 10px;
  }
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;

  .lucide-star {
    color: ${colors.warning};
  }
`;

const CardFooter = styled.div`
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  gap: 8px;

  @media (max-width: 480px) {
    padding: 10px 12px;
    flex-wrap: wrap;

    button:first-child {
      flex: 1;
      min-width: 0;
    }
  }
`;

const TableActionButton = styled(Button)`
  border-radius: 8px;
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledMenu = styled(Menu)`
  min-width: 180px;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid #f0f0f0;

  .ant-dropdown-menu-item {
    border-radius: 8px;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;

    &:hover {
      background: #f8fafc;
    }

    .lucide {
      width: 16px;
      height: 16px;
      color: #64748b;
    }
  }

  .ant-dropdown-menu-item-danger {
    color: #b91c1c !important;
    &:hover {
      background: #fef2f2 !important;
      color: #b91c1c !important;
    }
    .lucide {
      color: #b91c1c;
    }
  }
`;

/* --- Table row content redesign: cell blocks --- */
const RowCellExperience = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 2px 0;
  min-width: 0;
`;
const RowCellExperienceImage = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;
const RowCellExperienceBody = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;
const RowCellExperienceTitle = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.3;
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;
const RowCellExperienceMeta = styled.div`
  min-width: 0;
`;
const RowCellExperienceDescription = styled.div`
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
  word-break: break-word;
`;
const RowCellPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  &.pill-type-course {
    background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
    color: #5b21b6;
  }
  &.pill-type-single {
    background: linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%);
    color: #0e7490;
  }
  &.pill-category {
    background: #f1f5f9;
    color: #475569;
    font-weight: 500;
    text-transform: none;
  }
`;

const RowCellSchedule = styled.div`
  display: flex;
  align-items: stretch;
  gap: 0;
  max-width: 300px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid ${(p) => (p.$hasSchedules ? "#bbf7d0" : "#fecaca")};
  background: ${(p) => (p.$hasSchedules ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" : "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)")};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
`;
const RowCellScheduleIcon = styled.div`
  width: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(p) => (p.$hasSchedules ? "rgba(22, 163, 74, 0.15)" : "rgba(220, 38, 38, 0.15)")};
  svg { flex-shrink: 0; }
`;
const RowCellScheduleText = styled.div`
  flex: 1;
  padding: 8px 12px;
  min-width: 0;
`;
const RowCellSchedulePrimary = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${(p) => (p.$hasSchedules ? "#166534" : "#991b1b")};
  line-height: 1.35;
`;
const RowCellScheduleSecondary = styled.div`
  font-size: 11px;
  color: ${(p) => (p.$hasSchedules ? "#15803d" : "#b91c1c")};
  margin-top: 2px;
  opacity: 0.9;
`;

const RowCellStatus = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 4px 12px 4px 8px;
  border-radius: 12px;
  cursor: ${(p) => (p.$loading ? "wait" : "pointer")};
  opacity: ${(p) => (p.$loading ? 0.75 : 1)};
  transition: box-shadow 0.2s ease, transform 0.15s ease;
  border: 1px solid ${(p) => (p.$active ? "#a7f3d0" : "#fecaca")};
  background: ${(p) => (p.$active ? "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)" : "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)")};
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  &:hover {
    box-shadow: ${(p) => (p.$loading ? "0 2px 6px rgba(0, 0, 0, 0.05)" : "0 4px 12px rgba(0, 0, 0, 0.08)")};
  }
`;
const RowCellStatusLabel = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => (p.$active ? "#065f46" : "#991b1b")};
  letter-spacing: 0.02em;
`;
const RowCellStatusNeedsConfig = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 1px solid #fcd34d;
  font-size: 12px;
  font-weight: 600;
  color: #92400e;
`;

const RowCellActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
`;
const RowCellActionBtn = styled(Button)`
  height: 34px;
  min-width: 34px;
  padding: 0 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  &:hover {
    border-color: #ff385c;
    color: #ff385c;
    background: #fff5f7;
  }
  &.primary-action {
    background: linear-gradient(135deg, #ff385c 0%, #e11d48 100%);
    border: none;
    color: #fff;
    box-shadow: 0 2px 6px rgba(255, 56, 92, 0.35);
  }
  &.primary-action:hover {
    background: linear-gradient(135deg, #e11d48 0%, #be123c 100%);
    color: #fff;
    border: none;
    box-shadow: 0 4px 12px rgba(255, 56, 92, 0.4);
  }
`;
const RowCellActionIconBtn = styled(Button)`
  width: 34px;
  height: 34px;
  padding: 0;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  &:hover {
    border-color: #cbd5e1;
    color: #334155;
    background: #f8fafc;
  }
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 0.7;
  align-items: center;
  justify-content: center;
  padding: ${(props) => props.$padding || "60px 20px"};
  text-align: center;
  gap: 16px;

  @media (max-width: 768px) {
    padding: ${(props) => props.$padding || "40px 16px"};
    gap: 12px;
  }

  @media (max-width: 480px) {
    padding: ${(props) => props.$padding || "30px 12px"};
    gap: 10px;
  }
`;

const EmptyStateIcon = styled.div`
  opacity: 0.3;
  filter: grayscale(100%);

  lord-icon {
    width: 80px;
    height: 80px;
  }

  @media (max-width: 768px) {
    lord-icon {
      width: 64px;
      height: 64px;
    }
  }

  @media (max-width: 480px) {
    lord-icon {
      width: 48px;
      height: 48px;
    }
  }
`;

const EmptyStateText = styled.div`
  color: ${colors.textSecondary};
  font-size: 15px;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 14px;
  }

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const EmptyStateSubtext = styled.div`
  color: ${colors.textSecondary};
  font-size: 13px;
  opacity: 0.7;
  max-width: 300px;

  @media (max-width: 768px) {
    font-size: 12px;
    max-width: 250px;
  }

  @media (max-width: 480px) {
    font-size: 11px;
    max-width: 200px;
  }
`;

const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  flex: 1;
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
  flex-shrink: 0;
`;

const DesktopDrawerContent = styled(VaulDrawer.Content)`
  right: 8px;
  top: 8px;
  bottom: 8px;
  position: fixed;
  z-index: 1050;
  outline: none;
  width: 800px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const DrawerBody = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const CloseButton = styled(Button)`
  padding: 8px;
  height: auto;
  border: none;
  background: none;
  &:hover {
    background: #f1f5f9;
  }
`;

function ClassManagementContent(props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [searchText, setSearchText] = useState("");
  // State for view type filter (all, single, course)
  const [viewType, setViewType] = useState("all");
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedClassForAction, setSelectedClassForAction] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false);
  const [togglingClassId, setTogglingClassId] = useState(null);
  const screens = useBreakpoint();
  const isMobileView = !screens.md;
  const openClassId = searchParams.get("classId");

  // If listings URL has ?classId=xyz, redirect to Schedules tab with that class pre-selected
  useEffect(() => {
    if (openClassId && classes.length > 0) {
      router.replace(`/business/dashboard/schedules?classId=${openClassId}`, { scroll: false });
    }
  }, [openClassId, classes, router]);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const result = await businessClassService.fetchBusinessClasses();
      if (result.success && Array.isArray(result.data)) {
        const processedClasses = result.data.map((classItem) => {
          const primaryOption = classItem.options?.[0] || null;
          const coverImage =
            classItem.images?.find((img) => img.is_cover) ||
            classItem.images?.[0] ||
            null;
          return {
            ...classItem,
            options: classItem.options || [],
            option: primaryOption,
            active: classItem.status === "active",
            coverImageUrl: coverImage?.image_thumb_url || null,
          };
        });
        setClasses(processedClasses);
      } else {
        message.error(
          getErrorMessage(result.error || "Failed to load experiences."),
        );
      }
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Navigate to Schedules tab, optionally filtered to this class
  const goToSchedules = (classItem) => {
    router.push(`/business/dashboard/schedules?classId=${classItem.classId}`);
  };

  const handleEditClass = (classItem) => {
    setSelectedClassForAction(classItem);
    setEditDrawerVisible(true);
  };

  const handleClassEditSuccess = () => {
    setEditDrawerVisible(false);
    loadClasses();
    message.success("Experience updated successfully");
  };

  const handleCreateClassSuccess = () => {
    setCreateDrawerVisible(false);
    loadClasses();
    message.success("Experience created successfully");
  };

  const openDeleteModal = (classItem) => {
    setSelectedClassForAction(classItem);
    setDeleteModalVisible(true);
  };

  const handleDeleteClassConfirm = async () => {
    if (!selectedClassForAction) return;
    setIsDeleting(true);
    try {
      await businessClassService.deleteClass(selectedClassForAction.classId);
      message.success("Experience deleted successfully");
      setDeleteModalVisible(false);
      loadClasses();
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleClassVisibility = async (classId, currentStatus) => {
    const isActive = currentStatus === "active";
    setTogglingClassId(classId);
    try {
      await businessClassService.toggleClassActive(classId);
      message.success(
        `Experience ${isActive ? "deactivated" : "activated"} successfully`,
      );
      setClasses((prevClasses) =>
        prevClasses.map((c) =>
          c.classId === classId
            ? { ...c, status: isActive ? "inactive" : "active" }
            : c,
        ),
      );
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setTogglingClassId(null);
    }
  };

  const getFilteredClasses = () => {
    let filtered = classes;

    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      filtered = filtered.filter((c) =>
        c.title?.toLowerCase().includes(lowerSearch),
      );
    }

    // MODIFIED: Updated filter to use new viewType state
    if (viewType === "single") {
      filtered = filtered.filter(
        (c) => c.options?.[0]?.booking_type === "Single Session",
      );
    } else if (viewType === "course") {
      filtered = filtered.filter(
        (c) => c.options?.[0]?.booking_type === "Full Course",
      );
    }

    return filtered;
  };

  const filteredClasses = useMemo(
    () => getFilteredClasses(),
    [classes, searchText, viewType], // viewType added as dependency
  );

  // Responsive column widths so table fits viewport and avoids horizontal scroll
  const columnWidths = useMemo(() => {
    if (screens.xxl) return { class: 400, schedule: 350, status: 160, actions: 220 };
    if (screens.xl) return { class: 340, schedule: 320, status: 150, actions: 210 };
    if (screens.lg) return { class: 280, schedule: 260, status: 130, actions: 190 };
    // md and up (table is only shown from md up)
    return { class: 220, schedule: 200, status: 110, actions: 170 };
  }, [screens.xxl, screens.xl, screens.lg]);

  const columns = [
    {
      title: "EXPERIENCE",
      dataIndex: "title",
      key: "class",
      width: columnWidths.class,
      render: (text, record) => {
        const hasScheduleWarning = needsSchedulesWarning(record.last_schedule_date);
        const rawDescription = record.description ?? "";
        const plainDescription =
          typeof rawDescription === "string"
            ? rawDescription.replace(/<[^>]*>/g, "").trim()
            : "";

        return (
          <RowCellExperience>
            <RowCellExperienceImage>
              {record.coverImageUrl ? (
                <img src={record.coverImageUrl} alt="" />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94a3b8",
                  }}
                >
                  <ImageIcon size={22} />
                </div>
              )}
            </RowCellExperienceImage>
            <RowCellExperienceBody>
              <RowCellExperienceTitle>
                {text || "Untitled Experience"}
                {hasScheduleWarning && (
                  <Tooltip title="This experience is running out of available schedules and may not be visible to new guests.">
                    <span style={{ display: "inline-flex", lineHeight: 1 }}>
                      <AlertTriangle size={18} color={colors.warning} />
                    </span>
                  </Tooltip>
                )}
              </RowCellExperienceTitle>
              {plainDescription ? (
                <RowCellExperienceMeta>
                  <RowCellExperienceDescription title={plainDescription}>
                    {plainDescription}
                  </RowCellExperienceDescription>
                </RowCellExperienceMeta>
              ) : null}
            </RowCellExperienceBody>
          </RowCellExperience>
        );
      },
    },
    {
      title: "SCHEDULE",
      key: "schedule",
      width: columnWidths.schedule,
      render: (_, record) => {
        const scheduleInfo = formatScheduleInfo(record);
        const hasSchedules = !!record.last_schedule_date;
        const isCourse = record.options?.[0]?.booking_type === "Full Course";

        return (
          <RowCellSchedule $hasSchedules={hasSchedules}>
            <RowCellScheduleIcon $hasSchedules={hasSchedules}>
              {isCourse ? (
                <BookOpen size={20} color={hasSchedules ? "#16a34a" : "#dc2626"} />
              ) : (
                <Clock size={20} color={hasSchedules ? "#16a34a" : "#dc2626"} />
              )}
            </RowCellScheduleIcon>
            <RowCellScheduleText>
              <RowCellSchedulePrimary $hasSchedules={hasSchedules}>
                {scheduleInfo}
              </RowCellSchedulePrimary>
              {hasSchedules && (
                <RowCellScheduleSecondary $hasSchedules={hasSchedules}>
                  {isCourse ? "Course active" : "Sessions available"}
                </RowCellScheduleSecondary>
              )}
            </RowCellScheduleText>
          </RowCellSchedule>
        );
      },
    },
    {
      title: "STATUS",
      key: "status",
      width: columnWidths.status,
      render: (_, record) => {
        if (!record.option) {
          return (
            <RowCellStatusNeedsConfig>
              <AlertTriangle size={14} />
              Needs Config
            </RowCellStatusNeedsConfig>
          );
        }
        const isActive = record.status === "active";
        const isLoading = togglingClassId === record.classId;

        return (
          <Tooltip
            title={
              isLoading
                ? "Updating..."
                : `Set experience to ${isActive ? "Inactive" : "Active"}`
            }
          >
            <RowCellStatus
              $active={isActive}
              $loading={isLoading}
              onClick={(e) => {
                e.stopPropagation();
                if (!isLoading) {
                  toggleClassVisibility(record.classId, record.status);
                }
              }}
            >
              <CustomSwitch
                $checked={isActive}
                $loading={isLoading}
                $disabled={isLoading}
              />
              <RowCellStatusLabel $active={isActive}>
                {isActive ? "Active" : "Inactive"}
              </RowCellStatusLabel>
            </RowCellStatus>
          </Tooltip>
        );
      },
    },
    {
      title: "ACTIONS",
      key: "actions",
      align: "right",
      width: columnWidths.actions,
      render: (_, record) => {
        const isCourse = record.options?.[0]?.booking_type === "Full Course";

        const menu = (
          <StyledMenu onClick={({ domEvent }) => domEvent.stopPropagation()}>
            <Menu.Item
              key="edit"
              icon={<Edit3 size={16} />}
              onClick={() => handleEditClass(record)}
            >
              Edit Experience Details
            </Menu.Item>
            <Menu.Item
              key="delete"
              icon={<Trash2 size={16} />}
              onClick={() => openDeleteModal(record)}
              danger
            >
              Delete Experience
            </Menu.Item>
          </StyledMenu>
        );

        const primaryLabel = record.option ? "Schedules" : "Configure";
        const primaryClick = () => {
          if (record.option) {
            goToSchedules(record);
          } else {
            handleEditClass(record);
          }
        };

        return (
          <RowCellActions onClick={(e) => e.stopPropagation()}>
            <Tooltip
              title={
                record.option
                  ? "Manage times, dates, and prices"
                  : "Complete setup to add schedules"
              }
            >
              <RowCellActionBtn
                type="button"
                className="primary-action"
                onClick={primaryClick}
                icon={<Calendar size={16} />}
              >
                {primaryLabel}
              </RowCellActionBtn>
            </Tooltip>
            <Dropdown overlay={menu} trigger={["click"]} placement="bottomRight">
              <Tooltip title="More options">
                <RowCellActionIconBtn
                  type="button"
                  icon={<MoreVertical size={18} />}
                />
              </Tooltip>
            </Dropdown>
          </RowCellActions>
        );
      },
    },
  ];

  const renderEmptyState = () => (
    <EmptyStateContainer>
      <EmptyStateIcon>
        <lord-icon
          src="https://cdn.lordicon.com/yraqammt.json"
          trigger="in"
          state="in-newspaper"
          colors="primary:#94a3b8"
          style={{ width: 40, height: 40 }}
        />
      </EmptyStateIcon>
      <EmptyStateText>No Experiences Found</EmptyStateText>
      <EmptyStateSubtext>
        You haven't created any experiences yet. Click 'Create New Experience'
        to get started!
      </EmptyStateSubtext>
    </EmptyStateContainer>
  );

  const renderClassCard = (classItem) => {
    const {
      classId,
      coverImageUrl,
      title,
      average_rating,
      review_count,
      status,
      option,
      last_schedule_date,
    } = classItem;

    const isCourse = option?.booking_type === "Full Course";
    const typeInfo = formatClassType(option?.booking_type);

    const isActive = status === "active";

    const menu = (
      <StyledMenu>
        <Menu.Item
          key="edit"
          icon={<Edit3 size={16} />}
          onClick={() => handleEditClass(classItem)}
        >
          Edit Experience Details
        </Menu.Item>
        <Menu.Item
          key="delete"
          icon={<Trash2 size={16} />}
          danger
          onClick={() => openDeleteModal(classItem)}
        >
          Delete Experience
        </Menu.Item>
      </StyledMenu>
    );

    return (
      <ClassCardStyled key={classId} layout>
        <CardHeader>
          <Avatar
            shape="square"
            size={48}
            src={coverImageUrl}
            icon={<ImageIcon size={20} />}
            style={{ borderRadius: "8px" }}
          />
          <CardContent>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CardTitle style={{ marginBottom: 0 }}>
                {title || "Untitled Experience"}
              </CardTitle>
              {needsSchedulesWarning(last_schedule_date) && (
                <Tooltip title="This experience has no future schedules and may not be visible to guests.">
                  <AlertTriangle size={16} color={colors.warning} />
                </Tooltip>
              )}
            </div>
            <Space size={4} style={{ marginTop: "4px" }}>
              {/* MODIFIED: Add type tag */}
              <Tag
                icon={typeInfo.icon}
                color={typeInfo.color}
                bordered={false}
                style={{
                  borderRadius: "6px",
                  fontSize: "12px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {typeInfo.label}
              </Tag>
            </Space>
          </CardContent>
        </CardHeader>
        <CardBody>
          {/* MODIFIED: Removed schedule info text for mobile view */}
          <CardStats>
            {review_count > 0 ? (
              <StatItem>
                <Star size={14} className="lucide-star" fill={colors.warning} />
                <Text strong>{average_rating.toFixed(1)}</Text>
                <Text type="secondary">({review_count} reviews)</Text>
              </StatItem>
            ) : (
              <StatItem>
                <MessageSquare size={14} />
                <Text type="secondary">No reviews</Text>
              </StatItem>
            )}
          </CardStats>
          {option ? (
            <StatusTag $active={isActive}>
              {isActive ? <EyeIcon size={12} /> : <EyeOffIcon size={12} />}
              {isActive ? "Active" : "Inactive"}
            </StatusTag>
          ) : (
            <StatusTag>
              <AlertTriangle size={12} /> Needs Config
            </StatusTag>
          )}
        </CardBody>
        <CardFooter>
          <Button
            type="primary"
            ghost
            onClick={() => {
              if (option) {
                goToSchedules(classItem);
              } else {
                handleEditClass(classItem);
              }
            }}
            style={{ flex: 1 }}
          >
            {option ? "Manage Schedules" : "Configure"}
          </Button>
          <Dropdown overlay={menu} trigger={["click"]}>
            <Tooltip title="More options">
              <Button icon={<MoreVertical size={16} />} />
            </Tooltip>
          </Dropdown>
        </CardFooter>
      </ClassCardStyled>
    );
  };

  return (
    <PageContainer>
      <DashboardBreadcrumb title="Experience Management" />
      <PageHeader>
        <HeaderTextWrap>
          <HeaderTitle>Experience Management</HeaderTitle>
          <HeaderSubtitle>
            Oversee and manage all your experiences. Use Schedules to set when each experience runs.
          </HeaderSubtitle>
        </HeaderTextWrap>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ActionButton
            type="primary"
            icon={<Plus size={18} />}
            onClick={() => setCreateDrawerVisible(true)}
          >
            Create New Experience
          </ActionButton>
        </div>
      </PageHeader>
      <Divider />

      {loading ? (
        <ClassManagementSkeleton />
      ) : filteredClasses.length === 0 ? (
        renderEmptyState()
      ) : isMobileView ? (
        <MobileCardContainer>
          {filteredClasses.map(renderClassCard)}
        </MobileCardContainer>
      ) : (
        <TableViewWrapper>
          <Table
            columns={columns}
            dataSource={filteredClasses}
            rowKey="classId"
            pagination={false}
            scroll={undefined}
            onRow={(record) => ({
              onClick: () => {
                if (record.option) goToSchedules(record);
              },
              className: record.option ? "clickable-row" : "",
            })}
          />
        </TableViewWrapper>
      )}

      <DeleteClassModal
          visible={deleteModalVisible}
          onCancel={() => setDeleteModalVisible(false)}
          onConfirm={handleDeleteClassConfirm}
          classData={selectedClassForAction}
          isDeleting={isDeleting}
        />

        <ClassEditDrawer
          visible={editDrawerVisible}
          onClose={() => setEditDrawerVisible(false)}
          classData={selectedClassForAction}
          onSuccess={handleClassEditSuccess}
        />

        {isMobileView ? (
          <VaulDrawer.Root
            open={createDrawerVisible}
            onOpenChange={(open) => {
              if (!open) setCreateDrawerVisible(false);
            }}
            dismissible
            handleOnly={!isMobileView}
          >
            <VaulDrawer.Portal>
              <StyledScheduleDrawerOverlay />
              <StyledScheduleDrawerContent>
                <ScheduleDrawerHandle />

                <DrawerHeader>
                  <Title level={4} style={{ margin: 0 }}>
                    Create New Experience
                  </Title>
                  <CloseButton
                    icon={<X size={20} />}
                    onClick={() => setCreateDrawerVisible(false)}
                  />
                </DrawerHeader>

                <DrawerBody>
                  <ClassProvider>
                    <CreateClassPage onSuccess={handleCreateClassSuccess} />
                  </ClassProvider>
                </DrawerBody>
              </StyledScheduleDrawerContent>
            </VaulDrawer.Portal>
          </VaulDrawer.Root>
        ) : (
          <VaulDrawer.Root
            open={createDrawerVisible}
            onOpenChange={(open) => {
              if (!open) setCreateDrawerVisible(false);
            }}
            direction="right"
            dismissible
            handleOnly={!isMobileView}
          >
            <VaulDrawer.Portal>
              <StyledScheduleDrawerOverlay />
              <DesktopDrawerContent>
                <DrawerHeader>
                  <Title level={4} style={{ margin: 0 }}>
                    Create New Experience
                  </Title>
                  <CloseButton
                    icon={<X size={20} />}
                    onClick={() => setCreateDrawerVisible(false)}
                  />
                </DrawerHeader>
                <DrawerBody>
                  <ClassProvider>
                    <CreateClassPage onSuccess={handleCreateClassSuccess} />
                  </ClassProvider>
                </DrawerBody>
              </DesktopDrawerContent>
            </VaulDrawer.Portal>
          </VaulDrawer.Root>
        )}
      </PageContainer>
  );
}

const ClassManagement = (props) => {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <ClassManagementContent {...props} />
    </Suspense>
  );
};

export default ClassManagement;
