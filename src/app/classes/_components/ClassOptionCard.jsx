"use client";

import React, { useMemo } from "react";
import styled from "styled-components";
import { Tooltip } from "antd";
import dayjs from "dayjs";
import { fromZonedTime } from "date-fns-tz";
import { formatBusinessLocalToUserDisplay } from "@/services/utils";

const CORAL = "#FF385C";
const NEAR_BLACK = "#111111";
const MUTED = "#717171";
const DIVIDER = "#EBEBEB";
const SLOT_BORDER = "#DDDDDD";

/* ── Outer card ──────────────────────────────────────────────────── */
const Card = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 18px 20px 20px;
  width: 100%;
  box-sizing: border-box;
`;

/* ── Top row: price + CTA ────────────────────────────────────────── */
const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const PriceStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PriceLine = styled.div`
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 0 4px;
`;

const PriceFrom = styled.span`
  font-size: 20px;
  font-weight: 600;
  color: ${NEAR_BLACK};
  line-height: 1.1;
  letter-spacing: -0.02em;
`;

const PriceAmount = styled.span`
  font-size: 20px;
  font-weight: 600;
  color: ${NEAR_BLACK};
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0 2px 0 0;
`;

const PriceUnit = styled.span`
  font-size: 13px;
  font-weight: 400;
  color: ${NEAR_BLACK};
  align-self: flex-end;
  padding-top: 3px;
`;

const CancellationPolicyText = styled.span`
  display: inline-block;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.1; 
  text-decoration: underline;
  max-width: 100%;
