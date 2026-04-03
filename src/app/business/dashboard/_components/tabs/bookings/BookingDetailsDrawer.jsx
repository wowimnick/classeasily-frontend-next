"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled, { keyframes } from "styled-components";
import { Typography, Tag, Button, Popconfirm } from "antd";
import message from "@/lib/message";
import {
  Clock,
  Calendar,
  MessageSquare,
  Mail,
  Phone,
  UserCheck,
  Repeat,
  XCircle,
  ExternalLink,
  Users as UsersIcon,
  Info,
  Building,
  FileText,
  X,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { bookingService } from "@/services/apiService";
import {
  formatUTCToUserDisplay,
  formatBusinessLocalToUserDisplay,
  formatPhoneNumber,
} from "@/services/utils";
import { Drawer } from "vaul";
import { VAUL_OVERLAY_BACKDROP_BLUR } from "@/lib/vaulOverlayBlur";

const { Text, Title, Paragraph } = Typography;

// ─── Colour tokens ──────────────────────────────────────────────────────────
const C = {
  accent: "#3b82f6",
  brand: "#ff385c",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  border: "#e5e7eb",
  white: "#ffffff",
  sidebarBg: "#f4f5f8",
  inputBg: "#f9fafb",
};

// ─── Animations ─────────────────────────────────────────────────────────────
const fadeIn = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;

// ─── Vaul drawer shells ──────────────────────────────────────────────────────
const Overlay = styled(Drawer.Overlay)`
  position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1049;
  ${VAUL_OVERLAY_BACKDROP_BLUR}
`;

const MobileShell = styled(Drawer.Content)`
  background: ${C.white}; display: flex; flex-direction: column; overflow: hidden;
  border-radius: 24px 24px 0 0; height: 92%; max-height: 92vh;
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 1050; outline: none;
`;

const DesktopShell = styled(Drawer.Content)`
  right: 8px; top: 8px; bottom: 8px; position: fixed; z-index: 1050;
  outline: none; width: 860px; display: flex; flex-direction: column;
  border-radius: 16px; overflow: hidden;
  box-shadow: -4px 0 32px rgba(0,0,0,0.14), 0 4px 24px rgba(0,0,0,0.10);
`;

const DrawerInner = styled.div`
  display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden;
`;

const DrawerHandle = styled(Drawer.Handle)`
  width: 36px; height: 4px; background: rgba(0,0,0,0.18);
  border-radius: 2px; margin: 12px auto 8px; flex-shrink: 0;
`;

const ThumbArea = styled.div`
  flex-shrink: 0;
  background: ${C.sidebarBg};
  display: flex; justify-content: center; align-items: center;
`;

// ─── Two-column layout ───────────────────────────────────────────────────────
const TwoCol = styled.div`
  display: flex; flex: 1; overflow: hidden; min-height: 0;
  @media (max-width: 768px) {
    flex-direction: column; overflow: visible; min-height: 0;
  }
`;

// Mobile: scrollable main content with fade hint at bottom
const MobileScrollArea = styled.div`
  flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  position: relative;
  &::after {
    content: ""; position: sticky; bottom: 0; left: 0; right: 0; height: 28px;
    margin-top: -28px; display: block;
    background: linear-gradient(to bottom, rgba(255,255,255,0), ${C.white} 70%);
    pointer-events: none;
  }
`;
const MobileScrollInner = styled.div`
  padding-bottom: 36px;
`;

// Mobile: collapsible "Booking details" header (always visible)
const MobileDetailsHeader = styled.button`
  width: 100%; display: flex; align-items: center; gap: 12px; padding: 14px 16px;
  background: ${C.sidebarBg}; border: none; border-bottom: 1px solid ${C.border};
  cursor: pointer; text-align: left; flex-shrink: 0;
`;
const MobileDetailsBody = styled.div`
  background: ${C.sidebarBg}; border-bottom: 1px solid ${C.border};
  overflow: hidden;
`;

// LEFT column – white, scrollable
const LeftCol = styled.div`
  flex: 1; background: ${C.white}; overflow-y: auto; padding: 20px 24px;
  display: flex; flex-direction: column; gap: 28px;
  animation: ${fadeIn} 0.3s ease-out;
  @media (max-width: 768px) { gap: 20px; padding: 16px 20px; }
`;

// RIGHT column – cool gray, fixed-width, scrollable (z-index so content stays below footer)
const RightCol = styled.div`
  width: 300px; flex-shrink: 0; background: ${C.sidebarBg};
  overflow-y: auto; display: flex; flex-direction: column;
  border-left: 1px solid ${C.border}; position: relative; z-index: 0;
  @media (max-width: 768px) { width: 100%; border-left: none; border-bottom: 1px solid ${C.border}; }
`;

const RightColInner = styled.div`
  padding: 20px 24px; display: flex; flex-direction: column; gap: 20px; flex: 1;
`;

// RIGHT column header (title + close)
const RightHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center;
`;
const RightTitle = styled.span`
  font-size: 15px; font-weight: 700; color: ${C.textPrimary};
`;
const CloseBtn = styled.button`
  background: none; border: none; padding: 4px; cursor: pointer;
  color: ${C.textSecondary}; border-radius: 6px; display: flex; align-items: center;
  &:hover { background: ${C.border}; }
`;

// ─── Booker card ─────────────────────────────────────────────────────────────
const BookerCard = styled.div`
  background: ${C.white}; border-radius: 12px; padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06); display: flex; flex-direction: column; gap: 12px;
