import React, { useState } from "react";
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
} from "lucide-react";
import Image from "next/image";
import { Input } from "antd";
import dayjs from "dayjs";
import Giftcard3DScene from "./Giftcard3DScene";
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
  grid-template-columns: 1fr 400px; /* Standard Config Layout */
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
  background: #f9f9f9;
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
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
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
  border: 3px solid
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
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${CORPORATE_COLOR};
  }
`;

const CustomAmountInput = styled.div`
  position: relative;
  max-width: 160px;
  .ant-input {
    border-radius: 30px;
    padding-left: 24px;
    height: 45px;
    font-weight: 600;
  }
  span {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    font-weight: 600;
    color: #000;
  }
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
  background: #f9f9f9;
  border-radius: 16px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
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
  span {
    font-weight: 600;
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
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  z-index: 100;
  border-top: 1px solid #f0f0f0;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 900px) {
    display: flex;
  }
`;

// --- MINI CALENDAR (LOCAL) ---
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
          style={{
            border: "1px solid #eee",
            borderRadius: "50%",
            width: 32,
            height: 32,
            cursor: "pointer",
            background: "white",
          }}
          onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))}
        >
          <ChevronLeft size={16} />
        </button>
        <h4 style={{ margin: 0 }}>{currentMonth.format("MMMM YYYY")}</h4>
        <button
          style={{
            border: "1px solid #eee",
            borderRadius: "50%",
            width: 32,
            height: 32,
            cursor: "pointer",
            background: "white",
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
              key={idx}
              disabled={isPast}
              $selected={isSelected}
              onClick={() => !isPast && handleDayClick(day)}
            >
              {day}
            </CalDayBtn>
          );
        })}
      </CalGrid>
    </CalContainer>
  );
}

// --- MAIN COMPONENT ---

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
  const finalAmount = amount || (customAmount ? parseFloat(customAmount) : 0);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <ConfigGrid>
      <MobileVisualHeader>
        <Giftcard3DScene textureUrl={cardImages[selectedDesignIndex]} />
      </MobileVisualHeader>

      <LeftColumn>
        {/* DESIGN */}
        <SectionBlock>
          <SectionHeader>
            <Gift size={22} color={CORPORATE_COLOR} /> Select a design
          </SectionHeader>
          <DesignGrid>
            {cardImages.map((img, idx) => (
              <DesignOption
                key={idx}
                $selected={selectedDesignIndex === idx}
                onClick={() => setSelectedDesignIndex(idx)}
              >
                <Image src={img} alt={`Card ${idx}`} width={200} height={126} />
                {selectedDesignIndex === idx && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      background: "#000",
                      borderRadius: "50%",
                      padding: 2,
                    }}
                  >
                    <Check size={14} color="white" />
                  </div>
                )}
              </DesignOption>
            ))}
          </DesignGrid>
        </SectionBlock>

        {/* AMOUNT */}
        <SectionBlock>
          <SectionHeader>
            <CreditCard size={22} color={CORPORATE_COLOR} /> Choose amount
          </SectionHeader>
          <AmountGrid>
            {PRESET_AMOUNTS.map((val) => (
              <AmountChip
                key={val}
                $selected={amount === val}
                onClick={() => {
                  setAmount(val);
                  setCustomAmount("");
                }}
              >
                ${val}
              </AmountChip>
            ))}
            <CustomAmountInput>
              <span>$</span>
              <Input
                type="number"
                placeholder="Other"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setAmount(null);
                }}
              />
            </CustomAmountInput>
          </AmountGrid>
        </SectionBlock>

        {/* DETAILS */}
        <SectionBlock>
          <SectionHeader>
            <Mail size={22} color={CORPORATE_COLOR} /> How would you like to
            send it?
          </SectionHeader>
          <DeliveryToggle>
            <ToggleOption
              $selected={deliveryMethod === "email"}
              onClick={() => setDeliveryMethod("email")}
            >
              <Mail
                size={20}
                color={deliveryMethod === "email" ? CORPORATE_COLOR : "#444"}
              />
              <div>
                <h4>Email to recipient</h4>
                <p>We'll send it directly.</p>
              </div>
            </ToggleOption>
            <ToggleOption
              $selected={deliveryMethod === "self"}
              onClick={() => setDeliveryMethod("self")}
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
                style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
              >
                Recipient Name
              </label>
              <Input
                size="large"
                value={formData.recipientName}
                onChange={(e) =>
                  handleInputChange("recipientName", e.target.value)
                }
              />
            </div>
            {deliveryMethod === "email" && (
              <div>
                <label
                  style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
                >
                  Recipient Email
                </label>
                <Input
                  size="large"
                  type="email"
                  value={formData.recipientEmail}
                  onChange={(e) =>
                    handleInputChange("recipientEmail", e.target.value)
                  }
                />
              </div>
            )}
          </div>
          <div style={{ marginBottom: 20 }}>
            <label
              style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
            >
              Your Name
            </label>
            <Input
              size="large"
              value={formData.senderName}
              onChange={(e) => handleInputChange("senderName", e.target.value)}
            />
          </div>
          <div>
            <label
              style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
            >
              Message (Optional)
            </label>
            <Input.TextArea
              rows={4}
              value={formData.message}
              onChange={(e) => handleInputChange("message", e.target.value)}
            />
          </div>
        </SectionBlock>

        {/* SCHEDULING */}
        <SectionBlock>
          <SectionHeader>
            <Clock size={22} color={CORPORATE_COLOR} /> When should we send it?
          </SectionHeader>
          <DeliveryToggle style={{ marginBottom: 10 }}>
            <ToggleOption
              $selected={!isScheduled}
              onClick={() => setIsScheduled(false)}
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
              $selected={isScheduled}
              onClick={() => setIsScheduled(true)}
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
                  <SimpleCalendar
                    value={formData.date}
                    onChange={(val) => handleInputChange("date", val)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </SectionBlock>
      </LeftColumn>

      <RightColumn>
        <StickyCard>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "1.2rem" }}>Preview</h3>
          <CanvasContainer>
            <Giftcard3DScene textureUrl={cardImages[selectedDesignIndex]} />
          </CanvasContainer>
          <div>
            <SummaryRow>
              <span>Gift Card Value</span>
              <span>${finalAmount > 0 ? finalAmount.toFixed(2) : "0.00"}</span>
            </SummaryRow>
            <SummaryRow>
              <span>Delivery</span>
              <span style={{ color: "#008a05", fontWeight: 600 }}>Free</span>
            </SummaryRow>
            <SummaryRow className="total">
              <span>Total</span>
              <span>${finalAmount > 0 ? finalAmount.toFixed(2) : "0.00"}</span>
            </SummaryRow>
          </div>
          <ActionButton whileTap={{ scale: 0.98 }} onClick={onNext}>
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
          onClick={onNext}
        >
          Checkout
        </ActionButton>
      </MobileStickyFooter>
    </ConfigGrid>
  );
}
