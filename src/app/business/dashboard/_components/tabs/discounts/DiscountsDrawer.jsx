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
import { VAUL_OVERLAY_BACKDROP_BLUR } from "@/lib/vaulOverlayBlur";
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Typography,
  Tabs,
  Button,
  Grid,
  Steps,
  Checkbox,
  Tooltip,
} from "antd";
import message from "@/lib/message";
import {
  Ticket,
  Percent,
  DollarSign,
  Target,
  FileText,
  Info,
  Tag as TagIcon,
  Save,
  ArrowLeft,
  ArrowRight,
  Loader,
  Calendar,
  Users,
  Hash,
  ShoppingCart,
  TrendingUp,
  Package,
  Building2,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import {
  businessDiscountService,
  businessClassService,
  scheduleService,
} from "@/services/apiService";
import { useSubscription } from "@/context/SubscriptionContext";
import debounce from "lodash/debounce";
import { ResponsiveDateRangePicker } from "@/components/common/mobile/MobilePickers";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

// #region STYLED COMPONENTS

const colors = {
  primary: "#ff385c",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  lightBg: "#f8fafc",
  border: "#e2e8f0",
  textPrimary: "#334155",
  textSecondary: "#64748b",
};

const StyledDrawerOverlay = styled(VaulDrawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
  ${VAUL_OVERLAY_BACKDROP_BLUR}
`;

const StyledDrawerContent = styled(VaulDrawer.Content)`
  background: white;
  display: flex;
  flex-direction: column;
  border-radius: 24px 24px 0 0;
  height: 95%;
  height: 95dvh; /* Fixes mobile toolbar overlay issues */
  max-height: 95dvh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1050;
  outline: none;
  padding-bottom: env(
    safe-area-inset-bottom
  ); /* distinct separation for the home bar */
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

const DrawerHandle = styled(VaulDrawer.Handle)`
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

  @media (max-width: 768px) {
    padding: 16px 20px;
  }
`;

const DrawerTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 10px;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const DrawerSubtitle = styled.p`
  margin: 6px 0 0 0;
  font-size: 14px;
  color: ${colors.textSecondary};
  line-height: 1.5;

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const StepsNav = styled.div`
  background: white;
  padding: 16px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 10;

  @media (max-width: 768px) {
    padding: 12px 16px;
  }
`;

const MobileStepsIndicator = styled.div`
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  color: ${colors.textSecondary};

  strong {
    color: ${colors.textPrimary};
  }
`;

const ContentContainer = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex; // Added
  flex-direction: column; // Added
  min-height: 0; // CRITICAL: Allows flex child to scroll
`;

const ScrollContainer = styled.div`
  flex: 1; // Changed from height: 100% to flex: 1
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  padding: 0;

  // Improve mobile touch scrolling
  -webkit-overflow-scrolling: touch;
`;

const FormContainer = styled(motion.div)`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const NavigationFooter = styled.footer`
  flex-shrink: 0; // CRITICAL: Prevents footer from being squashed
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-top: 1px solid #ebebeb;
  background: white;
  z-index: 2;

  // Handle iPhone Home Bar area
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
  }
`;

const FooterButton = styled(Button)`
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0.5rem !important;
  font-weight: 500 !important;
  min-width: 120px;

  @media (max-width: 480px) {
    min-width: 100px;
    font-size: 14px !important;
  }
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

const StyledForm = styled(Form)`
  .ant-form-item {
    margin-bottom: ${(props) => props.theme.token.marginLG}px;

    &:first-child {
      margin-bottom: 0;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }

  .ant-form-item-explain-error {
    margin-top: ${(props) => props.theme.token.marginXS}px;
    font-size: ${(props) => props.theme.token.fontSizeSM || "12px"};
  }
`;

const StepHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  position: relative;

  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
  }
`;

const StepTitle = styled(Title)`
  margin-bottom: ${(props) => props.theme.token.marginXS}px !important;
  color: ${(props) => props.theme.token.colorText};
  font-size: 28px !important;
  font-weight: 700 !important;

  @media (max-width: 768px) {
    font-size: 24px !important;
  }
`;

const StepDescription = styled(Text)`
  display: block;
  color: ${(props) => props.theme.token.colorTextSecondary};
  font-size: ${(props) => props.theme.token.fontSizeLG || "16px"};
  margin-bottom: ${(props) => props.theme.token.marginLG}px;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const FormSection = styled(motion.div)`
  margin-bottom: 2rem;
  border-radius: 12px;

  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
  }
`;

