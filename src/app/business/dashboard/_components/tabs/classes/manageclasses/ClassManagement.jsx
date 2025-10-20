"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { Drawer as VaulDrawer } from "vaul";
import { Form, Tabs, Tooltip, Typography, ConfigProvider, Button, Empty, Space, Avatar, Tag, Popconfirm, Spin, DatePicker, Divider, Input, Checkbox, Select, Modal, Table, Switch, Dropdown, Menu, Grid, Segmented,  } from 'antd';
import message from '@/lib/message';
import {
  Search,
  Plus,
  Calendar,
  Users,
  Settings,
  Tag as TagIcon,
  ArrowRight,
  DollarSign,
  Edit,
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
} from "lucide-react";
import styled, { css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isToday from "dayjs/plugin/isToday";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { businessClassService, scheduleService } from "@/services/apiService";
import ScheduleEditDrawer from "./ScheduleEditDrawer";
import ClassEditDrawer from "./ClassEditDrawer";
import DeleteClassModal from "./DeleteClassModal";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";
import { ClassProvider } from "../newclasses/ClassContext";
import CreateClassPage from "../newclasses/CreateClassPage";

dayjs.extend(isBetween);
dayjs.extend(isToday);
dayjs.extend(weekOfYear);

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { useBreakpoint } = Grid;
import { theme } from "@/components/theme";
import { LordIcon } from "@/services/ReactUtils";

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
    dayjs().add(SCHEDULE_WARNING_THRESHOLD_DAYS, "day")
  );
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
  box-shadow: inset 0px -1px 11px 1px #0000000d;
  min-height: 100vh;
  @media (max-width: 768px) {
    padding: 16px;
    gap: 0;
  }
`;

const PageHeader = styled.div``;

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
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }
`;

const StyledSearchInput = styled(Input)`
  width: 300px;
  height: 44px;
  border-radius: 12px;
  background: white;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  .ant-input {
    background: transparent;
    font-size: 15px;
    &::placeholder {
      color: #9ca3af;
    }
  }

  .ant-input-prefix {
    color: #9ca3af;
    margin-right: 10px;
  }

  &:hover {
    border-color: #ff385c;
  }

  &.ant-input-affix-wrapper-focused {
    border-color: #ff385c;
    box-shadow: 0 0 0 3px rgba(255, 56, 92, 0.1);
  }

  @media (max-width: 768px) {
    width: 100%;
    height: 40px;
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
  svg {
    width: 18px;
    height: 18px;
  }
  @media (max-width: 768px) {
    width: 100%;
    height: 40px;
    font-size: 14px;
    padding: 0 16px;
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

const CategoryTag = styled(Tag)`
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 12px;
  font-weight: 500;
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background-color: #f0f9ff;
  color: #0284c7;
  svg {
    width: 12px;
    height: 12px;
  }
`;

const StyledScheduleDrawerOverlay = styled(VaulDrawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 1000;
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

const ScheduleDrawerHandle = styled.div`
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
    color: #475569;
    font-weight: 600;
    font-size: 12px;
    padding: 16px 20px;
    border-bottom: 2px solid #e2e8f0;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    &::before {
      display: none;
    }
  }

  .ant-table-tbody > tr > td {
    vertical-align: middle;
    padding: 12px 20px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 14px;
    color: #1e293b;
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
`;

const CardBody = styled.div`
  padding: 0 16px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
`;

const CardStats = styled.div`
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: ${colors.textSecondary};
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
    color: #ef4444 !important;
    &:hover {
      background: #fef2f2;
    }
    .lucide {
      color: #ef4444;
    }
  }
`;

const MobileDragHandle = styled(motion.div)`
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 12px auto 0;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }

  @media (min-width: 1025px) {
    display: none;
  }
`;

const DesktopScheduleModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 16px;
    overflow: hidden;
    padding: 0;
  }
  .ant-modal-header {
    border-radius: 16px 16px 0 0;
    padding: 20px 24px;
  }
  .ant-modal-footer {
    border-top: 1px solid #f0f0f0;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
    padding: 12px 24px;
    margin: 0;
  }
  .ant-modal-title {
    font-weight: 600;
    font-size: 18px;
  }
  .ant-modal-body {
    padding: 0;
    background-color: #f8fafc;
    height: 80vh;
    max-height: 800px;
    display: flex;
    flex-direction: column;
  }

  @media (max-width: 1024px) {
    display: none;
  }
`;

const MobileScheduleHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  background-color: white;
  flex-shrink: 0;
`;

const MobileScheduleTitle = styled(Title)`
  &.ant-typography {
    font-size: 18px;
    font-weight: 600;
    margin: 0 !important;
    color: #1f2937;
  }
