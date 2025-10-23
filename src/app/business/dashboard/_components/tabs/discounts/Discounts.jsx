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
  Popconfirm,
  Skeleton,
  Divider,
  ConfigProvider,
  Card,
  Grid,
} from "antd";
import message from "@/lib/message";
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
  Users,
  Clock,
  ShoppingCart,
  Gift,
  Hash,
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
  padding: 20px 24px;
  border-bottom: 1px solid ${colors.border};
  background: white;
  border-radius: 16px 16px 0 0;
`;

const DrawerTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    color: ${colors.primary};
  }
`;

const DrawerSubtitle = styled.p`
  margin: 6px 0 0 0;
  font-size: 14px;
  color: ${colors.textSecondary};
  line-height: 1.5;
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
  padding: 16px 24px;
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
  line-height: 1;
  margin-bottom: 4px;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  font-weight: 500;
  margin-bottom: 8px;
  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const ActionButton = styled(Button)`
  height: 40px;
  border-radius: 10px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const TableSection = styled(motion.div)`
  margin-top: 0;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
  padding: 24px;
  position: relative;

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 12px;
  }
`;

const TableHeader = styled.div`
  margin-bottom: 20px;
`;

const TableTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin: 0 0 6px 0;
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    color: ${colors.primary};
  }
`;

const TableDescription = styled(Text)`
  font-size: 14px;
  color: ${colors.textSecondary};
`;

const LoaderContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 10;
  border-radius: 16px;
`;

const StyledTable = styled(Table)`
  .ant-table {
    border-radius: 12px;
  }

  .ant-table-thead > tr > th {
    background: ${colors.lightBg};
    font-weight: 600;
    color: ${colors.textPrimary};
    border-bottom: 2px solid ${colors.border};
    padding: 14px 16px;

    &:first-child {
      border-top-left-radius: 12px;
    }

    &:last-child {
      border-top-right-radius: 12px;
    }
  }

  .ant-table-tbody > tr > td {
    padding: 14px 16px;
    border-bottom: 1px solid ${colors.border};
  }

  .ant-table-tbody > tr:last-child > td {
    border-bottom: none;
  }

  .ant-table-tbody > tr:hover > td {
    background: ${colors.lightBg};
  }
`;

const EmptyStateContainer = styled.div`
  text-align: center;
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const EmptyStateIcon = styled.div`
  margin-bottom: 8px;
`;

const EmptyStateText = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.textPrimary};
`;

const EmptyStateSubtext = styled.div`
  font-size: 14px;
  color: ${colors.textSecondary};
  max-width: 400px;
`;

const MobileDiscountCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid ${colors.border};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const MobileDiscountHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const MobileDiscountTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin-bottom: 4px;
`;

const MobileDiscountCode = styled.div`
  font-size: 14px;
  color: ${colors.primary};
  font-weight: 500;
  font-family: "Courier New", monospace;
`;

const MobileDiscountRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-top: 1px solid ${colors.border};
  font-size: 14px;
`;

const MobileDiscountLabel = styled.span`
  color: ${colors.textSecondary};
  font-weight: 500;
`;

const MobileDiscountValue = styled.span`
  color: ${colors.textPrimary};
  font-weight: 500;
`;

const MobileDiscountActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid ${colors.border};
`;

const DrawerContent = styled.div`
  padding: 24px;
`;

const FormSection = styled.div`
  margin-bottom: 28px;
`;

const SectionDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 32px 0 24px 0;
  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: ${colors.border};
  }
  span {
    padding: 0 16px;
    color: ${colors.textSecondary};
    font-weight: 600;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    svg {
      color: ${colors.primary};
    }
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const MobileFormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const FormLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin-bottom: 8px;

  svg {
    width: 16px;
    height: 16px;
    color: ${colors.primary};
  }
`;

const HelpText = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  margin-top: 4px;
  margin-bottom: 8px;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 6px;

  svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const StyledFormInput = styled(Input)`
  border-radius: 8px;
  height: 40px;

  &:focus {
    box-shadow: 0 0 0 3px ${colors.primary}20;
  }
`;

