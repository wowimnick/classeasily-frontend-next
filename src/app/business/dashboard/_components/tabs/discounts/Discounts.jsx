"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import styled from "styled-components";
import { Drawer as VaulDrawer } from "vaul";
import {
  Table,
  Button,
  Typography,
  Tag,
  Space,
  Tooltip,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Switch,
  message,
  Popconfirm,
  Skeleton,
  Divider,
  ConfigProvider,
  Card,
  Grid,
} from "antd";
import {
  Plus,
  Edit,
  Trash2,
  Ticket,
  Percent,
  DollarSign,
  Package,
  Calendar,
  Info,
  FileText,
  Tag as TagIcon,
  Save,
  TrendingUp,
  Target,
  RefreshCw,
  BarChart3,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import NumberFlow from "@number-flow/react";
import {
  businessDiscountService,
  businessClassService,
  scheduleService,
} from "@/services/apiService";
import { GlobalLoaderWithoutInlineStyles } from "@/components/common/GlobalLoader";
import { LordIcon } from "@/services/ReactUtils";
import { theme } from "@/components/theme";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

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
  chart: {
    blue: "#3b82f6",
    green: "#10b981",
    purple: "#8b5cf6",
    orange: "#f97316",
    red: "#ef4444",
    teal: "#14b8a6",
    yellow: "#eab308",
  },
};

// Vaul Drawer Styles - Mobile (Bottom)
const StyledDrawerOverlay = styled(VaulDrawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
`;

const StyledDrawerContent = styled(VaulDrawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  height: 85%;
  max-height: 85vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
`;

// Vaul Drawer Styles - Desktop (Right Side)
const DesktopDrawerContent = styled(VaulDrawer.Content)`
  right: 8px;
  top: 8px;
  bottom: 8px;
  position: fixed;
  z-index: 1050;
  outline: none;
  width: 720px;
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

const DrawerHandle = styled.div`
  width: 36px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

const DrawerHeader = styled.div`
  flex-shrink: 0;
  padding: 16px 24px;
  border-bottom: 1px solid ${colors.border};
  background: white;
  border-radius: 16px 16px 0 0;
`;

const DrawerTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    color: ${colors.primary};
  }
`;

const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  background-color: ${colors.lightBg};

  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
`;

const DrawerFooter = styled.div`
  flex-shrink: 0;
  padding: 12px 16px;
  border-top: 1px solid ${colors.border};
  background: white;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-radius: 0 0 16px 16px;
`;

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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 0;
  }
