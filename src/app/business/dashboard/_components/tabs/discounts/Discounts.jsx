"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useReducer,
  createContext,
  useContext,
  useCallback,
} from "react";
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
  Steps,
  Tabs,
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
  Hash,
  ArrowLeft,
  ArrowRight,
  Loader,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import debounce from "lodash/debounce";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

// #region --- STYLED COMPONENTS ---
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
  height: 95%;
  max-height: 95vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
`;
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
  overflow: hidden;
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
`;
const DrawerSubtitle = styled.p`
  margin: 6px 0 0 0;
  font-size: 14px;
  color: ${colors.textSecondary};
  line-height: 1.5;
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
`;
const HeaderSubtitle = styled(Text)`
  font-size: 15px;
  color: ${colors.textSecondary};
`;
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
`;
const StatCard = styled(Card)`
  border-radius: 16px;
  border: 1px solid ${colors.border};
  min-height: 140px;
  .ant-card-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
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
`;
const StatValue = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: ${colors.textPrimary};
`;
const StatLabel = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  font-weight: 500;
`;
const StatFooter = styled.div`
  font-size: 12px;
  color: ${colors.textSecondary};
  margin-top: auto;
  padding-top: 8px;
`;
const ActionButton = styled(Button)`
  height: 40px;
  border-radius: 10px;
  font-weight: 500;
`;
const TableSection = styled(motion.div)`
  background: white;
  border-radius: 16px;
  border: 1px solid ${colors.border};
  position: relative;
  overflow: hidden;
`;
const TableHeader = styled.div`
  padding: 20px 24px 16px;
  border-bottom: 1px solid ${colors.border};
`;
const TableTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin: 0;
`;
const TableDescription = styled(Text)`
  font-size: 14px;
  color: ${colors.textSecondary};
`;
const LoaderContainer = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 10;
  border-radius: 16px;
`;
const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    background: ${colors.lightBg};
    color: ${colors.textPrimary};
  }
`;
const EmptyStateContainer = styled.div`
  text-align: center;
  padding: 60px 20px;
`;
const MobileDiscountCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid ${colors.border};
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
`;
const MobileDiscountCode = styled.div`
  font-size: 14px;
  color: ${colors.primary};
  font-family: "Courier New", monospace;
`;
const MobileDiscountRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-top: 1px solid ${colors.border};
`;
const MobileDiscountLabel = styled.span`
  color: ${colors.textSecondary};
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
const FormSection = styled(motion.div)`
  margin-bottom: 28px;
`;
const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;
const FormGroup = styled.div`
  margin-bottom: 16px;
`;
const FormLabel = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin-bottom: 8px;
`;
const HelpText = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  margin-top: 4px;
  margin-bottom: 8px;
  display: flex;
  gap: 6px;
`;
const StyledFormInput = styled(Input)`
  border-radius: 8px;
  height: 40px;
`;
const StyledFormInputNumber = styled(InputNumber)`
  width: 100%;
  border-radius: 8px;
  height: 40px;
  .ant-input-number-input {
    height: 38px;
  }
`;
const StyledFormSelect = styled(Select)`
  .ant-select-selector {
    border-radius: 8px !important;
    height: 40px !important;
    display: flex;
    align-items: center;
  }
`;
const StyledFormRangePicker = styled(RangePicker)`
  border-radius: 8px;
  height: 40px;
  width: 100%;
`;
const StyledSwitch = styled(Switch)`
  &.ant-switch-checked {
    background-color: ${colors.success};
  }
`;
const DiscountTypeCard = styled.div`
  position: relative;
  border: 1px solid ${(props) => (props.$selected ? colors.primary : colors.border)};
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${(props) => (props.$selected ? `${colors.primary}05` : "white")};
  
  &:hover {
    border-color: ${(props) => (props.$selected ? colors.primary : colors.textSecondary)};
  }

  &::after {
    content: '';
    position: absolute;
    top: 12px;
    right: 12px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1px solid ${(props) => (props.$selected ? colors.primary : colors.border)};
    background: ${(props) => (props.$selected ? colors.primary : "white")};
    transition: all 0.2s ease;
  }

  ${(props) => props.$selected && `
    &::after {
      background: ${colors.primary};
      border-color: ${colors.primary};
      box-shadow: inset 0 0 0 3px white;
    }
  `}
`;

const DiscountTypeIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => (props.$selected ? colors.primary : colors.lightBg)};
  color: ${(props) => (props.$selected ? "white" : colors.textSecondary)};
  margin-bottom: 16px;
  transition: all 0.2s ease;
`;

const DiscountTypeTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin-bottom: 4px;
`;

const DiscountTypeDescription = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  line-height: 1.4;
`;

const StepHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;
const StepTitle = styled(Title)`
  margin-bottom: 8px !important;
  font-size: 24px !important;
  font-weight: 700 !important;
`;
const StepDescription = styled(Text)`
  display: block;
  font-size: 16px;
  line-height: 1.6;
`;
const StepsLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;
const ContentContainer = styled.div`
  flex: 1;
  position: relative;
  overflow-y: auto;
  background-color: ${colors.lightBg};
`;
const ScrollContainer = styled.div`
  height: 100%;
  overflow-y: auto;
  padding: 2rem;
  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
  }
`;
const FormContainer = styled(motion.div)`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;
const NavigationFooter = styled.footer`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-top: 1px solid ${colors.border};
  background: white;
  flex-shrink: 0;
`;
const FooterButton = styled(Button)`
  min-width: 120px;
`;
const LoadingSpinner = styled(Loader)`
  animation: spin 1s linear infinite;
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;
const TabContentWrapper = styled.div`
  padding: 24px;
  overflow-y: auto;
  height: 100%;
`;
const StyledTabs = styled(Tabs)`
  height: 100%;
  display: flex;
  flex-direction: column;
  .ant-tabs-nav {
    margin: 0 !important;
    padding: 0 24px;
    background: white;
    flex-shrink: 0;
  }
  .ant-tabs-content-holder {
    flex: 1;
    background: ${colors.lightBg};
    overflow: hidden;
  }
  .ant-tabs-tabpane {
    height: 100%;
  }
`;
const StatSkeleton = () => <Skeleton active paragraph={{ rows: 2 }} />;
// #endregion

// #region --- DISCOUNT CONTEXT ---
const DiscountContext = createContext();

const defaultInitialState = {
  basicInfo: { name: "", code: "", description: "" },
  typeAndValue: { discount_type: "percentage", value: null },
  applicability: {
    applicable_classes_type: "all_classes",
    applicable_class_id: null,
    applicable_group: null,
  },
  rules: {
    valid_dates: null,
    usage_limit: null,
    usage_limit_per_user: null,
    min_purchase_amount: null,
  },
};

const actionTypes = {
  SET_INITIAL_STATE: "SET_INITIAL_STATE",
  UPDATE_BASIC_INFO: "UPDATE_BASIC_INFO",
  UPDATE_TYPE_VALUE: "UPDATE_TYPE_VALUE",
  UPDATE_APPLICABILITY: "UPDATE_APPLICABILITY",
  UPDATE_RULES: "UPDATE_RULES",
  RESET_FORM: "RESET_FORM",
};

const discountReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_INITIAL_STATE:
      return action.payload;
    case actionTypes.UPDATE_BASIC_INFO:
      return { ...state, basicInfo: { ...state.basicInfo, ...action.payload } };
    case actionTypes.UPDATE_TYPE_VALUE:
      return { ...state, typeAndValue: { ...state.typeAndValue, ...action.payload } };
    case actionTypes.UPDATE_APPLICABILITY:
      return { ...state, applicability: { ...state.applicability, ...action.payload } };
    case actionTypes.UPDATE_RULES:
      return { ...state, rules: { ...state.rules, ...action.payload } };
    case actionTypes.RESET_FORM:
      return defaultInitialState;
    default:
      return state;
  }
};

const DiscountProvider = ({ children, editingDiscount }) => {
  const [state, dispatch] = useReducer(discountReducer, defaultInitialState);

  useEffect(() => {
    if (editingDiscount) {
      const initialState = {
        basicInfo: {
          name: editingDiscount.name,
          code: editingDiscount.code,
          description: editingDiscount.description,
        },
        typeAndValue: {
          discount_type: editingDiscount.discount_type,
          value: editingDiscount.value,
        },
        applicability: {
          applicable_classes_type: editingDiscount.applicable_class_id
            ? "specific_class"
            : "all_classes",
          applicable_class_id: editingDiscount.applicable_class_id,
          applicable_group: editingDiscount.applicable_group,
        },
        rules: {
          valid_dates:
            editingDiscount.valid_from && editingDiscount.valid_to
              ? [dayjs(editingDiscount.valid_from), dayjs(editingDiscount.valid_to)]
              : null,
          usage_limit: editingDiscount.usage_limit,
          usage_limit_per_user: editingDiscount.usage_limit_per_user,
          min_purchase_amount: editingDiscount.min_purchase_amount,
        },
      };
      dispatch({ type: actionTypes.SET_INITIAL_STATE, payload: initialState });
    } else {
      dispatch({ type: actionTypes.RESET_FORM });
    }
  }, [editingDiscount]);

  const updateBasicInfo = (data) => dispatch({ type: actionTypes.UPDATE_BASIC_INFO, payload: data });
  const debouncedUpdateBasicInfo = useCallback(debounce(updateBasicInfo, 400), []);
  const updateTypeValue = (data) => dispatch({ type: actionTypes.UPDATE_TYPE_VALUE, payload: data });
  const debouncedUpdateTypeValue = useCallback(debounce(updateTypeValue, 400), []);
  const updateApplicability = (data) => dispatch({ type: actionTypes.UPDATE_APPLICABILITY, payload: data });
  const debouncedUpdateApplicability = useCallback(debounce(updateApplicability, 400), []);
  const updateRules = (data) => dispatch({ type: actionTypes.UPDATE_RULES, payload: data });
  const debouncedUpdateRules = useCallback(debounce(updateRules, 400), []);
  const resetForm = () => dispatch({ type: actionTypes.RESET_FORM });

  const value = { state, updateBasicInfo, debouncedUpdateBasicInfo, updateTypeValue, debouncedUpdateTypeValue, updateApplicability, debouncedUpdateApplicability, updateRules, debouncedUpdateRules, resetForm };

  return <DiscountContext.Provider value={value}>{children}</DiscountContext.Provider>;
};