const FormGroup = styled.div`
  margin-bottom: ${(props) =>
    props.theme.token.marginLG || props.theme.token.margin}px;
  width: 100%;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: ${(props) => props.columns || "1fr 1fr"};
  gap: ${(props) => props.theme.token.marginLG}px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${(props) => props.theme.token.margin}px;
  }
`;

const FormLabel = styled.label`
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: ${(props) => props.theme.token.colorText};
  margin-bottom: ${(props) => props.theme.token.marginXS}px;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const HelpText = styled.div`
  font-size: 13px;
  color: ${(props) => props.theme.token.colorTextSecondary};
  margin-top: 4px;
  margin-bottom: 8px;
  line-height: 1.4;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;

  svg {
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const StyledInput = styled(Input)`
  height: ${(props) => props.theme.token.controlHeight}px;
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  font-size: ${(props) => props.theme.token.fontSize}px;
  transition: all 0.3s ease;

  &:focus {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20;
  }

  @media (max-width: 768px) {
    font-size: 16px !important;
  }
`;

const StyledSelect = styled(Select)`
  .ant-select-selector {
    height: ${(props) => props.theme.token.controlHeight}px !important;
    padding: 0 ${(props) => props.theme.token.controlPaddingHorizontal}px !important;
    border-radius: ${(props) => props.theme.token.borderRadius}px !important;
    display: flex;
    align-items: center;
    transition: all 0.3s ease;
  }

  .ant-select-selection-item,
  .ant-select-selection-placeholder {
    line-height: ${(props) => props.theme.token.controlHeight - 2}px !important;
    font-size: ${(props) => props.theme.token.fontSize}px;

    @media (max-width: 768px) {
      font-size: 16px !important;
    }
  }

  &.ant-select-focused .ant-select-selector {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20 !important;
  }
`;

const StyledInputNumber = styled(InputNumber)`
  height: ${(props) => props.theme.token.controlHeight}px;
  border-radius: ${(props) => props.theme.token.borderRadius}px;
  font-size: ${(props) => props.theme.token.fontSize}px;
  transition: all 0.3s ease;
  width: 100%;

  .ant-input-number-input-wrap,
  .ant-input-number-input {
    height: 100% !important;
    display: flex;
    align-items: center;

    @media (max-width: 768px) {
      font-size: 16px !important;
    }
  }

  &:focus-within {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20;
  }
`;

const StyledRangePicker = styled(RangePicker)`
  width: 100%;
  height: ${(props) => props.theme.token.controlHeight}px;
  border-radius: ${(props) => props.theme.token.borderRadius}px;

  input {
    @media (max-width: 768px) {
      font-size: 16px !important;
    }
  }

  &.ant-picker-focused {
    box-shadow: 0 0 0 3px ${(props) => props.theme.token.colorPrimary}20 !important;
  }
`;

const StyledTabs = styled(Tabs)`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; // CRITICAL for tabs scrolling

  .ant-tabs-nav {
    margin: 0 !important;
    padding: 0 24px;
    background: white;
    flex-shrink: 0;
    position: relative; // Changed from sticky to relative as the whole header is fixed
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .ant-tabs-tab {
    padding: 12px 16px !important;
    font-weight: 500;
  }

  .ant-tabs-content-holder {
    flex: 1;
    background: #f8fafc;
    overflow-y: auto; // This ensures only the content area scrolls
    min-height: 0; // CRITICAL
    display: flex;
    flex-direction: column;
  }

  .ant-tabs-content {
    flex: 1;
    height: 100%;
  }

  .ant-tabs-tabpane {
    height: 100%;
    padding: 0;
    outline: none; // Remove focus outline
  }

  @media (max-width: 768px) {
    .ant-tabs-tab {
      padding: 10px 12px !important;
      font-size: 13px;
    }

    .ant-tabs-nav {
      padding: 0 12px;
    }
  }
`;

const TabContentWrapper = styled.div`
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
  }
`;

const InfoBox = styled(motion.div)`
  margin-bottom: 1.5rem;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 12.5px;
  color: ${(props) => props.theme.token.colorTextSecondary};

  strong {
    color: ${(props) => props.theme.token.colorText};
  }

  ul {
    padding-left: 20px;
    margin: 5px 0 0 0;
    list-style: disc;

    li {
      margin: 4px 0;
    }
  }
`;

// #region CONTEXT & REDUCER

const DiscountContext = createContext();

const defaultInitialState = {
  basicInfo: { name: "", code: "" },
  typeAndValue: { discount_type: "percentage", value: null },
  applicability: {
    scope: "business",
    target_class: null,
    target_class_option: null,
    target_schedule_group_name: null,
  },
  rules: {
    valid_dates: null,
    usage_limit: null,
    usage_limit_per_user: 1,
    min_purchase_amount: null,
    apply_to_widget: false,
  },
};

const actionTypes = {
  SET_INITIAL_STATE: "SET_INITIAL_STATE",
  UPDATE_FIELD: "UPDATE_FIELD",
  RESET_FORM: "RESET_FORM",
};

const discountReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_INITIAL_STATE:
      return action.payload;
    case actionTypes.UPDATE_FIELD:
      const { step, data } = action.payload;
      return { ...state, [step]: { ...state[step], ...data } };
    case actionTypes.RESET_FORM:
      return defaultInitialState;
    default:
      return state;
  }
};