`;

const StatCard = styled(Card)`
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
  transition: all 0.2s ease;
  min-height: 140px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .ant-card-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;

    @media (max-width: 768px) {
      padding: 16px;
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

const LoaderContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 10;
  border-radius: 16px;
  backdrop-filter: blur(2px);
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

const ActionButton = styled(Button)`
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  padding: 0 16px;
  border: 1px solid ${colors.border};
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);

  &:hover {
    color: ${colors.primary};
    border-color: ${colors.primary};
    box-shadow: 0 0 0 2px rgba(255, 56, 92, 0.1);
    transform: translateY(-1px);

    lord-icon {
      --lord-icon-primary: ${colors.primary};
      --lord-icon-secondary: ${colors.primary};
    }
  }

  &.ant-btn-primary {
    background: ${colors.primary};
    border-color: ${colors.primary};
    color: white;

    &:hover {
      background: #e6325a;
      border-color: #e6325a;
      color: white;
      transform: translateY(-1px);
    }
  }

  @media (max-width: 768px) {
    width: 100%;
    height: 40px;
  }
`;

const DrawerContent = styled.div`
  padding: 24px;
  height: 100%;
  overflow-y: auto;
  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const StepHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
`;

const StepTitle = styled(Title)`
  margin-bottom: 8px !important;
  color: ${colors.textPrimary};
  font-size: 24px !important;
  font-weight: 700 !important;
  @media (max-width: 480px) {
    font-size: 20px !important;
  }
`;

const StepDescription = styled(Text)`
  display: block;
  color: ${colors.textSecondary};
  font-size: 15px;
  margin-bottom: 24px;
  line-height: 1.6;
  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const SectionDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 2rem 0;

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: ${colors.border};
  }

  span {
    padding: 0 1rem;
    color: ${colors.textSecondary};
    font-weight: 500;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const FormSection = styled(motion.div)`
  margin-bottom: 2rem;
  border-radius: 12px;
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
  width: 100%;
  @media (max-width: 768px) {
    margin-bottom: 16px;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: ${(props) => props.columns || "1fr 1fr"};
  gap: 24px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0;
    & > ${FormGroup} {
      margin-bottom: 16px;
    }
  }
`;

const MobileFormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const FormLabel = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${colors.textPrimary};
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const HelpText = styled.div`
  font-size: 12px;
  color: ${colors.textSecondary};
  margin-top: 4px;
  line-height: 1.4;
`;

const commonInputStyles = `
  height: 44px;
  border-radius: 12px;
  font-size: 14px;
  @media (max-width: 768px) {
    height: 40px;
    font-size: 14px;
  }
`;

const StyledFormInput = styled(Input)`
  ${commonInputStyles}
`;

const StyledFormSelect = styled(Select)`
  .ant-select-selector {
    ${commonInputStyles}
    display: flex !important;
    align-items: center !important;
  }
  .ant-select-selection-item,
  .ant-select-selection-placeholder {
    line-height: 42px !important;
    @media (max-width: 768px) {
      line-height: 38px !important;
    }
  }
`;

const StyledFormInputNumber = styled(InputNumber)`
  width: 100%;
  ${commonInputStyles}
  .ant-input-number-input-wrap, .ant-input-number-input {
    height: 100% !important;
    display: flex !important;
    align-items: center !important;
  }
`;

const StyledFormRangePicker = styled(RangePicker)`
  width: 100%;
  ${commonInputStyles}
`;

const DiscountCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DiscountName = styled(Text)`
  font-weight: 600;
  color: ${colors.textPrimary};
  font-size: 14px;
`;

const DiscountBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  width: fit-content;

  &.coupon {
    background: rgba(59, 130, 246, 0.1);
    color: ${colors.info};
  }

  &.automatic {
    background: rgba(16, 185, 129, 0.1);
    color: ${colors.success};
  }
`;

const ValueDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: ${colors.textPrimary};
  font-size: 15px;

  svg {
    color: ${colors.textSecondary};
  }
`;

const ScopeTag = styled(Tag)`
  border-radius: 6px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;

  &.class {
    background: rgba(139, 92, 246, 0.1);
    color: #7c3aed;
  }

  &.schedule {
    background: rgba(6, 182, 212, 0.1);
    color: #0891b2;
  }
`;

const UsageDisplay = styled.div`
  font-weight: 500;
  color: ${colors.textPrimary};
`;

const ActionButtonSmall = styled(Button)`
  height: 32px;
  border-radius: 8px;
`;

const StyledSwitch = styled(Switch)`
  &.ant-switch-checked {
    background-color: ${colors.success};
  }
`;

const MobileCard = styled(Card)`
  margin-bottom: 12px;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`;

const MobileCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
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

const MobileDiscountItem = ({ record, onEdit, onDelete, onToggleActive }) => {
  return (
    <MobileCard>
      <MobileCardHeader>
        <DiscountCard>
          <DiscountName>{record.name}</DiscountName>
          <DiscountBadge className={record.code ? "coupon" : "automatic"}>
            <Ticket size={10} />
            {record.code ? record.code : "AUTOMATIC"}
          </DiscountBadge>
        </DiscountCard>
        <Space>
          <Tooltip title="Edit">
            <ActionButtonSmall
              icon={<Edit size={14} />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this discount?"
            description="This action cannot be undone."
            onConfirm={() => onDelete(record.id)}
            okText="Yes, Delete"
            cancelText="No"
            placement="topRight"
          >
            <Tooltip title="Delete">
              <ActionButtonSmall danger icon={<Trash2 size={14} />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      </MobileCardHeader>
      <MobileCardContent>
        <MobileCardRow>
          <MobileCardLabel>Value</MobileCardLabel>
          <ValueDisplay>
            {record.discount_type === "percentage" ? (
              <Percent size={14} />
            ) : (
              <DollarSign size={14} />
            )}
            <span>
              {record.discount_type === "percentage"
                ? `${parseFloat(record.value)}%`
                : `$${parseFloat(record.value).toFixed(2)}`}
            </span>
          </ValueDisplay>
        </MobileCardRow>
        <MobileCardRow>
          <MobileCardLabel>Scope</MobileCardLabel>
          {record.scope === "class" ? (
            <Tooltip title={record.target_class_name || "N/A"}>
              <ScopeTag className="class">
                <Package size={12} />
                Entire Class
              </ScopeTag>
            </Tooltip>
          ) : (
            <Tooltip title={record.target_schedule_group_name || "N/A"}>
              <ScopeTag className="schedule">
                <Calendar size={12} />
                Schedule Group
              </ScopeTag>
            </Tooltip>
          )}
        </MobileCardRow>
        <MobileCardRow>
          <MobileCardLabel>Usage</MobileCardLabel>
          <UsageDisplay>
            {record.usage_count} / {record.usage_limit || "∞"}
          </UsageDisplay>
        </MobileCardRow>
        <MobileCardRow>
          <MobileCardLabel>Status</MobileCardLabel>
          <StyledSwitch
            checked={record.is_active}
            onChange={() => onToggleActive(record)}
            size="small"
          />
        </MobileCardRow>
      </MobileCardContent>
    </MobileCard>
  );
};

const Discounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [form] = Form.useForm();
  const [isReady, setIsReady] = useState(false);

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [businessClasses, setBusinessClasses] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [scheduleGroups, setScheduleGroups] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [scope, setScope] = useState("class");
  const [selectedClassOption, setSelectedClassOption] = useState(null);
  const watchedDiscountType = Form.useWatch("discount_type", form);
  const watchedClassOption = Form.useWatch("target_class_option", form);

  const refreshButtonRef = useRef(null);

  const totalDiscounts = discounts.length;
  const activeDiscounts = discounts.filter((d) => d.is_active).length;
  const totalUsage = discounts.reduce(
    (sum, d) => sum + (d.usage_count || 0),
    0
  );
  const avgUsage =
    totalDiscounts > 0 ? (totalUsage / totalDiscounts).toFixed(1) : 0;

  useEffect(() => {
    if (drawerVisible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [drawerVisible]);

  const fetchDiscounts = async () => {
    setLoading(true);
    setIsReady(false);
    const result = await businessDiscountService.getDiscounts();
    if (result.success) {
      setDiscounts(result.data);
      setTimeout(() => setIsReady(true), 50);
    } else {
      message.error(result.error || "Failed to load discounts.");
    }
    setLoading(false);
  };

  const fetchClassesAndOptions = async () => {
    const classResult = await businessClassService.fetchBusinessClasses({
      page_size: 500,
    });
    if (classResult.success) {
      setBusinessClasses(classResult.data);
      const options = classResult.data.flatMap((cls) =>
        cls.options.map((opt) => ({
          ...opt,
          className: cls.title,
          classId: cls.classId,
        }))
      );
      setClassOptions(options);
    }
  };

  const fetchScheduleGroups = async (classOptionId) => {
    if (!classOptionId) {
      setScheduleGroups([]);
      return;
    }

    setLoadingSchedules(true);
    try {
      const result = await scheduleService.fetchSchedules({
        option_id: classOptionId,
      });
      if (result.success) {
        const scheduleData = result.data || [];
        const groupedSchedules = scheduleData.reduce((acc, schedule) => {
          const groupName = schedule.name || `Unnamed Group (${schedule.date})`;
          if (!acc[groupName]) {
            acc[groupName] = { name: groupName, schedules: [] };
          }
          acc[groupName].schedules.push(schedule);
          return acc;
        }, {});
        setScheduleGroups(Object.values(groupedSchedules));
      } else {
        message.error("Failed to load schedule groups");
        setScheduleGroups([]);
      }
    } finally {
      setLoadingSchedules(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
    fetchClassesAndOptions();
  }, []);

  const refreshData = () => {
    fetchDiscounts();
    fetchClassesAndOptions();
  };

  const showDrawer = (discount = null) => {
    setEditingDiscount(discount);
    if (discount) {
      const formData = {
        ...discount,
        valid_dates:
          discount.valid_from && discount.valid_to
            ? [dayjs(discount.valid_from), dayjs(discount.valid_to)]
            : null,
        value: Number(discount.value),
      };

      setScope(discount.scope);
      if (discount.scope === "schedule_group" && discount.target_class_option) {
        setSelectedClassOption(discount.target_class_option);
        fetchScheduleGroups(discount.target_class_option);
      }
      form.setFieldsValue(formData);
    } else {
      form.resetFields();
      setScope("class");
      setSelectedClassOption(null);
      setScheduleGroups([]);
      form.setFieldsValue({
        is_active: true,
        scope: "class",
        discount_type: "percentage",
        value: 10,
      });
    }
    setDrawerVisible(true);
  };

  const onDrawerClose = () => {
    setDrawerVisible(false);
  };

  const handleClassOptionChange = (optionId) => {
    setSelectedClassOption(optionId);
    form.setFieldsValue({ target_schedule_group_name: undefined });
    fetchScheduleGroups(optionId);
  };

  const onFormSubmit = async (values) => {
    setSaveLoading(true);
    try {
      const payload = {
        ...values,
        valid_from: values.valid_dates
          ? values.valid_dates[0]?.toISOString()
          : null,
        valid_to: values.valid_dates
          ? values.valid_dates[1]?.toISOString()
          : null,
      };
      delete payload.valid_dates;

      let result;
      if (editingDiscount) {
        result = await businessDiscountService.updateDiscount(
          editingDiscount.id,
          payload
        );
      } else {
        result = await businessDiscountService.createDiscount(payload);
      }

      if (result.success) {
        message.success(`Discount ${editingDiscount ? "updated" : "created"}!`);
        onDrawerClose();
        fetchDiscounts();
      } else {
        message.error(
          result.error?.code?.[0] ||
            result.error?.detail ||
            "An error occurred."
        );
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await businessDiscountService.deleteDiscount(id);
    if (result.success) {
      message.success("Discount deleted.");
      fetchDiscounts();
    } else {
      message.error(result.error || "Failed to delete discount.");
    }
  };

  const handleToggleActive = async (discount) => {
    const result = await businessDiscountService.toggleDiscountActive(
      discount.id
    );
    if (result.success) {
      message.success(
        `Discount is now ${result.data.is_active ? "active" : "inactive"}.`
      );
      fetchDiscounts();
    } else {
      message.error("Failed to update status.");
    }
  };

  const statisticCards = [
    {
      key: "total_discounts",
      title: "Total Discounts",
      value: totalDiscounts,
      icon: <Ticket size={20} />,
      color: colors.chart.blue,
      background: "rgba(59, 130, 246, 0.1)",
    },
    {
      key: "active_discounts",
      title: "Active",
      value: activeDiscounts,
      icon: <Target size={20} />,
      color: colors.success,
      background: "rgba(16, 185, 129, 0.1)",
    },
    {
      key: "total_usage",
      title: "Total Usage",
      value: totalUsage,
      icon: <BarChart3 size={20} />,
      color: colors.chart.purple,
      background: "rgba(139, 92, 246, 0.1)",
    },
    {
      key: "avg_usage",
      title: "Avg. Usage",
      value: parseFloat(avgUsage),
      icon: <TrendingUp size={20} />,
      color: colors.chart.orange,
      background: "#ec4a211a",
      precision: 1,
    },
  ];

  const columns = [
    {
      title: "Discount Details",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <DiscountCard>
          <DiscountName>{record.name}</DiscountName>
          <DiscountBadge className={record.code ? "coupon" : "automatic"}>
            <Ticket size={10} />
            {record.code ? record.code : "AUTOMATIC"}
          </DiscountBadge>
        </DiscountCard>
      ),
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      render: (value, record) => (
        <ValueDisplay>
          {record.discount_type === "percentage" ? (
            <Percent size={14} />
          ) : (
            <DollarSign size={14} />
          )}
          <span>
            {record.discount_type === "percentage"
              ? `${parseFloat(value)}%`
              : `${parseFloat(value).toFixed(2)}`}
          </span>
        </ValueDisplay>
      ),
    },
    {
      title: "Scope",
      dataIndex: "scope",
      key: "scope",
      render: (scope, record) => {
        if (scope === "class") {
          return (
            <Tooltip title={record.target_class_name || "N/A"}>
              <ScopeTag className="class">
                <Package size={12} />
                Entire Class
              </ScopeTag>
            </Tooltip>
          );
        }
        return (
          <Tooltip title={record.target_schedule_group_name || "N/A"}>
            <ScopeTag className="schedule">
              <Calendar size={12} />
              Schedule Group
            </ScopeTag>
          </Tooltip>
        );
      },
    },
    {
      title: "Usage",
      key: "usage",
      render: (_, record) => (
        <UsageDisplay>
          {record.usage_count} / {record.usage_limit || "∞"}
        </UsageDisplay>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
        <StyledSwitch
          checked={record.is_active}
          onChange={() => handleToggleActive(record)}
          size="small"
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <ActionButtonSmall
              icon={<Edit size={14} />}
              onClick={() => showDrawer(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this discount?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes, Delete"
            cancelText="No"
            placement="topRight"
          >
            <Tooltip title="Delete">
              <ActionButtonSmall danger icon={<Trash2 size={14} />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const StatSkeleton = () => <Skeleton active paragraph={{ rows: 2 }} />;

  const renderDrawerContent = () => (
    <>
      <DrawerHeader>
        <DrawerTitle>
          <Ticket size={20} />
          {editingDiscount ? "Edit Discount" : "Create New Discount"}
        </DrawerTitle>
      </DrawerHeader>

      <DrawerBody>
        <DrawerContent>
          {!isMobile && (
            <StepHeader>
              <StepTitle level={2}>
                {editingDiscount ? "Edit Discount" : "Create New Discount"}
              </StepTitle>
              <StepDescription>
                Configure your promotional offer.
              </StepDescription>
            </StepHeader>
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={onFormSubmit}
            onValuesChange={(changedValues) => {
              if (changedValues.scope) setScope(changedValues.scope);
              if (changedValues.target_class_option) {
                handleClassOptionChange(changedValues.target_class_option);
              }
            }}
          >
            <FormSection>
              <FormGrid>
                <FormGroup>
                  <FormLabel>Internal Name</FormLabel>
                  <HelpText>For your reference only.</HelpText>
                  <Form.Item
                    name="name"
                    rules={[{ required: true, message: "Name is required" }]}
                  >
                    <StyledFormInput placeholder="e.g., Summer Sale" />
                  </Form.Item>
                </FormGroup>
                <FormGroup>
                  <FormLabel>Coupon Code</FormLabel>
                  <HelpText>Leave blank for an automatic discount.</HelpText>
                  <Form.Item name="code">
                    <StyledFormInput placeholder="e.g., SUMMER20" />
                  </Form.Item>
                </FormGroup>
              </FormGrid>

              <MobileFormGrid>
                <FormGroup>
                  <FormLabel>Discount Type</FormLabel>
                  <Form.Item name="discount_type" rules={[{ required: true }]}>
                    <StyledFormSelect>
                      <Option value="percentage">Percentage</Option>
                      <Option value="fixed_amount">Fixed Amount</Option>
                    </StyledFormSelect>
                  </Form.Item>
                </FormGroup>
                <FormGroup>
                  <FormLabel>Value</FormLabel>
                  <Form.Item
                    name="value"
                    rules={[
                      { required: true, message: "Value is required" },
                      { type: "number", min: 0.01 },
                      ...(watchedDiscountType === "percentage"
                        ? [{ type: "number", max: 100 }]
                        : []),
                    ]}
                  >
                    <StyledFormInputNumber
                      min={0.01}
                      max={watchedDiscountType === "percentage" ? 100 : 9999}
                      step={watchedDiscountType === "percentage" ? 1 : 0.01}
                      precision={watchedDiscountType === "percentage" ? 0 : 2}
                      suffix={watchedDiscountType === "percentage" ? "%" : ""}
                    />
                  </Form.Item>
                </FormGroup>
              </MobileFormGrid>
            </FormSection>

            <SectionDivider>
              <span>
                <Package size={16} /> Scope & Application
              </span>
            </SectionDivider>

            <FormSection>
              <FormGroup>
                <FormLabel>Scope</FormLabel>
                <Form.Item name="scope" rules={[{ required: true }]}>
                  <StyledFormSelect>
                    <Option value="class">Entire Class</Option>
                    <Option value="schedule_group">Schedule Group</Option>
                  </StyledFormSelect>
                </Form.Item>
              </FormGroup>
              {scope === "class" && (
                <FormGroup>
                  <FormLabel>Select Class</FormLabel>
                  <Form.Item
                    name="target_class"
                    rules={[{ required: true, message: "Select a class" }]}
                  >
                    <StyledFormSelect
                      showSearch
                      filterOption={(input, option) =>
                        option.label.toLowerCase().includes(input.toLowerCase())
                      }
                      placeholder="Choose a class"
                      options={businessClasses.map((c) => ({
                        value: c.classId,
                        label: c.title,
                      }))}
                    />
                  </Form.Item>
                </FormGroup>
              )}
              {scope === "schedule_group" && (
                <FormGrid>
                  <FormGroup>
                    <FormLabel>Select Class Option</FormLabel>
                    <Form.Item
                      name="target_class_option"
                      rules={[{ required: true, message: "Select an option" }]}
                    >
                      <StyledFormSelect
                        showSearch
                        placeholder="Choose an option"
                        filterOption={(input, option) =>
                          option.label
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        options={classOptions.map((opt) => ({
                          value: opt.optionId,
                          label: opt.className,
                        }))}
                      />
                    </Form.Item>
                  </FormGroup>
                  <FormGroup>
                    <FormLabel>Select Schedule Group</FormLabel>
                    <Form.Item
                      name="target_schedule_group_name"
                      rules={[{ required: true, message: "Select a group" }]}
                    >
                      <StyledFormSelect
                        placeholder="Choose a group"
                        loading={loadingSchedules}
                        disabled={!watchedClassOption || loadingSchedules}
                        options={scheduleGroups.map((group) => ({
                          value: group.name,
                          label: group.name,
                        }))}
                      />
                    </Form.Item>
                  </FormGroup>
                </FormGrid>
              )}
            </FormSection>

            <SectionDivider>
              <span>
                <FileText size={16} /> Rules & Conditions
              </span>
            </SectionDivider>

            <FormSection>
              <MobileFormGrid>
                <FormGroup>
                  <FormLabel>Status</FormLabel>
                  <Form.Item name="is_active" valuePropName="checked">
                    <StyledSwitch />
                  </Form.Item>
                </FormGroup>
                <FormGroup>
                  <FormLabel>Validity Period</FormLabel>
                  <Form.Item name="valid_dates">
                    <StyledFormRangePicker />
                  </Form.Item>
                </FormGroup>
              </MobileFormGrid>
              <MobileFormGrid>
                <FormGroup>
                  <FormLabel>Total Usage Limit</FormLabel>
                  <Form.Item name="usage_limit">
                    <StyledFormInputNumber min={1} placeholder="Unlimited" />
                  </Form.Item>
                </FormGroup>
                <FormGroup>
                  <FormLabel>Limit Per User</FormLabel>
                  <Form.Item name="usage_limit_per_user">
                    <StyledFormInputNumber min={1} placeholder="Unlimited" />
                  </Form.Item>
                </FormGroup>
              </MobileFormGrid>
              <FormGroup>
                <FormLabel>Minimum Purchase</FormLabel>
                <Form.Item name="min_purchase_amount">
                  <StyledFormInputNumber
                    min={0}
                    placeholder="No minimum"
                    precision={2}
                  />
                </Form.Item>
              </FormGroup>
            </FormSection>
          </Form>
        </DrawerContent>
      </DrawerBody>

      <DrawerFooter>
        <Button onClick={onDrawerClose} disabled={saveLoading}>
          Cancel
        </Button>
        <Button
          type="primary"
          icon={<Save size={16} />}
          onClick={() => form.submit()}
          loading={saveLoading}
          disabled={loading}
        >
          {editingDiscount ? "Save Changes" : "Create Discount"}
        </Button>
      </DrawerFooter>
    </>
  );

  return (
    <ConfigProvider theme={theme}>
      <DashboardWrapper>
        <DashboardHeader>
          <div>
            <PageTitle>Discounts & Coupons</PageTitle>
            <HeaderSubtitle>
              Create and manage promotions to attract more students.
            </HeaderSubtitle>
          </div>
          <Space
            direction={isMobile ? "vertical" : "horizontal"}
            style={{ width: isMobile ? "100%" : "auto" }}
          >
            <ActionButton
              ref={refreshButtonRef}
              icon={<RefreshCw size={16} />}
              onClick={refreshData}
              loading={loading}
            >
              Refresh
            </ActionButton>
            <ActionButton
              type="primary"
              onClick={() => showDrawer()}
              icon={<Plus size={16} />}
            >
              Create Discount
            </ActionButton>
          </Space>
        </DashboardHeader>

        <Divider />

        <StatsGrid>
          {statisticCards.map((stat) => (
            <StatCard key={stat.key}>
              {loading ? (
                <StatSkeleton />
              ) : (
                <>
                  <div>
                    <StatCardHeader>
                      <IconContainer
                        background={stat.background}
                        color={stat.color}
                      >
                        {stat.icon}
                      </IconContainer>
                    </StatCardHeader>
                    <StatLabel>{stat.title}</StatLabel>
                  </div>
                  <StatValue>
                    <NumberFlow
                      value={isReady ? stat.value : 0}
                      duration={800}
                      numberFormatOptions={{
                        minimumFractionDigits: stat.precision || 0,
                        maximumFractionDigits: stat.precision || 0,
                      }}
                    />
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
          {loading && !isMobile && (
            <LoaderContainer>
              <GlobalLoaderWithoutInlineStyles />
            </LoaderContainer>
          )}

          <TableHeader>
            <TableTitle>
              <Ticket />
              Discount Management
            </TableTitle>
            <TableDescription>
              Manage your promotional offers and track their performance.
            </TableDescription>
          </TableHeader>
          {isMobile ? (
            <div style={{ padding: "0 16px 16px" }}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 5 }} />
              ) : discounts.length > 0 ? (
                discounts.map((item) => (
                  <MobileDiscountItem
                    key={item.id}
                    record={item}
                    onEdit={showDrawer}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                  />
                ))
              ) : (
                <EmptyStateContainer>
                  <EmptyStateIcon>
                    <lord-icon
                      src="https://cdn.lordicon.com/abgykmtd.json"
                      trigger="in"
                      delay="1500"
                      state="in-label"
                      colors="primary:#94a3b8"
                      style={{ width: 40, height: 40 }}
                    />
                  </EmptyStateIcon>
                  <EmptyStateText>No Discounts Found</EmptyStateText>
                  <EmptyStateSubtext>
                    No discounts have been made yet. Press 'Create Discount' to
                    get started.
                  </EmptyStateSubtext>
                </EmptyStateContainer>
              )}
            </div>
          ) : (
            <StyledTable
              columns={columns}
              dataSource={discounts}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} discounts`,
              }}
              loading={false}
              locale={{
                emptyText: (
                  <EmptyStateContainer>
                    <EmptyStateIcon>
                      <lord-icon
                        src="https://cdn.lordicon.com/abgykmtd.json"
                        trigger="in"
                        delay="1500"
                        state="in-label"
                        colors="primary:#94a3b8"
                        style={{ width: 40, height: 40 }}
                      />
                    </EmptyStateIcon>
                    <EmptyStateText>No Discounts Found</EmptyStateText>
                    <EmptyStateSubtext>
                      No discounts have been made yet. Press 'Create Discount'
                      to get started.
                    </EmptyStateSubtext>
                  </EmptyStateContainer>
                ),
              }}
            />
          )}
        </TableSection>

        {shouldRender &&
          (isMobile ? (
            <VaulDrawer.Root
              open={drawerVisible}
              onOpenChange={(isOpen) => {
                if (!isOpen) onDrawerClose();
              }}
              dismissible
            >
              <VaulDrawer.Portal>
                <StyledDrawerOverlay />
                <StyledDrawerContent>
                  <DrawerHandle />
                  {renderDrawerContent()}
                </StyledDrawerContent>
              </VaulDrawer.Portal>
            </VaulDrawer.Root>
          ) : (
            <VaulDrawer.Root
              open={drawerVisible}
              onOpenChange={(isOpen) => {
                if (!isOpen) onDrawerClose();
              }}
              direction="right"
              dismissible
            >
              <VaulDrawer.Portal>
                <StyledDrawerOverlay />
                <DesktopDrawerContent
                  style={{ "--initial-transform": "calc(100% + 8px)" }}
                >
                  <DesktopDrawerInner>
                    {renderDrawerContent()}
                  </DesktopDrawerInner>
                </DesktopDrawerContent>
              </VaulDrawer.Portal>
            </VaulDrawer.Root>
          ))}
      </DashboardWrapper>
    </ConfigProvider>
  );
};

export default Discounts;