const useDiscount = () => {
  const context = useContext(DiscountContext);
  if (!context) throw new Error("useDiscount must be used within a DiscountProvider");
  return context;
};
// #endregion

// #region --- FORM CONTENT COMPONENTS ---
const BasicInfoFormContent = () => (
  <>
    <FormGroup>
      <FormLabel>Discount Name</FormLabel>
      <HelpText><Info size={14} />A friendly name for internal use (e.g., "Summer Sale").</HelpText>
      <Form.Item name="name" rules={[{ required: true, message: "Please enter a discount name" }]}>
        <StyledFormInput placeholder="e.g., Summer Sale 2025" />
      </Form.Item>
    </FormGroup>
    <FormGroup>
      <FormLabel>Promo Code</FormLabel>
      <HelpText><Info size={14} />The code students use at checkout (e.g., "SUMMER25").</HelpText>
      <Form.Item name="code" rules={[{ required: true, message: "Please enter a promo code" }, { pattern: /^[A-Z0-9-]+$/, message: "Use only uppercase letters, numbers, and hyphens." }]}>
        <StyledFormInput placeholder="e.g., SUMMER25" style={{ textTransform: "uppercase", fontFamily: "monospace" }} />
      </Form.Item>
    </FormGroup>
    <FormGroup>
      <FormLabel>Description (Optional)</FormLabel>
      <HelpText><Info size={14} />Explain what this discount offers. For internal reference.</HelpText>
      <Form.Item name="description">
        <Input.TextArea rows={3} placeholder="e.g., Get 20% off all summer classes..." style={{ borderRadius: "8px" }} />
      </Form.Item>
    </FormGroup>
  </>
);

