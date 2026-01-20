"use client";

import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import {
  Form,
  Select,
  InputNumber,
  Input,
  Typography,
  ConfigProvider,
  Button,
  Switch,
  Tooltip,
  Tabs,
  Radio,
  Popconfirm,
  Tag,
} from "antd";
import styled from "styled-components";
import {
  Backpack,
  Activity,
  Info,
  FileText,
  Tag as TagIcon,
  Ticket,
  CalendarRange,
  AlertCircle,
  Plus,
  Trash2,
  Crown,
  Link as LinkIcon,
  Unlink,
  ChevronDown,
  ChevronUp,
  Layers,
  Users,
  CalendarDays,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { theme } from "@/components/theme";
import { useClass } from "../ClassContext";

const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;

// --- ANIMATION HOOKS ---

const useElementSize = () => {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
};

const SmoothHeight = ({ children, activeKey }) => {
  const [ref, { height }] = useElementSize();

  return (
    <motion.div
      animate={{ height: height || "auto" }}
      style={{ overflow: "hidden" }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
    >
      <div ref={ref}>{children}</div>
    </motion.div>
  );
};

// --- STYLED COMPONENTS ---

const StepHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const StepTitle = styled(Title)`
  margin-bottom: 8px !important;
  color: ${(props) => props.theme.token.colorText};
  font-size: 28px !important;
  font-weight: 700 !important;
`;

const StepDescription = styled(Text)`
  display: block;
  color: ${(props) => props.theme.token.colorTextSecondary};
  font-size: 16px;
  margin-bottom: 24px;
`;

const GlobalSettingsContainer = styled.div`
  background: #ffffff;
  border: 1px solid ${(props) => props.theme.token.colorBorder};
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`;

const BookingTypeToggle = styled(Button.Group)`
  display: flex;
  width: 100%;

  .ant-btn {
    flex: 1;
    height: 40px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 14px;
  }
`;

const TierCard = styled(motion.div)`
  background: #fff;
  border: 1px solid
    ${(props) =>
      props.$isActive
        ? props.theme.token.colorPrimary
        : props.theme.token.colorBorder};
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: ${(props) =>
    props.$isActive ? "0 4px 12px rgba(0,0,0,0.08)" : "none"};

  &:hover {
    border-color: ${(props) =>
      props.$isActive
        ? props.theme.token.colorPrimary
        : props.theme.token.colorPrimaryBorder};
  }
`;

const TierHeader = styled.div`
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  background: ${(props) =>
    props.$isActive ? props.theme.token.colorPrimaryBg : "#fff"};
  transition: background 0.3s ease;
`;

const TierTitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;

  h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: ${(props) => props.theme.token.colorText};
  }
`;

const TierBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${(props) => props.$bg};
  color: ${(props) => props.$color};
  flex-shrink: 0;
`;

const TierBody = styled.div`
  padding: 0 24px 24px 24px;
  border-top: 1px solid ${(props) => props.theme.token.colorBorderSecondary};
`;

const StyledTabs = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: 16px !important;
  }
  .ant-tabs-tab {
    padding: 12px 0 !important;
    font-size: 14px;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: ${(props) => props.columns || "1fr 1fr"};
  gap: 20px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StandardLabel = ({ icon: Icon, label, help }) => (
  <div style={{ marginBottom: 6 }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontWeight: 500,
        fontSize: "14px",
        color: theme.token.colorText,
      }}
    >
      {Icon && <Icon size={14} color={theme.token.colorTextSecondary} />}
      {label}
    </div>
    {help && (
      <div
        style={{
          fontSize: "12px",
          color: theme.token.colorTextSecondary,
          marginTop: 2,
          marginLeft: Icon ? 20 : 0,
        }}
      >
        {help}
      </div>
    )}
  </div>
);

const ScheduleCardGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
`;

const ScheduleCard = styled.div`
  border: 1px solid
    ${(props) =>
      props.$selected
        ? props.theme.token.colorPrimary
        : props.theme.token.colorBorder};
  background: ${(props) =>
    props.$selected ? props.theme.token.colorPrimaryBg : "#fff"};
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &:hover {
    border-color: ${(props) => props.theme.token.colorPrimary};
  }

  h5 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${(props) =>
      props.$selected
        ? props.theme.token.colorPrimary
        : props.theme.token.colorText};
  }

  p {
    margin: 0;
    font-size: 12px;
    color: ${(props) => props.theme.token.colorTextSecondary};
    line-height: 1.4;
  }
`;

const QuickPill = styled(Tag)`
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  &:hover {
    background: ${(props) => props.theme.token.colorPrimaryBg};
    border-color: ${(props) => props.theme.token.colorPrimary};
    color: ${(props) => props.theme.token.colorPrimary};
  }
`;

const FooterActions = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid ${(props) => props.theme.token.colorBorder};
`;

const StyledInputNumber = styled(InputNumber)`
  width: 100%;
`;

// --- MAIN COMPONENT ---

const ClassOptionsStep = ({ onValidatedNext }) => {
  const [form] = Form.useForm();
  const { state, updateOptions, debouncedUpdateOptions, isLoaded } = useClass();
  const [activeTier, setActiveTier] = useState(0);
  const isFormInitialized = useRef(false);

  // Watchers
  const bookingType = Form.useWatch("booking_type", form);
  const options = Form.useWatch("options", form);

  // Initialize Form
  useEffect(() => {
    if (isLoaded && !isFormInitialized.current) {
      const contextOptions = state.options || [];
      const initialBookingType =
        contextOptions[0]?.booking_type || "Single Session";

      const mappedOptions =
        contextOptions.length > 0
          ? contextOptions.map((opt, index) => ({
              ...opt,
              schedule_mode:
                index === 0 ? "primary" : opt.schedule_mode || "synced",
            }))
          : [
              {
                title: "General Admission",
                schedule_mode: "primary",
                cancellationPolicy: "flexible",
                cancellationRefundPercentage: 100,
                level: "all",
              },
            ];

      form.setFieldsValue({
        booking_type: initialBookingType,
        options: mappedOptions,
      });

      isFormInitialized.current = true;
    }
  }, [isLoaded, state.options, form]);

  // Handler
  const handleValuesChange = (changedValues, allValues) => {
    if (!isFormInitialized.current) return;

    if (changedValues.options) {
      changedValues.options.forEach((opt, index) => {
        if (!opt) return;

        // Auto-clear strict refund values
        if (opt.cancellationPolicy === "strict") {
          const path = ["options", index, "cancellationRefundPercentage"];
          if (form.getFieldValue(path) !== 0) {
            form.setFieldValue(path, 0);
          }
        }
        if (opt.midCourseCancellationPolicy === "strict") {
          const path = [
            "options",
            index,
            "midCourseCancellationRefundPercentage",
          ];
          if (form.getFieldValue(path) !== 0) {
            form.setFieldValue(path, 0);
          }
        }
      });
    }

    const formattedOptions = allValues.options.map((opt) => ({
      ...opt,
      booking_type: allValues.booking_type,
      price_type:
        allValues.booking_type === "Full Course"
          ? "full_course"
          : "per_session",
    }));

    debouncedUpdateOptions(formattedOptions);
  };

  const handleFinish = (values) => {
    const formattedOptions = values.options.map((opt) => ({
      ...opt,
      booking_type: values.booking_type,
      price_type:
        values.booking_type === "Full Course" ? "full_course" : "per_session",
    }));
    updateOptions(formattedOptions);
    onValidatedNext();
  };

  const addTier = (addFn) => {
    const primaryTier = form.getFieldValue(["options", 0]);
    addFn({
      title: "",
      schedule_mode: "synced",
      level: primaryTier.level || "all",
      equipment: primaryTier.equipment || [],
      tags: primaryTier.tags || [],
      cancellationPolicy: primaryTier.cancellationPolicy,
      cancellationRefundPercentage: primaryTier.cancellationRefundPercentage,
      cancellationCustomHours: primaryTier.cancellationCustomHours,
      allowMidCourseDrops: primaryTier.allowMidCourseDrops,
      midCourseCancellationPolicy: primaryTier.midCourseCancellationPolicy,
    });
    const currentLen = form.getFieldValue("options").length;
    setActiveTier(currentLen);
  };

  return (
    <ConfigProvider theme={theme}>
      <StepHeader>
        <StepTitle level={2}>Experience Configuration</StepTitle>
        <StepDescription>
          Define your ticket tiers, activity details, and cancellation policies.
        </StepDescription>
      </StepHeader>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        onValuesChange={handleValuesChange}
        preserve={false}
      >
        <GlobalSettingsContainer>
          <StandardLabel icon={CalendarRange} label="Experience Structure" />
          <div
            style={{
              marginBottom: "12px",
              fontSize: "13px",
              color: theme.token.colorTextSecondary,
            }}
          >
            This setting applies to <strong>all</strong> ticket tiers.
          </div>
          <Form.Item
            name="booking_type"
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 0 }}
          >
            <BookingTypeToggle>
              <Tooltip title="Guests book specific dates (e.g., a one-off class).">
                <Button
                  type={
                    bookingType === "Single Session" ? "primary" : "default"
                  }
                  onClick={() =>
                    form.setFieldsValue({ booking_type: "Single Session" })
                  }
                >
                  <Ticket size={16} /> One-Time Experience
                </Button>
              </Tooltip>
              <Tooltip title="Guests enroll in a multi-day series (e.g. 4-week course).">
                <Button
                  type={bookingType === "Full Course" ? "primary" : "default"}
                  onClick={() =>
                    form.setFieldsValue({ booking_type: "Full Course" })
                  }
                >
                  <Layers size={16} /> Multi-Day Series
                </Button>
              </Tooltip>
            </BookingTypeToggle>
          </Form.Item>
        </GlobalSettingsContainer>

        <StandardLabel
          icon={Ticket}
          label="Ticket Tiers & Variations"
          help="Create standard tickets, VIP options, or different schedules."
        />

        <Form.List name="options">
          {(fields, { add, remove }) => (
            <>
              <AnimatePresence initial={false}>
                {fields.map((field, index) => {
                  const isPrimary = index === 0;
                  const isActive = activeTier === index;
                  const tierValues =
                    form.getFieldValue(["options", index]) || {};
                  const tierMode = tierValues.schedule_mode;

                  return (
                    <TierCard
                      key={field.key}
                      $isActive={isActive}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    >
                      <TierHeader
                        $isActive={isActive}
                        onClick={() => setActiveTier(isActive ? null : index)}
                      >
                        <TierTitleSection>
                          {isPrimary ? (
                            <Crown size={18} color="#ca8a04" fill="#ca8a04" />
                          ) : tierMode === "independent" ? (
                            <Unlink size={18} color="#64748b" />
                          ) : (
                            <LinkIcon size={18} color="#0f766e" />
                          )}
                          <div>
                            <h4
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              {form.getFieldValue([
                                "options",
                                index,
                                "title",
                              ]) ||
                                (isPrimary
                                  ? "Primary Tier"
                                  : "Untitled Option")}
                            </h4>
                            <AnimatePresence>
                              {!isActive && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{
                                    opacity: 1,
                                    height: "auto",
                                    marginTop: 4,
                                  }}
                                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                >
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: "12px" }}
                                  >
                                    {isPrimary
                                      ? "Main Configuration"
                                      : tierMode === "synced"
                                      ? "Synced to Primary Schedule"
                                      : "Independent Schedule"}
                                  </Text>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </TierTitleSection>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          {isPrimary ? (
                            <TierBadge $bg="#fef9c3" $color="#854d0e">
                              Primary
                            </TierBadge>
                          ) : tierMode === "independent" ? (
                            <TierBadge $bg="#f1f5f9" $color="#475569">
                              Independent
                            </TierBadge>
                          ) : (
                            <TierBadge $bg="#ccfbf1" $color="#115e59">
                              Synced
                            </TierBadge>
                          )}

                          {!isPrimary && (
                            <Popconfirm
                              title="Delete this tier?"
                              onConfirm={(e) => {
                                e.stopPropagation();
                                remove(field.name);
                              }}
                              onCancel={(e) => e.stopPropagation()}
                            >
                              <Button
                                type="text"
                                danger
                                size="small"
                                icon={<Trash2 size={16} />}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </Popconfirm>
                          )}
                          {isActive ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </div>
                      </TierHeader>

                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <TierBody>
                              <Tabs
                                defaultActiveKey="basics"
                                renderTabBar={(props, DefaultTabBar) => (
                                  <DefaultTabBar {...props} />
                                )}
                              >
                                <Tabs.TabPane tab="Basics" key="basics">
                                  <SmoothHeight>
                                    <TierBasicsTab
                                      field={field}
                                      isPrimary={isPrimary}
                                      form={form}
                                    />
                                  </SmoothHeight>
                                </Tabs.TabPane>
                                <Tabs.TabPane tab="Details" key="details">
                                  <SmoothHeight>
                                    <TierDetailsTab field={field} form={form} />
                                  </SmoothHeight>
                                </Tabs.TabPane>
                                <Tabs.TabPane tab="Policies" key="policies">
                                  <SmoothHeight>
                                    <TierPoliciesTab
                                      field={field}
                                      form={form}
                                      bookingType={bookingType}
                                    />
                                  </SmoothHeight>
                                </Tabs.TabPane>
                              </Tabs>
                            </TierBody>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </TierCard>
                  );
                })}
              </AnimatePresence>

              <FooterActions>
                <Button
                  type="dashed"
                  icon={<Plus size={16} />}
                  onClick={() => addTier(add)}
                  block
                  style={{ height: "48px", maxWidth: "300px" }}
                >
                  Add Ticket Tier
                </Button>
              </FooterActions>
            </>
          )}
        </Form.List>
      </Form>
    </ConfigProvider>
  );
};

