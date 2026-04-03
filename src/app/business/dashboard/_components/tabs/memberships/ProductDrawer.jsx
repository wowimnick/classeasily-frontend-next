"use client";

import React, { useState, useEffect } from "react";
import styled, { ThemeProvider } from "styled-components";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Tabs,
  Tooltip,
} from "antd";
import {
  X,
  Info,
  Tag,
  FileText,
  DollarSign,
  Layers,
  Users,
  CheckSquare,
  Sparkles,
  ListChecks,
  Link as LinkIcon,
  MessageSquare,
  ShieldCheck,
  Clock,
  Plus,
  Trash2,
  ToggleLeft,
} from "lucide-react";
import message from "@/lib/message";
import { businessMembershipService, businessClassService } from "@/services/apiService";
import { Drawer } from "vaul";
import { VAUL_OVERLAY_BACKDROP_BLUR } from "@/lib/vaulOverlayBlur";
import { theme as appTheme } from "@/components/theme";
import {
  bookingTheme,
  PageTitle,
} from "../classes/_shared/BookingFlowDesign";

const { TextArea } = Input;
const { Option } = Select;

// ─── Styled components matching ClassEditDrawer ───────────────────────────────

const StyledDrawerOverlay = styled(Drawer.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1049;
  ${VAUL_OVERLAY_BACKDROP_BLUR}
`;

const StyledDrawerContent = styled(Drawer.Content)`
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

const DrawerHandle = styled(Drawer.Handle)`
  width: 40px;
  height: 4px;
  background: #e5e7eb;
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
  width: 700px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: white;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid #e5e7eb;
  @media (max-width: 768px) {
    padding: 12px 16px;
  }
`;

const DrawerTitle = styled.h4`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${bookingTheme.textPrimary};
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const CloseButton = styled(Button)`
  padding: 8px;
  height: auto;
  border: none;
  background: none;
  &:hover {
    background: ${(p) => p.theme.token.colorBgTextHover};
  }
`;

const DrawerContentWrapper = styled.div`
  flex: 1 1 auto;
  overflow: hidden;
  background: #fff;
  display: flex;
  flex-direction: column;
`;

const DrawerFooter = styled.div`
  padding: 16px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid ${(p) => p.theme.token.colorBorderSecondary};
  background: white;
  flex-shrink: 0;
  @media (max-width: 768px) {
    padding: 12px 16px;
    flex-direction: column-reverse;
    .ant-btn {
      width: 100%;
    }
  }
`;

const StyledTabs = styled(Tabs)`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  > .ant-tabs-nav {
    margin: 0 !important;
    padding: 0 24px;
    background: white;
    flex-shrink: 0;
    border-bottom: 1px solid #e5e7eb;
  }

  > .ant-tabs-nav .ant-tabs-tab {
    font-weight: 500;
    font-size: 14px;
    color: #64748b;
  }

  > .ant-tabs-nav .ant-tabs-tab-active .ant-tabs-tab-btn {
    color: #222222;
  }

  > .ant-tabs-nav .ant-tabs-ink-bar {
    background: #222222;
    height: 3px;
  }

  > .ant-tabs-nav .ant-tabs-tab:hover {
    color: #222222;
  }

  > .ant-tabs-content-holder {
    flex: 1;
    overflow: auto;
    background: #fff;
  }

  > .ant-tabs-content-holder > .ant-tabs-content > .ant-tabs-tabpane {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
  }

  @media (max-width: 768px) {
    > .ant-tabs-nav {
      padding: 0 16px;
    }
    > .ant-tabs-nav .ant-tabs-tab {
      padding: 12px 10px !important;
      font-size: 13px;
    }
  }
`;

const ScrollContainer = styled.div`
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  padding: 0;
`;

const FormContainer = styled.div`
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
  padding: 24px;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const StepHeader = styled.div`
  margin-bottom: 24px;
`;

const StepDescription = styled.div`
  font-size: 14px;
  color: ${bookingTheme.textSecondary};
  margin-top: 4px;
  line-height: 1.5;
`;

const FormSection = styled.div`
  margin-bottom: 24px;
  background: ${bookingTheme.bg};
  border: 1px solid ${bookingTheme.borderLight};
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  padding: 20px;
  @media (max-width: 768px) {
    margin-bottom: 20px;
    padding: 16px;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  width: 100%;
  &:last-child {
    margin-bottom: 0;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: ${(p) => p.$columns || "1fr 1fr"};
  gap: 16px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const FormLabelWithIcon = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: ${bookingTheme.textPrimary};
  margin-bottom: 6px;
`;

const HelpText = styled.div`
  font-size: 13px;
  color: ${bookingTheme.textSecondary};
  margin-top: 4px;
  margin-bottom: 8px;
  line-height: 1.4;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  svg {
    flex-shrink: 0;
    margin-top: 1px;
  }
`;

const SectionDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 24px 0 16px;
  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: ${bookingTheme.borderLight};
  }
  span {
    padding: 0 12px;
    color: ${bookingTheme.textSecondary};
    font-weight: 600;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 6px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
`;

const ToggleGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 6px;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ToggleButton = styled.button`
  flex: 1;
  padding: 11px 16px;
  background: ${(p) => (p.$selected ? p.theme.token.colorPrimary : "white")};
  color: ${(p) => (p.$selected ? "#fff" : p.theme.token.colorText)};
  border: 1px solid
    ${(p) =>
      p.$selected ? p.theme.token.colorPrimary : p.theme.token.colorBorder};
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  &:hover:not(:disabled) {
    border-color: ${(p) => p.theme.token.colorPrimary};
    ${(p) =>
      !p.$selected &&
      `background: ${p.theme.token.colorPrimaryBg}; color: ${p.theme.token.colorPrimary};`}
  }
`;

const FormItemAntd = styled(Form.Item)`
  margin-bottom: 0 !important;
  .ant-form-item-explain-error {
    margin-top: 4px;
    font-size: 12px;
  }
`;

const FieldCard = styled.div`
  border: 1px solid ${bookingTheme.borderLight};
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 10px;
  background: #fafafa;
`;

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: 140px 1fr 110px auto;
  gap: 10px;
  align-items: center;
  @media (max-width: 600px) {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
`;

const SwitchRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
`;

const SwitchLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${bookingTheme.textSecondary};
`;

const SIGNUP_FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "select", label: "Select" },
  { value: "checkbox", label: "Checkbox" },
];

