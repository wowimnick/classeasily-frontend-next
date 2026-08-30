import React, { useState, useEffect, Suspense } from "react";
import styled, { css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Mail,
  User,
  Gift,
  Check,
  Clock,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { ConfigProvider, Input, Form } from "antd";
import dayjs from "dayjs";
import Giftcard3DScene from "./Giftcard3DScene";
import { theme } from "@/components/theme";
import {
  CORPORATE_COLOR,
  SectionHeader,
  SectionBlock,
  StickyCard,
  ActionButton,
} from "./GiftcardStyles";

// --- PRESETS ---
const PRESET_AMOUNTS = [25, 50, 100, 150, 200];

// --- LOCAL STYLED COMPONENTS ---

const ConfigGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 80px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr 350px;
    gap: 40px;
  }

  @media (max-width: 900px) {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
`;

const LeftColumn = styled.div`
  width: 100%;
  @media (max-width: 900px) {
    order: 2;
  }
`;

const RightColumn = styled.div`
  position: sticky;
  top: 120px;
  align-self: start;
  height: fit-content;

  @media (max-width: 900px) {
    display: none;
  }
`;

const MobileVisualHeader = styled.div`
  display: none;
  width: 100%;
  height: 280px;
  background: #fff;
  border-radius: 16px;
  margin-bottom: 32px;
  overflow: hidden;
  order: 1;

  @media (max-width: 900px) {
    display: block;
  }
`;

const DesignGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 16px;
  @media (max-width: 600px) {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
`;

const DesignOption = styled.button`
  position: relative;
  aspect-ratio: 1.58/1;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid
    ${(props) => (props.$selected ? CORPORATE_COLOR : "transparent")};
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  background: #f0f0f0;

  &:hover {
    transform: scale(1.02);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const CheckCircle = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
`;

const AmountGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
`;

const AmountChip = styled.button`
  padding: 12px 24px;
  border-radius: 30px;
  border: 1px solid ${(props) => (props.$selected ? CORPORATE_COLOR : "#ddd")};
  background: ${(props) => (props.$selected ? CORPORATE_COLOR : "white")};
  color: ${(props) => (props.$selected ? "white" : "#000")};
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 80px;

  &:hover {
    border-color: ${CORPORATE_COLOR};
  }
`;

// New styles for the redesign
const CustomInputWrapper = styled(motion.div)`
  width: 100%;
  margin-top: 8px;
  overflow: hidden;
`;

const CustomInputContainer = styled.div`
  position: relative;
  max-width: 150px;
`;

const DeliveryToggle = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 12px;
  }
`;

const ToggleOption = styled.button`
  flex: 1;
  padding: 16px;
  border: 1px solid ${(props) => (props.$selected ? CORPORATE_COLOR : "#eee")};
  border-radius: 12px;
  background: ${(props) => (props.$selected ? "#fff5f7" : "white")};
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;

  &:hover {
    border-color: ${CORPORATE_COLOR};
  }

  h4 {
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0;
    color: ${(props) => (props.$selected ? CORPORATE_COLOR : "#000")};
  }
  p {
    font-size: 0.8rem;
    color: #666;
    margin: 4px 0 0 0;
  }
`;

const CanvasContainer = styled.div`
  width: 100%;
  height: 250px;
  background: #fff;
  border-radius: 16px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CanvasFallback = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #888;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 0.95rem;
  color: #000;
  &.total {
    margin-top: 12px;
    padding-top: 16px;
    border-top: 1px solid #eee;
    font-weight: 700;
    font-size: 1.125rem;
    color: #000;
  }
`;

const MobileStickyFooter = styled.div`
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: white;
  padding: 16px 24px;
  z-index: 100;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.05);

  @media (max-width: 900px) {
    display: flex;
  }
`;

const ResponsiveSectionHeader = styled(SectionHeader)`
  transition: font-size 0.2s ease;
  font-size: 1.25rem;

  @media (max-width: 1024px) {
    font-size: 1.15rem;
  }

  @media (max-width: 768px) {
    font-size: 1.05rem;
  }

  @media (max-width: 480px) {
    font-size: 0.95rem;
  }
`;

// --- MINI CALENDAR ---
const CalContainer = styled.div`
  width: 100%;
  max-width: 320px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  padding: 20px;
  user-select: none;
`;
const CalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
`;
const CalDayBtn = styled.button`
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 50%;
  font-size: 0.9rem;
  font-weight: 500;
  color: #000;
  cursor: pointer;

  ${(props) =>
    props.$selected &&
    css`
      background: ${CORPORATE_COLOR};
      color: white;
      font-weight: 600;
    `}
  ${(props) =>
    props.disabled &&
    css`
      color: #ccc;
      cursor: not-allowed;
      text-decoration: line-through;
    `}
`;

function SimpleCalendar({ value, onChange }) {
  const [currentMonth, setCurrentMonth] = useState(dayjs(value || undefined));
  const today = dayjs();
  const selectedDate = value ? dayjs(value) : null;
  const startOfMonth = currentMonth.startOf("month");
  const daysInMonth = currentMonth.daysInMonth();
  const startDayOfWeek = startOfMonth.day();

  const handleDayClick = (day) => onChange(currentMonth.date(day));

  let days = [];
  for (let i = 0; i < startDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <CalContainer>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          aria-label="Previous Month"
          style={{
            border: "1px solid #eee",
            borderRadius: "50%",
            width: 32,
            height: 32,
            cursor: "pointer",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))}
        >
          <ChevronLeft size={16} />
        </button>
        <h4 style={{ margin: 0 }}>{currentMonth.format("MMMM YYYY")}</h4>
        <button
          type="button"
          aria-label="Next Month"
          style={{
            border: "1px solid #eee",
            borderRadius: "50%",
            width: 32,
            height: 32,
            cursor: "pointer",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <CalGrid>
        {days.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const date = currentMonth.date(day);
          const isPast = date.isBefore(today, "day");
          const isSelected = selectedDate && date.isSame(selectedDate, "day");
          return (
            <CalDayBtn
              type="button"
              key={idx}
              disabled={isPast}
              $selected={isSelected}
              onClick={() => !isPast && handleDayClick(day)}
              aria-label={`Select ${date.format("MMMM D, YYYY")}`}
              aria-pressed={isSelected}
            >
              {day}
            </CalDayBtn>
          );
        })}
      </CalGrid>
    </CalContainer>
  );
}

export default function GiftcardConfigStep({
  cardImages,
  selectedDesignIndex,
  setSelectedDesignIndex,
  amount,
  setAmount,
  customAmount,
  setCustomAmount,
  formData,
  setFormData,
  deliveryMethod,
  setDeliveryMethod,
  isScheduled,
  setIsScheduled,
  onNext,
}) {
  const [form] = Form.useForm();
  const finalAmount = amount || (customAmount ? parseFloat(customAmount) : 0);

  // 1. Initialize form from parent state when component mounts (e.g. Back from payment)
  useEffect(() => {
    form.setFieldsValue({
      ...formData,
      customAmount: customAmount,
    });
  }, [form, formData, customAmount]);

  // 2. Ensure field values are correct when switching modes
  useEffect(() => {
    if (amount === null) {
      form.setFieldsValue({ customAmount });
    }
  }, [amount, customAmount, form]);

  useEffect(() => {
    if (isScheduled) {
      form.setFieldsValue({ date: formData.date });
    }
  }, [isScheduled, formData.date, form]);

  // 3. Sync changes from Form back to parent state
  const handleValuesChange = (changedValues) => {
    // Handle customAmount
    if ("customAmount" in changedValues) {
      setCustomAmount(changedValues.customAmount);
    }

    // Handle standard form fields
    const formFields = [
      "recipientName",
      "recipientEmail",
      "senderName",
      "senderEmail",
      "message",
      "date",
    ];

    const updates = {};
    let hasUpdates = false;

    formFields.forEach((field) => {
      if (field in changedValues) {
        updates[field] = changedValues[field];
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      setFormData((prev) => ({ ...prev, ...updates }));
    }
  };

  const handleNext = async () => {
    try {
      await form.validateFields();
      onNext();
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  return (
    <ConfigProvider theme={theme}>
      <Form
        form={form}
        component={false}
        onValuesChange={handleValuesChange} // Bind sync handler
      >
        <ConfigGrid>
          <MobileVisualHeader>
            <Suspense
              fallback={
                <CanvasFallback>
                  <Loader2 className="animate-spin" />
                </CanvasFallback>
              }
            >
              <Giftcard3DScene textureUrl={cardImages[selectedDesignIndex]} />
            </Suspense>
          </MobileVisualHeader>

          <LeftColumn>
            {/* DESIGN */}
            <SectionBlock>
              <ResponsiveSectionHeader>
                <Gift size={22} color={CORPORATE_COLOR} /> Select a design
              </ResponsiveSectionHeader>
              <DesignGrid>
                {cardImages.map((img, idx) => (
                  <DesignOption
                    type="button"
                    key={idx}
                    $selected={selectedDesignIndex === idx}
                    onClick={() => setSelectedDesignIndex(idx)}
                    aria-label={`Select design ${idx + 1}`}
                    aria-pressed={selectedDesignIndex === idx}
                  >
                    <Image
                      src={img}
                      alt={`Card Design ${idx + 1}`}
                      width={200}
                      height={126}
                    />
                    {selectedDesignIndex === idx && (
                      <CheckCircle>
                        <Check size={14} color="white" />
                      </CheckCircle>
                    )}
                  </DesignOption>
                ))}
              </DesignGrid>
            </SectionBlock>

            {/* AMOUNT */}
            <SectionBlock>
              <ResponsiveSectionHeader>
                <CreditCard size={22} color={CORPORATE_COLOR} /> Choose amount
              </ResponsiveSectionHeader>
              <AmountGrid>
                {PRESET_AMOUNTS.map((val) => (
                  <AmountChip
                    type="button"
                    key={val}
                    $selected={amount === val}
                    onClick={() => {
                      setAmount(val);
                      setCustomAmount(""); // Clear custom amount if preset chosen
                    }}
                    aria-pressed={amount === val}
                  >
                    ${val}
                  </AmountChip>
                ))}
                {/* Custom Chip */}
                <AmountChip
                  type="button"
                  $selected={amount === null}
                  onClick={() => setAmount(null)}
                  aria-pressed={amount === null}
                >
                  Custom
                </AmountChip>
              </AmountGrid>

              {/* Custom Input Animation */}
              <AnimatePresence>
                {amount === null && (
                  <CustomInputWrapper
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CustomInputContainer>
                      <Form.Item
                        name="customAmount"
                        rules={[
                          {
                            required: true,
                            message: "Please enter an amount",
                          },
                        ]}
                        style={{ margin: 0 }}
                      >
                        <Input
                          prefix="$"
                          type="number"
                          placeholder="0.00"
                          size="middle"
                          autoFocus
                          aria-label="Custom Amount"
                        />
                      </Form.Item>
                    </CustomInputContainer>
                  </CustomInputWrapper>
                )}
              </AnimatePresence>
            </SectionBlock>

            {/* DETAILS */}
            <SectionBlock>
              <ResponsiveSectionHeader>
                <Mail size={22} color={CORPORATE_COLOR} /> How would you like to
                send it?
              </ResponsiveSectionHeader>
              <DeliveryToggle>
                <ToggleOption
                  type="button"
                  $selected={deliveryMethod === "email"}
                  onClick={() => setDeliveryMethod("email")}
                  aria-pressed={deliveryMethod === "email"}
                >
                  <Mail
                    size={20}
                    color={
                      deliveryMethod === "email" ? CORPORATE_COLOR : "#444"
                    }
                  />
                  <div>
                    <h4>Email to recipient</h4>
                    <p>We'll send it directly.</p>
                  </div>
                </ToggleOption>
                <ToggleOption
                  type="button"
                  $selected={deliveryMethod === "self"}
                  onClick={() => setDeliveryMethod("self")}
                  aria-pressed={deliveryMethod === "self"}
                >
                  <User
                    size={20}
                    color={deliveryMethod === "self" ? CORPORATE_COLOR : "#444"}
                  />
                  <div>
                    <h4>Email to me</h4>
                    <p>Print or forward later.</p>
                  </div>
                </ToggleOption>
              </DeliveryToggle>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 20,
                  marginBottom: 20,
                }}
              >
                <div>
                  <label
                    htmlFor="recipientName"
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontWeight: 600,
                      fontSize: "13px",
                    }}
                  >
                    Recipient Name
                  </label>
                  <Form.Item
                    name="recipientName"
                    rules={[
                      {
                        required: true,
                        message: "Recipient name is required",
                      },
                    ]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input
                      id="recipientName"
                      size="middle"
                      placeholder="e.g. John Doe"
                    />
                  </Form.Item>
                </div>
                {deliveryMethod === "email" && (
                  <div>
                    <label
                      htmlFor="recipientEmail"
                      style={{
                        display: "block",
                        marginBottom: 8,
                        fontWeight: 600,
                        fontSize: "13px",
                      }}
                    >
                      Recipient Email
                    </label>
                    <Form.Item
                      name="recipientEmail"
                      rules={[
                        {
                          required: true,
                          type: "email",
                          message: "Valid email is required",
                        },
                      ]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input
                        id="recipientEmail"
                        size="middle"
                        type="email"
                        placeholder="e.g. john@example.com"
                      />
                    </Form.Item>
                  </div>
                )}
                {deliveryMethod === "self" && (
                  <div>
                    <label
                      htmlFor="senderEmail"
                      style={{
                        display: "block",
                        marginBottom: 8,
                        fontWeight: 600,
                        fontSize: "13px",
                      }}
                    >
                      Your Email
                    </label>
                    <Form.Item
                      name="senderEmail"
                      rules={[
                        {
                          required: true,
                          type: "email",
                          message: "Your email is required to send the card to you",
                        },
                      ]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input
                        id="senderEmail"
                        size="middle"
                        type="email"
                        placeholder="e.g. you@example.com"
                      />
                    </Form.Item>
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 20 }}>
                <label
                  htmlFor="senderName"
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  Your Name
                </label>
                <Form.Item
                  name="senderName"
                  rules={[
                    {
                      required: true,
                      message: "Sender name is required",
                    },
                  ]}
                  style={{ marginBottom: 0 }}
                >
                  <Input
                    id="senderName"
                    size="middle"
                    placeholder="e.g. Jane Smith"
                  />
                </Form.Item>
              </div>
              <div>
                <label
                  htmlFor="message"
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                >
                  Message (Optional)
                </label>
                <Form.Item name="message" style={{ marginBottom: 0 }}>
                  <Input.TextArea
                    id="message"
                    rows={4}
                    placeholder="Write a personal note..."
                  />
                </Form.Item>
              </div>
            </SectionBlock>

            {/* SCHEDULING */}
            <SectionBlock>
              <ResponsiveSectionHeader>
                <Clock size={22} color={CORPORATE_COLOR} /> When should we send
                it?
              </ResponsiveSectionHeader>
              <DeliveryToggle style={{ marginBottom: 10 }}>
                <ToggleOption
                  type="button"
                  $selected={!isScheduled}
                  onClick={() => setIsScheduled(false)}
                  aria-pressed={!isScheduled}
                >
                  <Clock
                    size={20}
                    color={!isScheduled ? CORPORATE_COLOR : "#444"}
                  />
                  <div>
                    <h4>Send Instantly</h4>
                    <p>As soon as you pay.</p>
                  </div>
                </ToggleOption>
                <ToggleOption
                  type="button"
                  $selected={isScheduled}
                  onClick={() => setIsScheduled(true)}
                  aria-pressed={isScheduled}
                >
                  <CalendarIcon
                    size={20}
                    color={isScheduled ? CORPORATE_COLOR : "#444"}
                  />
                  <div>
                    <h4>Schedule for Later</h4>
                    <p>Choose a specific date.</p>
                  </div>
                </ToggleOption>
              </DeliveryToggle>

              <AnimatePresence>
                {isScheduled && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ marginTop: 24 }}>
                      <Form.Item
                        name="date"
                        rules={[
                          {
                            required: true,
                            message: "Please select a date",
                          },
                        ]}
                      >
                        <SimpleCalendar
                        // Form.Item injects value and onChange here automatically
                        />
                      </Form.Item>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </SectionBlock>
          </LeftColumn>

          <RightColumn>
            <StickyCard>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "1.2rem" }}>
                Preview
              </h3>
              <CanvasContainer>
                <Suspense
                  fallback={
                    <CanvasFallback>
                      <Loader2 className="animate-spin" />
                    </CanvasFallback>
                  }
                >
                  <Giftcard3DScene
                    textureUrl={cardImages[selectedDesignIndex]}
                  />
                </Suspense>
              </CanvasContainer>
              <div>
                <SummaryRow>
                  <span>Gift Card Value</span>
                  <span>
                    ${finalAmount > 0 ? finalAmount.toFixed(2) : "0.00"}
                  </span>
                </SummaryRow>
                <SummaryRow>
                  <span>Delivery</span>
                  <span style={{ color: "#008a05", fontWeight: 600 }}>
                    Free
                  </span>
                </SummaryRow>
                <SummaryRow className="total">
                  <span>Total</span>
                  <span>
                    ${finalAmount > 0 ? finalAmount.toFixed(2) : "0.00"}
                  </span>
                </SummaryRow>
              </div>
              <ActionButton whileTap={{ scale: 0.98 }} onClick={handleNext}>
                Checkout
              </ActionButton>
              <div
                style={{
                  textAlign: "center",
                  marginTop: 16,
                  fontSize: "0.8rem",
                  color: "#888",
                }}
              >
                Secure SSL Encrypted Payment
              </div>
            </StickyCard>
          </RightColumn>

          <MobileStickyFooter>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.8rem", color: "#666" }}>Total</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                ${finalAmount > 0 ? finalAmount.toFixed(2) : "0.00"}
              </span>
            </div>
            <ActionButton
              style={{ width: "auto", marginTop: 0 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
            >
              Checkout
            </ActionButton>
          </MobileStickyFooter>
        </ConfigGrid>
      </Form>
    </ConfigProvider>
  );
}