// --- SUB-COMPONENTS FOR TABS ---

const TierBasicsTab = ({ field, isPrimary, form }) => {
  return (
    <div style={{ paddingTop: "8px" }}>
      <StandardLabel
        icon={Ticket}
        label="Tier Name"
        help="The name visible to customers."
      />
      <Form.Item
        {...field}
        name={[field.name, "title"]}
        rules={[{ required: true, message: "Please name this tier" }]}
      >
        <Input
          placeholder={isPrimary ? "e.g. General Admission" : "e.g. VIP Access"}
          size="middle"
        />
      </Form.Item>

      <StandardLabel
        icon={Info}
        label="Description (Optional)"
        help="Briefly describe what is included."
      />
      <Form.Item {...field} name={[field.name, "description"]}>
        <TextArea
          placeholder="What does this ticket include?"
          rows={3}
          showCount
          maxLength={200}
        />
      </Form.Item>

      {!isPrimary && (
        <div style={{ marginTop: "24px" }}>
          <StandardLabel
            icon={CalendarRange}
            label="Schedule Behavior"
            help="Does this tier happen at the same time as your primary event, or does it have its own calendar?"
          />
          <Form.Item
            {...field}
            name={[field.name, "schedule_mode"]}
            initialValue="synced"
            style={{ marginBottom: 0 }}
          >
            <ScheduleModeSelector />
          </Form.Item>
        </div>
      )}
    </div>
  );
};