`;
const BookerName = styled.span`
  font-size: 15px; font-weight: 700; color: ${C.textPrimary}; display: block;
`;
const BookerEmail = styled.span`
  font-size: 13px; color: ${C.textSecondary}; display: block; word-break: break-all;
`;

// ─── Status tags ─────────────────────────────────────────────────────────────
const STag = styled.span`
  display: inline-flex; align-items: center; gap: 5px; font-size: 11px;
  font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;
  padding: 3px 10px; border-radius: 20px;
  background: ${p => p.$bg}; color: ${p => p.$color};
`;

// ─── Divider ─────────────────────────────────────────────────────────────────
const Div = styled.hr`
  border: none; border-top: 1px solid ${C.border}; margin: 0;
`;

// ─── Timeline ────────────────────────────────────────────────────────────────
const TimelineWrap = styled.div``;
const TimelineTitle = styled.div`
  font-size: 13px; font-weight: 700; color: ${C.textPrimary}; margin-bottom: 16px;
`;
const TimelineList = styled.div`
  position: relative; padding-left: 19px;
  &::before {
    content: ""; position: absolute; left: 5px; top: 2px; bottom: 55px;
    width: 2px; background: ${C.border};
  }
`;
const TLNode = styled.div`
  position: relative; padding-bottom: 20px;
  &:last-child { padding-bottom: 0; }
`;
const TLDot = styled.div`
  position: absolute; left: -17px; top: 4px; width: 10px; height: 10px;
  border-radius: 50%; background: ${p => p.$color || C.textSecondary};
  border: 2px solid ${C.sidebarBg};
`;
const TLDate = styled.div`
  font-size: 12px; font-weight: 700; color: ${C.textPrimary}; margin-bottom: 2px;
`;
const TLText = styled.div`
  font-size: 12px; color: ${C.textSecondary}; line-height: 1.5;
`;
const TLBadge = styled.span`
  display: inline-block; margin-top: 4px; font-size: 11px; font-weight: 600;
  padding: 2px 8px; border-radius: 12px;
  background: ${p => p.$bg}; color: ${p => p.$color};
  position: relative; z-index: 0;
`;

// ─── Left column sections ─────────────────────────────────────────────────────
const Section = styled.div``;
const SectionTitle = styled.div`
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 700; color: ${C.textSecondary};
  text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;
  svg { color: ${C.textSecondary}; }
`;
const Grid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;
const FieldLabel = styled.div`
  font-size: 12px; color: ${C.textSecondary}; margin-bottom: 3px;
`;
const FieldValue = styled.div`
  font-size: 14px; font-weight: 500; color: ${C.textPrimary}; word-break: break-word;
`;
const NoData = styled.span`
  font-style: italic; color: #9ca3af; font-size: 13px;