const StyledFormInputNumber = styled(InputNumber)`
  width: 100%;
  border-radius: 8px;
  height: 40px;

  .ant-input-number-input {
    height: 38px;
  }

  &:focus-within {
    box-shadow: 0 0 0 3px ${colors.primary}20;
  }
`;

const StyledFormSelect = styled(Select)`
  .ant-select-selector {
    border-radius: 8px !important;
    height: 40px !important;
    display: flex;
    align-items: center;
  }

  &.ant-select-focused .ant-select-selector {
    box-shadow: 0 0 0 3px ${colors.primary}20 !important;
  }
`;

const StyledFormRangePicker = styled(RangePicker)`
  border-radius: 8px;
  height: 40px;
  width: 100%;

  &:focus,
  &.ant-picker-focused {
    box-shadow: 0 0 0 3px ${colors.primary}20;
  }
`;

const StyledSwitch = styled(Switch)`
  &.ant-switch-checked {
    background-color: ${colors.success};
  }
`;

const DiscountTypeCard = styled.div`
  border: 2px solid
    ${(props) => (props.$selected ? colors.primary : colors.border)};
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${(props) => (props.$selected ? `${colors.primary}08` : "white")};

  &:hover {
    border-color: ${colors.primary};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
`;

const DiscountTypeIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => (props.$selected ? colors.primary : colors.lightBg)};
  color: ${(props) => (props.$selected ? "white" : colors.textSecondary)};
  margin-bottom: 12px;
`;

const DiscountTypeTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin-bottom: 4px;
`;

const DiscountTypeDesc = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  line-height: 1.4;
`;

const InfoBox = styled.div`
  background: ${colors.lightBg};
  border: 1px solid ${colors.border};
  border-radius: 8px;
  padding: 12px;
  display: flex;
  gap: 10px;
  margin-top: 8px;

  svg {
    flex-shrink: 0;
    margin-top: 2px;
    color: ${colors.info};
  }
`;

const InfoBoxText = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  line-height: 1.5;
`;

const StatSkeleton = () => <Skeleton active paragraph={{ rows: 2 }} />;

