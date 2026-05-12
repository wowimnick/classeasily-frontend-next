"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Alert, Button, ConfigProvider, Form, Input, InputNumber, Select } from "antd";
import styled from "styled-components";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, ChevronDown, MapPin, Clock, Users, Building2, Tag, ListChecks } from "lucide-react";
import { getDurationText } from "@/app/classes/_components/steps/utils.jsx";
import { theme as appTheme } from "@/components/theme";
import { formatMoney } from "./formatMoney";

/* ─── Page shell (matches ClassCheckoutClient PageWrapper + MainContainer) ─── */

const PageBleed = styled.div`
  width: 100vw;
  margin-left: calc(50% - 50vw);
  box-sizing: border-box;
  background: rgb(252, 252, 252);
  padding: 24px max(16px, env(safe-area-inset-left, 0px)) 32px
    max(16px, env(safe-area-inset-right, 0px));

  @media (max-width: 1023px) {
    padding: 0 0 calc(120px + env(safe-area-inset-bottom, 0px));
  }
`;

const Inner = styled.div`
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;

  @media (max-width: 1023px) {
    padding: 0;
  }
`;

/* ─── ReviewAndPaymentStep StepContainer / columns ─── */

const StepContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  position: relative;

  @media (min-width: 1024px) {
    grid-template-columns: minmax(0, 1.2fr) 400px;
    gap: 40px;
    align-items: flex-start;
  }
`;

const LeftColumnWrap = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;

  @media (max-width: 1023px) {
    .ant-input,
    .ant-input-affix-wrapper input,
    .ant-input-number-input {
      font-size: 16px !important;
    }
  }
`;

const PaymentSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const SummarySection = styled.div`
  display: none;
  @media (min-width: 1024px) {
    display: block;
    position: sticky;
    top: 100px;
  }
`;

/* ─── Mobile collapsible summary (ReviewAndPaymentStep) ─── */

const MobileSummaryContainer = styled.div`
  display: block;
  background: white;
  border-radius: 0;
  overflow: hidden;
  margin-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;

  @media (min-width: 1024px) {
    display: none;
  }
`;

const MobileSummaryHeader = styled.button`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 16px 20px;
  cursor: pointer;
  background: white;
  transition: background-color 0.2s;
  border: none;
  font-family: inherit;
  text-align: left;

  &:active {
    background-color: #f9fafb;
  }

  .title-group {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 600;
    color: #111827;

    svg {
      color: #ff385c;
    }
  }

  .price-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .total-price {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
  }

  .toggle-icon {
    color: #9ca3af;
    transition: transform 0.3s ease;
  }
`;

const MobileSummaryMotion = styled(motion.div)`
  background: #fff;
  overflow: hidden;
`;

const MobileSummaryInner = styled.div`
  border-top: 1px solid #e5e7eb;
  padding: 12px 12px 16px;
`;

/* ─── Desktop summary card (ReviewAndPaymentStep DesktopSummary*) ─── */

const DesktopSummaryCard = styled.div`
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 18px 20px;
  box-sizing: border-box;
`;

const DesktopSummaryTop = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const DesktopSummaryThumb = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f0f0f0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const DesktopSummaryTitleWrap = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DesktopSummaryTitle = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #111111;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const DesktopSummaryMeta = styled.div`
  font-size: 13px;
  font-weight: 400;
  color: #717171;
  line-height: 1.35;
`;

const DesktopSummaryDivider = styled.div`
  height: 1px;
  background: #ebebeb;
  margin: 16px 0;
`;

const DesktopSummarySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DesktopSummaryLabel = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #111111;
  line-height: 1.25;
`;

const DesktopSummaryValue = styled.div`
  font-size: 13px;
  font-weight: 400;
  color: ${(p) => (p.$muted ? "#717171" : "#111111")};
  line-height: 1.4;
`;

const DesktopPriceHeader = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #111111;
`;

const DesktopPriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
`;

const DesktopPriceText = styled.div`
  font-size: 13px;
  font-weight: 400;
  color: #111111;
`;

const DesktopTotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const DesktopTotalLabel = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #111111;

  .currency-code {
    text-decoration: underline;
    text-underline-offset: 2px;
    font-weight: 700;
  }
`;

const DesktopTotalAmount = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #111111;
`;

const DesktopInlineFooter = styled.div`
  display: none;
  @media (min-width: 1024px) {
    display: block;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #e5e7eb;
  }
`;