`;

// Cancellation block
const CancelBanner = styled.div`
  background: #fff5f5; border: 1px solid #fecaca; border-radius: 10px; padding: 16px;
`;
const CancelTitle = styled.div`
  display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700;
  color: ${C.error}; margin-bottom: 10px;
`;

// Course session row
const SessionRow = styled.div`
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 10px 0; border-bottom: 1px solid ${C.border};
  &:last-child { border-bottom: none; }
`;
const SessionNum = styled.span`
  font-size: 12px; color: ${C.textSecondary}; width: 24px; flex-shrink: 0;
`;

// ─── Footer ──────────────────────────────────────────────────────────────────
const Footer = styled.div`
  background: ${C.white}; border-top: 1px solid ${C.border};
  padding: 12px 16px; flex-shrink: 0; display: flex;
  justify-content: space-between; align-items: center; gap: 8px;
  flex-wrap: wrap; position: relative; z-index: 10;
  @media (max-width: 768px) { padding: 10px 12px; }
`;
const FooterLeft = styled.div`
  font-size: 13px; color: ${C.textSecondary};
`;
const FooterRight = styled.div`
  display: flex; gap: 10px; align-items: center; flex-wrap: wrap;
`;

// ─── Skeleton ────────────────────────────────────────────────────────────────
const pulse = keyframes`
  0%,100%{background-position:200% 0} 50%{background-position:-200% 0}
`;
const Skel = styled.div`
  height: ${p => p.$h || "14px"}; width: ${p => p.$w || "100%"};
  border-radius: ${p => p.$r || "4px"};
  background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);
  background-size: 200% 100%; animation: ${pulse} 1.5s ease-in-out infinite;