const Discounts = ({ businessId }) => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [form] = Form.useForm();
  const [isReady, setIsReady] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const refreshButtonRef = useRef(null);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [scheduleGroups, setScheduleGroups] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  const watchedClassOption = Form.useWatch("applicable_classes_type", form);
  const watchedDiscountType = Form.useWatch("discount_type", form);

  useEffect(() => {
    fetchDiscounts();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const response = await businessDiscountService.getDiscounts(businessId);
      setDiscounts(response.data || []);
    } catch (error) {
      message.error("Failed to load discounts");
      console.error("Error fetching discounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const response = await businessClassService.fetchBusinessClasses({
        business_id: businessId,
      });
      setClasses(response.data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchScheduleGroups = async (classId) => {
    try {
      setLoadingSchedules(true);
      const response = await scheduleService.getClassSchedules(classId);
      const uniqueGroups = [
        ...new Set(
          response.data
            .filter((schedule) => schedule.group_name)
            .map((schedule) => schedule.group_name)
        ),
      ].map((name) => ({ name }));
      setScheduleGroups(uniqueGroups);
    } catch (error) {
      console.error("Error fetching schedule groups:", error);
      setScheduleGroups([]);
    } finally {
      setLoadingSchedules(false);
    }
  };

  useEffect(() => {
    const classId = form.getFieldValue("applicable_class_id");
    if (watchedClassOption === "specific_class" && classId) {
      fetchScheduleGroups(classId);
    } else {
      setScheduleGroups([]);
    }
  }, [watchedClassOption]);

  const refreshData = async () => {
    await fetchDiscounts();
    if (refreshButtonRef.current) {
      refreshButtonRef.current.blur();
    }
  };

  const showDrawer = (discount = null) => {
    setEditingDiscount(discount);
    setShouldRender(true);

    if (discount) {
      const formData = {
        ...discount,
        valid_dates:
          discount.valid_from && discount.valid_to
            ? [dayjs(discount.valid_from), dayjs(discount.valid_to)]
            : null,
        applicable_classes_type: discount.applicable_class_id
          ? "specific_class"
          : "all_classes",
      };
      form.setFieldsValue(formData);

      if (discount.applicable_class_id) {
        fetchScheduleGroups(discount.applicable_class_id);
      }
    } else {
      form.resetFields();
      form.setFieldsValue({
        discount_type: "percentage",
        applicable_classes_type: "all_classes",
        is_active: true,
      });
    }

    requestAnimationFrame(() => {
      setDrawerVisible(true);
    });
  };

  const onDrawerClose = () => {
    setDrawerVisible(false);
    setTimeout(() => {
      setShouldRender(false);
      setEditingDiscount(null);
      form.resetFields();
    }, 300);
  };

  const handleSubmit = async (values) => {
    try {
      setSaveLoading(true);

      const payload = {
        ...values,
        business_id: businessId,
        valid_from: values.valid_dates?.[0]?.format("YYYY-MM-DD") || null,
        valid_to: values.valid_dates?.[1]?.format("YYYY-MM-DD") || null,
        applicable_class_id:
          values.applicable_classes_type === "specific_class"
            ? values.applicable_class_id
            : null,
        applicable_group:
          values.applicable_classes_type === "specific_class"
            ? values.applicable_group
            : null,
      };

      delete payload.valid_dates;
      delete payload.applicable_classes_type;

      if (editingDiscount) {
        await businessDiscountService.updateDiscount(
          editingDiscount.id,
          payload
        );
        message.success("Discount updated successfully!");
      } else {
        await businessDiscountService.createDiscount(payload);
        message.success("Discount created successfully!");
      }

      await fetchDiscounts();
      onDrawerClose();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to save discount");
      console.error("Error saving discount:", error);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await businessDiscountService.deleteDiscount(id);
      message.success("Discount deleted successfully!");
      await fetchDiscounts();
    } catch (error) {
      message.error("Failed to delete discount");
      console.error("Error deleting discount:", error);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await businessDiscountService.updateDiscount(id, {
        is_active: !currentStatus,
      });
      message.success(
        `Discount ${!currentStatus ? "activated" : "deactivated"} successfully!`
      );
      await fetchDiscounts();
    } catch (error) {
      message.error("Failed to update discount status");
      console.error("Error toggling discount status:", error);
    }
  };

  const statisticCards = [
    {
      key: "total",
      title: "Total Discounts",
      value: discounts.length,
      icon: <Ticket size={18} />,
      background: `${colors.chart.blue}15`,
      color: colors.chart.blue,
    },
    {
      key: "active",
      title: "Active Offers",
      value: discounts.filter((d) => d.is_active).length,
      icon: <TrendingUp size={18} />,
      background: `${colors.success}15`,
      color: colors.success,
    },
    {
      key: "usage",
      title: "Total Usage",
      value: discounts.reduce((sum, d) => sum + (d.times_used || 0), 0),
      icon: <BarChart3 size={18} />,
      background: `${colors.chart.purple}15`,
      color: colors.chart.purple,
    },
  ];

  const columns = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      render: (text) => (
        <Text
          strong
          style={{
            fontFamily: "monospace",
            color: colors.primary,
            fontSize: "14px",
          }}
        >
          {text}
        </Text>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Type",
      dataIndex: "discount_type",
      key: "discount_type",
      render: (type, record) => (
        <Space>
          {type === "percentage" ? (
            <Tag color="blue">{record.value}% OFF</Tag>
          ) : (
            <Tag color="green">${record.value} OFF</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Validity",
      key: "validity",
      render: (_, record) => {
        if (!record.valid_from && !record.valid_to) {
          return <Text type="secondary">No expiry</Text>;
        }
        return (
          <Space direction="vertical" size={0}>
            {record.valid_from && (
              <Text type="secondary" style={{ fontSize: "12px" }}>
                From: {dayjs(record.valid_from).format("MMM D, YYYY")}
              </Text>
            )}
            {record.valid_to && (
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Until: {dayjs(record.valid_to).format("MMM D, YYYY")}
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: "Usage",
      key: "usage",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.times_used || 0} times</Text>
          {record.usage_limit && (
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Limit: {record.usage_limit}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive, record) => (
        <Space>
          <Tag color={isActive ? "success" : "default"}>
            {isActive ? "Active" : "Inactive"}
          </Tag>
          <Tooltip title={record.is_active ? "Deactivate" : "Activate"}>
            <Switch
              size="small"
              checked={record.is_active}
              onChange={() => handleToggleActive(record.id, record.is_active)}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit discount">
            <Button
              type="text"
              icon={<Edit size={16} />}
              onClick={() => showDrawer(record)}
            />
          </Tooltip>

          <Popconfirm
            title="Delete discount"
            description="Are you sure you want to delete this discount?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete discount">
              <Button type="text" danger icon={<Trash2 size={16} />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const MobileDiscountItem = ({ record, onEdit, onDelete, onToggleActive }) => (
    <MobileDiscountCard>
      <MobileDiscountHeader>
        <div>
          <MobileDiscountTitle>{record.name}</MobileDiscountTitle>
          <MobileDiscountCode>{record.code}</MobileDiscountCode>
        </div>
        <Tag color={record.is_active ? "success" : "default"}>
          {record.is_active ? "Active" : "Inactive"}
        </Tag>
      </MobileDiscountHeader>

      <MobileDiscountRow>
        <MobileDiscountLabel>Discount</MobileDiscountLabel>
        <MobileDiscountValue>
          {record.discount_type === "percentage"
            ? `${record.value}% OFF`
            : `$${record.value} OFF`}
        </MobileDiscountValue>
      </MobileDiscountRow>

      <MobileDiscountRow>
        <MobileDiscountLabel>Times Used</MobileDiscountLabel>
        <MobileDiscountValue>
          {record.times_used || 0}
          {record.usage_limit ? ` / ${record.usage_limit}` : ""}
        </MobileDiscountValue>
      </MobileDiscountRow>

      {(record.valid_from || record.valid_to) && (
        <MobileDiscountRow>
          <MobileDiscountLabel>Valid Period</MobileDiscountLabel>
          <MobileDiscountValue style={{ fontSize: "12px" }}>
            {record.valid_from && dayjs(record.valid_from).format("MMM D")} -{" "}
            {record.valid_to && dayjs(record.valid_to).format("MMM D, YYYY")}
          </MobileDiscountValue>
        </MobileDiscountRow>
      )}

      <MobileDiscountActions>
        <Button
          size="small"
          icon={<Edit size={14} />}
          onClick={() => onEdit(record)}
          style={{ flex: 1 }}
        >
          Edit
        </Button>
        <Button
          size="small"
          onClick={() => onToggleActive(record.id, record.is_active)}
          style={{ flex: 1 }}
        >
          {record.is_active ? "Deactivate" : "Activate"}
        </Button>
        <Popconfirm
          title="Delete?"
          onConfirm={() => onDelete(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button size="small" danger icon={<Trash2 size={14} />} />
        </Popconfirm>
      </MobileDiscountActions>
    </MobileDiscountCard>
  );

  const renderDrawerContent = () => (
    <>
      <DrawerHeader>
        <DrawerTitle>
          <Gift size={20} />
          {editingDiscount ? "Edit Discount" : "Create New Discount"}
        </DrawerTitle>
        <DrawerSubtitle>
          {editingDiscount
            ? "Update your discount details to adjust your promotional offer"
            : "Set up a promotional offer to attract more students and boost enrollment"}
        </DrawerSubtitle>
      </DrawerHeader>

      <DrawerBody>
        <DrawerContent>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              discount_type: "percentage",
              applicable_classes_type: "all_classes",
              is_active: true,
            }}
          >
            <SectionDivider>
              <span>
                <TagIcon size={16} /> Basic Information
              </span>
            </SectionDivider>

            <FormSection>
              <FormGroup>
                <FormLabel>
                  <TagIcon size={16} />
                  Discount Name
                  <Tooltip title="Give your discount a descriptive name that helps you identify it easily in your dashboard">
                    <Info
                      size={14}
                      style={{ color: "#8c8c8c", cursor: "help" }}
                    />
                  </Tooltip>
                </FormLabel>
                <HelpText>
                  <Info size={14} />A friendly name for internal use (e.g.,
                  "Summer Sale", "New Student Welcome")
                </HelpText>
                <Form.Item
                  name="name"
                  rules={[
                    { required: true, message: "Please enter a discount name" },
                  ]}
                >
                  <StyledFormInput placeholder="e.g., Summer Sale 2025" />
                </Form.Item>
              </FormGroup>

              <FormGroup>
                <FormLabel>
                  <Hash size={16} />
                  Promo Code
                  <Tooltip title="Create a unique code that students will enter at checkout. Use uppercase letters, numbers, and hyphens only">
                    <Info
                      size={14}
                      style={{ color: "#8c8c8c", cursor: "help" }}
                    />
                  </Tooltip>
                </FormLabel>
                <HelpText>
                  <Info size={14} />
                  The code students will use at checkout (e.g., "SUMMER25",
                  "WELCOME10")
                </HelpText>
                <Form.Item
                  name="code"
                  rules={[
                    { required: true, message: "Please enter a promo code" },
                    {
                      pattern: /^[A-Z0-9-]+$/,
                      message:
                        "Code must contain only uppercase letters, numbers, and hyphens",
                    },
                  ]}
                >
                  <StyledFormInput
                    placeholder="e.g., SUMMER25"
                    style={{
                      textTransform: "uppercase",
                      fontFamily: "monospace",
                    }}
                  />
                </Form.Item>
              </FormGroup>

              <FormGroup>
                <FormLabel>
                  <FileText size={16} />
                  Description (Optional)
                  <Tooltip title="Add details about this promotion that will be visible to students when they apply the code">
                    <Info
                      size={14}
                      style={{ color: "#8c8c8c", cursor: "help" }}
                    />
                  </Tooltip>
                </FormLabel>
                <HelpText>
                  <Info size={14} />
                  Explain what this discount offers and any special conditions
                </HelpText>
                <Form.Item name="description">
                  <Input.TextArea
                    rows={3}
                    placeholder="e.g., Get 20% off all summer classes when you enroll by June 1st"
                    style={{ borderRadius: "8px" }}
                  />
                </Form.Item>
              </FormGroup>
            </FormSection>

            <SectionDivider>
              <span>
                <Percent size={16} /> Discount Type & Value
              </span>
            </SectionDivider>

            <FormSection>
              <FormGroup>
                <FormLabel>
                  Select Discount Type
                  <Tooltip title="Choose between a percentage discount (e.g., 20% off) or a fixed amount discount (e.g., $10 off)">
                    <Info
                      size={14}
                      style={{ color: "#8c8c8c", cursor: "help" }}
                    />
                  </Tooltip>
                </FormLabel>
                <Form.Item name="discount_type">
                  <FormGrid>
                    <DiscountTypeCard
                      $selected={watchedDiscountType === "percentage"}
                      onClick={() =>
                        form.setFieldValue("discount_type", "percentage")
                      }
                    >
                      <DiscountTypeIcon
                        $selected={watchedDiscountType === "percentage"}
                      >
                        <Percent size={20} />
                      </DiscountTypeIcon>
                      <DiscountTypeTitle>Percentage Off</DiscountTypeTitle>
                      <DiscountTypeDesc>
                        Discount as a percentage of the total price
                      </DiscountTypeDesc>
                    </DiscountTypeCard>

                    <DiscountTypeCard
                      $selected={watchedDiscountType === "fixed"}
                      onClick={() =>
                        form.setFieldValue("discount_type", "fixed")
                      }
                    >
                      <DiscountTypeIcon
                        $selected={watchedDiscountType === "fixed"}
                      >
                        <DollarSign size={20} />
                      </DiscountTypeIcon>
                      <DiscountTypeTitle>Fixed Amount</DiscountTypeTitle>
                      <DiscountTypeDesc>
                        Discount as a specific dollar amount
                      </DiscountTypeDesc>
                    </DiscountTypeCard>
                  </FormGrid>
                </Form.Item>
              </FormGroup>

              <FormGroup>
                <FormLabel>
                  {watchedDiscountType === "percentage" ? (
                    <Percent size={16} />
                  ) : (
                    <DollarSign size={16} />
                  )}
                  Discount Value
                  <Tooltip
                    title={
                      watchedDiscountType === "percentage"
                        ? "Enter the percentage amount to discount (1-100). For example, enter 20 for a 20% discount"
                        : "Enter the dollar amount to discount. For example, enter 10 for $10 off the total price"
                    }
                  >
                    <Info
                      size={14}
                      style={{ color: "#8c8c8c", cursor: "help" }}
                    />
                  </Tooltip>
                </FormLabel>
                <HelpText>
                  <Info size={14} />
                  {watchedDiscountType === "percentage"
                    ? "Enter a percentage between 1 and 100"
                    : "Enter the fixed dollar amount to discount"}
                </HelpText>
                <Form.Item
                  name="value"
                  rules={[
                    {
                      required: true,
                      message: "Please enter a discount value",
                    },
                    {
                      type: "number",
                      min: watchedDiscountType === "percentage" ? 1 : 0.01,
                      max:
                        watchedDiscountType === "percentage" ? 100 : undefined,
                      message:
                        watchedDiscountType === "percentage"
                          ? "Percentage must be between 1 and 100"
                          : "Amount must be greater than 0",
                    },
                  ]}
                >
                  <StyledFormInputNumber
                    min={watchedDiscountType === "percentage" ? 1 : 0.01}
                    max={watchedDiscountType === "percentage" ? 100 : undefined}
                    prefix={
                      watchedDiscountType === "percentage" ? null : (
                        <DollarSign size={14} />
                      )
                    }
                    suffix={watchedDiscountType === "percentage" ? "%" : null}
                    placeholder={
                      watchedDiscountType === "percentage"
                        ? "e.g., 20"
                        : "e.g., 10.00"
                    }
                    precision={watchedDiscountType === "percentage" ? 0 : 2}
                  />
                </Form.Item>
                <InfoBox>
                  <InfoBoxText>
                    {watchedDiscountType === "percentage"
                      ? "This discount will reduce the total price by the specified percentage. For example, a 20% discount on a $100 class would save $20."
                      : "This discount will reduce the total price by the exact dollar amount specified, regardless of the original price."}
                  </InfoBoxText>
                </InfoBox>
              </FormGroup>
            </FormSection>

            <SectionDivider>
              <span>
                <Package size={16} /> Applicability
              </span>
            </SectionDivider>

            <FormSection>
              <FormGroup>
                <FormLabel>
                  Apply To
                  <Tooltip title="Choose whether this discount applies to all your classes or only specific ones">
                    <Info
                      size={14}
                      style={{ color: "#8c8c8c", cursor: "help" }}
                    />
                  </Tooltip>
                </FormLabel>
                <HelpText>
                  <Info size={14} />
                  Select which classes this discount can be applied to
                </HelpText>
                <Form.Item name="applicable_classes_type">
                  <StyledFormSelect>
                    <Option value="all_classes">All Classes</Option>
                    <Option value="specific_class">
                      Specific Class & Group
                    </Option>
                  </StyledFormSelect>
                </Form.Item>
              </FormGroup>

              {watchedClassOption === "specific_class" && (
                <FormGrid>
                  <FormGroup>
                    <FormLabel>
                      <Package size={16} />
                      Select Class
                      <Tooltip title="Choose the specific class this discount applies to">
                        <Info
                          size={14}
                          style={{ color: "#8c8c8c", cursor: "help" }}
                        />
                      </Tooltip>
                    </FormLabel>
                    <Form.Item
                      name="applicable_class_id"
                      rules={[
                        {
                          required: watchedClassOption === "specific_class",
                          message: "Please select a class",
                        },
                      ]}
                    >
                      <StyledFormSelect
                        placeholder="Choose a class"
                        loading={loadingClasses}
                        onChange={(classId) => {
                          form.setFieldValue("applicable_group", undefined);
                          fetchScheduleGroups(classId);
                        }}
                        showSearch
                        optionFilterProp="children"
                      >
                        {classes.map((cls) => (
                          <Option key={cls.id} value={cls.id}>
                            {cls.name}
                          </Option>
                        ))}
                      </StyledFormSelect>
                    </Form.Item>
                  </FormGroup>
                  <FormGroup>
                    <FormLabel>
                      <Users size={16} />
                      Group (Optional)
                      <Tooltip title="Optionally select a specific schedule group within the class">
                        <Info
                          size={14}
                          style={{ color: "#8c8c8c", cursor: "help" }}
                        />
                      </Tooltip>
                    </FormLabel>
                    <Form.Item name="applicable_group">
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
                  <FormLabel>
                    <TrendingUp size={16} />
                    Status
                    <Tooltip title="Active discounts can be used by students. Inactive discounts are hidden and cannot be applied">
                      <Info
                        size={14}
                        style={{ color: "#8c8c8c", cursor: "help" }}
                      />
                    </Tooltip>
                  </FormLabel>
                  <HelpText>
                    <Info size={14} />
                    Enable or disable this discount
                  </HelpText>
                  <Form.Item name="is_active" valuePropName="checked">
                    <StyledSwitch />
                  </Form.Item>
                </FormGroup>
                <FormGroup>
                  <FormLabel>
                    <Calendar size={16} />
                    Validity Period
                    <Tooltip title="Set when this discount code becomes available and when it expires. Leave empty for no expiration">
                      <Info
                        size={14}
                        style={{ color: "#8c8c8c", cursor: "help" }}
                      />
                    </Tooltip>
                  </FormLabel>
                  <HelpText>
                    <Info size={14} />
                    Set start and end dates (optional)
                  </HelpText>
                  <Form.Item name="valid_dates">
                    <StyledFormRangePicker />
                  </Form.Item>
                </FormGroup>
              </MobileFormGrid>
              <MobileFormGrid>
                <FormGroup>
                  <FormLabel>
                    <Target size={16} />
                    Total Usage Limit
                    <Tooltip title="Set the maximum number of times this discount can be used across all students. Leave empty for unlimited uses">
                      <Info
                        size={14}
                        style={{ color: "#8c8c8c", cursor: "help" }}
                      />
                    </Tooltip>
                  </FormLabel>
                  <HelpText>
                    <Info size={14} />
                    Max times this code can be used overall
                  </HelpText>
                  <Form.Item name="usage_limit">
                    <StyledFormInputNumber min={1} placeholder="Unlimited" />
                  </Form.Item>
                </FormGroup>
                <FormGroup>
                  <FormLabel>
                    <Users size={16} />
                    Limit Per User
                    <Tooltip title="Set how many times each individual student can use this discount. Leave empty for no per-user limit">
                      <Info
                        size={14}
                        style={{ color: "#8c8c8c", cursor: "help" }}
                      />
                    </Tooltip>
                  </FormLabel>
                  <HelpText>
                    <Info size={14} />
                    Max times per student can use this code
                  </HelpText>
                  <Form.Item name="usage_limit_per_user">
                    <StyledFormInputNumber min={1} placeholder="Unlimited" />
                  </Form.Item>
                </FormGroup>
              </MobileFormGrid>
              <FormGroup>
                <FormLabel>
                  <ShoppingCart size={16} />
                  Minimum Purchase
                  <Tooltip title="Set a minimum purchase amount required to use this discount. Leave empty for no minimum">
                    <Info
                      size={14}
                      style={{ color: "#8c8c8c", cursor: "help" }}
                    />
                  </Tooltip>
                </FormLabel>
                <HelpText>
                  <Info size={14} />
                  Minimum cart value required to apply this discount
                </HelpText>
                <Form.Item name="min_purchase_amount">
                  <StyledFormInputNumber
                    min={0}
                    placeholder="No minimum"
                    precision={2}
                    prefix={<DollarSign size={14} />}
                  />
                </Form.Item>
              </FormGroup>
            </FormSection>
          </Form>
        </DrawerContent>
      </DrawerBody>

      <DrawerFooter>
        <Button onClick={onDrawerClose} disabled={saveLoading} size="middle">
          Cancel
        </Button>
        <Button
          type="primary"
          icon={<Save size={16} />}
          onClick={() => form.submit()}
          loading={saveLoading}
          disabled={loading}
          size="middle"
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
