"use client";

import React, {
  useEffect,
  useState,
  useRef,
  useLayoutEffect,
  useMemo,
} from "react";
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
  Popconfirm,
  Tag,
} from "antd";
import styled from "styled-components";
import {
  Backpack,
  Activity,
  FileText,
  Ticket,
  CalendarRange,
  Plus,
  Trash2,
  Crown,
  Link as LinkIcon,
  Unlink,
  ChevronDown,
  ChevronUp,
  Users,
  CalendarDays,
  Clock,
  Percent,
  Type,
  ToggleLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { theme } from "@/components/theme";
import { useClass } from "../ClassContext";

const { Option } = Select;
const { Title, Text } = Typography;

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

const SmoothHeight = ({ children }) => {
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
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease;
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

const TierInternalTabs = styled(Tabs)`
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

const FormItemAntd = styled(Form.Item)`
  margin-bottom: 0 !important;
  .ant-form-item-explain-error {
    margin-top: 4px;
    font-size: 12px;
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
          marginLeft: Icon ? 0 : 0,
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

const StyledTagsSelect = styled(Select)`
  .ant-select-selector {
    border-radius: ${(props) => props.theme.token.borderRadius}px !important;
  }
`;

// --- FEATURE BUILDER COMPONENT ---
// Matches the logic from ClassEditDrawer exactly

const FeatureBuilder = ({ form, tierIndex, onUpdate }) => {
  // We watch the entire options array to derive the global list of Feature Keys (Rows)
  const options = Form.useWatch("options", form) || [];

  // Parse all descriptions to get a unique set of keys (Row Headers)
  const allFeatureKeys = useMemo(() => {
    const keys = new Set();
    options.forEach((opt) => {
      try {
        const parsed = JSON.parse(opt.description || "{}");
        if (typeof parsed === "object" && parsed !== null) {
          Object.keys(parsed).forEach((k) => keys.add(k));
        }
      } catch (e) {
        // Ignore parsing errors or plain strings
      }
    });
    return Array.from(keys);
  }, [options]);

  // Helper to safely update the form options array
  const updateOptions = (newOptions) => {
    form.setFieldsValue({ options: newOptions });
    // IMPORTANT: Since setFieldsValue doesn't trigger onValuesChange in parent,
    // we must manually trigger the context update.
    onUpdate(newOptions);
  };

  const getCurrentTierFeatures = () => {
    try {
      const currentDesc = options[tierIndex]?.description;
      return currentDesc ? JSON.parse(currentDesc) : {};
    } catch (e) {
      return {};
    }
  };

  // 1. Change Cell Value (Specific to this Tier)
  const handleValueChange = (key, newValue) => {
    const newOptions = [...options];
    const currentFeatures = getCurrentTierFeatures();

    currentFeatures[key] = newValue;

    newOptions[tierIndex] = {
      ...newOptions[tierIndex],
      description: JSON.stringify(currentFeatures),
    };

    updateOptions(newOptions);
  };

  // 2. Rename Row (Applies to ALL Tiers to keep table synced)
  const handleKeyRename = (oldKey, newKey) => {
    if (!newKey.trim() || oldKey === newKey) return;

    const newOptions = options.map((opt) => {
      try {
        const features = JSON.parse(opt.description || "{}");
        if (Object.prototype.hasOwnProperty.call(features, oldKey)) {
          const value = features[oldKey];
          delete features[oldKey];
          features[newKey] = value;
          return { ...opt, description: JSON.stringify(features) };
        }
        return opt;
      } catch (e) {
        return opt;
      }
    });

    updateOptions(newOptions);
  };

  // 3. Delete Row (Applies to ALL Tiers)
  const handleDeleteRow = (key) => {
    const newOptions = options.map((opt) => {
      try {
        const features = JSON.parse(opt.description || "{}");
        if (Object.prototype.hasOwnProperty.call(features, key)) {
          delete features[key];
          return { ...opt, description: JSON.stringify(features) };
        }
        return opt;
      } catch (e) {
        return opt;
      }
    });

    updateOptions(newOptions);
  };

  // 4. Add New Row
  const handleAddFeature = () => {
    const newKey = "New Feature";
    let finalKey = newKey;
    let counter = 1;

    while (allFeatureKeys.includes(finalKey)) {
      finalKey = `${newKey} ${counter}`;
      counter++;
    }

    handleValueChange(finalKey, true); // Default to "Included"
  };

  const currentFeatures = getCurrentTierFeatures();

  return (
    <div style={{ padding: 0 }}>
      {allFeatureKeys.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 24px",
            gap: "8px",
            marginBottom: "6px",
            padding: "0 4px",
          }}
        >
          <Text
            type="secondary"
            style={{
              fontSize: "11px",
              fontWeight: "600",
              letterSpacing: "0.5px",
            }}
          >
            FEATURE
          </Text>
          <Text
            type="secondary"
            style={{
              fontSize: "11px",
              fontWeight: "600",
              letterSpacing: "0.5px",
            }}
          >
            VALUE
          </Text>
        </div>
      )}

      {allFeatureKeys.map((key) => {
        const value = currentFeatures[key];
        const effectiveValue = value === undefined ? "" : value;
        const isBool = typeof effectiveValue === "boolean";

        return (
          <div
            key={key}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 24px",
              gap: "8px",
              marginBottom: "6px",
              alignItems: "center",
            }}
          >
            {/* Row Name Input */}
            <Input
              size="middle"
              variant="filled"
              placeholder="e.g. Duration"
              defaultValue={key}
              onBlur={(e) => handleKeyRename(key, e.target.value)}
              onPressEnter={(e) => e.target.blur()}
              style={{ fontSize: "13px" }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {/* Value Selector */}
              <div style={{ flex: 1 }}>
                {isBool ? (
                  <div
                    style={{
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: "4px",
                    }}
                  >
                    <Switch
                      size="small"
                      checked={effectiveValue}
                      onChange={(checked) => handleValueChange(key, checked)}
                    />
                    <span
                      style={{
                        fontSize: "12px",
                        marginLeft: "8px",
                        color: effectiveValue ? "#10b981" : "#94a3b8",
                      }}
                    >
                      {effectiveValue ? "Included" : "Excluded"}
                    </span>
                  </div>
                ) : (
                  <Input
                    size="middle"
                    placeholder="e.g. 2 Hours"
                    value={effectiveValue}
                    onChange={(e) => handleValueChange(key, e.target.value)}
                    style={{ fontSize: "13px" }}
                  />
                )}
              </div>

              {/* Type Toggle */}
              <Tooltip
                title={isBool ? "Switch to Text Input" : "Switch to Yes/No"}
              >
                <Button
                  size="small"
                  type="text"
                  style={{ color: "#94a3b8" }}
                  icon={isBool ? <Type size={14} /> : <ToggleLeft size={14} />}
                  onClick={() => handleValueChange(key, isBool ? "" : true)}
                />
              </Tooltip>
            </div>

            {/* Delete */}
            <Popconfirm
              title="Delete row?"
              okText="Yes"
              cancelText="No"
              onConfirm={() => handleDeleteRow(key)}
            >
              <Button
                type="text"
                size="small"
                danger
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  opacity: 0.6,
                }}
                icon={<Trash2 size={14} />}
              />
            </Popconfirm>
          </div>
        );
      })}

      <Button
        type="dashed"
        size="small"
        block
        icon={<Plus size={12} />}
        onClick={handleAddFeature}
        style={{
          marginTop: "4px",
          fontSize: "12px",
          color: "#64748b",
          borderColor: "#e2e8f0",
        }}
      >
        Add Comparison Row
      </Button>
    </div>
  );
};