const TypeValueFormContent = () => {
  const form = Form.useFormInstance();
  const watchedDiscountType = Form.useWatch("discount_type", form);
  const discountType = watchedDiscountType || form.getFieldValue("discount_type");

  return (
    <>
      <FormGroup>
        <FormLabel>Select Discount Type</FormLabel>
        <HelpText><Info size={14} />Choose between a percentage discount or a fixed dollar amount.</HelpText>
        <Form.Item name="discount_type" noStyle>
          <FormGrid>
            <DiscountTypeCard
              $selected={discountType === "percentage"}
              onClick={() => form.setFieldValue("discount_type", "percentage")}
            >
              <DiscountTypeTitle>Percentage Off</DiscountTypeTitle>
              <DiscountTypeDescription>
                Reduce the price by a percentage (e.g., 20% off)
              </DiscountTypeDescription>
            </DiscountTypeCard>
            <DiscountTypeCard
              $selected={discountType === "fixed_amount"}
              onClick={() => form.setFieldValue("discount_type", "fixed_amount")}
            >
              <DiscountTypeTitle>Fixed Amount</DiscountTypeTitle>
              <DiscountTypeDescription>
                Reduce the price by a set amount (e.g., $10 off)
              </DiscountTypeDescription>
            </DiscountTypeCard>
          </FormGrid>
        </Form.Item>
      </FormGroup>
      <FormGroup>
        <FormLabel>Discount Value</FormLabel>
        <HelpText>
          <Info size={14} />
          {discountType === "percentage"
            ? "Enter a percentage between 1-100 (e.g., 20 for 20% off)."
            : "Enter a fixed dollar amount (e.g., 10.00 for $10 off)."}
        </HelpText>
        <Form.Item
          name="value"
          rules={[
            { required: true, message: "Please enter a discount value" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const type = getFieldValue('discount_type');
                if (!value) return Promise.reject();

                if (type === "percentage") {
                  if (value < 1 || value > 100) {
                    return Promise.reject(new Error("Percentage must be between 1-100."));
                  }
                } else {
                  if (value < 0.01) {
                    return Promise.reject(new Error("Amount must be greater than 0."));
                  }
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <StyledFormInputNumber
            prefix={discountType !== "percentage" && <DollarSign size={14} />}
            suffix={discountType === "percentage" && "%"}
            placeholder={discountType === "percentage" ? "e.g., 20" : "e.g., 10.00"}
            precision={discountType === "percentage" ? 0 : 2}
          />
        </Form.Item>
      </FormGroup>
    </>
  );
};

const ApplicabilityFormContent = ({ businessId }) => {
  const form = Form.useFormInstance();
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [scheduleGroups, setScheduleGroups] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const watchedClassOption = Form.useWatch("applicable_classes_type", form);
  const watchedClassId = Form.useWatch("applicable_class_id", form);

  useEffect(() => {
    const fetchClasses = async () => {
      setLoadingClasses(true);
      try {
        const response = await businessClassService.fetchBusinessClasses({ business_id: businessId });
        // FIX: Access the 'results' array from the response data
        setClasses(response.data.results || []);
      } catch (error) { console.error("Error fetching classes:", error); }
      finally { setLoadingClasses(false); }
    };
    fetchClasses();
  }, [businessId]);

  const fetchScheduleGroups = useCallback(async (classId) => {
    if (!classId) return;
    setLoadingSchedules(true);
    try {
      const response = await scheduleService.getClassSchedules(classId);
      const uniqueGroups = [...new Set(response.data.filter((s) => s.group_name).map((s) => s.group_name))].map((name) => ({ name }));
      setScheduleGroups(uniqueGroups);
    } catch (error) { setScheduleGroups([]); }
    finally { setLoadingSchedules(false); }
  }, []);

  useEffect(() => {
    if (watchedClassOption === "specific_class" && watchedClassId) {
      fetchScheduleGroups(watchedClassId);
    } else { setScheduleGroups([]); }
  }, [watchedClassOption, watchedClassId, fetchScheduleGroups]);

  return (
    <>
      <FormGroup>
        <FormLabel>Apply To</FormLabel>
        <HelpText><Info size={14} />Choose whether this discount applies to all classes or just specific ones.</HelpText>
        <Form.Item name="applicable_classes_type">
          <StyledFormSelect>
            <Option value="all_classes">All Classes</Option>
            <Option value="specific_class">Specific Class & Group</Option>
          </StyledFormSelect>
        </Form.Item>
      </FormGroup>
      <AnimatePresence>
        {watchedClassOption === "specific_class" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <FormGrid>
              <FormGroup>
                <FormLabel>Select Class</FormLabel>
                <HelpText><Info size={14} />Choose which class this discount applies to.</HelpText>
                <Form.Item name="applicable_class_id" rules={[{ required: true, message: "Please select a class" }]}>
                  <StyledFormSelect
                    placeholder="Choose a class"
                    loading={loadingClasses}
                    onChange={() => form.setFieldValue("applicable_group", undefined)}
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {classes.map((cls) => (
                      <Option key={cls.classId} value={cls.classId}>
                        {cls.title || `Class ${cls.classId}`}
                      </Option>
                    ))}
                  </StyledFormSelect>
                </Form.Item>
              </FormGroup>
              <FormGroup>
                <FormLabel>Group (Optional)</FormLabel>
                <HelpText><Info size={14} />Optionally limit to a specific schedule group.</HelpText>
                <Form.Item name="applicable_group">
                  <StyledFormSelect
                    placeholder="All groups"
                    loading={loadingSchedules}
                    disabled={!watchedClassId || loadingSchedules}
                    allowClear
                    options={scheduleGroups.map((g) => ({ value: g.name, label: g.name }))}
                  />
                </Form.Item>
              </FormGroup>
            </FormGrid>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const RulesFormContent = () => (
  <>
    <FormGroup>
      <FormLabel>Validity Period (Optional)</FormLabel>
      <HelpText><Info size={14} />Set start and end dates for when this discount is valid. Leave empty for no expiration.</HelpText>
      <Form.Item name="valid_dates">
        <StyledFormRangePicker />
      </Form.Item>
    </FormGroup>
    <FormGrid>
      <FormGroup>
        <FormLabel>Total Usage Limit (Optional)</FormLabel>
        <HelpText><Info size={14} />Maximum number of times this code can be used across all users.</HelpText>
        <Form.Item name="usage_limit">
          <StyledFormInputNumber min={1} placeholder="Unlimited" />
        </Form.Item>
      </FormGroup>
      <FormGroup>
        <FormLabel>Limit Per User (Optional)</FormLabel>
        <HelpText><Info size={14} />How many times each individual user can use this code.</HelpText>
        <Form.Item name="usage_limit_per_user">
          <StyledFormInputNumber min={1} placeholder="Unlimited" />
        </Form.Item>
      </FormGroup>
    </FormGrid>
    <FormGroup>
      <FormLabel>Minimum Purchase (Optional)</FormLabel>
      <HelpText><Info size={14} />Minimum order amount required to use this discount.</HelpText>
      <Form.Item name="min_purchase_amount">
        <StyledFormInputNumber min={0} placeholder="No minimum" precision={2} prefix={<DollarSign size={14} />} />
      </Form.Item>
    </FormGroup>
  </>
);
// #endregion

// #region --- STEP & FLOW COMPONENTS ---
const DiscountCreateWizard = ({ onFinalSubmit }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const isMobile = useBreakpoint().md === false;
  const { state } = useDiscount();
  const isFinalStep = currentStep === 3;

  const steps = [
    { title: "Info", icon: <TagIcon />, component: ({ onValidatedNext }) => { const [form] = Form.useForm(); const { state, debouncedUpdateBasicInfo } = useDiscount(); useEffect(() => { form.setFieldsValue(state.basicInfo); }, [state.basicInfo, form]); return (<><StepHeader><StepTitle level={3}>Basic Information</StepTitle><StepDescription>Start with the essential details for your discount.</StepDescription></StepHeader><Form form={form} layout="vertical" onFinish={onValidatedNext} onValuesChange={(_, allValues) => debouncedUpdateBasicInfo(allValues)} id="step-0-form"><BasicInfoFormContent /></Form></>); } },
    { title: "Type", icon: <Percent />, component: ({ onValidatedNext }) => { const [form] = Form.useForm(); const { state, updateTypeValue } = useDiscount(); useEffect(() => { form.setFieldsValue(state.typeAndValue); }, [state.typeAndValue, form]); return (<><StepHeader><StepTitle level={3}>Discount Type & Value</StepTitle><StepDescription>Choose the discount type and its value.</StepDescription></StepHeader><Form form={form} layout="vertical" onFinish={onValidatedNext} onValuesChange={(_, allValues) => updateTypeValue(allValues)} id="step-1-form"><TypeValueFormContent /></Form></>); } },
    { title: "Applies To", icon: <Package />, component: ({ onValidatedNext, businessId }) => { const [form] = Form.useForm(); const { state, debouncedUpdateApplicability } = useDiscount(); useEffect(() => { form.setFieldsValue(state.applicability); }, [state.applicability, form]); return (<><StepHeader><StepTitle level={3}>Applicability</StepTitle><StepDescription>Specify which classes this discount applies to.</StepDescription></StepHeader><Form form={form} layout="vertical" onFinish={onValidatedNext} onValuesChange={(_, allValues) => debouncedUpdateApplicability(allValues)} id="step-2-form"><ApplicabilityFormContent businessId={businessId} /></Form></>); } },
    { title: "Rules", icon: <FileText />, component: ({ onValidatedNext }) => { const [form] = Form.useForm(); const { state, debouncedUpdateRules } = useDiscount(); useEffect(() => { form.setFieldsValue(state.rules); }, [state.rules, form]); return (<><StepHeader><StepTitle level={3}>Rules & Conditions</StepTitle><StepDescription>Set the final rules for this discount.</StepDescription></StepHeader><Form form={form} layout="vertical" onFinish={onValidatedNext} onValuesChange={(_, allValues) => debouncedUpdateRules(allValues)} id="step-3-form"><RulesFormContent /></Form></>); } },
  ];

  const handleNext = async () => {
    if (isFinalStep) {
      setLoading(true);
      try {
        await onFinalSubmit(state);
      } catch (error) {
        const errorData = error.response?.data;
        if (errorData) {
          // Navigate to the step with the error
          if (errorData.name || errorData.code || errorData.description) {
            setCurrentStep(0);
            message.error('Please check the basic information');
          } else if (errorData.discount_type || errorData.value) {
            setCurrentStep(1);
            message.error('Please check the discount type and value');
          } else if (errorData.applicable_class_id || errorData.applicable_group) {
            setCurrentStep(2);
            message.error('Please check the applicability settings');
          } else if (errorData.valid_from || errorData.valid_to || errorData.usage_limit) {
            setCurrentStep(3);
            message.error('Please check the rules and conditions');
          } else {
            message.error(errorData.message || 'Failed to create discount');
          }
        }
      } finally {
        setLoading(false);
      }
    } else {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const StepComponent = steps[currentStep].component;

  return (
    <>
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${colors.border}` }}>
        <Steps current={currentStep} size="small" onChange={setCurrentStep} items={steps.map(s => ({ title: isMobile ? null : s.title, icon: React.cloneElement(s.icon, { size: 16 }) }))} />
      </div>
      <StepsLayout>
        <ContentContainer>
          <ScrollContainer>
            <FormContainer key={currentStep} initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              <StepComponent onValidatedNext={handleNext} businessId={useDiscount().businessId} />
            </FormContainer>
          </ScrollContainer>
        </ContentContainer>
        <NavigationFooter>
          <FooterButton onClick={handleBack} disabled={loading || currentStep === 0} icon={<ArrowLeft size={16} />}>Previous</FooterButton>
          <FooterButton type="primary" form={`step-${currentStep}-form`} htmlType="submit" disabled={loading} icon={loading ? <LoadingSpinner size={16} /> : !isFinalStep && <ArrowRight size={16} />}>
            {isFinalStep ? (loading ? "Creating..." : "Create Discount") : "Next"}
          </FooterButton>
        </NavigationFooter>
      </StepsLayout>
    </>
  );
};

const DiscountEditTabs = ({ onFinalSubmit, businessId }) => {
  const [form] = Form.useForm();
  const { state } = useDiscount();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('1');

  useEffect(() => {
    const values = {
      ...state.basicInfo,
      ...state.typeAndValue,
      ...state.applicability,
      ...state.rules,
    };
    form.setFieldsValue(values);
    setTimeout(() => {
      form.validateFields().catch(() => { });
    }, 100);
  }, [state, form]);

  const handleSave = async (values) => {
    setLoading(true);
    const finalState = {
      basicInfo: { name: values.name, code: values.code, description: values.description },
      typeAndValue: { discount_type: values.discount_type, value: values.value },
      applicability: { applicable_classes_type: values.applicable_classes_type, applicable_class_id: values.applicable_class_id, applicable_group: values.applicable_group },
      rules: { valid_dates: values.valid_dates, usage_limit: values.usage_limit, usage_limit_per_user: values.usage_limit_per_user, min_purchase_amount: values.min_purchase_amount },
    };
    try {
      await onFinalSubmit(finalState);
    } catch (error) {
      // Handle error and navigate to the correct tab
      const errorData = error.response?.data;

      if (errorData) {
        // Determine which tab has the error
        if (errorData.name || errorData.code || errorData.description) {
          setActiveTab('1');
          message.error('Please check the Basic Info tab for errors');
        } else if (errorData.discount_type || errorData.value) {
          setActiveTab('2');
          message.error('Please check the Type & Value tab for errors');
        } else if (errorData.applicable_class_id || errorData.applicable_group) {
          setActiveTab('3');
          message.error('Please check the Applicability tab for errors');
        } else if (errorData.valid_from || errorData.valid_to || errorData.usage_limit || errorData.usage_limit_per_user || errorData.min_purchase_amount) {
          setActiveTab('4');
          message.error('Please check the Rules tab for errors');
        } else {
          message.error(errorData.message || 'Failed to save discount');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: '1', label: 'Basic Info', children: <TabContentWrapper><BasicInfoFormContent /></TabContentWrapper> },
    { key: '2', label: 'Type & Value', children: <TabContentWrapper><TypeValueFormContent /></TabContentWrapper> },
    { key: '3', label: 'Applicability', children: <TabContentWrapper><ApplicabilityFormContent businessId={businessId} /></TabContentWrapper> },
    { key: '4', label: 'Rules', children: <TabContentWrapper><RulesFormContent /></TabContentWrapper> },
  ];

  return (
    <Form form={form} layout="vertical" onFinish={handleSave} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <StyledTabs activeKey={activeTab} onChange={setActiveTab} items={tabs} />
      <NavigationFooter>
        <div />
        <FooterButton type="primary" htmlType="submit" loading={loading} icon={<Save size={16} />}>
          Save Changes
        </FooterButton>
      </NavigationFooter>
    </Form>
  );
};
const DiscountFlow = ({ editingDiscount, onSuccess, onClose, businessId }) => {
  const { resetForm } = useDiscount();

  const handleFinalSubmit = async (state) => {
    const { basicInfo, typeAndValue, applicability, rules } = state;

    // FIX: Construct a robust payload, sending 'undefined' for empty optional fields
    // so they are omitted from the request body.
    const payload = {
      ...basicInfo,
      ...typeAndValue,
      business_id: businessId,
      is_active: true,

      // Use dayjs's isValid() to ensure dates are valid before formatting
      valid_from: rules.valid_dates?.[0]?.isValid() ? rules.valid_dates[0].format("YYYY-MM-DD") : undefined,
      valid_to: rules.valid_dates?.[1]?.isValid() ? rules.valid_dates[1].format("YYYY-MM-DD") : undefined,

      applicable_class_id: applicability.applicable_classes_type === "specific_class" ? applicability.applicable_class_id : undefined,
      applicable_group: applicability.applicable_classes_type === "specific_class" && applicability.applicable_group ? applicability.applicable_group : undefined,

      // Use nullish coalescing (??) to convert null to undefined but preserve 0
      usage_limit: rules.usage_limit ?? undefined,
      usage_limit_per_user: rules.usage_limit_per_user ?? undefined,
      min_purchase_amount: rules.min_purchase_amount ?? undefined
    };

    try {
      if (editingDiscount) {
        await businessDiscountService.updateDiscount(editingDiscount.id, payload);
        message.success("Discount updated successfully!");
      } else {
        await businessDiscountService.createDiscount(payload);
        message.success("Discount created successfully!");
      }
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to save discount");
      throw error;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <DrawerHeader>
        <div>
          <DrawerTitle>{editingDiscount ? "Edit Discount" : "Create New Discount"}</DrawerTitle>
          <DrawerSubtitle>{editingDiscount ? "Update your discount details" : "Set up a new promotional offer"}</DrawerSubtitle>
        </div>
      </DrawerHeader>
      {editingDiscount ? (
        // FIX: Add a unique key to force remount when the edited discount changes
        <DiscountEditTabs key={editingDiscount.id} onFinalSubmit={handleFinalSubmit} businessId={businessId} />
      ) : (
        <DiscountCreateWizard onFinalSubmit={handleFinalSubmit} />
      )}
    </div>
  );
};

const DiscountFlowWrapper = ({ editingDiscount, onSuccess, onClose, businessId }) => (
  <DiscountProvider editingDiscount={editingDiscount}>
    <DiscountFlow editingDiscount={editingDiscount} onSuccess={onSuccess} onClose={onClose} businessId={businessId} />
  </DiscountProvider>
);
// #endregion

// #region --- MAIN COMPONENT ---
const Discounts = ({ businessId }) => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const refreshButtonRef = useRef(null);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const fetchDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await businessDiscountService.getDiscounts(businessId);
      setDiscounts(response.data || []);
    } catch (error) { message.error("Failed to load discounts"); }
    finally { setLoading(false); }
  }, [businessId]);

  useEffect(() => { fetchDiscounts(); }, [fetchDiscounts]);
  useEffect(() => { if (!loading) { const timer = setTimeout(() => setIsReady(true), 100); return () => clearTimeout(timer); } }, [loading]);

  const refreshData = async () => {
    await fetchDiscounts();
    if (refreshButtonRef.current) refreshButtonRef.current.blur();
  };

  const showDrawer = (discount = null) => {
    setEditingDiscount(discount);
    setDrawerVisible(true);
  };

  const onDrawerClose = () => {
    setDrawerVisible(false);
    setTimeout(() => { setEditingDiscount(null); }, 300);
  };

  const handleDelete = async (id) => {
    try {
      await businessDiscountService.deleteDiscount(id);
      message.success("Discount deleted successfully!");
      await fetchDiscounts();
    } catch (error) { message.error("Failed to delete discount"); }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await businessDiscountService.updateDiscount(id, { is_active: !currentStatus });
      message.success(`Discount ${!currentStatus ? "activated" : "deactivated"}`);
      await fetchDiscounts();
    } catch (error) { message.error("Failed to update discount status"); }
  };

  const statisticCards = [
    { key: "total", title: "Total Discounts", value: discounts.length, icon: <Ticket size={18} />, background: `${colors.info}15`, color: colors.info },
    { key: "active", title: "Active Offers", value: discounts.filter((d) => d.is_active).length, icon: <TrendingUp size={18} />, background: `${colors.success}15`, color: colors.success },
    { key: "usage", title: "Total Usage", value: discounts.reduce((sum, d) => sum + (d.times_used || 0), 0), icon: <BarChart3 size={18} />, background: `#8b5cf615`, color: "#8b5cf6" },
  ];

  const columns = [
    { title: "Code", dataIndex: "code", key: "code", render: (text) => <Text strong style={{ fontFamily: "monospace", color: colors.primary }}>{text}</Text> },
    { title: "Name", dataIndex: "name", key: "name", render: (text) => <Text strong>{text}</Text> },
    {
      title: "Type",
      dataIndex: "discount_type",
      key: "discount_type",
      render: (type, record) => type === "percentage"
        ? <Tag color="blue">{record.value}% OFF</Tag>
        : <Tag color="green">${record.value} OFF</Tag>
    },
    { title: "Validity", key: "validity", render: (_, record) => !record.valid_from && !record.valid_to ? (<Text type="secondary">No expiry</Text>) : (<Space direction="vertical" size={0}><Text type="secondary" style={{ fontSize: "12px" }}>From: {dayjs(record.valid_from).format("MMM D, YYYY")}</Text><Text type="secondary" style={{ fontSize: "12px" }}>Until: {dayjs(record.valid_to).format("MMM D, YYYY")}</Text></Space>) },
    { title: "Usage", key: "usage", render: (_, record) => <Space direction="vertical" size={0}><Text strong>{record.times_used || 0} times</Text>{record.usage_limit && <Text type="secondary" style={{ fontSize: "12px" }}>Limit: {record.usage_limit}</Text>}</Space> },
    { title: "Status", dataIndex: "is_active", key: "is_active", render: (isActive, record) => <Space><Tag color={isActive ? "success" : "default"}>{isActive ? "Active" : "Inactive"}</Tag><Tooltip title={record.is_active ? "Deactivate" : "Activate"}><Switch size="small" checked={record.is_active} onChange={() => handleToggleActive(record.id, record.is_active)} /></Tooltip></Space> },
    { title: "Actions", key: "actions", render: (_, record) => <Space><Tooltip title="Edit discount"><Button type="text" icon={<Edit size={16} />} onClick={() => showDrawer(record)} /></Tooltip><Popconfirm title="Delete this discount?" onConfirm={() => handleDelete(record.id)} okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }}><Tooltip title="Delete discount"><Button type="text" danger icon={<Trash2 size={16} />} /></Tooltip></Popconfirm></Space> },
  ];

  const MobileDiscountItem = ({ record }) => (
    <MobileDiscountCard>
      <MobileDiscountHeader>
        <div><MobileDiscountTitle>{record.name}</MobileDiscountTitle><MobileDiscountCode>{record.code}</MobileDiscountCode></div>
        <Tag color={record.is_active ? "success" : "default"}>{record.is_active ? "Active" : "Inactive"}</Tag>
      </MobileDiscountHeader>
      <MobileDiscountRow>
        <MobileDiscountLabel>Discount</MobileDiscountLabel>
        <MobileDiscountValue>
          {record.discount_type === "percentage"
            ? `${record.value}% OFF`
            : `$${record.value} OFF`}
        </MobileDiscountValue>
      </MobileDiscountRow>
      <MobileDiscountRow><MobileDiscountLabel>Times Used</MobileDiscountLabel><MobileDiscountValue>{record.times_used || 0}{record.usage_limit ? ` / ${record.usage_limit}` : ""}</MobileDiscountValue></MobileDiscountRow>
      <MobileDiscountActions>
        <Button size="small" icon={<Edit size={14} />} onClick={() => showDrawer(record)} style={{ flex: 1 }}>Edit</Button>
        <Button size="small" onClick={() => handleToggleActive(record.id, record.is_active)} style={{ flex: 1 }}>{record.is_active ? "Deactivate" : "Activate"}</Button>
        <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No"><Button size="small" danger icon={<Trash2 size={14} />} /></Popconfirm>
      </MobileDiscountActions>
    </MobileDiscountCard>
  );

  return (
    <ConfigProvider theme={theme}>
      <DashboardWrapper>
        <DashboardHeader>
          <div><PageTitle>Discounts & Coupons</PageTitle><HeaderSubtitle>Create and manage promotions to attract more students.</HeaderSubtitle></div>
          <Space>
            <ActionButton ref={refreshButtonRef} icon={<RefreshCw size={16} />} onClick={refreshData} loading={loading}>Refresh</ActionButton>
            <ActionButton type="primary" onClick={() => showDrawer()} icon={<Plus size={16} />}>Create Discount</ActionButton>
          </Space>
        </DashboardHeader>

        <Divider />

        <StatsGrid>
          {statisticCards.map((stat) => (<StatCard key={stat.key}>{loading ? <StatSkeleton /> : (<><StatCardHeader><IconContainer background={stat.background} color={stat.color}>{stat.icon}</IconContainer></StatCardHeader><div><StatValue><NumberFlow value={isReady ? stat.value : 0} duration={800} /></StatValue><StatLabel>{stat.title}</StatLabel></div>{stat.footer && <StatFooter>{stat.footer}</StatFooter>}</>)}</StatCard>))}
        </StatsGrid>

        <Divider />

        <TableSection>
          {loading && !isMobile && <LoaderContainer><GlobalLoaderWithoutInlineStyles /></LoaderContainer>}
          <TableHeader><TableTitle>Discount Management</TableTitle><TableDescription>Manage your promotional offers and track their performance.</TableDescription></TableHeader>
          {isMobile ? (<div style={{ padding: "0 16px 16px" }}>{loading ? <Skeleton active paragraph={{ rows: 5 }} /> : discounts.length > 0 ? (discounts.map((item) => <MobileDiscountItem key={item.id} record={item} />)) : (<EmptyStateContainer><Text>No discounts found. Create one to get started.</Text></EmptyStateContainer>)}</div>) : (<StyledTable columns={columns} dataSource={discounts} rowKey="id" pagination={{ pageSize: 10, showSizeChanger: true }} loading={false} locale={{ emptyText: <EmptyStateContainer><Text>No discounts have been made yet.</Text></EmptyStateContainer> }} />)}
        </TableSection>

        <VaulDrawer.Root open={drawerVisible} onOpenChange={(isOpen) => !isOpen && onDrawerClose()} direction={isMobile ? "bottom" : "right"} dismissible>
          <VaulDrawer.Portal>
            <StyledDrawerOverlay />
            {isMobile ? (
              <StyledDrawerContent>
                <DrawerHandle />
                <DiscountFlowWrapper editingDiscount={editingDiscount} onSuccess={refreshData} onClose={onDrawerClose} businessId={businessId} />
              </StyledDrawerContent>
            ) : (
              <DesktopDrawerContent>
                <DesktopDrawerInner>
                  <DiscountFlowWrapper editingDiscount={editingDiscount} onSuccess={refreshData} onClose={onDrawerClose} businessId={businessId} />
                </DesktopDrawerInner>
              </DesktopDrawerContent>
            )}
          </VaulDrawer.Portal>
        </VaulDrawer.Root>
      </DashboardWrapper>
    </ConfigProvider>
  );
};

export default Discounts;
// #endregion