// Map form field names to tab key for validation redirect
const FIELD_TO_TAB = {
  name: "1",
  description: "1",
  price: "1",
  billing_interval: "1",
  access_type: "1",
  credit_allowance: "1",
  credit_unit: "1",
  applicable_class_ids: "1",
  requires_approval: "1",
  is_active: "1",
  application_instructions: "2",
  confirmation_message: "3",
  welcome_url: "3",
  max_members: "3",
  trial_period_days: "3",
};

// Map form field names to element id for scroll-into-view
const FIELD_TO_ID = {
  name: "mp_name",
  description: "mp_description",
  price: "mp_price",
  billing_interval: "mp_billing_interval",
  credit_allowance: "mp_credit_allowance",
  credit_unit: "mp_credit_unit",
  applicable_class_ids: "mp_applicable_classes",
  application_instructions: "mp_app_instructions",
  confirmation_message: "mp_confirmation_message",
  welcome_url: "mp_welcome_url",
  max_members: "mp_max_members",
  trial_period_days: "mp_trial_period_days",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductDrawer({ open, onClose, product, onSaved }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState([]);
  const [signupFields, setSignupFields] = useState([]);
  const [activeTab, setActiveTab] = useState("1");
  const [isMobile, setIsMobile] = useState(false);

  const isEdit = !!product?.id;

  const accessType = Form.useWatch("access_type", form) || "unlimited";
  const requiresApproval = Form.useWatch("requires_approval", form) === true;

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!open) {
      setActiveTab("1");
      return;
    }
    if (isEdit) {
      form.setFieldsValue({
        name: product.name,
        description: product.description || "",
        price: product.price,
        billing_interval: product.billing_interval || "month",
        access_type: product.access_type || "unlimited",
        credit_allowance: product.credit_allowance ?? undefined,
        credit_unit: product.credit_unit || "",
        applicable_class_ids: product.applicable_class_ids || [],
        is_active: product.is_active !== false,
        requires_approval: product.requires_approval || false,
        confirmation_message: product.confirmation_message || "",
        welcome_url: product.welcome_url || "",
        application_instructions: product.application_instructions || "",
        max_members: product.max_members ?? undefined,
        trial_period_days: product.trial_period_days ?? undefined,
      });
      setSignupFields(
        Array.isArray(product.signup_fields)
          ? product.signup_fields.map((f) => ({
              ...f,
              options: Array.isArray(f.options)
                ? f.options.join("\n")
                : f.options || "",
            }))
          : []
      );
    } else {
      form.resetFields();
      form.setFieldsValue({
        billing_interval: "month",
        access_type: "unlimited",
        is_active: true,
        requires_approval: false,
        applicable_class_ids: [],
      });
      setSignupFields([]);
    }
  }, [open, isEdit, product, form]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const res = await businessClassService.fetchBusinessClasses({ status: "active" });
      if (res.success && Array.isArray(res.data)) setClasses(res.data);
    })();
  }, [open]);

  const classOptions = classes.map((c) => ({
    value: c.classId ?? c.id,
    label: c.title || `Class ${c.classId ?? c.id}`,
  }));

  // ── Signup field helpers ───────────────────────────────────────────────────
  const addSignupField = () =>
    setSignupFields((p) => [
      ...p,
      { key: "", label: "", type: "text", required: false, options: "" },
    ]);
  const removeSignupField = (i) =>
    setSignupFields((p) => p.filter((_, idx) => idx !== i));
  const updateSignupField = (i, updates) =>
    setSignupFields((p) => p.map((f, idx) => (idx === i ? { ...f, ...updates } : f)));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const signupFieldsPayload = signupFields
        .filter((f) => (f.key || "").trim() && (f.label || "").trim())
        .map((f) => ({
          key: (f.key || "").trim(),
          label: (f.label || "").trim(),
          type: f.type || "text",
          required: !!f.required,
          ...(f.type === "select" && f.options
            ? {
                options:
                  typeof f.options === "string"
                    ? f.options
                        .split("\n")
                        .map((o) => o.trim())
                        .filter(Boolean)
                    : f.options,
              }
            : {}),
        }));

      const payload = {
        name: values.name,
        description: values.description || "",
        price: values.price,
        currency: "CAD",
        billing_interval: values.billing_interval || "month",
        access_type: values.access_type || "unlimited",
        credit_allowance:
          values.access_type === "credits" ? values.credit_allowance : null,
        credit_unit:
          values.access_type === "credits"
            ? (values.credit_unit || "").trim()
            : "",
        applicable_class_ids: values.applicable_class_ids || [],
        is_active: values.is_active !== false,
        requires_approval: values.requires_approval || false,
        confirmation_message: (values.confirmation_message || "").trim(),
        welcome_url: (values.welcome_url || "").trim(),
        application_instructions: (values.application_instructions || "").trim(),
        signup_fields: signupFieldsPayload,
        max_members:
          values.max_members != null && values.max_members !== ""
            ? values.max_members
            : null,
        trial_period_days:
          values.trial_period_days != null && values.trial_period_days !== ""
            ? values.trial_period_days
            : null,
      };

      if (isEdit) {
        const res = await businessMembershipService.updateProduct(product.id, payload);
        if (!res.success) {
          message.error(res.error || "Failed to update");
          return;
        }
        const syncRes = await businessMembershipService.syncStripe(product.id);
        if (!syncRes.success)
          message.warning("Saved but Stripe sync failed: " + (syncRes.error || ""));
        else message.success("Plan updated");
      } else {
        const res = await businessMembershipService.createProduct(payload);
        if (!res.success) {
          message.error(res.error || "Failed to create");
          return;
        }
        const newId = res.data?.id;
        if (newId) {
          const syncRes = await businessMembershipService.syncStripe(newId);
          if (!syncRes.success)
            message.warning("Created but Stripe sync failed: " + (syncRes.error || ""));
        }
        message.success("Plan created");
      }

      onSaved?.();
      onClose?.();
    } catch (err) {
      if (err?.errorFields?.length) {
        message.error("Please correct the highlighted errors.");
        const first = err.errorFields[0];
        const fieldName = Array.isArray(first?.name) ? first.name[0] : first?.name;
        if (fieldName && FIELD_TO_TAB[fieldName]) {
          setActiveTab(FIELD_TO_TAB[fieldName]);
          const id = FIELD_TO_ID[fieldName];
          if (id) {
            setTimeout(() => {
              const el = document.getElementById(id);
              el?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 150);
          }
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (open) => {
    if (!open) onClose?.();
  };

  // ── Tab content ─────────────────────────────────────────────────────────────

  const tab1 = (
    <ScrollContainer>
      <FormContainer>
        <StepHeader>
          <PageTitle>Plan details</PageTitle>
          <StepDescription>Name, pricing, access, and membership settings.</StepDescription>
        </StepHeader>

        {/* Plan identity */}
        <FormSection>
          <FormGroup>
            <FormLabelWithIcon htmlFor="mp_name">
              <Tag size={15} />
              Plan name
              <Tooltip
                title="Choose a short, memorable name. e.g. 'Monthly Yoga Pass' or 'Potters Club'."
                placement="topRight"
              >
                <Info
                  size={13}
                  style={{ color: bookingTheme.textSecondary, cursor: "help", marginLeft: 2 }}
                />
              </Tooltip>
            </FormLabelWithIcon>
            <HelpText>
              <Info size={13} />
              This is what members will see when signing up.
            </HelpText>
            <FormItemAntd
              name="name"
              rules={[{ required: true, message: "Plan name is required" }]}
            >
              <Input id="mp_name" placeholder="e.g. Monthly Yoga Pass" maxLength={200} />
            </FormItemAntd>
          </FormGroup>

          <FormGroup>
            <FormLabelWithIcon htmlFor="mp_description">
              <FileText size={15} />
              Description
            </FormLabelWithIcon>
            <HelpText>
              <Info size={13} />
              What's included? Shown on the sign-up screen.
            </HelpText>
            <FormItemAntd name="description">
              <TextArea
                id="mp_description"
                rows={3}
                placeholder="e.g. Unlimited access to all weekly pottery classes."
                maxLength={1000}
                showCount
              />
            </FormItemAntd>
          </FormGroup>
        </FormSection>

        {/* Pricing */}
        <SectionDivider>
          <span>
            <DollarSign size={13} />
            Pricing & billing
          </span>
        </SectionDivider>

        <FormSection>
          <FormGrid $columns="1fr 140px">
            <FormGroup>
              <FormLabelWithIcon htmlFor="mp_price">
                <DollarSign size={15} />
                Price (CAD)
              </FormLabelWithIcon>
              <HelpText>
                <Info size={13} />
                All membership prices are in Canadian dollars.
              </HelpText>
              <FormItemAntd
                name="price"
                rules={[{ required: true, message: "Price is required" }]}
              >
                <InputNumber
                  id="mp_price"
                  min={0}
                  step={0.01}
                  style={{ width: "100%" }}
                  addonBefore="$"
                  placeholder="0.00"
                />
              </FormItemAntd>
            </FormGroup>
            <FormGroup>
              <FormLabelWithIcon htmlFor="mp_billing_interval">
                <Clock size={15} />
                Billing cycle
              </FormLabelWithIcon>
              <HelpText>
                <Info size={13} />
                How often the member is charged. Supported for Stripe subscriptions (monthly or yearly).
              </HelpText>
              <FormItemAntd name="billing_interval">
                <Select id="mp_billing_interval" style={{ width: "100%" }}>
                  <Option value="month">Monthly</Option>
                  <Option value="year">Yearly</Option>
                </Select>
              </FormItemAntd>
            </FormGroup>
          </FormGrid>

          <FormGroup style={{ marginTop: 4 }}>
            <FormLabelWithIcon>
              <Layers size={15} />
              Access type
            </FormLabelWithIcon>
            <HelpText>
              <Info size={13} />
              Unlimited gives full access; Credits gives a set number of bookings per billing period.
            </HelpText>
            <FormItemAntd name="access_type">
              <ToggleGroup>
                <ToggleButton
                  type="button"
                  $selected={accessType === "unlimited"}
                  onClick={() => form.setFieldValue("access_type", "unlimited")}
                >
                  <Sparkles size={15} />
                  Unlimited
                </ToggleButton>
                <ToggleButton
                  type="button"
                  $selected={accessType === "credits"}
                  onClick={() => form.setFieldValue("access_type", "credits")}
                >
                  <Layers size={15} />
                  Credits
                </ToggleButton>
              </ToggleGroup>
            </FormItemAntd>
          </FormGroup>

          {accessType === "credits" && (
            <FormGrid $columns="160px 1fr">
              <FormGroup>
                <FormLabelWithIcon htmlFor="mp_credit_allowance">
                  Credits per period
                </FormLabelWithIcon>
                <HelpText>
                  <Info size={13} />
                  Number of credits the member gets each billing cycle (e.g. each month or each year, depending on the billing cycle above).
                </HelpText>
                <FormItemAntd
                  name="credit_allowance"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <InputNumber
                    id="mp_credit_allowance"
                    min={1}
                    style={{ width: "100%" }}
                    placeholder="e.g. 8"
                  />
                </FormItemAntd>
              </FormGroup>
              <FormGroup>
                <FormLabelWithIcon htmlFor="mp_credit_unit">
                  Credit unit label
                  <Tooltip title="Shown on the booking widget, e.g. '8 sessions / month'.">
                    <Info size={13} style={{ color: bookingTheme.textSecondary, cursor: "help" }} />
                  </Tooltip>
                </FormLabelWithIcon>
                <HelpText>
                  <Info size={13} />
                  e.g. "sessions", "2-hour classes"
                </HelpText>
                <FormItemAntd name="credit_unit">
                  <Input
                    id="mp_credit_unit"
                    placeholder="e.g. sessions"
                    maxLength={100}
                  />
                </FormItemAntd>
              </FormGroup>
            </FormGrid>
          )}
        </FormSection>

        {/* Classes & approval */}
        <SectionDivider>
          <span>
            <Users size={13} />
            Access & approval
          </span>
        </SectionDivider>

        <FormSection>
          <FormGroup>
            <FormLabelWithIcon htmlFor="mp_applicable_classes">
              <CheckSquare size={15} />
              Applicable classes
            </FormLabelWithIcon>
            <HelpText>
              <Info size={13} />
              Restrict this plan to specific classes. When set, members can only use this membership (or apply credits) when booking one of these classes. Leave empty to allow access to all classes.
            </HelpText>
            <FormItemAntd name="applicable_class_ids">
              <Select
                id="mp_applicable_classes"
                mode="multiple"
                placeholder="All classes"
                options={classOptions}
                allowClear
                showSearch
                filterOption={(input, opt) =>
                  (opt?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
                style={{ width: "100%" }}
              />
            </FormItemAntd>
          </FormGroup>

          <FormGroup>
            <FormLabelWithIcon>
              <ShieldCheck size={15} />
              Requires approval
              <Tooltip title="When on, members submit an application instead of paying immediately. You review and approve them from the Members table.">
                <Info size={13} style={{ color: bookingTheme.textSecondary, cursor: "help" }} />
              </Tooltip>
            </FormLabelWithIcon>
            <HelpText>
              <Info size={13} />
              Turn on for invite-only or curated memberships.
            </HelpText>
            <SwitchRow>
              <FormItemAntd name="requires_approval" valuePropName="checked">
                <Switch />
              </FormItemAntd>
              <SwitchLabel>Require approval before membership is active</SwitchLabel>
            </SwitchRow>
          </FormGroup>

          <FormGroup>
            <FormLabelWithIcon>
              <ToggleLeft size={15} />
              Active
            </FormLabelWithIcon>
            <HelpText>
              <Info size={13} />
              Inactive plans are hidden from the booking widget.
            </HelpText>
            <SwitchRow>
              <FormItemAntd name="is_active" valuePropName="checked">
                <Switch />
              </FormItemAntd>
              <SwitchLabel>Plan is publicly available</SwitchLabel>
            </SwitchRow>
          </FormGroup>
        </FormSection>
      </FormContainer>
    </ScrollContainer>
  );

  const tab2 = (
    <ScrollContainer>
      <FormContainer>
        <StepHeader>
          <PageTitle>Signup form</PageTitle>
          <StepDescription>
            Add custom questions to collect from members at signup.
            {requiresApproval && " You can also set instructions for applicants."}
          </StepDescription>
        </StepHeader>

        {requiresApproval && (
          <>
            <FormSection>
              <FormGroup>
                <FormLabelWithIcon htmlFor="mp_app_instructions">
                  <MessageSquare size={15} />
                  Application instructions
                  <Tooltip title="Shown above the form on the booking widget when someone applies. Use this to set expectations.">
                    <Info size={13} style={{ color: bookingTheme.textSecondary, cursor: "help" }} />
                  </Tooltip>
                </FormLabelWithIcon>
                <HelpText>
                  <Info size={13} />
                  E.g. "We review applications within 2 business days and will email you with next steps."
                </HelpText>
                <FormItemAntd name="application_instructions">
                  <TextArea
                    id="mp_app_instructions"
                    rows={3}
                    placeholder="e.g. We review applications within 2 business days…"
                    maxLength={1000}
                    showCount
                  />
                </FormItemAntd>
              </FormGroup>
            </FormSection>

            <SectionDivider>
              <span>
                <ListChecks size={13} />
                Custom fields
              </span>
            </SectionDivider>
          </>
        )}

        {!requiresApproval && (
          <SectionDivider style={{ marginTop: 0 }}>
            <span>
              <ListChecks size={13} />
              Custom fields
            </span>
          </SectionDivider>
        )}

        <FormSection>
          <HelpText style={{ marginBottom: 16 }}>
            <Info size={13} />
            These extra questions are shown on the signup form. Each field needs a unique key (used internally) and a label (shown to the member).
          </HelpText>

          {signupFields.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "24px 0",
                color: bookingTheme.textSecondary,
                fontSize: 14,
                border: `1.5px dashed ${bookingTheme.borderLight}`,
                borderRadius: 12,
                marginBottom: 12,
              }}
            >
              No custom fields yet. Click "Add field" to collect extra info from members.
            </div>
          )}

          {signupFields.map((field, index) => (
            <FieldCard key={index}>
              <FieldRow>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: bookingTheme.textSecondary, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Key</div>
                  <Input
                    placeholder="e.g. how_heard"
                    value={field.key}
                    onChange={(e) => updateSignupField(index, { key: e.target.value })}
                    size="small"
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: bookingTheme.textSecondary, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Label shown to member</div>
                  <Input
                    placeholder="e.g. How did you hear about us?"
                    value={field.label}
                    onChange={(e) => updateSignupField(index, { label: e.target.value })}
                    size="small"
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: bookingTheme.textSecondary, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Type</div>
                  <Select
                    value={field.type || "text"}
                    onChange={(v) => updateSignupField(index, { type: v })}
                    options={SIGNUP_FIELD_TYPES}
                    size="small"
                    style={{ width: "100%" }}
                  />
                </div>
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<Trash2 size={14} />}
                  onClick={() => removeSignupField(index)}
                  style={{ marginTop: 20 }}
                />
              </FieldRow>

              <SwitchRow style={{ marginTop: 10 }}>
                <Switch
                  size="small"
                  checked={!!field.required}
                  onChange={(v) => updateSignupField(index, { required: v })}
                />
                <SwitchLabel>Required</SwitchLabel>
              </SwitchRow>

              {field.type === "select" && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: bookingTheme.textSecondary, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Options (one per line)</div>
                  <TextArea
                    placeholder={"Option 1\nOption 2\nOption 3"}
                    value={
                      typeof field.options === "string"
                        ? field.options
                        : Array.isArray(field.options)
                        ? field.options.join("\n")
                        : ""
                    }
                    onChange={(e) => updateSignupField(index, { options: e.target.value })}
                    rows={3}
                    size="small"
                  />
                </div>
              )}
            </FieldCard>
          ))}

          <Button
            type="dashed"
            onClick={addSignupField}
            icon={<Plus size={14} />}
            block
            style={{ marginTop: 8, height: 40 }}
          >
            Add field
          </Button>
        </FormSection>
      </FormContainer>
    </ScrollContainer>
  );

  const tab3 = (
    <ScrollContainer>
      <FormContainer>
        <StepHeader>
          <PageTitle>After signup</PageTitle>
          <StepDescription>
            Customise what members see after subscribing, and set optional limits.
          </StepDescription>
        </StepHeader>

        {/* Success screen */}
        <FormSection>
          <FormGroup>
            <FormLabelWithIcon htmlFor="mp_confirmation_message">
              <MessageSquare size={15} />
              Confirmation message
              <Tooltip title="This replaces the default 'You can now book classes at member rates.' copy on the success screen.">
                <Info size={13} style={{ color: bookingTheme.textSecondary, cursor: "help" }} />
              </Tooltip>
            </FormLabelWithIcon>
            <HelpText>
              <Info size={13} />
              Shown to the member immediately after subscribing. Leave blank for the default message.
            </HelpText>
            <FormItemAntd name="confirmation_message">
              <TextArea
                id="mp_confirmation_message"
                rows={3}
                placeholder="e.g. Welcome! You're now a member. See you in class 🎉"
                maxLength={500}
                showCount
              />
            </FormItemAntd>
          </FormGroup>

          <FormGroup>
            <FormLabelWithIcon htmlFor="mp_welcome_url">
              <LinkIcon size={15} />
              Member portal link
              <Tooltip title='If set, an "Access member portal →" button appears below the Done button on the success screen.'>
                <Info size={13} style={{ color: bookingTheme.textSecondary, cursor: "help" }} />
              </Tooltip>
            </FormLabelWithIcon>
            <HelpText>
              <Info size={13} />
              Optional. Link to your members-only page, community, or dashboard.
            </HelpText>
            <FormItemAntd name="welcome_url">
              <Input
                id="mp_welcome_url"
                placeholder="https://yoursite.com/members"
                maxLength={500}
                addonBefore="URL"
              />
            </FormItemAntd>
          </FormGroup>
        </FormSection>

        {/* Limits */}
        <SectionDivider>
          <span>
            <Users size={13} />
            Limits & trial
          </span>
        </SectionDivider>

        <FormSection>
          <FormGrid $columns="1fr 1fr">
            <FormGroup>
              <FormLabelWithIcon htmlFor="mp_max_members">
                <Users size={15} />
                Member cap
                <Tooltip title="Once this number of active + trialing members is reached, new sign-ups are blocked with a 'plan full' message.">
                  <Info size={13} style={{ color: bookingTheme.textSecondary, cursor: "help" }} />
                </Tooltip>
              </FormLabelWithIcon>
              <HelpText>
                <Info size={13} />
                Leave empty for unlimited members.
              </HelpText>
              <FormItemAntd name="max_members">
                <InputNumber
                  id="mp_max_members"
                  min={1}
                  placeholder="Unlimited"
                  style={{ width: "100%" }}
                />
              </FormItemAntd>
            </FormGroup>

            <FormGroup>
              <FormLabelWithIcon htmlFor="mp_trial_period_days">
                <Clock size={15} />
                Free trial (days)
                <Tooltip title="Passed directly to Stripe when creating the subscription. Members won't be charged until the trial ends.">
                  <Info size={13} style={{ color: bookingTheme.textSecondary, cursor: "help" }} />
                </Tooltip>
              </FormLabelWithIcon>
              <HelpText>
                <Info size={13} />
                New subscribers get this many days free before their first charge.
              </HelpText>
              <FormItemAntd name="trial_period_days">
                <InputNumber
                  id="mp_trial_period_days"
                  min={1}
                  placeholder="None"
                  style={{ width: "100%" }}
                  addonAfter="days"
                />
              </FormItemAntd>
            </FormGroup>
          </FormGrid>
        </FormSection>
      </FormContainer>
    </ScrollContainer>
  );

  // ── Shell ──────────────────────────────────────────────────────────────────

  const drawerContent = (
    <>
      <DrawerHeader>
        <DrawerTitle>{isEdit ? "Edit membership plan" : "Create membership plan"}</DrawerTitle>
        <CloseButton icon={<X size={20} />} onClick={onClose} disabled={saving} />
      </DrawerHeader>

      <DrawerContentWrapper>
        <StyledTabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { label: "Plan details", key: "1", children: tab1 },
            { label: "Signup form", key: "2", children: tab2 },
            { label: "After signup", key: "3", children: tab3 },
          ]}
        />
      </DrawerContentWrapper>

      <DrawerFooter>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="primary" loading={saving} onClick={handleSave}>
          {isEdit ? "Save changes" : "Create plan"}
        </Button>
      </DrawerFooter>
    </>
  );

  return (
    <ThemeProvider theme={appTheme}>
      <Form
        form={form}
        layout="vertical"
        style={{ display: "flex", flexDirection: "column", height: "100%" }}
      >
        <Drawer.Root
          open={open}
          onOpenChange={handleOpenChange}
          direction={isMobile ? "bottom" : "right"}
          dismissible
          handleOnly={!isMobile}
          repositionInputs={false}
        >
          <Drawer.Portal>
            <StyledDrawerOverlay />
            {isMobile ? (
              <StyledDrawerContent>
                <DrawerHandle />
                {drawerContent}
              </StyledDrawerContent>
            ) : (
              <DesktopDrawerContent>{drawerContent}</DesktopDrawerContent>
            )}
          </Drawer.Portal>
        </Drawer.Root>
      </Form>
    </ThemeProvider>
  );
}
