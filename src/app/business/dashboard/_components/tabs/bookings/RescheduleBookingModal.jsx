"use client";

import React, { useState, useEffect } from "react";
import styled, { createGlobalStyle, keyframes } from "styled-components";
import { Modal } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, AlertTriangle, Info as InfoIcon, X,
  CheckCircle, ChevronDown, ChevronLeft, ChevronRight, ArrowRight,
} from "lucide-react";
import { Drawer } from "vaul";
import moment from "moment";

import message from "@/lib/message";
import { bookingService } from "@/services/apiService";
import { theme } from "@/components/theme";

const PRIMARY = theme.token.colorPrimary;

// ─── GLOBAL ──────────────────────────────────────────────────────────────────

const ModalGlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap');
  .rs-modal .ant-modal-content { padding:0!important; border-radius:18px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,.16); }
  .rs-modal .ant-modal-body { padding:0; }
`;

// ─── LAYOUT ──────────────────────────────────────────────────────────────────

const Shell = styled.div`
  font-family: 'Geist', -apple-system, sans-serif;
  display: flex; flex-direction: column;
  max-height: 84vh; background: white;
`;
const Head = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px 15px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
`;
const HeadInfo = styled.div`
  .eyebrow { font-size:11px; font-weight:600; letter-spacing:.7px; text-transform:uppercase; color:#9ca3af; margin-bottom:2px; }
  .name { font-size:16px; font-weight:600; color:#111827; }
`;
const IconBtn = styled.button`
  width:28px; height:28px; border-radius:50%;
  border:1px solid #e5e7eb; background:transparent;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; color:#6b7280; transition:background .12s,color .12s;
  &:hover { background:#f3f4f6; color:#111827; }
  &:disabled { opacity:.3; cursor:default; }
`;
const Body = styled.div`
  flex:1; overflow-y:auto; padding:18px 20px;
  display:flex; flex-direction:column; gap:18px;
  &::-webkit-scrollbar { width:3px; }
  &::-webkit-scrollbar-thumb { background:#e5e7eb; border-radius:3px; }
`;
const Foot = styled.div`
  flex-shrink:0; border-top:1px solid #f0f0f0;
  padding:13px 20px; display:flex; align-items:center;
  justify-content:space-between; background:white;
`;
const FootHint = styled.div`
  font-size:13px; color:#9ca3af;
  b { color:#374151; font-weight:500; }
`;
const Divider = styled.div`height:1px; background:#f0f0f0; flex-shrink:0;`;

// ─── DATE STRIP ──────────────────────────────────────────────────────────────

const MonthRow = styled.div`
  display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;
`;
const MonthLabel = styled.span`font-size:13px; font-weight:600; color:#374151;`;
const DateStrip = styled.div`display:grid; grid-template-columns:repeat(7,1fr); gap:5px;`;
const DateChip = styled.button`
  display:flex; flex-direction:column; align-items:center; gap:2px;
  padding:9px 3px 8px; border-radius:9px;
  border:1.5px solid ${p => p.$active ? PRIMARY : p.$has ? "#e5e7eb" : "transparent"};
  background:${p => p.$active ? PRIMARY : "transparent"};
  cursor:${p => p.$has ? "pointer" : "default"}; opacity:${p => p.$has ? 1 : .28};
  transition:border-color .12s, background .12s;
  .dow { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:.3px; color:${p => p.$active ? "rgba(255,255,255,.65)" : "#9ca3af"}; }
  .day { font-size:15px; font-weight:600; color:${p => p.$active ? "white" : "#111827"}; }
  .dot { width:4px; height:4px; border-radius:50%; background:${p => p.$active ? "rgba(255,255,255,.55)" : PRIMARY}; opacity:${p => p.$has ? 1 : 0}; }
  &:hover:not(:disabled) {
    border-color:${p => !p.$active && p.$has ? PRIMARY + "66" : undefined};
    background:${p => !p.$active && p.$has ? PRIMARY + "0a" : undefined};
  }
`;

// ─── TIME GRID ───────────────────────────────────────────────────────────────