`;

const MobileCloseButton = styled(Button)`
  border: none;
  background: none;
  padding: 8px;
  height: auto;
  color: #6b7280;

  &:hover {
    background: #f3f4f6;
  }
`;

const MobileScheduleFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  background-color: white;
  flex-shrink: 0;
`;

const ModalLayout = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  flex: 1;
  flex-direction: row-reverse;
  overflow: hidden;
`;

const CalendarPanel = styled.div`
  flex: 3;
  background: white;
  padding: 20px;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
`;

const ScheduleListPanel = styled.div`
  flex: 2;
  display: flex;
  flex-direction: column;
  overflow-y: hidden;
  background-color: #f8fafc;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
`;

const MonthTitle = styled.h4`
  font-weight: 600;
  font-size: 16px;
  margin: 0;
  text-align: center;
`;

const NavButton = styled.button`
  background: transparent;
  border: 1px solid transparent;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s ease;
  &:hover {
    background: #f1f5f9;
  }
`;

const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: 1fr;
  gap: 4px;
  flex: 1;
`;

const WeekDay = styled.div`
  text-align: center;
  font-weight: 500;
  font-size: 12px;
  color: #94a3b8;
  padding-bottom: 8px;
`;

const DayCell = styled.div`
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  padding: 8px;
  position: relative;
  transition: all 0.2s ease;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  ${(props) =>
    !props.$isInMonth && `background-color: #f8fafc; pointer-events: none;`}
  ${(props) =>
    props.$isSelected &&
    `border-color: ${theme.token.colorPrimary}; background-color: #fff8f9; box-shadow: 0 0 0 2px ${theme.token.colorPrimary}40;`}
  &:hover {
    border-color: #e2e8f0;
  }
`;

const DayHeader = styled.div`
  font-weight: 500;
  font-size: 13px;
  color: ${(props) => (props.$isPast ? "#94a3b8" : "#1f2937")};
  margin-bottom: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  ${(props) =>
    props.$isToday &&
    `background-color: ${theme.token.colorPrimary}; color: white; border-radius: 50%;`}
`;

const SchedulePreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  flex: 1;
`;

const CalendarSchedulePreview = styled.div`
  background-color: #eff6ff;
  color: #1d4ed8;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MoreSchedulesIndicator = styled.div`
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
  text-align: center;
  margin-top: 4px;
`;

const ScheduleCard = styled(motion.div)`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.2s ease;
  position: relative;
  ${(props) => props.$isPast && `opacity: 0.6;`}
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const CardInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  .time {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
  }
  .date {
    font-size: 13px;
    font-weight: 500;
    color: #64748b;
  }
  .group {
    font-size: 12px;
    color: #475569;
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 6px;
    width: fit-content;
  }
`;

const CardActions = styled(Space)`
  flex-shrink: 0;
  .ant-btn {
    border-radius: 8px;
  }
`;

const CardBottom = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
  font-size: 13px;
  color: #475569;
`;

const DropdownHeader = styled(motion.div)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  background: white;
  &:hover {
    background: #fafafa;
  }
`;

const DropdownIcon = styled(motion.div)`
  display: inline-flex;
  margin-left: 8px;
`;

const DropdownContent = styled(motion.div)`
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
`;

const ScheduleListContainer = styled(motion.div)`
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: #f8fafc;
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

const ModalControls = styled.div`
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  background-color: white;
`;

const ControlRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const mobileScheduleVariants = {
  hidden: { y: "100%" },
  visible: { y: 0, transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] } },
  exit: { y: "100%", transition: { duration: 0.3, ease: [0.5, 0, 0.75, 0] } },
};