const ScheduleModeSelector = ({ value, onChange }) => {
  return (
    <ScheduleCardGroup>
      <ScheduleCard
        $selected={value === "synced"}
        onClick={() => onChange("synced")}
      >
        <h5>
          <Users size={16} /> Same Spot / Time
        </h5>
        <p>
          Happens alongside the Primary tier. Great for VIP upgrades or pricing
          variations for the same event.
        </p>
      </ScheduleCard>
      <ScheduleCard
        $selected={value === "independent"}
        onClick={() => onChange("independent")}
      >
        <h5>
          <CalendarDays size={16} /> Separate Time
        </h5>
        <p>
          Has its own unique schedule. Great for "Tuesday Discount" vs "Saturday
          Premium" or different rooms.
        </p>
      </ScheduleCard>
    </ScheduleCardGroup>
  );
};

const TierDetailsTab = ({ field, form }) => {
  return (
    <div style={{ paddingTop: "8px" }}>
      <FormGrid>
        <div>
          <StandardLabel
            icon={Activity}
            label="Activity Level"
            help="Difficulty intensity."
          />
          <Form.Item {...field} name={[field.name, "level"]} initialValue="all">
            <Select size="middle">
              <Option value="all">Open to Everyone</Option>
              <Option value="no-experience">No Experience Needed</Option>
              <Option value="intermediate">Intermediate</Option>
              <Option value="advanced">Advanced</Option>
              <Option value="strenuous">Strenuous</Option>
            </Select>
          </Form.Item>
        </div>
      </FormGrid>

      <div style={{ marginTop: "16px" }}>
        <StandardLabel
          icon={Backpack}
          label="Packing List"
          help="Items guests should bring (Type and press Enter)."
        />
        <Form.Item {...field} name={[field.name, "equipment"]}>
          <Select
            mode="tags"
            size="middle"
            placeholder="e.g. Towel, ID Card, Water"
            style={{ width: "100%" }}
            tokenSeparators={[","]}
            open={false}
          />
        </Form.Item>
      </div>

      <div style={{ marginTop: "16px" }}>
        <StandardLabel
          icon={TagIcon}
          label="Search Tags"
          help="Keywords for discovery."
        />
        <Form.Item {...field} name={[field.name, "tags"]}>
          <Select
            mode="tags"
            size="middle"
            placeholder="Keywords..."
            style={{ width: "100%" }}
            tokenSeparators={[","]}
            open={false}
          />
        </Form.Item>
      </div>
    </div>
  );
};