const SectionTitle = styled.div`
  font-size:11px; font-weight:600; text-transform:uppercase;
  letter-spacing:.6px; color:#9ca3af; margin-bottom:8px;
`;
const TimeGrid = styled.div`display:grid; grid-template-columns:repeat(3,1fr); gap:8px;`;
const TimeChip = styled.button`
  display:flex; flex-direction:column; align-items:center; gap:3px;
  padding:12px 8px 11px; border-radius:10px;
  border:1.5px solid ${p => p.$active ? PRIMARY : "#e5e7eb"};
  background:${p => p.$active ? PRIMARY + "0d" : "white"};
  cursor:${p => p.$disabled ? "not-allowed" : "pointer"}; opacity:${p => p.$disabled ? .4 : 1};
  transition:all .12s; box-shadow:${p => p.$active ? `0 0 0 3px ${PRIMARY}22` : "none"};
  .tval { font-size:14px; font-weight:600; color:${p => p.$active ? PRIMARY : "#111827"}; font-variant-numeric:tabular-nums; }
  .sval { font-size:11px; color:${p => p.$active ? PRIMARY : p.$full ? "#dc2626" : p.$tight ? "#d97706" : "#6b7280"}; }
  .pval { font-size:11px; font-weight:500; color:${p => p.$active ? PRIMARY : "#374151"}; }
  &:hover:not(:disabled) {
    border-color:${p => p.$active ? PRIMARY : PRIMARY + "88"};
    background:${p => p.$active ? PRIMARY + "0d" : PRIMARY + "05"};
  }
`;

// ─── WARNINGS ────────────────────────────────────────────────────────────────

const WarningBox = styled.div`
  display:flex; align-items:flex-start; gap:10px; padding:10px 12px; border-radius:10px;
  background:${p => p.$type === "warning" ? "#fffbeb" : "#eff6ff"};
  border:1px solid ${p => p.$type === "warning" ? "#fde68a" : "#bfdbfe"};
  .icon { color:${p => p.$type === "warning" ? "#d97706" : "#3b82f6"}; flex-shrink:0; margin-top:1px; }
  .title { font-size:12.5px; font-weight:600; color:#374151; margin-bottom:2px; }
  .desc { font-size:12px; color:#6b7280; line-height:1.45; }
  b { color:#374151; font-weight:600; }
`;

// ─── OTHER CLASSES — TWO-LEVEL ACCORDION ─────────────────────────────────────

const AccTrigger = styled.button`
  display:flex; align-items:center; justify-content:space-between;
  width:100%; padding:11px 14px; border-radius:10px;
  border:1px solid #e5e7eb; background:#fafafa; cursor:pointer;
  transition:border-color .12s, background .12s;
  .left { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:500; color:#374151; }
  .badge { font-size:11px; font-weight:600; background:#efefef; color:#6b7280; padding:2px 7px; border-radius:20px; }
  &:hover { border-color:#d1d5db; background:#f3f4f6; }
`;

const ClassList = styled(motion.div)`
  display:flex; flex-direction:column; gap:6px; padding-top:8px; overflow:hidden;
`;

const ClassCard = styled.div`
  border-radius:10px; border:1px solid #e5e7eb; overflow:hidden;
`;

const ClassCardHeader = styled.button`
  display:flex; align-items:center; justify-content:space-between;
  width:100%; padding:11px 14px; background:white; cursor:pointer; text-align:left;
  border:none; border-bottom:${p => p.$open ? "1px solid #f0f0f0" : "none"};
  transition:background .1s;
  &:hover { background:#fafafa; }
`;

const ClassCardInfo = styled.div`
  .cname { font-size:13px; font-weight:600; color:#111827; }
  .ccount { font-size:11px; color:#9ca3af; margin-top:1px; }
`;

const ClassSlotGrid = styled(motion.div)`
  display:grid; grid-template-columns:repeat(3,1fr); gap:6px; padding:10px 12px 12px; overflow:hidden;
`;