const DiscountProvider = ({ children, editingDiscount }) => {
  const [state, dispatch] = useReducer(discountReducer, defaultInitialState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (editingDiscount) {
      const initialState = {
        basicInfo: {
          name: editingDiscount.name || "",
          code: editingDiscount.code || "",
        },
        typeAndValue: {
          discount_type: editingDiscount.discount_type || "percentage",
          value: editingDiscount.value || null,
        },
        applicability: {
          scope: editingDiscount.scope || "business",
          target_class: editingDiscount.target_class || null,
          target_class_option: editingDiscount.target_class_option || null,
          target_schedule_group_name:
            editingDiscount.target_schedule_group_name || null,
        },
        rules: {
          valid_dates:
            editingDiscount.valid_from && editingDiscount.valid_to
              ? [
                  dayjs(editingDiscount.valid_from),
                  dayjs(editingDiscount.valid_to),
                ]
              : null,
          usage_limit: editingDiscount.usage_limit || null,
          usage_limit_per_user: editingDiscount.usage_limit_per_user ?? 1,
          min_purchase_amount: editingDiscount.min_purchase_amount || null,
          apply_to_widget: editingDiscount.apply_to_widget ?? false,
        },
      };
      dispatch({ type: actionTypes.SET_INITIAL_STATE, payload: initialState });
    } else {
      dispatch({ type: actionTypes.RESET_FORM });
    }
    setIsLoaded(true);
  }, [editingDiscount]);

  const updateStepData = useCallback((step, data) => {
    dispatch({ type: actionTypes.UPDATE_FIELD, payload: { step, data } });
  }, []);

  const resetForm = useCallback(() => {
    dispatch({ type: actionTypes.RESET_FORM });
  }, []);

  const value = { state, isLoaded, updateStepData, resetForm };

  return (
    <DiscountContext.Provider value={value}>
      {children}
    </DiscountContext.Provider>
  );
};

const useDiscount = () => {
  const context = useContext(DiscountContext);
  if (!context)
    throw new Error("useDiscount must be used within a DiscountProvider");
  return context;
};

// #endregion

// #region STEP COMPONENTS (REFACTORED WITH UI RESTORED)