const TierPoliciesTab = ({ field, form, bookingType }) => {
  return (
    <div style={{ paddingTop: "8px" }}>
      <FormGrid>
        <div>
          <StandardLabel
            icon={FileText}
            label="Cancellation Notice"
            help="Minimum notice for refund."
          />
          <Form.Item
            {...field}
            name={[field.name, "cancellationPolicy"]}
            initialValue="flexible"
            rules={[{ required: true }]}
          >
            <Select size="middle">
              <Option value="flexible">Flexible (1hr)</Option>
              <Option value="24h">24 Hours</Option>
              <Option value="48h">48 Hours</Option>
              <Option value="72h">72 Hours</Option>
              <Option value="strict">Strict (Non-refundable)</Option>
              <Option value="custom">Custom</Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          shouldUpdate={(prev, curr) =>
            prev.options?.[field.key]?.cancellationPolicy !==
            curr.options?.[field.key]?.cancellationPolicy
          }
          noStyle
        >
          {({ getFieldValue }) => {
            const policy = getFieldValue([
              "options",
              field.name,
              "cancellationPolicy",
            ]);
            const isStrict = policy === "strict";

            return (
              <div>
                <StandardLabel
                  icon={Percent}
                  label="Refund %"
                  help="Amount refunded."
                />
                <Form.Item
                  {...field}
                  name={[field.name, "cancellationRefundPercentage"]}
                  initialValue={100}
                >
                  <StyledInputNumber
                    min={0}
                    max={100}
                    formatter={(val) => `${val}%`}
                    disabled={isStrict}
                    size="middle"
                  />
                </Form.Item>
              </div>
            );
          }}
        </Form.Item>
      </FormGrid>

      {/* Custom Hours Expansion */}
      <Form.Item
        shouldUpdate={(prev, curr) =>
          prev.options?.[field.key]?.cancellationPolicy !==
          curr.options?.[field.key]?.cancellationPolicy
        }
        noStyle
      >
        {({ getFieldValue, setFieldsValue }) => {
          const policy = getFieldValue([
            "options",
            field.name,
            "cancellationPolicy",
          ]);
          if (policy !== "custom") return null;

          return (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ marginBottom: 16 }}>
                <StandardLabel
                  icon={Clock}
                  label="Custom Hours Notice"
                  help="Hours before start required."
                />
                <div style={{ display: "flex", gap: "12px" }}>
                  <Form.Item
                    {...field}
                    name={[field.name, "cancellationCustomHours"]}
                    rules={[{ required: true, message: "Required" }]}
                    style={{ marginBottom: 0, flex: 1 }}
                  >
                    <InputNumber
                      min={1}
                      placeholder="e.g. 12"
                      addonAfter="Hours"
                      size="middle"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {[12, 24, 48, 168].map((h) => (
                      <QuickPill
                        key={h}
                        onClick={() =>
                          setFieldsValue({
                            options: {
                              [field.name]: { cancellationCustomHours: h },
                            },
                          })
                        }
                      >
                        {h < 25 ? `${h}h` : `${h / 24}d`}
                      </QuickPill>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        }}
      </Form.Item>

      {/* Mid-Course Logic - Only if Full Course */}
      {bookingType === "Full Course" && (
        <div
          style={{
            marginTop: "24px",
            borderTop: "1px dashed #e2e8f0",
            paddingTop: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <StandardLabel
              icon={AlertCircle}
              label="Mid-Series Drops"
              help="Allow partial refunds after start?"
            />
            <Form.Item
              {...field}
              name={[field.name, "allowMidCourseDrops"]}
              valuePropName="checked"
              initialValue={false}
              noStyle
            >
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>
          </div>

          <Form.Item
            shouldUpdate={(prev, curr) =>
              prev.options?.[field.key]?.allowMidCourseDrops !==
              curr.options?.[field.key]?.allowMidCourseDrops
            }
          >
            {({ getFieldValue }) => {
              const allowed = getFieldValue([
                "options",
                field.name,
                "allowMidCourseDrops",
              ]);
              if (!allowed) return null;

              return (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  <FormGrid>
                    <div>
                      <StandardLabel label="Drop Notice" />
                      <Form.Item
                        {...field}
                        name={[field.name, "midCourseCancellationPolicy"]}
                        initialValue="24h"
                      >
                        <Select size="middle">
                          <Option value="flexible">Flexible</Option>
                          <Option value="24h">24 Hours</Option>
                          <Option value="48h">48 Hours</Option>
                          <Option value="strict">Strict</Option>
                        </Select>
                      </Form.Item>
                    </div>
                    <div>
                      <StandardLabel label="Refund % (Remaining)" />
                      <Form.Item
                        {...field}
                        name={[
                          field.name,
                          "midCourseCancellationRefundPercentage",
                        ]}
                        initialValue={100}
                      >
                        <StyledInputNumber
                          min={0}
                          max={100}
                          formatter={(val) => `${val}%`}
                          size="middle"
                        />
                      </Form.Item>
                    </div>
                  </FormGrid>
                </motion.div>
              );
            }}
          </Form.Item>
        </div>
      )}
    </div>
  );
};

// Simple Icon wrapper for consistent size in FormGrid if needed
const Percent = ({ size, color }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color || "currentColor"}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="5" x2="5" y2="19"></line>
    <circle cx="6.5" cy="6.5" r="2.5"></circle>
    <circle cx="17.5" cy="17.5" r="2.5"></circle>
  </svg>
);

export default ClassOptionsStep;