const MiniTimeChip = styled.button`
  display:flex; flex-direction:column; align-items:center; gap:2px;
  padding:10px 6px 9px; border-radius:8px;
  border:1.5px solid ${p => p.$active ? PRIMARY : "#e5e7eb"};
  background:${p => p.$active ? PRIMARY + "0d" : "white"};
  cursor:${p => p.$disabled ? "not-allowed" : "pointer"}; opacity:${p => p.$disabled ? .4 : 1};
  transition:all .12s; box-shadow:${p => p.$active ? `0 0 0 3px ${PRIMARY}22` : "none"};
  .tv { font-size:12px; font-weight:600; color:${p => p.$active ? PRIMARY : "#111827"}; }
  .sv { font-size:11px; color:${p => p.$active ? PRIMARY : p.$full ? "#dc2626" : p.$tight ? "#d97706" : "#6b7280"}; }
  .pv { font-size:11px; color:${p => p.$active ? PRIMARY : "#9ca3af"}; }
  &:hover:not(:disabled) { border-color:${p => p.$active ? PRIMARY : PRIMARY + "77"}; }
`;

// ─── SKELETON ────────────────────────────────────────────────────────────────

const pulse = keyframes`0%,100%{opacity:1}50%{opacity:.4}`;
const SkeleBar = styled.div`
  height:${p => p.$h || 14}px; border-radius:6px;
  background:#f0f0f0; width:${p => p.$w || "100%"};
  animation:${pulse} 1.4s ease infinite;
`;

// ─── BUTTONS ─────────────────────────────────────────────────────────────────