/* ─── Section cards + field rows (checkout guest/payment sections) ─── */

const SectionCard = styled.div`
  background: white;
  border-radius: 16px;
  border: none;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  @media (max-width: 1023px) {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    margin-bottom: 24px;
  }
`;

const SectionHeader = styled.div`
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-bottom: 1px solid #ebebeb;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #111827;
  }

  @media (max-width: 1023px) {
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;

    h3 {
      color: #222222;
    }
  }
`;

const SectionContentInner = styled.div`
  padding: 16px 20px 20px;
  border-top: none;

  @media (max-width: 1023px) {
    padding: 0;
    border-top: none;
  }
`;

const CheckoutFieldRow = styled.div`
  @media (min-width: 1024px) {
    padding: 14px 0;
    margin-bottom: 0;
    border-bottom: 1px solid #ebebeb;

    &:last-of-type {
      border-bottom: none;
      padding-bottom: 0;
    }

    &:first-of-type {
      padding-top: 0;
    }
  }

  @media (max-width: 1023px) {
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 0;

    &:last-of-type {
      border-bottom: none;
    }
  }
`;

const FieldLabel = styled.span`
  font-weight: 600;
  font-size: 0.8125rem;
  color: #111827;

  @media (max-width: 1023px) {
    font-size: 15px;
    color: #222222;
  }
`;