const BasicInfoStep = () => (
  <FormSection
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <StepHeader>
      <StepTitle level={2}>Basic Information</StepTitle>
      <StepDescription>
        Start by naming your discount and creating a unique code (if
        applicable).
      </StepDescription>
    </StepHeader>
    <FormGroup>
      <FormLabel>
        <TagIcon size={16} /> Discount Name
      </FormLabel>
      <HelpText>
        <Info size={14} /> An internal name to help you identify this discount
        (guests won't see this).
      </HelpText>
      <Form.Item
        name="name"
        rules={[
          { required: true, message: "Please enter a discount name" },
          { min: 3, message: "Name must be at least 3 characters" },
        ]}
      >
        <StyledInput placeholder="e.g., Summer Sale 2025" size="middle" />
      </Form.Item>
    </FormGroup>
    <FormGroup>
      <FormLabel>
        <Hash size={16} /> Coupon Code (Optional)
      </FormLabel>
      <HelpText>
        <Info size={14} /> Leave blank for an automatic discount. Enter a code
        if you want guests to enter it at checkout.
      </HelpText>
      <Form.Item
        name="code"
        getValueFromEvent={(e) => e.target.value.toUpperCase()}
        rules={[
          {
            pattern: /^[A-Z0-9_-]*$/i,
            message:
              "Code can only contain letters, numbers, dashes, and underscores",
          },
          { max: 50, message: "Code cannot exceed 50 characters" },
        ]}
      >
        <StyledInput placeholder="e.g., SUMMER20, NEWGUEST" size="middle" />
      </Form.Item>
    </FormGroup>
    <InfoBox>
      <strong>Tip:</strong> If you leave the code blank, this discount will be
      automatically applied to eligible purchases. If you provide a code, guests
      must enter it during checkout.
    </InfoBox>
  </FormSection>
);

const TypeAndValueStep = ({ form }) => {
  const discountType = Form.useWatch("discount_type", form) || "percentage";

  return (
    <FormSection
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <StepHeader>
        <StepTitle level={2}>Discount Type & Value</StepTitle>
        <StepDescription>
          Choose whether this is a percentage or fixed amount discount, and set
          the value.
        </StepDescription>
      </StepHeader>
      <FormGroup>
        <FormLabel>
          <TrendingUp size={16} /> Discount Type
        </FormLabel>
        <HelpText>
          <Info size={14} /> Select whether you want to offer a percentage off
          or a fixed dollar amount off.
        </HelpText>
        <Form.Item
          name="discount_type"
          rules={[{ required: true, message: "Please select a discount type" }]}
        >
          <StyledSelect placeholder="Select discount type" size="middle">
            <Option value="percentage">
              <Percent size={14} style={{ marginRight: 8 }} /> Percentage Off
            </Option>
            <Option value="fixed_amount">
              <DollarSign size={14} style={{ marginRight: 8 }} /> Fixed Amount
              Off
            </Option>
          </StyledSelect>
        </Form.Item>
      </FormGroup>
      <FormGroup>
        <FormLabel>
          {discountType === "percentage" ? (
            <Percent size={16} />
          ) : (
            <DollarSign size={16} />
          )}{" "}
          Discount Value
        </FormLabel>
        <HelpText>
          <Info size={14} />
          {discountType === "percentage"
            ? "Enter a percentage between 1 and 100 (e.g., 20 for 20% off)."
            : "Enter a fixed dollar amount (e.g., 10 for $10 off)."}
        </HelpText>
        <Form.Item
          key={discountType} // Force re-mount on type change to prevent stale validation
          name="value"
          rules={[
            { required: true, message: "Please enter a discount value" },
            {
              type: "number",
              min: 0.01,
              message: "Value must be greater than 0",
            },
            ...(discountType === "percentage"
              ? [
                  {
                    type: "number",
                    max: 100,
                    message: "Percentage cannot exceed 100",
                  },
                ]
              : []),
          ]}
        >
          <StyledInputNumber
            min={0.01}
            max={discountType === "percentage" ? 100 : undefined}
            precision={2}
            placeholder={
              discountType === "percentage" ? "e.g., 20" : "e.g., 10"
            }
            formatter={(val) =>
              discountType === "percentage"
                ? val
                  ? `${val}%`
                  : ""
                : val
                ? `$${val}`
                : ""
            }
            parser={(val) =>
              val ? val.toString().replace(/\$\s?|%/g, "") : ""
            }
            size="middle"
          />
        </Form.Item>
      </FormGroup>
      <InfoBox>
        <strong>Example:</strong>{" "}
        {discountType === "percentage"
          ? "If you set the value to 20, guests will get 20% off eligible purchases."
          : "If you set the value to 10, guests will get $10 off eligible purchases."}
      </InfoBox>
    </FormSection>
  );
};

const ApplicabilityStep = ({ businessId, form }) => {
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [scheduleGroups, setScheduleGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const scope = Form.useWatch("scope", form);
  const selectedClass = Form.useWatch("target_class", form);

  useEffect(() => {
    const fetchClasses = async () => {
      setLoadingClasses(true);
      try {
        const response = await businessClassService.fetchBusinessClasses({
          businessId,
        });
        setClasses(response.data || []);
      } catch (error) {
        message.error("Failed to load experiences");
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchClasses();
  }, [businessId]);

  const fetchScheduleGroups = useCallback(
    async (classId) => {
      if (!classId) {
        setScheduleGroups([]);
        return;
      }
      setLoadingGroups(true);
      try {
        const targetClass = classes.find((c) => c.classId === classId);
        if (!targetClass?.options?.length) {
          setScheduleGroups([]);
          return;
        }
        const allGroups = [];
        for (const option of targetClass.options) {
          const scheduleResponse = await scheduleService.fetchSchedules({
            option_id: option.optionId,
          });
          if (scheduleResponse.success && scheduleResponse.data) {
            const uniqueGroups = [
              ...new Set(
                scheduleResponse.data.filter((s) => s.name).map((s) => s.name)
              ),
            ];
            uniqueGroups.forEach((groupName) =>
              allGroups.push({
                name: groupName,
                option_id: option.optionId,
                option_name: option.booking_type,
              })
            );
          }
        }
        setScheduleGroups(allGroups);
      } catch (error) {
        message.error("Failed to load schedule groups");
        setScheduleGroups([]);
      } finally {
        setLoadingGroups(false);
      }
    },
    [classes]
  );

  useEffect(() => {
    if (scope === "schedule_group" && selectedClass) {
      fetchScheduleGroups(selectedClass);
    } else {
      setScheduleGroups([]);
    }
  }, [scope, selectedClass, fetchScheduleGroups]);

  const handleGroupChange = (value) => {
    const selectedGroup = scheduleGroups.find((g) => g.name === value);
    form.setFieldsValue({
      target_class_option: selectedGroup ? selectedGroup.option_id : null,
    });
  };

  return (
    <FormSection>
      <StepHeader>
        <StepTitle level={2}>Applicability</StepTitle>
        <StepDescription>
          Define where this discount can be used.
        </StepDescription>
      </StepHeader>
      <FormGroup>
        <FormLabel>
          <Target size={16} /> Discount Scope
        </FormLabel>
        <HelpText>
          <Info size={14} /> Choose where this discount applies.
        </HelpText>
        <Form.Item
          name="scope"
          rules={[{ required: true, message: "Please select a scope" }]}
        >
          <StyledSelect placeholder="Select discount scope" size="middle">
            <Option value="business">
              <Building2 size={14} style={{ marginRight: 8 }} />
              Entire Business
            </Option>
            <Option value="class">
              <Package size={14} style={{ marginRight: 8 }} />
              Specific Experience
            </Option>
            <Option value="schedule_group">
              <Layers size={14} style={{ marginRight: 8 }} />
              Specific Schedule Group
            </Option>
          </StyledSelect>
        </Form.Item>
      </FormGroup>
      <AnimatePresence>
        {(scope === "class" || scope === "schedule_group") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <FormGroup>
              <FormLabel>
                <Package size={16} /> Select Experience
              </FormLabel>
              <Form.Item
                name="target_class"
                rules={[
                  {
                    required: scope !== "business",
                    message: "Please select an experience",
                  },
                ]}
              >
                <StyledSelect
                  placeholder="Select an experience"
                  loading={loadingClasses}
                  showSearch
                  size="middle"
                >
                  {classes.map((cls) => (
                    <Option key={cls.classId} value={cls.classId}>
                      {cls.title}
                    </Option>
                  ))}
                </StyledSelect>
              </Form.Item>
            </FormGroup>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {scope === "schedule_group" && selectedClass && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <FormGroup>
              <FormLabel>
                <Layers size={16} /> Select Schedule Group
              </FormLabel>
              <Form.Item
                name="target_schedule_group_name"
                rules={[
                  {
                    required: scope === "schedule_group",
                    message: "Please select a schedule group",
                  },
                ]}
              >
                <StyledSelect
                  placeholder="Select a schedule group"
                  loading={loadingGroups}
                  onChange={handleGroupChange}
                  size="middle"
                  allowClear
                >
                  {scheduleGroups.map((group, i) => (
                    <Option key={`${group.name}-${i}`} value={group.name}>
                      {group.name} ({group.option_name})
                    </Option>
                  ))}
                </StyledSelect>
              </Form.Item>
              <Form.Item name="target_class_option" hidden>
                <Input />
              </Form.Item>
            </FormGroup>
          </motion.div>
        )}
      </AnimatePresence>
    </FormSection>
  );
};

const ApplyToWidgetCheckbox = () => {
  const { subscription } = useSubscription();
  const planId = subscription?.planId || "";
  const canApplyToWidget = ["growth", "advanced"].includes(planId.toLowerCase());
  const checkbox = (
    <Form.Item name="apply_to_widget" valuePropName="checked">
      <Checkbox disabled={!canApplyToWidget}>
        Apply to both widget & marketplace
      </Checkbox>
    </Form.Item>
  );
  if (canApplyToWidget) return <FormGroup>{checkbox}</FormGroup>;
  return (
    <FormGroup>
      <FormLabel>
        <Layers size={16} /> Widget & marketplace
      </FormLabel>
      <Tooltip title="Upgrade to Growth or Advanced to use this discount on your widget.">
        <span style={{ display: "inline-block" }}>{checkbox}</span>
      </Tooltip>
    </FormGroup>
  );
};

const RulesStep = ({ isMobile }) => (
  <FormSection
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <StepHeader>
      <StepTitle level={2}>Usage Rules & Limits</StepTitle>
      <StepDescription>
        Set optional constraints like validity dates, usage limits, and minimum
        purchase requirements.
      </StepDescription>
    </StepHeader>
    <FormGroup>
      <FormLabel>
        <Calendar size={16} /> Valid Date Range (Optional)
      </FormLabel>
      <HelpText>
        <Info size={14} /> Leave blank if this discount has no expiration.
      </HelpText>
      <Form.Item name="valid_dates">
        <ResponsiveDateRangePicker
          isMobile={isMobile}
          format="YYYY-MM-DD"
          placeholder="Select valid date range (optional)"
          renderDesktop={(rp) => (
            <StyledRangePicker
              {...rp}
              format="YYYY-MM-DD"
              size="middle"
              style={{ width: "100%" }}
            />
          )}
        />
      </Form.Item>
    </FormGroup>
    <FormGrid>
      <FormGroup>
        <FormLabel>
          <Hash size={16} /> Total Usage Limit (Optional)
        </FormLabel>
        <HelpText>
          <Info size={14} /> Maximum total uses. Leave blank for unlimited.
        </HelpText>
        <Form.Item
          name="usage_limit"
          rules={[
            { type: "number", min: 1, message: "Limit must be at least 1" },
          ]}
        >
          <StyledInputNumber min={1} placeholder="e.g., 100" size="middle" />
        </Form.Item>
      </FormGroup>
      <FormGroup>
        <FormLabel>
          <Users size={16} /> Per-User Usage Limit
        </FormLabel>
        <HelpText>
          <Info size={14} /> How many times one guest can use this.
        </HelpText>
        <Form.Item
          name="usage_limit_per_user"
          rules={[
            { required: true, message: "Please set a limit" },
            { type: "number", min: 1, message: "Limit must be at least 1" },
          ]}
        >
          <StyledInputNumber min={1} placeholder="e.g., 1" size="middle" />
        </Form.Item>
      </FormGroup>
    </FormGrid>
    <FormGroup>
      <FormLabel>
        <ShoppingCart size={16} /> Minimum Purchase Amount (Optional)
      </FormLabel>
      <HelpText>
        <Info size={14} /> Minimum booking total required.
      </HelpText>
      <Form.Item
        name="min_purchase_amount"
        rules={[
          { type: "number", min: 0.01, message: "Must be greater than 0" },
        ]}
      >
        <StyledInputNumber
          min={0.01}
          precision={2}
          formatter={(val) => (val ? `$${val}` : "")}
          parser={(val) => (val ? val.toString().replace(/\$\s?/g, "") : "")}
          placeholder="e.g., 50.00"
          size="middle"
        />
      </Form.Item>
      <ApplyToWidgetCheckbox />
    </FormGroup>
  </FormSection>
);

// #endregion

// #region WIZARD & EDIT COMPONENTS

const wizardSteps = [
  {
    key: "basicInfo",
    title: "Basic Info",
    icon: <TagIcon size={18} />,
    component: BasicInfoStep,
  },
  {
    key: "typeAndValue",
    title: "Type & Value",
    icon: <Percent size={18} />,
    component: TypeAndValueStep,
  },
  {
    key: "applicability",
    title: "Applicability",
    icon: <Target size={18} />,
    component: ApplicabilityStep,
  },
  {
    key: "rules",
    title: "Rules & Limits",
    icon: <FileText size={18} />,
    component: RulesStep,
  },
];

const useIsMobile = () => {
  const screens = useBreakpoint();
  return !screens.md;
};

const DiscountCreateWizard = ({ onFinalSubmit, businessId }) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { state, updateStepData, resetForm } = useDiscount();
  const isMobile = useIsMobile();
  const isFinalStep = currentStep === wizardSteps.length - 1;

  const handleNext = async (values) => {
    updateStepData(wizardSteps[currentStep].key, values);
    if (isFinalStep) {
      setLoading(true);
      try {
        const finalState = { ...state, [wizardSteps[currentStep].key]: values };
        await onFinalSubmit(finalState);
        resetForm();
      } catch (error) {
        console.error("Submission failed", error);
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    updateStepData(wizardSteps[currentStep].key, form.getFieldsValue());
    setCurrentStep(currentStep - 1);
  };

  useEffect(() => {
    form.setFieldsValue(state[wizardSteps[currentStep].key]);
  }, [currentStep, state, form]);

  const StepComponent = wizardSteps[currentStep].component;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
      }}
    >
      <StepsNav>
        {isMobile ? (
          <MobileStepsIndicator>
            Step {currentStep + 1} of {wizardSteps.length}:{" "}
            <strong>{wizardSteps[currentStep].title}</strong>
          </MobileStepsIndicator>
        ) : (
          <Steps
            current={currentStep}
            size="small"
            items={wizardSteps.map((s) => ({ title: s.title, icon: s.icon }))}
          />
        )}
      </StepsNav>
      <ContentContainer>
        <ScrollContainer>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleNext}
            initialValues={state[wizardSteps[currentStep].key]}
          >
            <FormContainer key={currentStep}>
              <StepComponent
                businessId={businessId}
                form={form}
                isMobile={isMobile}
              />
            </FormContainer>
          </Form>
        </ScrollContainer>
      </ContentContainer>
      <NavigationFooter>
        <FooterButton
          onClick={handleBack}
          disabled={loading || currentStep === 0}
          icon={<ArrowLeft size={16} />}
        >
          Previous
        </FooterButton>
        <FooterButton
          type="primary"
          onClick={() => form.submit()}
          loading={loading}
          icon={!isFinalStep && <ArrowRight size={16} />}
        >
          {isFinalStep ? (loading ? "Creating..." : "Create Discount") : "Next"}
        </FooterButton>
      </NavigationFooter>
    </div>
  );
};

const DiscountEditTabs = ({ onFinalSubmit, businessId }) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("1");
  const [loading, setLoading] = useState(false);
  const { state, isLoaded } = useDiscount();
  const isMobile = useIsMobile();

  const fieldToTabMap = {
    name: "1",
    code: "1",
    discount_type: "2",
    value: "2",
    scope: "3",
    target_class: "3",
    target_schedule_group_name: "3",
    valid_dates: "4",
    usage_limit: "4",
    usage_limit_per_user: "4",
    min_purchase_amount: "4",
    apply_to_widget: "4",
  };

  const handleSave = async (values) => {
    setLoading(true);
    try {
      const fullState = {
        basicInfo: { name: values.name, code: values.code },
        typeAndValue: {
          discount_type: values.discount_type,
          value: values.value,
        },
        applicability: {
          scope: values.scope,
          target_class: values.target_class,
          target_class_option: values.target_class_option,
          target_schedule_group_name: values.target_schedule_group_name,
        },
        rules: {
          valid_dates: values.valid_dates,
          usage_limit: values.usage_limit,
          usage_limit_per_user: values.usage_limit_per_user,
          min_purchase_amount: values.min_purchase_amount,
          apply_to_widget: values.apply_to_widget || false,
        },
      };
      await onFinalSubmit(fullState);
    } catch (error) {
      console.error("Error saving discount:", error);
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = ({ errorFields }) => {
    if (errorFields.length > 0) {
      const firstErrorField = errorFields[0].name[0];
      const targetTab = fieldToTabMap[firstErrorField];
      if (targetTab && targetTab !== activeTab) {
        setActiveTab(targetTab);
      }
      message.error("Please correct the highlighted errors before saving.", 4);
    }
  };

  const onValuesChange = (changedValues, allValues) => {
    if (changedValues.hasOwnProperty("scope")) {
      form.setFieldsValue({
        target_class: null,
        target_schedule_group_name: null,
        target_class_option: null,
      });
    }
    if (changedValues.hasOwnProperty("target_class")) {
      form.setFieldsValue({
        target_schedule_group_name: null,
        target_class_option: null,
      });
    }
    if (changedValues.hasOwnProperty("discount_type")) {
      setTimeout(() => form.validateFields(["value"]), 50);
    }
  };

  const tabs = [
    { key: "1", label: "Basic Info", children: <BasicInfoStep /> },
    {
      key: "2",
      label: "Type & Value",
      children: <TypeAndValueStep form={form} />,
    },
    {
      key: "3",
      label: "Applicability",
      children: <ApplicabilityStep businessId={businessId} form={form} />,
    },
    { key: "4", label: "Rules", children: <RulesStep isMobile={isMobile} /> },
  ];

  // Construct initial values once the state is loaded
  const initialValues = isLoaded
    ? {
        ...state.basicInfo,
        ...state.typeAndValue,
        ...state.applicability,
        ...state.rules,
      }
    : {};

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSave}
      onFinishFailed={onFinishFailed}
      onValuesChange={onValuesChange}
      initialValues={initialValues}
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <StyledTabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabs.map((t) => ({
          ...t,
          children: <TabContentWrapper>{t.children}</TabContentWrapper>,
        }))}
      />
      <NavigationFooter>
        <div />
        <FooterButton
          type="primary"
          htmlType="submit"
          loading={loading}
          icon={<Save size={16} />}
        >
          Save Changes
        </FooterButton>
      </NavigationFooter>
    </Form>
  );
};