`;
// ─── Helpers ─────────────────────────────────────────────────────────────────
const statusConfig = {
  confirmed: { color: C.accent, bg: "#eff6ff", icon: <UserCheck size={11} /> },
  completed: { color: "#059669", bg: "#d1fae5", icon: <CheckCircle size={11} /> },
  cancelled: { color: C.error, bg: "#fee2e2", icon: <XCircle size={11} /> },
  pending: { color: C.warning, bg: "#fffbeb", icon: <Clock size={11} /> },
  forfeited: { color: C.textSecondary, bg: "#f1f5f9", icon: <XCircle size={11} /> },
};
const payoutStatusConfig = {
  pending: { color: C.warning, bg: "#fffbeb", label: "In escrow" },
  processed: { color: "#059669", bg: "#d1fae5", label: "Paid out" },
  failed: { color: C.error, bg: "#fee2e2", label: "Payout failed" },
  not_applicable: { color: C.textSecondary, bg: "#f1f5f9", label: "N/A" },
  refunded: { color: C.textSecondary, bg: "#f1f5f9", label: "No payout" },
};
const paymentStatusConfig = {
  succeeded: { color: "#059669", bg: "#d1fae5", label: "Paid" },
  pending: { color: C.warning, bg: "#fffbeb", label: "Pending" },
  failed: { color: C.error, bg: "#fee2e2", label: "Failed" },
  refunded: { color: C.accent, bg: "#eff6ff", label: "Refunded" },
  partially_refunded: { color: C.accent, bg: "#eff6ff", label: "Partial Refund" },
};

function StatusBadge({ status, paymentStatus }) {
  let cfg = statusConfig[status?.toLowerCase()] || { color: C.textSecondary, bg: C.inputBg, icon: <Info size={11} /> };
  let label = status?.toUpperCase() || "UNKNOWN";
  if (status === "confirmed" && paymentStatus === "refund_pending") {
    cfg = { color: C.warning, bg: "#fffbeb", icon: <Clock size={11} /> };
    label = "REFUND PENDING";
  }
  return <STag $color={cfg.color} $bg={cfg.bg}>{cfg.icon} {label}</STag>;
}

function fmt(date, format = "MMM d, yyyy") {
  if (!date) return null;
  try { return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "short", day: "numeric" }).format(new Date(date)); }
  catch { return String(date); }
}

function formatDuration(minutes) {
  if (minutes == null || minutes < 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

// ─── Component ───────────────────────────────────────────────────────────────
const BookingDetailsDrawer = ({ visible, onClose, bookingId, onBookingCancel, onReschedule }) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [mobileDetailsExpanded, setMobileDetailsExpanded] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (visible) { setShouldRender(true); }
    else {
      setMobileDetailsExpanded(false);
      const t = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(t);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || !bookingId) { setBooking(null); return; }
    (async () => {
      setLoading(true); setError(null);
      try {
        const r = await bookingService.getBookingDetails(bookingId);
        if (r.success) setBooking(r.data);
        else { setError(r.error || "Failed to load booking details."); message.error(r.error || "Failed to load booking details."); }
      } catch { setError("An unexpected error occurred."); message.error("An unexpected error occurred."); }
      finally { setLoading(false); }
    })();
  }, [bookingId, visible]);

  const handleInternalCancel = async () => {
    if (!booking?.id) return;
    setIsCancelling(true);
    try {
      const r = await bookingService.businessCancelBooking(booking.id, "Cancelled by business user");
      if (r.success) { message.success("Booking successfully cancelled"); onBookingCancel?.(r.data); onClose(); }
      else message.error(r.error || "Cancellation failed.");
    } catch { message.error("An error occurred during cancellation."); }
    finally { setIsCancelling(false); }
  };

  const handleRescheduleClick = () => { if (booking) { onReschedule(booking); onClose(); } };

  // ── Right column (or mobile collapsible body) ─────────────────────────────
  const renderRightCol = (opts = {}) => {
    const { mobileBodyOnly = false } = opts;
    const { booker_details: bd = {}, payment_info: pay = {} } = booking || {};
    const payoutSt = booking?.payout_status || "pending";
    const netPayout = booking?.allocated_net_payout;
    const payoutCfg = payoutStatusConfig[payoutSt] || payoutStatusConfig.pending;
    const payCfg = paymentStatusConfig[pay?.status?.toLowerCase()] || null;

    const timelineItems = [];
    // Booking created
    if (booking?.booking_date) {
      timelineItems.push({
        dotColor: C.accent,
        date: fmt(booking.booking_date),
        text: "Booking confirmed",
        badge: null,
      });
    }
    // Payment
    if (pay && Object.keys(pay).length > 0) {
      const methodStr = pay.card_brand
        ? `•••• ${pay.card_last4} (${pay.card_brand})`
        : pay.payment_method_type || "Card";
      const amt = pay.amount ? `$${parseFloat(pay.amount).toFixed(2)} ${pay.currency?.toUpperCase() || ""}` : "";
      timelineItems.push({
        dotColor: payCfg?.color || C.textSecondary,
        date: "Payment",
        text: `${amt}${methodStr ? ` · ${methodStr}` : ""}`,
        badge: payCfg ? { label: payCfg.label, ...payCfg } : null,
        receiptUrl: pay.receipt_url,
      });
    }
    // Payout (respects cancellation/refund: no payout when guest refunded; partial refund = reduced amount; always show ETA when available)
    const paymentStatus = booking?.payment_status;
    const payStatus = pay?.status?.toLowerCase();
    const refundedAmount = pay?.refunded_amount != null ? parseFloat(pay.refunded_amount) : 0;
    const netPayoutNum = netPayout != null ? parseFloat(netPayout) : 0;
    const payoutEta = booking?.payout_eta;
    const isFullyRefunded = paymentStatus === "refunded" || paymentStatus === "refund_pending" || payStatus === "refunded";
    const isPartiallyRefunded = payStatus === "partially_refunded" || (refundedAmount > 0 && netPayoutNum > 0);

    let payoutSubtext;
    let payoutBadgeCfg = payoutCfg;
    if (payoutSt === "processed") {
      payoutSubtext = netPayoutNum > 0 ? `$${netPayoutNum.toFixed(2)} paid out` : "Paid out";
      if (payoutEta) payoutSubtext += ` · Paid out on ${fmt(payoutEta)}`;
    } else if (isFullyRefunded || payoutSt === "not_applicable") {
      // No payout when guest was refunded (per cancellation policy) or not applicable (e.g. free)
      payoutBadgeCfg = isFullyRefunded ? payoutStatusConfig.refunded : payoutStatusConfig.not_applicable;
      if (paymentStatus === "refund_pending") {
        payoutSubtext = "No payout — refund pending for guest per cancellation policy.";
      } else if (payStatus === "refunded" || paymentStatus === "refunded") {
        payoutSubtext = "No payout — guest was refunded per cancellation policy.";
      } else {
        payoutSubtext = "No payout for this booking.";
      }
      if (isFullyRefunded && payoutEta) payoutSubtext += ` Scheduled payout was expected by ${fmt(payoutEta)}.`;
    } else if (payoutSt === "failed") {
      payoutSubtext = netPayoutNum > 0 ? `$${netPayoutNum.toFixed(2)} allocated` : "Payout failed";
      payoutSubtext += " · Payout failed";
    } else if (isPartiallyRefunded) {
      // Partial refund: only the remaining amount is in the payout
      payoutSubtext = netPayoutNum > 0
        ? `$${netPayoutNum.toFixed(2)} allocated (after partial refund)`
        : "Amount allocated at payout (after partial refund)";
      if (payoutEta) payoutSubtext += ` · Expected by ${fmt(payoutEta)}`;
      else payoutSubtext += " · Included in your next payout";
    } else {
      // Pending payout (no refund)
      payoutSubtext = netPayoutNum > 0 ? `$${netPayoutNum.toFixed(2)} allocated` : "Amount allocated at payout";
      if (payoutEta) payoutSubtext += ` · Expected by ${fmt(payoutEta)}`;
      else payoutSubtext += " · Included in your next payout";
    }
    timelineItems.push({
      dotColor: payoutBadgeCfg.color,
      date: "Payout",
      text: payoutSubtext,
      badge: { label: payoutBadgeCfg.label, color: payoutBadgeCfg.color, bg: payoutBadgeCfg.bg },
    });

    const bodyContent = (
      <>
        {loading ? (
          <BookerCard>
            <div>
              <Skel $h="15px" $w="65%" style={{ marginBottom: 6 }} />
              <Skel $h="12px" $w="85%" />
            </div>
          </BookerCard>
        ) : booking ? (
          <BookerCard>
            <div>
              <BookerName>{bd.full_name || "Unknown Guest"}</BookerName>
              <BookerEmail>{bd.email || "—"}</BookerEmail>
            </div>
            <div>
              <StatusBadge status={booking.status} paymentStatus={booking.payment_status} />
            </div>
          </BookerCard>
        ) : null}

        <Div />

        {loading ? (
          <TimelineWrap>
            <TimelineTitle>Payment & Payout</TimelineTitle>
            <TimelineList>
              {[1, 2, 3].map(i => (
                <TLNode key={i}>
                  <TLDot $color={C.border} />
                  <Skel $h="12px" $w="60%" style={{ marginBottom: 4 }} />
                  <Skel $h="11px" $w="80%" />
                </TLNode>
              ))}
            </TimelineList>
          </TimelineWrap>
        ) : booking ? (
          <TimelineWrap>
            <TimelineTitle>Payment & Payout</TimelineTitle>
            <TimelineList>
              {timelineItems.map((item, i) => (
                <TLNode key={i}>
                  <TLDot $color={item.dotColor} />
                  <TLDate>{item.date}</TLDate>
                  <TLText>{item.text}</TLText>
                  {item.badge && (
                    <TLBadge $color={item.badge.color} $bg={item.badge.bg}>
                      {item.badge.label}
                    </TLBadge>
                  )}
                  {item.receiptUrl && (
                    <div style={{ marginTop: 4 }}>
                      <a href={item.receiptUrl} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, color: C.accent, display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <ExternalLink size={10} /> View receipt
                      </a>
                    </div>
                  )}
                </TLNode>
              ))}
            </TimelineList>
          </TimelineWrap>
        ) : null}
      </>
    );

    if (mobileBodyOnly) return bodyContent;

    return (
      <RightCol>
        <RightColInner>
          <RightHeader>
            <RightTitle>Booking Details</RightTitle>
            <CloseBtn onClick={onClose} aria-label="Close"><X size={16} /></CloseBtn>
          </RightHeader>
          {bodyContent}
        </RightColInner>
      </RightCol>
    );
  };

  // ── Left column ───────────────────────────────────────────────────────────
  const renderLeftCol = () => {
    if (loading) {
      return (
        <LeftCol>
          <Section>
            <Skel $h="13px" $w="120px" style={{ marginBottom: 16 }} />
            <Grid>
              {[1, 2, 3, 4].map(i => (
                <div key={i}>
                  <Skel $h="11px" $w="50%" style={{ marginBottom: 6 }} />
                  <Skel $h="14px" $w="80%" />
                </div>
              ))}
            </Grid>
          </Section>
          <Div />
          <Section>
            <Skel $h="13px" $w="80px" style={{ marginBottom: 16 }} />
            <Grid>
              {[1, 2].map(i => (
                <div key={i}>
                  <Skel $h="11px" $w="45%" style={{ marginBottom: 6 }} />
                  <Skel $h="14px" $w="70%" />
                </div>
              ))}
            </Grid>
          </Section>
        </LeftCol>
      );
    }

    if (error || !booking) {
      return (
        <LeftCol>
          <Text type="danger">{error || "Booking data not available."}</Text>
        </LeftCol>
      );
    }

    const {
      booker_details: bd = {},
      schedule_instance_details: si = {},
      business_context: biz = {},
      payment_info: pay = {},
    } = booking;

    const bizTz = biz.business_timezone || "UTC";
    const userTz = bd.user_timezone || bizTz;
    const { display: phoneDisplay, link: phoneLink } = formatPhoneNumber(bd.phone_number);

    return (
      <LeftCol>
        {/* Cancellation banner */}
        {booking.status === "cancelled" && (
          <CancelBanner>
            <CancelTitle><XCircle size={15} /> Cancellation</CancelTitle>
            <FieldLabel>Reason</FieldLabel>
            <FieldValue>{booking.cancellation_reason || <NoData>No reason provided</NoData>}</FieldValue>
            {booking.cancelled_at && (
              <div style={{ marginTop: 8 }}>
                <FieldLabel>Cancelled on</FieldLabel>
                <FieldValue>{fmt(booking.cancelled_at)}</FieldValue>
              </div>
            )}
          </CancelBanner>
        )}

        {/* Experience & Schedule */}
        <Section>
          <SectionTitle><Calendar size={13} /> Experience &amp; Schedule</SectionTitle>
          <Grid>
            <div>
              <FieldLabel>Experience</FieldLabel>
              <FieldValue>{booking.class_name || <NoData>N/A</NoData>}</FieldValue>
            </div>
            {booking.has_multiple_options && (
              <div>
                <FieldLabel>Option / Tier</FieldLabel>
                <FieldValue>{booking.option_name || <NoData>N/A</NoData>}</FieldValue>
              </div>
            )}
            <div>
              <FieldLabel>Date &amp; Time</FieldLabel>
              <FieldValue>
                {formatBusinessLocalToUserDisplay(si.date, si.time, bizTz, bizTz, { dateTimeFormat: "EEE, MMM d, yyyy · h:mm a" })}
              </FieldValue>
            </div>
            <div>
              <FieldLabel>Duration</FieldLabel>
              <FieldValue>{booking.duration != null ? (formatDuration(booking.duration) || <NoData>N/A</NoData>) : <NoData>N/A</NoData>}</FieldValue>
            </div>
            <div>
              <FieldLabel>Business</FieldLabel>
              <FieldValue>{biz.businessName || <NoData>N/A</NoData>}</FieldValue>
            </div>
          </Grid>
        </Section>

        <Div />

        {/* Guests */}
        <Section>
          <SectionTitle><UsersIcon size={13} /> Guests</SectionTitle>
          <Grid>
            <div>
              <FieldLabel>Email</FieldLabel>
              <FieldValue>{bd.email || <NoData>N/A</NoData>}</FieldValue>
            </div>
            <div>
              <FieldLabel>Phone</FieldLabel>
              <FieldValue>
                {phoneLink ? <a href={phoneLink}>{phoneDisplay}</a> : phoneDisplay || <NoData>N/A</NoData>}
              </FieldValue>
            </div>
            {booking.participants > 0 && (
              <div>
                <FieldLabel>Participants</FieldLabel>
                <FieldValue>
                  {booking.participant_details?.[0]?.name
                    ? `${booking.participant_details[0].name} · ${booking.participants} spot${booking.participants !== 1 ? "s" : ""}`
                    : `${booking.participants} participant${booking.participants !== 1 ? "s" : ""}`}
                </FieldValue>
              </div>
            )}
          </Grid>
        </Section>

        <Div />

        {/* Booking Info */}
        <Section>
          <SectionTitle><FileText size={13} /> Booking Information</SectionTitle>
          <Grid>
            {booking.user_facing_reference && (
              <div>
                <FieldLabel>Reference</FieldLabel>
                <FieldValue style={{ fontFamily: "monospace", letterSpacing: 1 }}>
                  {booking.user_facing_reference}
                </FieldValue>
              </div>
            )}
            <div>
              <FieldLabel>Booked on</FieldLabel>
              <FieldValue>
                {formatUTCToUserDisplay(booking.booking_date, userTz, { dateTimeFormat: "MMM d, yyyy · h:mm a zzz" })}
              </FieldValue>
            </div>
            {booking.amount_paid != null && parseFloat(booking.amount_paid) > 0 && (
              <div>
                <FieldLabel>Total paid</FieldLabel>
                <FieldValue>${parseFloat(booking.amount_paid).toFixed(2)}</FieldValue>
              </div>
            )}
            {(pay?.metadata?.booking_source || pay?.metadata?.original_stripe_metadata?.booking_source) && (
              <div>
                <FieldLabel>Source</FieldLabel>
                <FieldValue style={{ textTransform: "capitalize" }}>
                  {(pay.metadata?.booking_source || pay.metadata?.original_stripe_metadata?.booking_source) === "widget" ? "Widget" : "Marketplace"}
                </FieldValue>
              </div>
            )}
            {booking.notes && (
              <div style={{ gridColumn: "1 / -1" }}>
                <FieldLabel>Notes from booker</FieldLabel>
                <FieldValue style={{ fontWeight: 400, fontSize: 13, lineHeight: 1.6 }}>
                  {booking.notes}
                </FieldValue>
              </div>
            )}
            {booking.is_rescheduled && booking.original_session_details && (
              <div style={{ gridColumn: "1 / -1" }}>
                <FieldLabel>Rescheduled from</FieldLabel>
                <FieldValue>
                  {formatBusinessLocalToUserDisplay(
                    booking.original_session_details.date,
                    booking.original_session_details.time,
                    bizTz, bizTz, { dateTimeFormat: "EEE, MMM d, yyyy · h:mm a" }
                  )}
                </FieldValue>
              </div>
            )}
          </Grid>
        </Section>

        {/* Course Schedule */}
        {booking.enrollment_type === "Full Course" && booking.course_schedule?.length > 0 && (
          <>
            <Div />
            <Section>
              <SectionTitle><Repeat size={13} /> Course Schedule</SectionTitle>
              <div>
                {booking.course_schedule.map((session) => (
                  <SessionRow key={session.session_number}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, flex: 1 }}>
                      <SessionNum>#{session.session_number}</SessionNum>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: session.is_current ? 700 : 400, color: C.textPrimary }}>
                          {formatBusinessLocalToUserDisplay(session.date, session.time, bizTz, bizTz, { dateTimeFormat: "EEE, MMM d · h:mm a" })}
                          {session.is_current && (
                            <Tag color="blue" style={{ marginLeft: 8, fontSize: 10 }}>This booking</Tag>
                          )}
                        </div>
                      </div>
                    </div>
                    <STag
                      $color={session.status === "completed" ? "#059669" : session.status === "cancelled" ? C.error : C.textSecondary}
                      $bg={session.status === "completed" ? "#d1fae5" : session.status === "cancelled" ? "#fee2e2" : C.inputBg}
                      style={{ fontSize: 10 }}
                    >
                      {session.status.toUpperCase()}
                    </STag>
                  </SessionRow>
                ))}
              </div>
            </Section>
          </>
        )}
      </LeftCol>
    );
  };

  // ── Footer ────────────────────────────────────────────────────────────────
  const renderFooter = () => {
    if (loading || !booking) return null;
    const messagesHref = booking.id ? `/business/dashboard/messages?booking_id=${booking.id}` : "#";
    return (
      <Footer>
        <FooterLeft>
          {booking.user_facing_reference && (
            <span style={{ fontFamily: "monospace", fontSize: 12, color: C.textSecondary }}>
              {booking.user_facing_reference}
            </span>
          )}
        </FooterLeft>
        <FooterRight>
          <Link href={messagesHref} onClick={onClose}>
            <Button icon={<MessageSquare size={14} />} size="small">Message</Button>
          </Link>
          {booking.status === "confirmed" && (
            <>
              <Button icon={<Repeat size={14} />} size="small" onClick={handleRescheduleClick}>
                Reschedule
              </Button>
              <Popconfirm
                title="Cancel this booking?"
                description="The guest will be notified and a refund may be initiated."
                onConfirm={handleInternalCancel}
                okText="Yes, Cancel"
                cancelText="No"
                placement="topRight"
                disabled={isCancelling}
              >
                <Button type="primary" danger icon={<XCircle size={14} />} loading={isCancelling} size="small">
                  Cancel
                </Button>
              </Popconfirm>
            </>
          )}
        </FooterRight>
      </Footer>
    );
  };

  if (!shouldRender) return null;

  const mobileContent = (
    <DrawerInner>
      {/* Collapsible "Booking details" – tap to expand/collapse */}
      <MobileDetailsHeader type="button" onClick={() => setMobileDetailsExpanded((e) => !e)}>
        {loading ? (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Skel $h="14px" $w="60%" style={{ marginBottom: 4 }} />
              <Skel $h="12px" $w="80%" />
            </div>
            <ChevronDown size={20} style={{ color: C.textSecondary, flexShrink: 0 }} />
          </>
        ) : booking ? (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <BookerName style={{ fontSize: 14 }}>{booking.booker_details?.full_name || "Guest"}</BookerName>
              <StatusBadge status={booking.status} paymentStatus={booking.payment_status} />
            </div>
            {mobileDetailsExpanded ? <ChevronUp size={20} style={{ color: C.textSecondary, flexShrink: 0 }} /> : <ChevronDown size={20} style={{ color: C.textSecondary, flexShrink: 0 }} />}
            <CloseBtn
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              style={{ marginLeft: 4 }}
              aria-label="Close"
            >
              <X size={18} />
            </CloseBtn>
          </>
        ) : (
          <span style={{ flex: 1, fontSize: 14, color: C.textSecondary }}>Booking details</span>
        )}
      </MobileDetailsHeader>
      {mobileDetailsExpanded && (loading || booking) && (
        <MobileDetailsBody>
          <div style={{ padding: "0 20px 20px" }}>{renderRightCol({ mobileBodyOnly: true })}</div>
        </MobileDetailsBody>
      )}
      <MobileScrollArea>
        <MobileScrollInner>{renderLeftCol()}</MobileScrollInner>
      </MobileScrollArea>
      {renderFooter()}
    </DrawerInner>
  );

  const desktopContent = (
    <DrawerInner>
      <TwoCol>
        {renderLeftCol()}
        {renderRightCol()}
      </TwoCol>
      {renderFooter()}
    </DrawerInner>
  );

  const mainContent = isMobile ? mobileContent : desktopContent;

  return isMobile ? (
    <Drawer.Root
      open={visible}
      onOpenChange={open => !open && onClose()}
      snapPoints={[1]}
      activeSnapPoint={1}
      dismissible
    >
      <Drawer.Portal>
        <Overlay />
        <MobileShell>
          <ThumbArea>
            <DrawerHandle />
          </ThumbArea>
          {mainContent}
        </MobileShell>
      </Drawer.Portal>
    </Drawer.Root>
  ) : (
    <Drawer.Root open={visible} onOpenChange={open => !open && onClose()} direction="right" dismissible handleOnly>
      <Drawer.Portal>
        <Overlay />
        <DesktopShell style={{ "--initial-transform": "calc(100% + 8px)" }}>
          {mainContent}
        </DesktopShell>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default BookingDetailsDrawer;