const SummaryDataRow = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;

  .label {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .value {
    font-size: 15px;
    color: #111827;
    font-weight: 500;
    line-height: 1.45;
  }

  @media (max-width: 1023px) {
    margin-bottom: 0;
    padding: 16px 12px;
    border-bottom: 1px solid #e5e7eb;

    .label {
      font-size: 15px;
      font-weight: 600;
      color: #222222;
    }

    .value {
      font-size: 14px;
      color: #717171;
      line-height: 1.4;
    }

    &:last-child {
      border-bottom: none;
    }
  }
`;

const InclusionList = styled.ul`
  margin: 4px 0 0;
  padding-left: 1.15rem;
  color: #111827;
  font-size: 14px;
  line-height: 1.45;
  font-weight: 500;

  li + li {
    margin-top: 4px;
  }
`;

const NextButton = styled(Button)`
  height: 48px;
  min-width: 140px;
  font-size: 16px;
  font-weight: 600;
  background: #ff385c;
  border-color: #ff385c;
  border-radius: 8px;

  &:hover {
    background: #e31c5f !important;
    border-color: #e31c5f !important;
    opacity: 1 !important;
  }

  @media (max-width: 1023px) {
    width: 100%;
    min-width: unset;
    height: 52px;
    background: #222222;
    border-color: #222222;

    &:hover {
      background: #333 !important;
      border-color: #333 !important;
    }
  }
`;

const MobileStickyFooter = styled(motion.footer)`
  display: none;

  @media (max-width: 1023px) {
    display: block;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(8px) saturate(180%);
    -webkit-backdrop-filter: blur(8px) saturate(180%);
    border-top: 1px solid rgba(255, 255, 255, 0.125);
    box-shadow: 0 -8px 32px 0 rgba(31, 38, 135, 0.08);
    padding: 16px 24px;
    padding-bottom: max(16px, env(safe-area-inset-bottom, 0px));
    z-index: 100;
  }
`;

const MobileFooterPrimary = styled(Button)`
  width: 100%;
  height: 52px;
  font-weight: 700;
  font-size: 1rem;
  border-radius: 8px;
  background: #222222 !important;
  border-color: #222222 !important;
  color: #fff !important;

  &:hover:not(:disabled) {
    background: #333333 !important;
    border-color: #333333 !important;
  }

  &:disabled {
    opacity: 0.65;
  }
`;

const FooterDueRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  color: #6b7280;

  strong {
    font-size: 16px;
    color: #111827;
  }
`;

const FooterNote = styled.p`
  margin: 0;
  padding: 12px max(20px, env(safe-area-inset-left)) 24px max(20px, env(safe-area-inset-right));
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.45;
  text-align: center;

  @media (min-width: 1024px) {
    display: none;
  }
`;

const COLLAPSE = { duration: 0.25, ease: [0.4, 0, 0.2, 1] };

function computeDeposit(totalCents, pct) {
  const t = Number(totalCents) || 0;
  const p = Math.min(100, Math.max(1, Number(pct) || 25));
  const d = Math.max(1, Math.round((t * p) / 100));
  return { deposit: d, balance: Math.max(0, t - d) };
}

function formatHeadcountRange(minHc, maxHc) {
  const lo = minHc != null && minHc !== "" ? Number(minHc) : null;
  const hi = maxHc != null && maxHc !== "" ? Number(maxHc) : null;
  const hasLo = lo != null && Number.isFinite(lo) && lo > 0;
  const hasHi = hi != null && Number.isFinite(hi) && hi > 0;
  if (hasLo && hasHi) return lo === hi ? `${lo} guests` : `${lo}–${hi} guests`;
  if (hasLo) return `${lo}+ guests`;
  if (hasHi) return `Up to ${hi} guests`;
  return "";
}

function formatSelectedDatetime(iso, dateChoices) {
  if (!iso) return "";
  const hit = dateChoices.find((d) => d.value === iso);
  if (hit?.label) return hit.label;
  return dayjs(iso).isValid() ? dayjs(iso).format("ddd, MMM D, YYYY h:mm A") : iso;
}

export default function ChooseFlow({
  option,
  depositPercent,
  currency,
  defaultEmail,
  defaultName,
  defaultCompany,
  onCancel,
  onSubmit,
  submitting,
}) {
  const [form] = Form.useForm();
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  const headcountWatch = Form.useWatch("headcount", form);
  const datetimeWatch = Form.useWatch("confirmed_datetime", form);

  const total = option?.price_total_cents || 0;
  const { deposit, balance } = computeDeposit(total, depositPercent);
  const cur = (currency || "usd").toUpperCase();

  const rawDates = option?.proposed_date_options || [];
  const dateChoices = rawDates.map((iso) => ({
    value: iso,
    label: dayjs(iso).isValid() ? dayjs(iso).format("ddd, MMM D, YYYY h:mm A") : iso,
  }));
  const hasDates = dateChoices.length > 0;

  const durationLabel = useMemo(() => {
    const m = option?.duration_minutes;
    if (m == null || m === "") return "";
    const n = Number(m);
    if (!Number.isFinite(n) || n <= 0) return "";
    return getDurationText(n);
  }, [option?.duration_minutes]);

  const headcountRangeLabel = formatHeadcountRange(option?.min_headcount, option?.max_headcount);
  const minHc =
    option?.min_headcount != null && option.min_headcount !== ""
      ? Number(option.min_headcount)
      : undefined;
  const maxHc =
    option?.max_headcount != null && option.max_headcount !== ""
      ? Number(option.max_headcount)
      : undefined;

  const locationLine =
    option?.location_label?.trim?.() || option?.location_text?.trim?.() || "";

  const pricePerPerson =
    option?.price_per_person_cents != null && Number(option.price_per_person_cents) > 0
      ? Number(option.price_per_person_cents)
      : null;

  const displayGuests =
    headcountWatch != null && headcountWatch !== ""
      ? Number(headcountWatch)
      : option?.min_headcount || 8;

  const dateDisplay = hasDates
    ? formatSelectedDatetime(datetimeWatch, dateChoices) || "Choose below"
    : "Your host will confirm timing";

  const inclusions = Array.isArray(option?.inclusions) ? option.inclusions.filter(Boolean) : [];

  useEffect(() => {
    if (rawDates.length === 1) {
      form.setFieldsValue({ confirmed_datetime: rawDates[0] });
    }
  }, [option?.id, rawDates, form]);

  const finish = async () => {
    const v = await form.validateFields();
    await onSubmit({
      option_id: option.id,
      headcount: v.headcount,
      confirmed_datetime: v.confirmed_datetime,
      special_requests: v.special_requests || "",
      billing_company_name: v.billing_company_name,
      billing_contact_name: v.billing_contact_name,
      billing_email: v.billing_email,
      po_number: v.po_number || "",
      billing_address: {},
    });
  };

  const renderPricingBlock = (compact) => (
    <>
      <DesktopSummaryDivider />
      <DesktopSummarySection>
        <DesktopPriceHeader>Price details</DesktopPriceHeader>
        <DesktopPriceRow>
          <DesktopPriceText>Total (estimate)</DesktopPriceText>
          <DesktopPriceText>{formatMoney(total, currency)}</DesktopPriceText>
        </DesktopPriceRow>
        <DesktopPriceRow>
          <DesktopPriceText>Balance after deposit</DesktopPriceText>
          <DesktopPriceText>{formatMoney(balance, currency)}</DesktopPriceText>
        </DesktopPriceRow>
      </DesktopSummarySection>
      <DesktopSummaryDivider />
      <DesktopTotalRow>
        <DesktopTotalLabel>
          Due today <span className="currency-code">{cur}</span>
        </DesktopTotalLabel>
        <DesktopTotalAmount>{formatMoney(deposit, currency)}</DesktopTotalAmount>
      </DesktopTotalRow>
      {compact ? (
        <p
          style={{
            margin: "12px 0 0",
            fontSize: 12,
            color: "#717171",
            lineHeight: 1.45,
            textAlign: "center",
          }}
        >
          Remainder invoiced before your event.
        </p>
      ) : null}
    </>
  );

  const summaryTop = (
    <DesktopSummaryTop>
      {option?.cover_image_url ? (
        <DesktopSummaryThumb>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={option.cover_image_url} alt="" />
        </DesktopSummaryThumb>
      ) : (
        <DesktopSummaryThumb />
      )}
      <DesktopSummaryTitleWrap>
        <DesktopSummaryTitle>{option?.title}</DesktopSummaryTitle>
        {option?.host_name ? <DesktopSummaryMeta>{option.host_name}</DesktopSummaryMeta> : null}
      </DesktopSummaryTitleWrap>
    </DesktopSummaryTop>
  );

  const policyLines = (
    <>
      <DesktopSummaryDivider />
      <DesktopSummarySection>
        <DesktopSummaryLabel>Deposit &amp; invoicing</DesktopSummaryLabel>
        <DesktopSummaryValue $muted>
          Pay {depositPercent}% today to reserve this date for your group. The remaining balance is
          invoiced before your event and typically follows your company&apos;s AP terms.
        </DesktopSummaryValue>
      </DesktopSummarySection>
      <DesktopSummaryDivider />
      <DesktopSummarySection>
        <DesktopSummaryLabel>Date</DesktopSummaryLabel>
        <DesktopSummaryValue>{dateDisplay}</DesktopSummaryValue>
      </DesktopSummarySection>
      <DesktopSummaryDivider />
      <DesktopSummarySection>
        <DesktopSummaryLabel>Guests</DesktopSummaryLabel>
        <DesktopSummaryValue>
          {Number.isFinite(displayGuests) ? displayGuests : "—"}{" "}
          {Number(displayGuests) === 1 ? "guest" : "guests"}
        </DesktopSummaryValue>
      </DesktopSummarySection>
    </>
  );

  return (
    <ConfigProvider theme={appTheme}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          preserve
          style={{ padding: 0 }}
          initialValues={{
            headcount: option?.min_headcount || 8,
            billing_email: defaultEmail || "",
            billing_contact_name: defaultName,
            billing_company_name: defaultCompany,
          }}
        >
          <PageBleed>
            <Inner>
              <StepContainer>
                <LeftColumnWrap>
                  <PaymentSection>
                    <MobileSummaryContainer>
                      <MobileSummaryHeader
                        type="button"
                        onClick={() => setShowMobileSummary((v) => !v)}
                        aria-expanded={showMobileSummary}
                      >
                        <span className="title-group">
                          <Ticket size={20} aria-hidden />
                          <span>Booking summary</span>
                        </span>
                        <span className="price-group">
                          <span className="total-price">{formatMoney(deposit, currency)}</span>
                          <ChevronDown
                            className="toggle-icon"
                            size={20}
                            style={{ transform: showMobileSummary ? "rotate(180deg)" : "none" }}
                            aria-hidden
                          />
                        </span>
                      </MobileSummaryHeader>
                      <AnimatePresence initial={false}>
                        {showMobileSummary && (
                          <MobileSummaryMotion
                            key="mobile-sum"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={COLLAPSE}
                            style={{ overflow: "hidden" }}
                          >
                            <MobileSummaryInner>
                              {summaryTop}
                              {policyLines}
                              {renderPricingBlock(true)}
                            </MobileSummaryInner>
                          </MobileSummaryMotion>
                        )}
                      </AnimatePresence>
                    </MobileSummaryContainer>

                    <SectionCard>
                      <SectionHeader>
                        <h3>Experience details</h3>
                      </SectionHeader>
                      <SectionContentInner>
                        {option?.host_name ? (
                          <SummaryDataRow>
                            <span className="label">
                              <Building2 size={14} aria-hidden />
                              Host
                            </span>
                            <span className="value">{option.host_name}</span>
                          </SummaryDataRow>
                        ) : null}
                        {locationLine ? (
                          <SummaryDataRow>
                            <span className="label">
                              <MapPin size={14} aria-hidden />
                              Location
                            </span>
                            <span className="value">{locationLine}</span>
                          </SummaryDataRow>
                        ) : null}
                        {durationLabel ? (
                          <SummaryDataRow>
                            <span className="label">
                              <Clock size={14} aria-hidden />
                              Duration
                            </span>
                            <span className="value">{durationLabel}</span>
                          </SummaryDataRow>
                        ) : null}
                        {headcountRangeLabel ? (
                          <SummaryDataRow>
                            <span className="label">
                              <Users size={14} aria-hidden />
                              Typical group size
                            </span>
                            <span className="value">{headcountRangeLabel}</span>
                          </SummaryDataRow>
                        ) : null}
                        {pricePerPerson != null ? (
                          <SummaryDataRow>
                            <span className="label">Price per person (estimate)</span>
                            <span className="value">{formatMoney(pricePerPerson, currency)}</span>
                          </SummaryDataRow>
                        ) : null}
                        {option?.tagline?.trim?.() ? (
                          <SummaryDataRow>
                            <span className="label">
                              <Tag size={14} aria-hidden />
                              Highlight
                            </span>
                            <span className="value">{option.tagline.trim()}</span>
                          </SummaryDataRow>
                        ) : null}
                        {option?.description?.trim?.() ? (
                          <SummaryDataRow>
                            <span className="label">About this experience</span>
                            <span className="value">{option.description.trim()}</span>
                          </SummaryDataRow>
                        ) : null}
                        {inclusions.length > 0 ? (
                          <SummaryDataRow>
                            <span className="label">
                              <ListChecks size={14} aria-hidden />
                              What&apos;s included
                            </span>
                            <span className="value">
                              <InclusionList>
                                {inclusions.map((line) => (
                                  <li key={line}>{line}</li>
                                ))}
                              </InclusionList>
                            </span>
                          </SummaryDataRow>
                        ) : null}
                        {option?.class_slug ? (
                          <SummaryDataRow>
                            <span className="label">Listing</span>
                            <span className="value">
                              <Link
                                href={`/classes/${option.class_slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontWeight: 600, color: "#111827", textDecoration: "underline" }}
                              >
                                View public class page
                              </Link>
                            </span>
                          </SummaryDataRow>
                        ) : null}
                      </SectionContentInner>
                    </SectionCard>

                    <SectionCard style={{ marginTop: 24 }}>
                      <SectionHeader>
                        <h3>Event details</h3>
                      </SectionHeader>
                      <SectionContentInner>
                        <CheckoutFieldRow>
                          <Form.Item
                            name="headcount"
                            label={<FieldLabel>Number of guests</FieldLabel>}
                            rules={[
                              { required: true, message: "Enter guest count" },
                              ...(minHc != null && Number.isFinite(minHc)
                                ? [{ type: "number", min: minHc, message: `At least ${minHc} guests` }]
                                : []),
                              ...(maxHc != null && Number.isFinite(maxHc)
                                ? [{ type: "number", max: maxHc, message: `At most ${maxHc} guests` }]
                                : []),
                            ]}
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber
                              min={minHc != null && Number.isFinite(minHc) ? minHc : 1}
                              max={maxHc != null && Number.isFinite(maxHc) ? maxHc : undefined}
                              style={{ width: "100%" }}
                              size="middle"
                            />
                          </Form.Item>
                        </CheckoutFieldRow>

                        {!hasDates ? (
                          <CheckoutFieldRow>
                            <Alert
                              type="warning"
                              showIcon
                              message="No proposed times yet"
                              description="Please contact your representative to confirm availability before completing this step."
                              style={{ borderRadius: 8 }}
                            />
                          </CheckoutFieldRow>
                        ) : (
                          <CheckoutFieldRow>
                            <Form.Item
                              name="confirmed_datetime"
                              label={<FieldLabel>Date &amp; time</FieldLabel>}
                              rules={[{ required: true, message: "Select a time" }]}
                              style={{ marginBottom: 0 }}
                            >
                              <Select options={dateChoices} placeholder="Choose a proposed time" size="middle" />
                            </Form.Item>
                          </CheckoutFieldRow>
                        )}

                        <CheckoutFieldRow>
                          <Form.Item
                            name="special_requests"
                            label={<FieldLabel>Notes for your host (optional)</FieldLabel>}
                            style={{ marginBottom: 0 }}
                          >
                            <Input.TextArea
                              rows={4}
                              placeholder="Accessibility, dietary needs, AV or room setup, parking, arrival window, surprises — anything logistics teams should know."
                              style={{ borderRadius: 8 }}
                            />
                          </Form.Item>
                        </CheckoutFieldRow>
                      </SectionContentInner>
                    </SectionCard>

                    <SectionCard style={{ marginTop: 24 }}>
                      <SectionHeader>
                        <h3>Billing</h3>
                      </SectionHeader>
                      <SectionContentInner>
                        <CheckoutFieldRow>
                          <Form.Item
                            name="billing_company_name"
                            label={<FieldLabel>Company / entity name</FieldLabel>}
                            rules={[{ required: true, message: "Required" }]}
                            style={{ marginBottom: 0 }}
                          >
                            <Input size="middle" placeholder="Legal or billing name" />
                          </Form.Item>
                        </CheckoutFieldRow>
                        <CheckoutFieldRow>
                          <Form.Item
                            name="billing_contact_name"
                            label={<FieldLabel>Billing contact</FieldLabel>}
                            rules={[{ required: true, message: "Required" }]}
                            style={{ marginBottom: 0 }}
                          >
                            <Input size="middle" placeholder="Full name" />
                          </Form.Item>
                        </CheckoutFieldRow>
                        <CheckoutFieldRow>
                          <Form.Item
                            name="billing_email"
                            label={<FieldLabel>Accounts payable email</FieldLabel>}
                            rules={[{ required: true, type: "email", message: "Valid email required" }]}
                            style={{ marginBottom: 0 }}
                          >
                            <Input size="middle" placeholder="name@company.com" />
                          </Form.Item>
                        </CheckoutFieldRow>
                        <CheckoutFieldRow>
                          <Form.Item
                            name="po_number"
                            label={<FieldLabel>PO or reference # (optional)</FieldLabel>}
                            style={{ marginBottom: 0 }}
                          >
                            <Input size="middle" placeholder="Purchase order or cost center" />
                          </Form.Item>
                        </CheckoutFieldRow>
                      </SectionContentInner>
                    </SectionCard>
                  </PaymentSection>
                </LeftColumnWrap>

                <SummarySection aria-label="Booking summary">
                  <DesktopSummaryCard>
                    {summaryTop}
                    {policyLines}
                    {renderPricingBlock(false)}
                    <DesktopInlineFooter>
                      <NextButton
                        type="primary"
                        size="middle"
                        loading={submitting}
                        onClick={finish}
                        disabled={!hasDates}
                        style={{ width: "100%", marginBottom: 10 }}
                      >
                        Confirm &amp; pay deposit
                      </NextButton>
                      <Button size="middle" onClick={onCancel} style={{ width: "100%", height: 48, fontWeight: 500 }}>
                        Back to comparison
                      </Button>
                      <p
                        style={{
                          margin: "14px 0 0",
                          fontSize: 13,
                          color: "#717171",
                          textAlign: "center",
                          lineHeight: 1.45,
                        }}
                      >
                        You&apos;ll be redirected to securely pay {formatMoney(deposit, currency)} ({cur}).
                      </p>
                    </DesktopInlineFooter>
                  </DesktopSummaryCard>
                </SummarySection>
              </StepContainer>
            </Inner>
            <FooterNote>
              By continuing you authorize ClassEasily to charge the deposit and share these details with the host.
            </FooterNote>
          </PageBleed>
        </Form>

        <MobileStickyFooter>
          <FooterDueRow>
            <span>Due today</span>
            <strong>{formatMoney(deposit, currency)}</strong>
          </FooterDueRow>
          <MobileFooterPrimary
            type="primary"
            loading={submitting}
            disabled={!hasDates || submitting}
            onClick={finish}
          >
            Confirm &amp; pay deposit
          </MobileFooterPrimary>
          <button
            type="button"
            onClick={onCancel}
            style={{
              marginTop: 10,
              width: "100%",
              border: "none",
              background: "transparent",
              color: "#374151",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "underline",
              padding: "4px 0",
            }}
          >
            Back to comparison
          </button>
        </MobileStickyFooter>
      </motion.div>
    </ConfigProvider>
  );
}