function ClassManagementContent(props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedClassForAction, setSelectedClassForAction] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false);
  const [scheduleEditModal, setScheduleEditModal] = useState({
    visible: false,
    selectedClass: null,
    editingSchedule: null,
  });
  const [schedulesModal, setSchedulesModal] = useState({
    visible: false,
    classData: null,
  });
  const [schedulesModalLoading, setSchedulesModalLoading] = useState(false);
  const [scheduleGroupFilter, setScheduleGroupFilter] = useState(undefined);
  const [showPastSchedules, setShowPastSchedules] = useState(false);
  const [scheduleForm] = Form.useForm();
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(dayjs());
  const [scheduleView, setScheduleView] = useState("calendar");
  const [shouldRender, setShouldRender] = useState(false);
  const screens = useBreakpoint();
  const isMobileView = !screens.md;
  const openClassId = searchParams.get("classId");
  const scrollToScheduleId = searchParams.get("scheduleId");
  const openScheduleGroup = searchParams.get("scheduleGroup");

  useEffect(() => {
    if (createDrawerVisible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [createDrawerVisible]);

  useEffect(() => {
    if (openClassId && classes.length > 0) {
      const classToOpen = classes.find(
        (c) => c.classId === parseInt(openClassId)
      );
      if (classToOpen) {
        router.replace(pathname, { scroll: false });
        openSchedulesModal(classToOpen);
        if (openScheduleGroup) setScheduleGroupFilter(openScheduleGroup);
        setShowPastSchedules(true);
      }
    }
  }, [openClassId, openScheduleGroup, classes, pathname, router]);

  useEffect(() => {
    if (
      scrollToScheduleId &&
      !schedulesModalLoading &&
      schedulesModal.visible
    ) {
      const element = document.getElementById(
        `schedule-card-${scrollToScheduleId}`
      );
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.style.transition = "box-shadow 0.3s";
          element.style.boxShadow = "0 0 0 3px rgba(255, 56, 92, 0.5)";
          setTimeout(() => (element.style.boxShadow = ""), 2500);
        }, 300);
      }
    }
  }, [scrollToScheduleId, schedulesModalLoading, schedulesModal.visible]);

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
            option: primaryOption ? { ...primaryOption, schedules: [] } : null,
            active: classItem.status === "active",
            coverImageUrl: coverImage?.image_thumb_url || null,
          };
        });
        setClasses(processedClasses);
      } else {
        message.error(
          getErrorMessage(result.error || "Failed to load classes.")
        );
      }
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const refreshSchedulesInModal = async (classToRefresh) => {
    const targetClass = classToRefresh || schedulesModal.classData;
    if (!targetClass?.option) return;
    setSchedulesModalLoading(true);
    try {
      const result = await scheduleService.fetchSchedules({
        option_id: targetClass.option.optionId,
      });
      if (result.success) {
        setSchedulesModal((prev) => {
          if (!prev.classData) {
            return prev;
          }
          return {
            ...prev,
            classData: {
              ...prev.classData,
              option: {
                ...prev.classData.option,
                schedules: result.data || [],
              },
            },
          };
        });
      } else {
        message.error(
          getErrorMessage(result.error || "Failed to refresh schedules.")
        );
      }
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSchedulesModalLoading(false);
    }
  };

  const openSchedulesModal = (classItem) => {
    setSchedulesModal({ visible: true, classData: classItem });
    if (classItem.option) {
      refreshSchedulesInModal(classItem);
    }
  };

  const closeSchedulesModal = () => {
    setSchedulesModal({ visible: false, classData: null });
    setSelectedCalendarDate(null);
    setShowPastSchedules(false);
    setCalendarMonth(dayjs());
    setScheduleGroupFilter(undefined);
    setScheduleView("calendar");
  };

  const handleEditClass = (classItem) => {
    setSelectedClassForAction(classItem);
    setEditDrawerVisible(true);
  };

  const handleClassEditSuccess = () => {
    setEditDrawerVisible(false);
    loadClasses();
    message.success("Class updated successfully");
  };

  const handleCreateClassSuccess = () => {
    setCreateDrawerVisible(false);
    loadClasses();
    message.success("Class created successfully");
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
      message.success("Class deleted successfully");
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
    try {
      await businessClassService.toggleClassActive(classId);
      message.success(
        `Class ${isActive ? "deactivated" : "activated"} successfully`
      );
      setClasses((prevClasses) =>
        prevClasses.map((c) =>
          c.classId === classId
            ? { ...c, status: isActive ? "inactive" : "active" }
            : c
        )
      );
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  const handleAddSchedule = (classItemFromModalContext) => {
    const targetClass = classItemFromModalContext || schedulesModal.classData;
    if (!targetClass?.option) {
      message.error(
        "This class needs main options configured before adding schedules."
      );
      return;
    }
    setScheduleEditModal({
      visible: true,
      selectedClass: targetClass,
      selectedOption: targetClass.option,
      editingSchedule: null,
    });
  };

  const handleEditSchedule = (scheduleToEdit) => {
    const targetClass = schedulesModal.classData;
    setScheduleEditModal({
      visible: true,
      selectedClass: targetClass,
      selectedOption: targetClass.option,
      editingSchedule: scheduleToEdit,
    });
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      await scheduleService.deleteSchedule(scheduleId);
      await refreshSchedulesInModal();
      message.success("Schedule deleted successfully.");
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  const handleDeleteScheduleGroup = async (groupName) => {
    const optionId = schedulesModal.classData?.option?.optionId;
    if (!optionId) return;

    try {
      await scheduleService.deleteScheduleGroup({
        option_id: optionId,
        name: groupName,
      });
      message.success(`Group "${groupName}" deleted successfully.`);
      await refreshSchedulesInModal();
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  const handleScheduleSave = async (action, data) => {
    try {
      let result;
      const editingId = scheduleEditModal.editingSchedule?.id;

      if (action === "edit" && editingId) {
        result = await scheduleService.updateSchedule(editingId, data);
      } else if (action === "add") {
        result = await scheduleService.createSchedule(data);
      } else if (action === "add-bulk") {
        result = { success: true };
      } else {
        throw new Error("Invalid schedule operation.");
      }

      if (result.success) {
        message.success(
          `Schedule ${action === "edit" ? "updated" : "created"} successfully.`
        );
        setScheduleEditModal({ visible: false, selectedClass: null });
        await refreshSchedulesInModal();
      } else {
        message.error(
          getErrorMessage(result.error || "Schedule operation failed.")
        );
      }
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  };

  const formatTime = (timeStr) =>
    timeStr ? dayjs(`2000-01-01T${timeStr}`).format("h:mm A") : "N/A";

  const renderScheduleCard = (schedule) => {
    const isPast = dayjs(schedule.date || schedule.start_date).isBefore(
      dayjs(),
      "day"
    );
    const hasConfirmedBookings = schedule.has_confirmed_bookings || false;
    const canDelete = !isPast && !hasConfirmedBookings;
    const dateToDisplay = schedule.date || schedule.start_date;
    const isCourse =
      schedulesModal.classData?.option.booking_type === "Full Course";

    return (
      <ScheduleCard key={schedule.id} $isPast={isPast}>
        <CardTop>
          <CardInfo>
            <div className="time">{formatTime(schedule.time)}</div>
            <div className="date">
              {isCourse
                ? `Every ${schedule.day} from ${dayjs(
                    schedule.start_date
                  ).format("MMM D")} to ${dayjs(schedule.end_date).format(
                    "MMM D, YYYY"
                  )}`
                : dayjs(dateToDisplay).format("dddd, MMMM D, YYYY")}
            </div>
            {schedule.name && <div className="group">{schedule.name}</div>}
          </CardInfo>
          <CardActions>
            <Tooltip title="Edit Schedule Details">
              <Button
                icon={<Edit3 size={14} />}
                onClick={() => handleEditSchedule(schedule)}
                disabled={isPast}
              />
            </Tooltip>
            <Popconfirm
              title="Are you sure you want to delete this schedule?"
              description="This action cannot be undone."
              onConfirm={() => handleDeleteSchedule(schedule.id)}
              disabled={!canDelete}
              okText="Yes, delete"
              cancelText="No"
            >
              <Tooltip
                title={
                  canDelete
                    ? "Delete Schedule"
                    : "Cannot delete past schedules or schedules with confirmed bookings."
                }
              >
                <span>
                  <Button
                    danger
                    icon={<Trash2 size={14} />}
                    disabled={!canDelete}
                  />
                </span>
              </Tooltip>
            </Popconfirm>
          </CardActions>
        </CardTop>
        <CardBottom>
          <StatItem>
            <Users size={14} />{" "}
            <b>
              {schedule.booked_participants}/{schedule.maxParticipants}
            </b>
            &nbsp;Spots Booked
          </StatItem>
          <StatItem>
            <DollarSign size={14} />{" "}
            <b>{parseFloat(schedule.price).toFixed(2)}</b>
            &nbsp;CAD
          </StatItem>
        </CardBottom>
      </ScheduleCard>
    );
  };

  const CustomDropdown = ({ groupName, schedulesInGroup }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <div>
        <DropdownHeader onClick={() => setIsOpen(!isOpen)}>
          <Space>
            <Text strong>{groupName}</Text>
            <Tag>{schedulesInGroup.length} schedules</Tag>
          </Space>
          <Space>
            {groupName !== "Individual Schedules" && (
              <Popconfirm
                title={`Delete all ${schedulesInGroup.length} schedules in the "${groupName}" group?`}
                description="This cannot be undone. Schedules with bookings will not be deleted."
                onConfirm={(e) => {
                  e.stopPropagation();
                  handleDeleteScheduleGroup(groupName);
                }}
                onCancel={(e) => e.stopPropagation()}
                okText="Yes, delete all"
              >
                <Tooltip title={`Delete entire '${groupName}' group`}>
                  <Button
                    size="small"
                    type="text"
                    danger
                    icon={<Trash2 size={14} />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Tooltip>
              </Popconfirm>
            )}
            <DropdownIcon animate={{ rotate: isOpen ? 180 : 0 }}>
              <ChevronDown size={16} />
            </DropdownIcon>
          </Space>
        </DropdownHeader>
        <AnimatePresence>
          {isOpen && (
            <DropdownContent
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              {schedulesInGroup.map(renderScheduleCard)}
            </DropdownContent>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderSchedulesModalContent = (
    classItem,
    currentCalendarMonth,
    setCalendarMonth
  ) => {
    if (!classItem?.option) {
      return (
        <EmptyStateContainer>
          <EmptyStateIcon>
            <LordIcon
              src="https://cdn.lordicon.com/asyunleq.json"
              trigger="in"
              state="in-cog"
              colors="primary:#94a3b8"
              style={{ width: 40, height: 40 }}
            />
          </EmptyStateIcon>
          <EmptyStateText>Configuration Needed</EmptyStateText>
          <EmptyStateSubtext>
            This class must be configured before schedules can be added.
          </EmptyStateSubtext>
        </EmptyStateContainer>
      );
    }

    const allSchedules = classItem.option.schedules || [];
    let filteredForList = allSchedules;

    if (selectedCalendarDate) {
      filteredForList = allSchedules.filter((s) =>
        dayjs(s.date || s.start_date).isSame(selectedCalendarDate, "day")
      );
    } else if (!showPastSchedules) {
      filteredForList = allSchedules.filter(
        (s) => !dayjs(s.date || s.start_date).isBefore(dayjs(), "day")
      );
    }

    const INDIVIDUAL_KEY = "##__INDIVIDUAL__##";
    if (scheduleGroupFilter) {
      filteredForList =
        scheduleGroupFilter === INDIVIDUAL_KEY
          ? filteredForList.filter((s) => !s.name)
          : filteredForList.filter((s) => s.name === scheduleGroupFilter);
    }

    const groupedSchedules = filteredForList.reduce((acc, schedule) => {
      const groupName = schedule.name || "Individual Schedules";
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(schedule);
      return acc;
    }, {});

    Object.values(groupedSchedules).forEach((group) =>
      group.sort((a, b) => {
        const dateA = dayjs(a.date || a.start_date);
        const dateB = dayjs(b.date || b.start_date);
        if (dateA.isBefore(dateB)) return -1;
        if (dateA.isAfter(dateB)) return 1;
        return dayjs(`T${a.time}`).isBefore(dayjs(`T${b.time}`)) ? -1 : 1;
      })
    );

    const sortedGroupNames = Object.keys(groupedSchedules).sort((a, b) => {
      if (a === "Individual Schedules") return 1;
      if (b === "Individual Schedules") return -1;
      return a.localeCompare(b);
    });

    const uniqueGroups = [
      ...new Set(allSchedules.map((s) => s.name).filter(Boolean)),
    ];
    const hasIndividual = allSchedules.some((s) => !s.name);

    const ScheduleFilters = () => (
      <ModalControls>
        <ControlRow>
          {!isMobileView && (
            <Segmented
              options={[
                { label: "List", value: "list", icon: <List size={14} /> },
                {
                  label: "Calendar",
                  value: "calendar",
                  icon: <Calendar size={14} />,
                },
              ]}
              value={scheduleView}
              onChange={setScheduleView}
            />
          )}

          <Select
            placeholder="Filter by group"
            allowClear
            value={scheduleGroupFilter}
            onChange={setScheduleGroupFilter}
            style={{ minWidth: 200, flex: 1 }}
      >
            {hasIndividual && (
              <Option value={INDIVIDUAL_KEY}>Individual Schedules</Option>
            )}
            {uniqueGroups.map((group) => (
              <Option key={group} value={group}>
                {group}
              </Option>
            ))}
          </Select>

          <Tooltip title="Check this to see schedules that have already occurred.">
            <Checkbox
              checked={showPastSchedules}
              onChange={(e) => setShowPastSchedules(e.target.checked)}
            >
              Show Past
            </Checkbox>
          </Tooltip>
        </ControlRow>
        {selectedCalendarDate && (
          <ControlRow>
            <Text>
              Showing schedules for:{" "}
              <b>{selectedCalendarDate.format("MMMM D, YYYY")}</b>
            </Text>
            <Button
              type="link"
              size="small"
              onClick={() => setSelectedCalendarDate(null)}
              icon={<Undo2 size={14} />}
            >
              Clear Selection
            </Button>
          </ControlRow>
        )}
      </ModalControls>
    );

    const CalendarView = ({ onDateSelect, currentMonth, onMonthChange }) => {
      const schedulesByDate = allSchedules.reduce((acc, s) => {
        const dateKey = s.date || s.start_date;
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(s);
        return acc;
      }, {});

      const today = dayjs().startOf("day");
      const year = currentMonth.year();
      const month = currentMonth.month();
      const firstDay = dayjs(new Date(year, month, 1)).day();
      const daysInMonth = currentMonth.daysInMonth();
      const days = Array.from({ length: firstDay }, (_, i) => ({
        inMonth: false,
        key: `prev-${i}`,
      })).concat(
        Array.from({ length: daysInMonth }, (_, i) => ({
          date: dayjs(new Date(year, month, i + 1)),
          inMonth: true,
        }))
      );

      return (
        <CalendarPanel>
          <CalendarHeader>
            <NavButton onClick={() => onMonthChange(-1)}>
              <ChevronLeft size={20} />
            </NavButton>
            <MonthTitle>{currentMonth.format("MMMM YYYY")}</MonthTitle>
            <NavButton onClick={() => onMonthChange(1)}>
              <ChevronRight size={20} />
            </NavButton>
          </CalendarHeader>
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}
          >
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <WeekDay key={day}>{day}</WeekDay>
            ))}
          </div>
          <DaysGrid>
            {days.map((day, index) => {
              if (!day.inMonth) return <DayCell key={index} />;
              const dateStr = day.date.format("YYYY-MM-DD");
              const isSelected = selectedCalendarDate?.isSame(day.date, "day");
              const isToday = day.date.isSame(today, "day");
              const daySchedules = schedulesByDate[dateStr] || [];

              return (
                <DayCell
                  key={dateStr}
                  $isInMonth
                  $isSelected={isSelected}
                  onClick={() => onDateSelect(day.date)}
                >
                  <DayHeader $isToday={isToday}>{day.date.date()}</DayHeader>
                  <SchedulePreviewContainer>
                    {daySchedules.slice(0, 1).map((s) => (
                      <CalendarSchedulePreview key={s.id}>
                        {formatTime(s.time)}
                      </CalendarSchedulePreview>
                    ))}
                    {daySchedules.length > 1 && (
                      <MoreSchedulesIndicator>
                        {daySchedules.length - 1} more
                      </MoreSchedulesIndicator>
                    )}
                  </SchedulePreviewContainer>
                </DayCell>
              );
            })}
          </DaysGrid>
        </CalendarPanel>
      );
    };

    const ListView = () => (
      <ScheduleListContainer>
        {schedulesModalLoading ? (
          <LoaderContainer>
            <GlobalLoaderWithoutInlineStyles />
          </LoaderContainer>
        ) : sortedGroupNames.length === 0 ? (
          <EmptyStateContainer>
            <EmptyStateIcon>
              <LordIcon
                src="https://cdn.lordicon.com/uoljexdg.json"
                trigger="in"
                colors="primary:#94a3b8"
                style={{ width: 40, height: 40 }}
              />
            </EmptyStateIcon>
            <EmptyStateText>No Schedules Found</EmptyStateText>
            <EmptyStateSubtext>
              Try adjusting your filters or creating a new schedule.
            </EmptyStateSubtext>
          </EmptyStateContainer>
        ) : (
          sortedGroupNames.map((groupName) => (
            <CustomDropdown
              key={groupName}
              groupName={groupName}
              schedulesInGroup={groupedSchedules[groupName]}
            />
          ))
        )}
      </ScheduleListContainer>
    );

    const renderContent = () => {
      if (isMobileView || scheduleView === "list") {
        return <ListView />;
      }
      if (scheduleView === "calendar") {
        return (
          <ModalLayout>
            <CalendarView
              onDateSelect={setSelectedCalendarDate}
              currentMonth={currentCalendarMonth}
              onMonthChange={(dir) =>
                setCalendarMonth((prev) => prev.add(dir, "month"))
              }
            />
            <ScheduleListPanel>
              <ListView />
            </ScheduleListPanel>
          </ModalLayout>
        );
      }
      return null;
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <ScheduleFilters />
        {renderContent()}
      </div>
    );
  };

  const getFilteredClasses = () => {
    let filtered = classes;

    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title?.toLowerCase().includes(lowerSearch) ||
          c.category_name?.toLowerCase().includes(lowerSearch) ||
          c.subcategory_name?.toLowerCase().includes(lowerSearch)
      );
    }
    return filtered;
  };

  const filteredClasses = useMemo(
    () => getFilteredClasses(),
    [classes, searchText]
  );

  const columns = [
    {
      title: "Class",
      dataIndex: "title",
      key: "class",
      render: (text, record) => {
        const categoryDisplay = [record.category_name, record.subcategory_name]
          .filter(Boolean)
          .join(" / ");

        return (
          <Space size="middle">
            <Avatar
              shape="square"
              size={56}
              src={record.coverImageUrl}
              icon={<ImageIcon size={24} />}
              style={{ borderRadius: "8px", backgroundColor: "#f3f4f6" }}
            />
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Text strong style={{ fontSize: "15px" }}>
                  {text || "Untitled Class"}
                </Text>
                {needsSchedulesWarning(record.last_schedule_date) && (
                  <Tooltip title="This class is running out of available schedules and may not be visible to new students.">
                    <AlertTriangle size={16} color={colors.warning} />
                  </Tooltip>
                )}
              </div>
              {categoryDisplay && (
                <CategoryTag>
                  <TagIcon size={12} /> {categoryDisplay}
                </CategoryTag>
              )}
            </div>
          </Space>
        );
      },
    },
    {
      title: "Rating",
      key: "rating",
      width: 150,
      render: (_, record) =>
        record.review_count > 0 ? (
          <StatItem>
            <Star size={16} className="lucide-star" fill={colors.warning} />
            <Text strong>{record.average_rating.toFixed(1)}</Text>
            <Text type="secondary">({record.review_count})</Text>
          </StatItem>
        ) : (
          <Text type="secondary">No reviews yet</Text>
        ),
    },
    {
      title: "Status",
      key: "status",
      width: 150,
      render: (_, record) => {
        if (!record.option) {
          return (
            <StatusTag>
              <AlertTriangle size={12} /> Needs Config
            </StatusTag>
          );
        }
        const isActive = record.status === "active";
        return (
          <Tooltip
            title={`Click to set class to ${isActive ? "Inactive" : "Active"}`}
          >
            <Space>
              <Switch
                checked={isActive}
                onChange={(checked, event) => {
                  event.stopPropagation();
                  toggleClassVisibility(record.classId, record.status);
                }}
                size="small"
              />
              <Text>{isActive ? "Active" : "Inactive"}</Text>
            </Space>
          </Tooltip>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      width: 200,
      render: (_, record) => {
        const menu = (
          <StyledMenu onClick={({ domEvent }) => domEvent.stopPropagation()}>
            <Menu.Item
              key="edit"
              icon={<Edit size={16} />}
              onClick={() => handleEditClass(record)}
            >
              Edit Class Details
            </Menu.Item>
            <Menu.Item
              key="delete"
              icon={<Trash2 size={16} />}
              onClick={() => openDeleteModal(record)}
              danger
            >
              Delete Class
            </Menu.Item>
          </StyledMenu>
        );

        return (
          <Space size="small" onClick={(e) => e.stopPropagation()}>
            <Tooltip
              title={
                record.option
                  ? "Manage class times, dates, and prices"
                  : "Complete class setup to add schedules"
              }
            >
              <Button
                onClick={() => {
                  if (record.option) {
                    openSchedulesModal(record);
                  } else {
                    handleEditClass(record);
                  }
                }}
              >
                {record.option ? "Manage Schedules" : "Configure Class"}
              </Button>
            </Tooltip>
            <Dropdown
              overlay={menu}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Tooltip title="More class options">
                <TableActionButton icon={<MoreVertical size={16} />} />
              </Tooltip>
            </Dropdown>
          </Space>
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
      <EmptyStateText>No Classes Found</EmptyStateText>
      <EmptyStateSubtext>
        You haven't created any classes yet. Click 'Create New Class' to get
        started!
      </EmptyStateSubtext>
    </EmptyStateContainer>
  );

  const renderClassCard = (classItem) => {
    const {
      classId,
      coverImageUrl,
      title,
      category_name,
      subcategory_name,
      average_rating,
      review_count,
      status,
      option,
      last_schedule_date,
    } = classItem;

    const categoryDisplay = [category_name, subcategory_name]
      .filter(Boolean)
      .join(" / ");

    const isActive = status === "active";

    const menu = (
      <StyledMenu>
        <Menu.Item
          key="edit"
          icon={<Edit size={16} />}
          onClick={() => handleEditClass(classItem)}
        >
          Edit Class Details
        </Menu.Item>
        <Menu.Item
          key="delete"
          icon={<Trash2 size={16} />}
          danger
          onClick={() => openDeleteModal(classItem)}
        >
          Delete Class
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
                {title || "Untitled Class"}
              </CardTitle>
              {needsSchedulesWarning(last_schedule_date) && (
                <Tooltip title="This class has no future schedules and may not be visible to students.">
                  <AlertTriangle size={16} color={colors.warning} />
                </Tooltip>
              )}
            </div>
            {categoryDisplay && <CategoryTag>{categoryDisplay}</CategoryTag>}
          </CardContent>
        </CardHeader>
        <CardBody>
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
              if (option) openSchedulesModal(classItem);
              else handleEditClass(classItem);
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
    <ConfigProvider theme={theme}>
      <PageContainer>
        <PageHeader>
          <HeaderTitle>Class Management</HeaderTitle>
          <HeaderSubtitle>
            Oversee, edit, and manage all your class offerings and their
            schedules.
          </HeaderSubtitle>
        </PageHeader>
        <Divider />

        <Controls>
          <StyledSearchInput
            prefix={<Search size={18} />}
            placeholder="Search classes by name or category..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <ActionButton
            type="primary"
            icon={<Plus size={18} />}
            onClick={() => setCreateDrawerVisible(true)}
          >
            Create New Class
          </ActionButton>
        </Controls>

        {loading ? (
          <LoaderContainer>
            <GlobalLoaderWithoutInlineStyles />
          </LoaderContainer>
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
              onRow={(record) => ({
                onClick: () => {
                  if (record.option) {
                    openSchedulesModal(record);
                  }
                },
                className: record.option ? "clickable-row" : "",
              })}
            />
          </TableViewWrapper>
        )}

        <ScheduleEditDrawer
          open={scheduleEditModal.visible}
          onCancel={() => setScheduleEditModal({ visible: false })}
          onSubmit={handleScheduleSave}
          editingSchedule={scheduleEditModal.editingSchedule}
          optionType={scheduleEditModal.selectedOption?.booking_type}
          optionId={scheduleEditModal.selectedOption?.optionId}
          form={scheduleForm}
        />

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

        {shouldRender &&
          (isMobileView ? (
            <VaulDrawer.Root
              open={createDrawerVisible}
              onOpenChange={(open) => {
                if (!open) setCreateDrawerVisible(false);
              }}
              dismissible
            >
              <VaulDrawer.Portal>
                <StyledScheduleDrawerOverlay />
                <StyledScheduleDrawerContent>
                  <ScheduleDrawerHandle />

                  <DrawerHeader>
                    <Title level={4} style={{ margin: 0 }}>
                      Create New Class
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
            >
              <VaulDrawer.Portal>
                <StyledScheduleDrawerOverlay />
                <DesktopDrawerContent>
                  <DrawerHeader>
                    <Title level={4} style={{ margin: 0 }}>
                      Create New Class
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
          ))}

        {!isMobileView && (
          <DesktopScheduleModal
            title={`Manage Schedules for "${schedulesModal.classData?.title}"`}
            open={schedulesModal.visible}
            centered
            onCancel={closeSchedulesModal}
            width="65vw"
            destroyOnClose
            footer={[
              <Button
                key="add"
                type="primary"
                icon={<Plus size={16} />}
                onClick={() => handleAddSchedule(schedulesModal.classData)}
              >
                Add New Schedule
              </Button>,
            ]}
          >
            {schedulesModal.visible &&
              renderSchedulesModalContent(
                schedulesModal.classData,
                calendarMonth,
                setCalendarMonth
              )}
          </DesktopScheduleModal>
        )}

        {isMobileView && (
          <VaulDrawer.Root
            open={schedulesModal.visible}
            onOpenChange={(open) => {
              if (!open) {
                closeSchedulesModal();
              }
            }}
          >
            <VaulDrawer.Portal>
              <StyledScheduleDrawerOverlay />
              <StyledScheduleDrawerContent>
                <ScheduleDrawerHandle />

                <MobileScheduleHeader>
                  <MobileScheduleTitle>Manage Schedules</MobileScheduleTitle>
                  <MobileCloseButton
                    icon={<X size={20} />}
                    onClick={closeSchedulesModal}
                  />
                </MobileScheduleHeader>

                <div style={{ flex: 1, overflow: "hidden" }}>
                  {schedulesModal.visible &&
                    renderSchedulesModalContent(
                      schedulesModal.classData,
                      calendarMonth,
                      setCalendarMonth
                    )}
                </div>

                <MobileScheduleFooter>
                  <Button
                    type="primary"
                    icon={<Plus size={16} />}
                    onClick={() => handleAddSchedule(schedulesModal.classData)}
                    block
                  >
                    Add New Schedule
                  </Button>
                </MobileScheduleFooter>
              </StyledScheduleDrawerContent>
            </VaulDrawer.Portal>
          </VaulDrawer.Root>
        )}
      </PageContainer>
    </ConfigProvider>
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