// --- SUB-COMPONENTS FOR TABS ---

const TierBasicsTab = ({ field, isPrimary, form, onUpdate }) => {
  return (
    <div style={{ paddingTop: "8px" }}>
      <StandardLabel
        icon={Ticket}
        label="Tier Name"
        help="The name visible to customers (e.g., VIP)."
      />
      <FormItemAntd
        {...field}
        name={[field.name, "title"]}
        rules={[{ required: true, message: "Please name this tier" }]}
      >
        <Input
          placeholder={isPrimary ? "e.g. General Admission" : "e.g. VIP Access"}
          size="middle"
        />
      </FormItemAntd>

      <div style={{ marginTop: "16px" }}>
        <StandardLabel
          icon={FileText} // Changed icon slightly to match functionality
          label="Features & Comparison"
          help="Define what is included in this tier. Rows are synced across all tiers."
        />
        {/* We do NOT bind this Form.Item to 'description' directly via 'name' property.
            Instead, FeatureBuilder manages the form state for 'options' globally.
         */}
        <Form.Item style={{ marginBottom: "16px" }}>
          <FeatureBuilder
            form={form}
            tierIndex={field.name}
            onUpdate={onUpdate}
          />
        </Form.Item>
      </div>

      {!isPrimary && (
        <div style={{ marginTop: "24px" }}>
          <StandardLabel
            icon={CalendarRange}
            label="Schedule Behavior"
            help="Does this tier happen at the same time as your primary event?"
          />
          <FormItemAntd
            {...field}
            name={[field.name, "schedule_mode"]}
            initialValue="synced"
            style={{ marginBottom: 0 }}
          >
            <ScheduleModeSelector />
          </FormItemAntd>
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
          <FormItemAntd
            {...field}
            name={[field.name, "level"]}
            initialValue="all"
          >
            <Select size="middle">
              <Option value="all">Open to Everyone</Option>
              <Option value="no-experience">No Experience Needed</Option>
              <Option value="intermediate">Intermediate</Option>
              <Option value="advanced">Advanced</Option>
              <Option value="strenuous">Strenuous</Option>
            </Select>
          </FormItemAntd>
        </div>
      </FormGrid>

      <div style={{ marginTop: "16px" }}>
        <StandardLabel
          icon={Backpack}
          label="Packing List"
          help="Items guests should bring (Type and press Enter)."
        />
        <FormItemAntd {...field} name={[field.name, "equipment"]}>
          <StyledTagsSelect
            mode="tags"
            size="middle"
            placeholder="e.g. Towel, ID Card, Water"
            style={{ width: "100%" }}
            tokenSeparators={[","]}
            open={false}
          />
        </FormItemAntd>
      </div>
    </div>
  );
};

const TierPoliciesTab = ({ field, form }) => {
  return (
    <div style={{ paddingTop: "8px" }}>
      <FormGrid>
        <div>
          <StandardLabel
            icon={FileText}
            label="Cancellation Notice"
            help="Minimum notice for refund."
          />
          <FormItemAntd
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
          </FormItemAntd>
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
                  label="Refund"
                  help="Amount refunded."
                />
                <FormItemAntd
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
                </FormItemAntd>
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
              style={{ overflow: "hidden", marginTop: 16 }}
            >
              <div style={{ marginBottom: 16 }}>
                <StandardLabel
                  icon={Clock}
                  label="Custom Hours Notice"
                  help="Hours before start required."
                />
                <div style={{ display: "flex", gap: "12px" }}>
                  <FormItemAntd
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
                  </FormItemAntd>
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
    </div>
  );
};

// --- MAIN COMPONENT ---

const ClassOptionsStep = ({ onValidatedNext }) => {
  const [form] = Form.useForm();
  const { state, updateOptions, debouncedUpdateOptions, isLoaded } = useClass();
  const [activeTier, setActiveTier] = useState(0);
  const isFormInitialized = useRef(false);

  // Initialize Form
  useEffect(() => {
    if (isLoaded && !isFormInitialized.current) {
      const contextOptions = state.options || [];

      const mappedOptions =
        contextOptions.length > 0
          ? contextOptions.map((opt, index) => ({
              ...opt,
              schedule_mode:
                index === 0 ? "primary" : opt.schedule_mode || "synced",
              title:
                opt.title || (index === 0 ? "General Admission" : "Option"),
              description: opt.description || "",
              equipment: opt.equipment || [],
              tags: opt.tags || [],
              // Force update these to ensure consistency
              booking_type: "Single Session",
              price_type: "per_session",
            }))
          : [
              {
                title: "General Admission",
                schedule_mode: "primary",
                booking_type: "Single Session",
                price_type: "per_session",
                cancellationPolicy: "flexible",
                cancellationRefundPercentage: 100,
                level: "all",
                equipment: [],
                tags: [],
              },
            ];

      form.setFieldsValue({
        booking_type: "Single Session", // Hidden field backup
        options: mappedOptions,
      });

      isFormInitialized.current = true;
    }
  }, [isLoaded, state.options, form]);

  // Handler for form changes
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
      });
    }

    const formattedOptions = allValues.options.map((opt) => ({
      ...opt,
      booking_type: "Single Session",
      price_type: "per_session",
    }));

    debouncedUpdateOptions(formattedOptions);
  };

  // Callback specifically for the FeatureBuilder to force context update
  const handleManualFeatureUpdate = (newOptions) => {
    if (!isFormInitialized.current) return;

    const formattedOptions = newOptions.map((opt) => ({
      ...opt,
      booking_type: "Single Session",
      price_type: "per_session",
    }));

    debouncedUpdateOptions(formattedOptions);
  };

  const handleFinish = (values) => {
    const formattedOptions = values.options.map((opt) => ({
      ...opt,
      booking_type: "Single Session",
      price_type: "per_session",
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
      booking_type: "Single Session",
      price_type: "per_session",
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
        id="step-2-form"
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        onValuesChange={handleValuesChange}
        preserve={true}
      >
        {/* Hidden field to maintain form structure if needed by other components */}
        <Form.Item name="booking_type" hidden initialValue="Single Session">
          <Input />
        </Form.Item>

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
                              <TierInternalTabs
                                defaultActiveKey="basics"
                                renderTabBar={(props, DefaultTabBar) => (
                                  <DefaultTabBar {...props} />
                                )}
                                items={[
                                  {
                                    key: "basics",
                                    label: "Basics",
                                    children: (
                                      <SmoothHeight>
                                        <TierBasicsTab
                                          field={field}
                                          isPrimary={isPrimary}
                                          form={form}
                                          onUpdate={handleManualFeatureUpdate}
                                        />
                                      </SmoothHeight>
                                    ),
                                  },
                                  {
                                    key: "details",
                                    label: "Details",
                                    children: (
                                      <SmoothHeight>
                                        <TierDetailsTab
                                          field={field}
                                          form={form}
                                        />
                                      </SmoothHeight>
                                    ),
                                  },
                                  {
                                    key: "policies",
                                    label: "Policies",
                                    children: (
                                      <SmoothHeight>
                                        <TierPoliciesTab
                                          field={field}
                                          form={form}
                                        />
                                      </SmoothHeight>
                                    ),
                                  },
                                ]}
                              />
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

export default ClassOptionsStep;