// #endregion

// #region MAIN DRAWER COMPONENT

const DiscountFlowWrapper = ({
  editingDiscount,
  onSuccess,
  onClose,
  businessId,
}) => {
  const { subscription } = useSubscription();
  const canApplyToWidget = ["growth", "advanced"].includes(
    (subscription?.planId || "").toLowerCase()
  );

  const handleFinalSubmit = async (state) => {
    const { basicInfo, typeAndValue, applicability, rules } = state;

    const cleanPayload = {
      name: basicInfo.name,
      code: basicInfo.code || null,
      discount_type: typeAndValue.discount_type,
      value: typeAndValue.value,
      scope: applicability.scope,
      is_active: editingDiscount ? editingDiscount.is_active : true,
      valid_from: rules.valid_dates?.[0]?.isValid()
        ? rules.valid_dates[0].format("YYYY-MM-DD")
        : null,
      valid_to: rules.valid_dates?.[1]?.isValid()
        ? rules.valid_dates[1].format("YYYY-MM-DD")
        : null,
      target_class:
        applicability.scope !== "business" ? applicability.target_class : null,
      target_class_option:
        applicability.scope === "schedule_group"
          ? applicability.target_class_option
          : null,
      target_schedule_group_name:
        applicability.scope === "schedule_group"
          ? applicability.target_schedule_group_name
          : null,
      usage_limit: rules.usage_limit || null,
      usage_limit_per_user: rules.usage_limit_per_user || 1,
      min_purchase_amount: rules.min_purchase_amount || null,
      apply_to_widget: canApplyToWidget && (rules.apply_to_widget || false),
    };

    try {
      if (editingDiscount) {
        await businessDiscountService.updateDiscount(
          editingDiscount.id,
          cleanPayload
        );
        message.success("Discount updated successfully!");
      } else {
        await businessDiscountService.createDiscount({
          business_id: businessId,
          ...cleanPayload,
        });
        message.success("Discount created successfully!");
      }
      onSuccess();
      onClose();
    } catch (error) {
      const errorData = error.response?.data;
      const errorMsg = errorData
        ? Object.entries(errorData)
            .map(
              ([key, value]) =>
                `${key.replace(/_/g, " ")}: ${
                  Array.isArray(value) ? value.join(" ") : value
                }`
            )
            .join("; ")
        : "Failed to save discount.";
      message.error(errorMsg, 6);
      throw error;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <DrawerHeader>
        <DrawerTitle>
          {editingDiscount ? "Edit Discount" : "Create New Discount"}
        </DrawerTitle>
        <DrawerSubtitle>
          {editingDiscount
            ? "Update your discount details"
            : "Set up a new promotional offer"}
        </DrawerSubtitle>
      </DrawerHeader>
      {editingDiscount ? (
        <DiscountEditTabs
          key={editingDiscount.id}
          onFinalSubmit={handleFinalSubmit}
          businessId={businessId}
        />
      ) : (
        <DiscountCreateWizard
          onFinalSubmit={handleFinalSubmit}
          businessId={businessId}
        />
      )}
    </div>
  );
};

const DiscountsDrawer = ({
  visible,
  onClose,
  editingDiscount,
  onSuccess,
  businessId,
  placement,
}) => {
  const isMobile = useIsMobile();

  return (
    <DiscountProvider editingDiscount={editingDiscount}>
        <VaulDrawer.Root
          direction={placement}
          open={visible}
          onOpenChange={(open) => !open && onClose()}
          handleOnly={!isMobile}
        >
          <VaulDrawer.Portal>
            <StyledDrawerOverlay />
            {isMobile ? (
              <StyledDrawerContent>
                <DrawerHandle />
                <DiscountFlowWrapper
                  {...{ editingDiscount, onSuccess, onClose, businessId }}
                />
              </StyledDrawerContent>
            ) : (
              <DesktopDrawerContent>
                <DrawerHandle />
                <DesktopDrawerInner>
                  <DiscountFlowWrapper
                    {...{ editingDiscount, onSuccess, onClose, businessId }}
                  />
                </DesktopDrawerInner>
              </DesktopDrawerContent>
            )}
          </VaulDrawer.Portal>
        </VaulDrawer.Root>
    </DiscountProvider>
  );
};

// #endregion

export default DiscountsDrawer;