`;

const ShowDatesBtn = styled.button`
  flex-shrink: 0;
  background: ${CORAL};
  color: #fff;
  border: none;
  border-radius: 9999px;
  padding: 12px 22px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.18s;
  &:hover:not(:disabled) {
    opacity: 0.88;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* ── Divider ─────────────────────────────────────────────────────── */
const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${DIVIDER};
  margin: 16px 0;
`;

/* ── Slot list ───────────────────────────────────────────────────── */
const SlotList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SlotCard = styled.button`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  width: 100%;
  background: #fff;
  border: 1px solid ${SLOT_BORDER};
  border-radius: 12px;
  padding: 18px 20px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.18s, box-shadow 0.18s;
  &:hover {
    border-color: #aaa;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  }
`;

const SlotLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  align-self: flex-start;
`;

const SlotDate = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: ${NEAR_BLACK};
  white-space: nowrap;
`;

const SlotTime = styled.span`
  font-size: 13px;
  font-weight: 400;
  color: ${MUTED};
  white-space: nowrap;
`;

const SlotSpots = styled.span`
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 500;
  color: #000;
  margin-left: 14px;
  white-space: nowrap;
  line-height: 1.25;
`;

/* ── Show all dates link ─────────────────────────────────────────── */
const ShowAllLink = styled.button`
  display: block;
  width: 100%;
  margin-top: 16px;
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 400;
  color: ${MUTED};
  text-align: center;
  cursor: pointer;
  padding: 4px 0;
  &:hover {
    color: ${NEAR_BLACK};
  }
`;

/* ── Empty / course states ───────────────────────────────────────── */
const CourseNotice = styled.div`
  margin-top: 12px;
  padding: 18px 20px;
  border: 1px solid ${SLOT_BORDER};
  border-radius: 12px;
  font-size: 14px;
  color: ${MUTED};
  line-height: 1.5;

  strong {
    display: block;
    font-size: 15px;
    font-weight: 700;
    color: ${NEAR_BLACK};
    margin-bottom: 4px;
  }
`;

/* ─────────────────────────────────────────────────────────────────── */

const ClassOptionCard = ({
  option,
  currency = "$",
  onBookNow,
  onSelectSlot,
  businessTimeZone,
}) => {
  if (!option) return null;

  const optionId = option.optionId;
  const isCourse = option.booking_type === "Full Course";
  const schedules = Array.isArray(option.schedules) ? option.schedules : [];
  const bizTz = businessTimeZone || "Etc/UTC";
  const userTz =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "Etc/UTC";

  /* ── Helpers ─────────────────────────────────────────── */
  const getStartMs = (s) => {
    if (!s?.date || !s?.time) return 0;
    const parts = String(s.time).split(":");
    const timeStr = `${parts[0]}:${parts[1] || "00"}:${parts[2] || "00"}`;
    const dtStr = `${s.date}T${timeStr}`;
    if (bizTz && bizTz !== "Etc/UTC") {
      try { return fromZonedTime(dtStr, bizTz).getTime(); }
      catch { return dayjs(dtStr).valueOf(); }
    }
    return dayjs(dtStr).valueOf();
  };

  const todayInBizTz = useMemo(() => {
    if (!bizTz || bizTz === "Etc/UTC") return dayjs().format("YYYY-MM-DD");
    try { return new Date().toLocaleDateString("en-CA", { timeZone: bizTz }); }
    catch { return dayjs().format("YYYY-MM-DD"); }
  }, [bizTz]);

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    try { return dayjs(`2000-01-01 ${timeStr}`, "YYYY-MM-DD HH:mm:ss").format("h:mm A"); }
    catch { return timeStr; }
  };

  const formatEndTime = (timeStr, durationMins) => {
    if (!timeStr) return "";
    try {
      const start = dayjs(`2000-01-01 ${timeStr}`, "YYYY-MM-DD HH:mm:ss");
      return start.add(Number(durationMins) || 0, "minute").format("h:mm A");
    } catch { return ""; }
  };

  const formatSlotDate = (dateStr, timeStr) => {
    if (!dateStr) return "";
    if (bizTz && bizTz !== "Etc/UTC" && timeStr) {
      try {
        const d = formatBusinessLocalToUserDisplay(dateStr, timeStr, bizTz, userTz, {
          dateTimeFormat: "EEEE, MMM d",
        });
        if (d && d !== "Invalid Date") return d;
      } catch {}
    }
    return dayjs(dateStr).format("dddd, MMM D");
  };

  const formatSlotTime = (dateStr, timeStr, duration) => {
    if (!timeStr) return "";
    let start = formatTime(timeStr);
    if (bizTz && bizTz !== "Etc/UTC" && dateStr) {
      try {
        const t = formatBusinessLocalToUserDisplay(dateStr, timeStr, bizTz, userTz, {
          dateTimeFormat: "h:mm a",
        });
        if (t && t !== "Invalid Time") start = t.replace("am", "AM").replace("pm", "PM");
      } catch {}
    }
    const end = formatEndTime(timeStr, duration);
    return end ? `${start} – ${end}` : start;
  };

  /* ── Price ───────────────────────────────────────────── */
  const now = Date.now();
  const upcomingSchedules = schedules
    .filter((s) => {
      if (isCourse) return s.date && s.date >= todayInBizTz;
      return s.date && s.time && getStartMs(s) > now;
    })
    .sort((a, b) => {
      if (isCourse) {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
      }
      return getStartMs(a) - getStartMs(b);
    });

  const minPrice = useMemo(() => {
    const prices = schedules
      .map((s) => parseFloat(s.price || 0))
      .filter((p) => !isNaN(p) && p > 0);
    return prices.length ? Math.min(...prices) : 0;
  }, [schedules]);

  const priceDisplay = minPrice === 0 ? "Free" : `${currency}${Math.round(minPrice)}`;
  const priceUnit = isCourse ? "/ course" : "/ guest";

  const cancellationPolicyDisplay = useMemo(() => {
    const raw = option.cancellationPolicy;
    if (!raw || String(raw).trim() === "") return null;

    const policy = String(raw).toLowerCase().trim();
    const pctNum = parseFloat(option.cancellationRefundPercentage ?? 0);
    const pctRounded = Number.isFinite(pctNum) ? Math.round(pctNum) : 0;
    const hoursRaw = option.cancellationCustomHours;
    const hoursNum =
      hoursRaw != null && hoursRaw !== ""
        ? parseFloat(String(hoursRaw).replace(/,/g, ""))
        : NaN;
    const hasCustomHours = Number.isFinite(hoursNum) && hoursNum > 0;

    const policyTitle =
      policy === "flexible"
        ? "Flexible"
        : policy === "moderate"
          ? "Moderate"
          : policy === "strict"
            ? "Strict"
            : raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();

    const isFreeCancellation = policy === "flexible" && pctRounded >= 100;

    const short = isFreeCancellation
      ? "Free cancellation"
      : "Cancellation Policy";

    const hoursPhrase = hasCustomHours
      ? ` For this listing, plan to cancel at least ${hoursNum} hours before the scheduled start unless checkout shows a different cutoff.`
      : "";

    /** Full tooltip copy only — no duplicate headline vs body */
    const tooltipParagraphs = [];
    if (policy === "flexible") {
      if (pctRounded >= 100) {
        tooltipParagraphs.push(
          `You can receive a full refund when you cancel before the deadline shown at checkout and on your confirmation.${hoursPhrase}`,
          `After that cutoff, the booking is typically non-refundable or only partly refundable, depending on how this host processes late cancellations.`,
          `If something urgent comes up, you may still message the host through your booking—some hosts accommodate exceptions when they can.`,
        );
      } else {
        tooltipParagraphs.push(
          `This host uses a flexible cancellation policy. You may receive up to ${pctRounded}% back, depending on how far in advance you cancel—generally, the earlier you cancel, the larger the refund.`,
          `Your checkout screen lists the exact cutoff times and refund tiers.${hoursPhrase}`,
          `Refunds are processed to your original payment method once the cancellation is confirmed.`,
        );
      }
    } else if (policy === "moderate") {
      tooltipParagraphs.push(
        `Moderate policies reward advance planning: you may receive up to ${pctRounded}% back when you cancel with enough notice before the session.`,
        `Notice periods and refund tiers are spelled out at checkout so you can compare options before you pay.${hoursPhrase}`,
        `Last-minute cancellations often qualify for a reduced refund or none—plan accordingly if your schedule is uncertain.`,
      );
    } else if (policy === "strict") {
      tooltipParagraphs.push(
        `This host applies a strict cancellation policy: refunds up to ${pctRounded}% are available only in limited situations described when you book.`,
        `Read the terms carefully before you reserve—last-minute changes are often fully non-refundable.${hoursPhrase}`,
        `If you believe your situation qualifies for an exception (e.g. serious emergency), contact the host through your booking to discuss options.`,
      );
    } else {
      tooltipParagraphs.push(
        `This listing follows a ${policyTitle} cancellation approach with up to ${pctRounded}% refund potential; exact rules appear at checkout.`,
        `Always review deadlines and fees before completing payment.${hoursPhrase}`,
      );
    }

    return { short, tooltipParagraphs };
  }, [
    option.cancellationPolicy,
    option.cancellationRefundPercentage,
    option.cancellationCustomHours,
  ]);

  const PREVIEW_COUNT = 5;
  const previewSlots = upcomingSchedules.slice(0, PREVIEW_COUNT);
  const hasMore = upcomingSchedules.length > PREVIEW_COUNT;

  const handleBook = () => {
    if (optionId && onBookNow) onBookNow(optionId);
  };

  const handleSlotSelect = (schedule) => {
    if (onSelectSlot) {
      onSelectSlot(option, schedule);
      return;
    }
    handleBook();
  };

  const isDisabled = !optionId || schedules.length === 0;

  return (
    <Card>
      {/* ── Top row ── */}
      <TopRow>
        <PriceStack>
          <PriceLine>
            {minPrice > 0 && <PriceFrom>From </PriceFrom>}
            <PriceAmount>{priceDisplay}</PriceAmount>
            <PriceUnit>{priceUnit}</PriceUnit>
          </PriceLine>
          {cancellationPolicyDisplay && (
            <Tooltip
              title={
                <div style={{ fontSize: 12, lineHeight: 1.55 }}>
                  {cancellationPolicyDisplay.tooltipParagraphs.map((para, i, arr) => (
                    <p
                      key={i}
                      style={{
                        margin: i === arr.length - 1 ? 0 : "0 0 8px",
                      }}
                    >
                      {para}
                    </p>
                  ))}
                </div>
              }
              placement="topLeft"
              mouseEnterDelay={0.2}
              arrow
              styles={{ body: { maxWidth: 320 } }}
            >
              <CancellationPolicyText>
                {cancellationPolicyDisplay.short}
              </CancellationPolicyText>
            </Tooltip>
          )}
        </PriceStack>
        <ShowDatesBtn
          onClick={handleBook}
          disabled={isDisabled}
          aria-label={isCourse ? "View course dates" : "Show available dates"}
        >
          {isCourse ? "View dates" : "Show dates"}
        </ShowDatesBtn>
      </TopRow>

      <Divider />

      {/* ── Slot list ── */}
      {isCourse ? (
        previewSlots.length > 0 ? (
          <SlotList>
            {previewSlots.map((s, i) => {
              const spots =
                s.available_spots != null ? s.available_spots : s.maxParticipants;
              return (
                <SlotCard key={s.id || i} onClick={handleBook}>
                  <SlotLeft>
                    <SlotDate>
                      Starts {dayjs(s.date).format("dddd, MMM D")}
                    </SlotDate>
                    <SlotTime>
                      {Array.isArray(s.days) ? `Every ${s.days.join(", ")}` : "See details"}
                      {s.time ? ` at ${formatTime(s.time)}` : ""}
                    </SlotTime>
                  </SlotLeft>
                  {spots != null && (
                    <SlotSpots>
                      {spots === 1 ? "1 spot left" : `${spots} spots`}
                    </SlotSpots>
                  )}
                </SlotCard>
              );
            })}
          </SlotList>
        ) : (
          <CourseNotice>
            <strong>No upcoming courses</strong>
            Check back soon for the next start date.
          </CourseNotice>
        )
      ) : previewSlots.length > 0 ? (
        <SlotList>
          {previewSlots.map((s, i) => {
            const spots =
              s.available_spots != null ? s.available_spots : s.maxParticipants;
            return (
              <SlotCard key={s.id || i} onClick={() => handleSlotSelect(s)}>
                <SlotLeft>
                  <SlotDate>{formatSlotDate(s.date, s.time)}</SlotDate>
                  <SlotTime>{formatSlotTime(s.date, s.time, s.duration)}</SlotTime>
                </SlotLeft>
                {spots != null && (
                  <SlotSpots>
                    {spots === 0
                      ? "Full"
                      : spots === 1
                      ? "1 spot left"
                      : `${spots} spots available`}
                  </SlotSpots>
                )}
              </SlotCard>
            );
          })}
        </SlotList>
      ) : (
        <CourseNotice>
          <strong>No upcoming sessions</strong>
          Check back soon for new dates.
        </CourseNotice>
      )}

      {(hasMore || previewSlots.length > 0) && (
        <ShowAllLink onClick={handleBook}>
          Show all dates
        </ShowAllLink>
      )}
    </Card>
  );
};

export default ClassOptionCard;