const Btn = styled.button`
  padding:9px 18px; border-radius:9px; font-size:13.5px; font-weight:500;
  font-family:inherit; cursor:pointer; transition:all .12s;
  display:flex; align-items:center; gap:5px;
  ${p => p.$primary ? `
    background:${p.disabled ? "#e5e7eb" : PRIMARY}; border:none;
    color:${p.disabled ? "#9ca3af" : "white"}; cursor:${p.disabled ? "not-allowed" : "pointer"};
    &:hover:not(:disabled) { filter:brightness(1.07); box-shadow:0 4px 12px ${PRIMARY}44; }
    &:active:not(:disabled) { transform:translateY(1px); }
  ` : `
    background:white; border:1.5px solid #e5e7eb; color:#6b7280;
    &:hover { border-color:#d1d5db; color:#374151; background:#f9fafb; }
  `}
`;

// ─── SUCCESS ─────────────────────────────────────────────────────────────────

const popOut = keyframes`0%{transform:scale(1);opacity:.5}100%{transform:scale(1.8);opacity:0}`;
const SuccessWrap = styled.div`
  display:flex; flex-direction:column; align-items:center;
  padding:48px 28px 44px; font-family:inherit;
`;
const SuccessRing = styled.div`
  position:relative; width:64px; height:64px; margin-bottom:20px;
  &::before { content:''; position:absolute; inset:0; border-radius:50%; background:${PRIMARY}22; animation:${popOut} 1.2s ease-out forwards; }
`;
const SuccessCircle = styled.div`
  width:64px; height:64px; border-radius:50%; background:${PRIMARY};
  display:flex; align-items:center; justify-content:center;
`;
const SCard = styled.div`
  margin-top:20px; width:100%; max-width:270px;
  background:#f8faff; border:1px solid #dbeafe; border-radius:12px; overflow:hidden;
`;
const SRow = styled.div`
  display:flex; justify-content:space-between; align-items:center;
  padding:9px 14px; font-size:13px;
  border-bottom:1px solid #dbeafe; &:last-child{border-bottom:none;}
  .l{color:#9ca3af} .v{color:#111827;font-weight:600}
`;

// ─── MAIN ────────────────────────────────────────────────────────────────────

const RescheduleContent = ({ booking, onSuccess, onCancel, isInDrawer }) => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [policyCheck, setPolicyCheck] = useState(null);
  const [checkingPolicy, setCheckingPolicy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [view, setView] = useState("selection");
  const [activeDateKey, setActiveDateKey] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [otherOpen, setOtherOpen] = useState(false);
  const [expandedClass, setExpandedClass] = useState(null); // class key of expanded sub-accordion

  useEffect(() => { if (booking) fetchSlots(); }, [booking]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const r = await bookingService.fetchAvailableRescheduleSlots(booking.id, { scope: "business" });
      if (r.success) {
        const data = r.data || [];
        setSlots(data);
        const same = data.filter(s => s.is_same_option !== false);
        if (same.length > 0) setActiveDateKey(same.map(s => s.date).sort()[0]);
      } else message.error(r.error || "Failed to fetch slots.");
    } catch { message.error("Error fetching slots."); }
    finally { setLoading(false); }
  };

  const sameSlots = slots.filter(s => s.is_same_option !== false);
  const otherSlots = slots.filter(s => s.is_same_option === false);

  // Group other slots by class_title (fallback to id)
  const otherByClass = otherSlots.reduce((acc, s) => {
    const key = s.class_title || s.class_id || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});
  const classKeys = Object.keys(otherByClass);

  const weekStart = moment().startOf("day").add(weekOffset * 7, "days");
  const weekDays = Array.from({ length: 7 }, (_, i) => weekStart.clone().add(i, "days"));
  const slotsByDate = sameSlots.reduce((acc, s) => { (acc[s.date] = acc[s.date] || []).push(s); return acc; }, {});
  const timesForDate = activeDateKey ? (slotsByDate[activeDateKey] || []) : [];

  const pickSlot = async (slot) => {
    if (!slot.is_valid || slot.id === selectedSlotId) return;
    setSelectedSlotId(slot.id);
    setSelectedSlot(slot);
    setCheckingPolicy(true);
    setPolicyCheck(null);
    try {
      const r = await bookingService.rescheduleBooking(booking.id, slot.id, true);
      if (r.success) setPolicyCheck(r.data);
      else { message.error(r.error || "Slot verification failed."); setSelectedSlotId(null); setSelectedSlot(null); }
    } catch { message.error("Error checking slot."); setSelectedSlotId(null); setSelectedSlot(null); }
    finally { setCheckingPolicy(false); }
  };

  const handleConfirm = async () => {
    if (!selectedSlotId) return;
    setConfirming(true);
    try {
      const r = await bookingService.rescheduleBooking(booking.id, selectedSlotId, false, "Rescheduled by business");
      if (r.success) { setView("success"); setTimeout(onSuccess, 2200); }
      else { message.error(r.error || "Reschedule failed."); setConfirming(false); }
    } catch { message.error("Unexpected error."); setConfirming(false); }
  };

  // ── SUCCESS ────────────────────────────────────────────────────────────────
  if (view === "success") {
    return (
      <SuccessWrap>
        <motion.div initial={{ scale: .3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}>
          <SuccessRing><SuccessCircle><CheckCircle size={28} color="white" strokeWidth={2.5} /></SuccessCircle></SuccessRing>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .22 }}
          style={{ textAlign: "center" }}>
          <div style={{ fontSize: 19, fontWeight: 700, color: "#111827", marginBottom: 5 }}>Booking rescheduled</div>
          <div style={{ fontSize: 13, color: "#9ca3af" }}>{booking?.user_name} has been moved to the new slot.</div>
        </motion.div>
        {selectedSlot && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .38 }}>
            <SCard>
              <SRow><span className="l">Date</span><span className="v">{moment(selectedSlot.date).format("ddd, MMM D")}</span></SRow>
              <SRow><span className="l">Time</span><span className="v">{moment(selectedSlot.time, "HH:mm:ss").format("h:mm A")}</span></SRow>
              {selectedSlot.class_title && <SRow><span className="l">Class</span><span className="v">{selectedSlot.class_title}</span></SRow>}
            </SCard>
          </motion.div>
        )}
      </SuccessWrap>
    );
  }

  // ── WARNINGS ───────────────────────────────────────────────────────────────
  const renderWarnings = () => {
    if (checkingPolicy) return <SkeleBar $h={50} />;
    if (!policyCheck) return null;
    const diff = parseFloat(policyCheck.price_difference);
    const isDiffClass = selectedSlot?.is_same_option === false;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {isDiffClass && (
          <WarningBox $type="warning">
            <div className="icon"><AlertTriangle size={14} /></div>
            <div>
              <div className="title">Different class</div>
              <div className="desc">Moving to <b>{selectedSlot.class_title || "another class"}{selectedSlot.option_title ? ` – ${selectedSlot.option_title}` : ""}</b>. Customer will be reassigned.</div>
            </div>
          </WarningBox>
        )}
        <WarningBox $type={policyCheck.warning_required ? "warning" : "info"}>
          <div className="icon">{policyCheck.warning_required ? <AlertTriangle size={14} /> : <InfoIcon size={14} />}</div>
          <div>
            <div className="title">{policyCheck.warning_required ? "Policy warning" : "Policy info"}</div>
            <div className="desc">{policyCheck.policy_message}</div>
          </div>
        </WarningBox>
        {diff !== 0 && (
          <WarningBox $type="warning">
            <div className="icon"><AlertTriangle size={14} /></div>
            <div>
              <div className="title">{diff > 0 ? "Price increase" : "Price decrease"}</div>
              <div className="desc">New session is <b>${Math.abs(diff).toFixed(2)}</b> {diff > 0 ? "more" : "less"}. Not charged or refunded automatically.</div>
            </div>
          </WarningBox>
        )}
      </div>
    );
  };

  return (
    <Shell>
      <Head>
        <HeadInfo>
          <div className="eyebrow">Reschedule</div>
          <div className="name">{booking?.user_name}</div>
        </HeadInfo>
        {!isInDrawer && <IconBtn onClick={onCancel}><X size={14} /></IconBtn>}
      </Head>

      <Body>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <SkeleBar $h={18} $w="45%" />
            <SkeleBar $h={76} />
            <SkeleBar $h={18} $w="35%" style={{ marginTop: 8 }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {[1,2,3,4,5,6].map(i => <SkeleBar key={i} $h={70} />)}
            </div>
          </div>
        ) : slots.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af", fontSize: 14 }}>
            No slots available to reschedule to.
          </div>
        ) : (
          <>
            {/* ── DATE STRIP ── */}
            {sameSlots.length > 0 && (
              <div>
                <MonthRow>
                  <MonthLabel>{weekDays[0].format("MMMM YYYY")}</MonthLabel>
                  <div style={{ display: "flex", gap: 4 }}>
                    <IconBtn onClick={() => setWeekOffset(o => o - 1)} disabled={weekOffset <= 0}><ChevronLeft size={14} /></IconBtn>
                    <IconBtn onClick={() => setWeekOffset(o => o + 1)}><ChevronRight size={14} /></IconBtn>
                  </div>
                </MonthRow>
                <DateStrip>
                  {weekDays.map(d => {
                    const key = d.format("YYYY-MM-DD");
                    const has = !!slotsByDate[key];
                    return (
                      <DateChip key={key} $active={activeDateKey === key} $has={has}
                        onClick={() => has && setActiveDateKey(key)} disabled={!has}>
                        <span className="dow">{d.format("dd").slice(0, 2)}</span>
                        <span className="day">{d.format("D")}</span>
                        <span className="dot" />
                      </DateChip>
                    );
                  })}
                </DateStrip>
              </div>
            )}

            {/* ── TIME GRID ── */}
            {activeDateKey && (
              <div>
                <SectionTitle>Available times · {moment(activeDateKey).format("ddd, MMM D")}</SectionTitle>
                {timesForDate.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#9ca3af" }}>No slots on this date.</div>
                ) : (
                  <TimeGrid>
                    {timesForDate.map(slot => {
                      const spots = slot.available_spots;
                      return (
                        <TimeChip key={slot.id}
                          $active={selectedSlotId === slot.id} $disabled={!slot.is_valid}
                          $full={spots === 0} $tight={spots > 0 && spots <= 3}
                          onClick={() => pickSlot(slot)} disabled={!slot.is_valid}>
                          <span className="tval">{moment(slot.time, "HH:mm:ss").format("h:mm A")}</span>
                          <span className="sval">{spots === 0 ? "Full" : `${spots} spot${spots !== 1 ? "s" : ""}`}</span>
                          <span className="pval">${parseFloat(slot.price).toFixed(2)}</span>
                        </TimeChip>
                      );
                    })}
                  </TimeGrid>
                )}
              </div>
            )}

            {/* ── INLINE WARNINGS ── */}
            <AnimatePresence>
              {selectedSlotId && (policyCheck || checkingPolicy) && (
                <motion.div key="warn"
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} transition={{ duration: .16 }}>
                  {renderWarnings()}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── OTHER CLASSES ── */}
            {otherSlots.length > 0 && (
              <>
                {sameSlots.length > 0 && <Divider />}
                <div>
                  <AccTrigger onClick={() => setOtherOpen(o => !o)}>
                    <div className="left">
                      <span>Other classes</span>
                      <span className="badge">{classKeys.length}</span>
                    </div>
                    <motion.div animate={{ rotate: otherOpen ? 180 : 0 }} transition={{ duration: .18 }}>
                      <ChevronDown size={15} color="#6b7280" />
                    </motion.div>
                  </AccTrigger>

                  <AnimatePresence initial={false}>
                    {otherOpen && (
                      <ClassList key="cl"
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: .22, ease: "easeInOut" }}>
                        {classKeys.map(classKey => {
                          const classSlots = otherByClass[classKey];
                          const isOpen = expandedClass === classKey;
                          const validCount = classSlots.filter(s => s.is_valid).length;
                          return (
                            <ClassCard key={classKey}>
                              <ClassCardHeader $open={isOpen}
                                onClick={() => setExpandedClass(isOpen ? null : classKey)}>
                                <ClassCardInfo>
                                  <div className="cname">{classKey}{classSlots[0]?.option_title ? ` · ${classSlots[0].option_title}` : ""}</div>
                                  <div className="ccount">{validCount} slot{validCount !== 1 ? "s" : ""} available</div>
                                </ClassCardInfo>
                                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: .15 }}>
                                  <ChevronDown size={14} color="#9ca3af" />
                                </motion.div>
                              </ClassCardHeader>

                              <AnimatePresence initial={false}>
                                {isOpen && (
                                  <ClassSlotGrid key="sg"
                                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }} transition={{ duration: .18, ease: "easeInOut" }}>
                                    {classSlots.map(slot => {
                                      const spots = slot.available_spots;
                                      return (
                                        <MiniTimeChip key={slot.id}
                                          $active={selectedSlotId === slot.id} $disabled={!slot.is_valid}
                                          $full={spots === 0} $tight={spots > 0 && spots <= 3}
                                          onClick={() => pickSlot(slot)} disabled={!slot.is_valid}>
                                          <span className="tv">{moment(slot.date).format("MMM D")}</span>
                                          <span className="sv">{moment(slot.time, "HH:mm:ss").format("h:mm A")}</span>
                                          <span className="pv">${parseFloat(slot.price).toFixed(2)}</span>
                                        </MiniTimeChip>
                                      );
                                    })}
                                  </ClassSlotGrid>
                                )}
                              </AnimatePresence>
                            </ClassCard>
                          );
                        })}
                      </ClassList>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </>
        )}
      </Body>

      <Foot>
        <FootHint>
          {selectedSlot
            ? <><b>{moment(selectedSlot.date).format("MMM D")}</b> · <b>{moment(selectedSlot.time, "HH:mm:ss").format("h:mm A")}</b></>
            : "Pick a date and time"}
        </FootHint>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={onCancel}>Cancel</Btn>
          <Btn $primary disabled={!selectedSlotId || checkingPolicy || confirming} onClick={handleConfirm}>
            {confirming ? "Confirming…" : <><span>Confirm</span><ArrowRight size={13} /></>}
          </Btn>
        </div>
      </Foot>
    </Shell>
  );
};

// ─── EXPORT ───────────────────────────────────────────────────────────────────

const RescheduleBookingModal = ({ visible, booking, onSuccess, onCancel }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth <= 576);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <ModalGlobalStyle />
      {isMobile ? (
        <Drawer.Root open={visible} onOpenChange={open => !open && onCancel()}>
          <Drawer.Portal>
            <Drawer.Overlay style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000 }} />
            <Drawer.Content style={{
              position: "fixed", bottom: 0, left: 0, right: 0, background: "white",
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              zIndex: 1001, outline: "none", display: "flex", flexDirection: "column", maxHeight: "92vh"
            }}>
              <Drawer.Handle style={{ width: 36, height: 4, background: "#e5e7eb", borderRadius: 2, margin: "10px auto", flexShrink: 0 }} />
              <RescheduleContent booking={booking} onSuccess={onSuccess} onCancel={onCancel} isInDrawer />
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      ) : (
        <Modal open={visible} onCancel={onCancel} footer={null} centered width={440}
          closable={false} className="rs-modal" destroyOnClose>
          <RescheduleContent booking={booking} onSuccess={onSuccess} onCancel={onCancel} isInDrawer={false} />
        </Modal>
      )}
    </>
  );
};

export default RescheduleBookingModal;