"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import styled, { keyframes } from "styled-components";
import { Drawer } from "vaul";
import {
  MessageSquare,
  Send,
  X,
  Paperclip,
  Plus,
  User,
} from "lucide-react";
import { Empty, Input, Typography, Skeleton, Modal } from "antd";
import message from "@/lib/message";
import { businessConversationService } from "@/services/apiService";
import EmojiQuickPick from "@/components/chat/EmojiQuickPick";
import { useConversationWebSocket } from "@/hooks/useConversationWebSocket";
import DashboardBreadcrumb from "../../DashboardBreadcrumb";
import { theme } from "@/components/theme";

const { Text } = Typography;

const MODAL_DRAWER_BREAKPOINT = 768;
const POLL_MS = 12000;
const POLL_MS_WHEN_WS_CONNECTED = 60000;

const colors = {
  primary: "#ff385c",
  textPrimary: "#1f2937",
  textSecondary: "#64748b",
  border: "#f1f5f9",
  lightBg: "#f8fafc",
  chart: { blue: "#3b82f6", purple: "#8b5cf6", teal: "#14b8a6" },
};

const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const formatTime = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatShortTime = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }
  return d.toLocaleString("en-US", { month: "short", day: "numeric" });
};

/* ── Avatar: Lucide User icon in circle ── */
function UserAvatar({ size = 38 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: colors.border,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: colors.textSecondary,
        flexShrink: 0,
      }}
    >
      <User size={Math.round(size * 0.5)} strokeWidth={2} />
    </div>
  );
}

/* ─────────────── Styled Components ─────────────── */

const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 24px;
  background-color: #fff;
  min-height: 100vh;
  @media (max-width: 768px) {
    padding: 12px;
    gap: 12px;
  }
`;

const DashboardHeader = styled.div`
  display: flex;
  width: fit-content;
  justify-content: space-between;
  align-items: center;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 4px;
    width: 100%;
  }
`;

const StyledTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #222222;
  margin: 0 0 4px 0;
  line-height: 1.2;
  @media (max-width: 768px) {
    font-size: 22px;
  }
`;

const HeaderSubtitle = styled(Text)`
  font-size: 15px;
  color: ${colors.textSecondary};
  display: block;
  line-height: 1.4;
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const ResponsiveDivider = styled.hr`
  margin: 24px 0;
  border: none;
  border-top: 1px solid ${colors.border};
  @media (max-width: 768px) {
    margin: 16px 0;
  }
`;

const SectionTitle = styled.div`
  font-weight: 600;
  font-size: 17px;
  color: ${colors.textPrimary};
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const SectionDescription = styled(Text)`
  font-size: 14px;
  color: ${colors.textSecondary};
  display: block;
  margin-bottom: 12px;
`;

/* ── Two-column Messages Layout ── */
const MessagesLayout = styled.div`
  display: grid;
  grid-template-columns: 320px 1fr;
  border-radius: 16px;
  border: 1px solid ${colors.border};
  overflow: hidden;
  background: #fff;
  height: calc(100vh - 320px);
  min-height: 480px;
  max-height: 680px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
`;

/* ── Left Sidebar ── */
const ConversationSidebar = styled.div`
  border-right: 1px solid ${colors.border};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
`;

const SidebarTopBar = styled.div`
  padding: 14px 16px;
  border-bottom: 1px solid ${colors.border};
  flex-shrink: 0;
`;

const FilterTabsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

const FilterTab = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13.5px;
  font-weight: ${(p) => (p.$active ? "700" : "400")};
  color: ${(p) => (p.$active ? colors.textPrimary : colors.textSecondary)};
  padding: 4px 9px;
  border-radius: 6px;
  transition: all 0.15s ease;
  &:hover {
    background: ${colors.lightBg};
  }
`;

const MarkReadBtn = styled.button`
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: ${colors.textSecondary};
  padding: 4px 2px;
  white-space: nowrap;
  &:hover {
    color: ${colors.textPrimary};
  }
`;

const ThreadListWrap = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 6px 0;
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #e5e7eb;
    border-radius: 4px;
  }
`;

const ThreadItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 11px;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease, margin 0.2s ease, padding 0.2s ease, border-radius 0.2s ease;
  ${(p) =>
    p.$active
      ? `
    background: #fff;
    margin: 5px 10px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.09);
    padding: 12px 14px;
  `
      : `
    padding: 11px 16px;
    border-bottom: 1px solid ${colors.border};
    &:hover { background: ${colors.lightBg}; }
    &:last-child { border-bottom: none; }
  `}
`;

const ThreadContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ThreadNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
`;

const ThreadName = styled.span`
  font-size: 13.5px;
  font-weight: 600;
  color: ${colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
`;

const ThreadBadge = styled.span`
  font-size: 10.5px;
  color: ${colors.textSecondary};
  background: #f1f5f9;
  border-radius: 20px;
  padding: 1px 7px;
  white-space: nowrap;
  flex-shrink: 0;
`;

const ThreadPreview = styled.div`
  font-size: 12.5px;
  color: ${colors.textSecondary};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
`;

const ThreadTime = styled.div`
  font-size: 11px;
  color: ${colors.textSecondary};
  flex-shrink: 0;
  margin-top: 2px;
`;

const SidebarFABRow = styled.div`
  padding: 12px 16px;
  border-top: 1px solid ${colors.border};
  display: flex;
  justify-content: center;
  flex-shrink: 0;
`;

const NewMessageFAB = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  border: 1px solid ${colors.border};
  border-radius: 999px;
  padding: 8px 22px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
  font-size: 13px;
  font-weight: 500;
  color: ${colors.primary};
  transition: all 0.15s ease;
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.13);
    transform: translateY(-1px);
  }
`;

/* ── Right Chat Panel ── */
const ChatPanel = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: ${colors.lightBg};
`;

const ChatPanelHeader = styled.div`
  padding: 14px 24px;
  border-bottom: 1px solid ${colors.border};
  background: #fff;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
`;

const ChatHeaderInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ChatName = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: ${colors.textPrimary};
`;

const ChatSubtitle = styled.div`
  font-size: 12px;
  color: ${colors.textSecondary};
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MessagesScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #e5e7eb;
    border-radius: 4px;
  }
`;

const MsgRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  justify-content: ${(p) => (p.$isBusiness ? "flex-end" : "flex-start")};
`;

const BubbleGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${(p) => (p.$isBusiness ? "flex-end" : "flex-start")};
  max-width: 70%;
`;

const Bubble = styled.div`
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 13.5px;
  line-height: 1.55;
  word-break: break-word;
  white-space: pre-wrap;
  ${(p) =>
    p.$isBusiness
      ? `
    background: ${colors.primary};
    color: #fff;
    border-bottom-right-radius: 5px;
    box-shadow: 0 2px 8px ${hexToRgba(colors.primary, 0.28)};
  `
      : `
    background: #fff;
    color: ${colors.textPrimary};
    border-bottom-left-radius: 5px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  `}
`;

const MsgTime = styled.div`
  font-size: 10.5px;
  margin-top: 4px;
  color: ${colors.textSecondary};
  opacity: 0.75;
`;

const TypingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TypingText = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  font-style: italic;
`;

const ChatEmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #d1d5db;
  p {
    font-size: 15px;
    color: ${colors.textSecondary};
    margin: 0;
  }
`;

/* ── Input Bar ── */
const ChatInputBarWrap = styled.div`
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid ${colors.border};
  flex-shrink: 0;
`;

const InputBarOuter = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border-radius: 999px;
  padding: 5px 5px 5px 8px;
  border: 1px solid ${colors.border};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease;
  &:focus-within {
    box-shadow: 0 2px 14px rgba(0, 0, 0, 0.1);
  }
`;

const AttachBtn = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #4b5563;
  flex-shrink: 0;
  transition: background 0.15s ease;
  &:hover {
    background: #e5e7eb;
  }
`;

const StyledTextareaWrap = styled.div`
  flex: 1;
  min-width: 0;
  .ant-input,
  textarea {
    padding: 6px 0 !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    resize: none;
    font-size: 13.5px;
    line-height: 1.5;
  }
  @media (max-width: 768px) {
    .ant-input,
    textarea {
      font-size: 16px !important;
    }
  }
`;

const SendPillBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${(p) => (p.$disabled ? "#f3f4f6" : colors.primary)};
  color: ${(p) => (p.$disabled ? "#9ca3af" : "#fff")};
  border: none;
  border-radius: 999px;
  padding: 8px 18px;
  cursor: ${(p) => (p.$disabled ? "not-allowed" : "pointer")};
  font-size: 13.5px;
  font-weight: 500;
  flex-shrink: 0;
  transition: all 0.15s ease;
  &:hover:not([disabled]) {
    background: #e01b46;
  }
`;

/* ── Mobile List ── */
const ListCard = styled.div`
  border-radius: ${theme.token.borderRadius}px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
  background: #fff;
`;

const MobileRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  border-bottom: 1px solid ${colors.border};
  transition: background 0.15s ease;
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: ${colors.lightBg};
  }
`;

const RowMain = styled.div`
  flex: 1;
  min-width: 0;
`;

const GuestName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin-bottom: 2px;
`;

const Preview = styled.div`
  font-size: 12.5px;
  color: ${colors.textSecondary};
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/* ── Mobile Drawer ── */
const VaulDrawerContent = styled(Drawer.Content)`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  z-index: 1001;
  outline: none;
  display: flex;
  flex-direction: column;
  height: 90vh;
  max-height: 90vh;
  min-height: 70vh;
`;

const DrawerBodyWrap = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const DrawerHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
`;

/* ── Skeleton ── */
const shimmer = keyframes`
  0% { background-position: -468px 0; }
  100% { background-position: 468px 0; }
`;

const SkeletonBase = styled.div`
  background: #f0f0f0;
  background-image: linear-gradient(to right, #f0f0f0 0%, #e8e8e8 20%, #f0f0f0 40%, #f0f0f0 100%);
  background-repeat: no-repeat;
  background-size: 800px 100%;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: ${(p) => p.$radius || "6px"};
  width: ${(p) => p.$width || "100%"};
  height: ${(p) => p.$height || "20px"};
`;

const BubbleSkeleton = styled(SkeletonBase)`
  height: 48px;
  border-radius: 16px;
`;

/* ─────────────── Component ─────────────── */

export default function BusinessMessages() {
  const searchParams = useSearchParams();
  const openBookingId = searchParams.get("booking_id");
  const openConversationId = searchParams.get("conversation_id");

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState("all");
  const [newMessageModalOpen, setNewMessageModalOpen] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const messagesEndRef = useRef(null);
  const hasAutoOpenedRef = useRef(false);

  const ws = useConversationWebSocket({
    conversationId: selected?.id ?? null,
    guestInboxToken: null,
    initialMessages: selected?.messages ?? [],
    initialReadStatus: selected
      ? {
          last_read_by_booker_at: selected.last_read_by_booker_at ?? null,
          last_read_by_business_at: selected.last_read_by_business_at ?? null,
        }
      : null,
  });

  const displayMessages =
    selected?.id && ws.messages?.length ? ws.messages : selected?.messages ?? [];
  const typingGuest = ws.typing?.booker?.active
    ? ws.typing.booker.displayName || "Guest"
    : null;
  const hasTyping = !!typingGuest;

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth <= MODAL_DRAWER_BREAKPOINT);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchList = useCallback(async () => {
    const result = await businessConversationService.getList();
    if (result.success) setList(result.data || []);
    setLoading(false);
  }, []);

  const fetchDetail = useCallback(async (id, isInitialLoad = false) => {
    if (!id) return;
    if (isInitialLoad) setDetailLoading(true);
    const result = await businessConversationService.getDetail(id);
    if (result.success) setSelected(result.data);
    if (isInitialLoad) setDetailLoading(false);
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // When we land with ?booking_id= or ?conversation_id=, open that thread once list is loaded
  useEffect(() => {
    if (loading || hasAutoOpenedRef.current) return;

    const bid = openBookingId ? Number(openBookingId) : null;
    const matchByBooking = (c) => {
      const b = c.booking;
      if (b == null) return false;
      const bId = typeof b === "object" && b !== null && "id" in b ? b.id : b;
      return Number(bId) === Number(openBookingId) || String(bId) === String(openBookingId);
    };

    if (openConversationId) {
      const conv = list.find((c) => String(c.id) === openConversationId);
      hasAutoOpenedRef.current = true;
      if (conv) openConversation(conv);
    } else if (openBookingId && bid) {
      const conv = list.find(matchByBooking);
      hasAutoOpenedRef.current = true;
      if (conv) {
        openConversation(conv);
      } else {
        // Business initiates: get or create conversation for this booking
        setDetailLoading(true);
        businessConversationService.startByBooking(bid).then((result) => {
          setDetailLoading(false);
          if (result.success && result.data) {
            setSelected(result.data);
            setReplyText("");
            fetchList();
            if (isMobile) setOpen(true);
          } else {
            message.error(result.error || "Could not start conversation");
          }
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, openBookingId, openConversationId, list]);

  useEffect(() => {
    if (!selected?.id) return;
    const interval = ws.connected ? POLL_MS_WHEN_WS_CONNECTED : POLL_MS;
    const t = setInterval(() => fetchDetail(selected.id, false), interval);
    return () => clearInterval(t);
  }, [selected?.id, fetchDetail, ws.connected]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  const openConversation = (conv) => {
    setSelected(conv);
    setReplyText("");
    fetchDetail(conv.id, true);
    if (isMobile) setOpen(true);
  };

  useEffect(() => {
    if (selected?.id) ws.sendMarkRead();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, open]);

  const closeConversation = () => setOpen(false);

  const isUnread = useCallback((c) => {
    const lastMsgAt = c.last_message_at ? new Date(c.last_message_at).getTime() : 0;
    if (!lastMsgAt) return false;
    const readAt = c.last_read_by_business_at ? new Date(c.last_read_by_business_at).getTime() : 0;
    return lastMsgAt > readAt;
  }, []);

  const unreadList = useMemo(() => list.filter(isUnread), [list, isUnread]);

  const filteredList = useMemo(
    () => (filter === "unread" ? unreadList : list),
    [filter, list, unreadList]
  );

  const handleMarkAllRead = useCallback(async () => {
    if (unreadList.length === 0) return;
    setMarkingAllRead(true);
    let done = 0;
    for (const c of unreadList) {
      const result = await businessConversationService.markRead(c.id);
      if (result.success) done++;
    }
    setMarkingAllRead(false);
    fetchList();
    if (done > 0) message.success(`Marked ${done} conversation${done !== 1 ? "s" : ""} as read`);
  }, [unreadList, fetchList]);

  const handleNewMessageSelect = (conv) => {
    setNewMessageModalOpen(false);
    openConversation(conv);
  };

  const handleSendReply = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!selected?.id || !replyText.trim()) return;
    setSending(true);
    const result = await businessConversationService.sendMessage(
      selected.id,
      replyText.trim()
    );
    if (result.success) {
      setReplyText("");
      fetchDetail(selected.id);
      fetchList();
    } else {
      message.error(result.error || "Failed to send reply");
    }
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  /* Shared chat body (messages + input) */
  const renderChatBody = (bgOverride) => (
    <>
      <MessagesScroll style={bgOverride ? { background: bgOverride } : undefined}>
        {detailLoading ? (
          <>
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <BubbleSkeleton style={{ width: "62%" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <BubbleSkeleton style={{ width: "52%" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <BubbleSkeleton style={{ width: "44%" }} />
            </div>
          </>
        ) : displayMessages.length === 0 ? (
          <Empty description="No messages yet" style={{ margin: "auto" }} />
        ) : (
          displayMessages.map((msg) => {
            const isBiz = msg.sender_type === "business";
            return (
              <MsgRow key={msg.id} $isBusiness={isBiz}>
                {!isBiz && <UserAvatar size={30} />}
                <BubbleGroup $isBusiness={isBiz}>
                  <Bubble $isBusiness={isBiz}>{msg.text}</Bubble>
                  <MsgTime>{formatTime(msg.created_at)}</MsgTime>
                </BubbleGroup>
                {isBiz && <UserAvatar size={30} />}
              </MsgRow>
            );
          })
        )}
        {hasTyping && (
          <TypingRow>
            <UserAvatar size={26} />
            <TypingText>{typingGuest} is typing…</TypingText>
          </TypingRow>
        )}
        <div ref={messagesEndRef} />
      </MessagesScroll>

      <ChatInputBarWrap>
        <EmojiQuickPick onInsert={(emoji) => setReplyText((prev) => prev + emoji)} />
        <InputBarOuter>
          <AttachBtn type="button" aria-label="Attach file">
            <Paperclip size={15} />
          </AttachBtn>
          <StyledTextareaWrap>
            <Input.TextArea
              placeholder="Type something..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={ws.sendTypingStart}
              onBlur={ws.sendTypingStop}
              disabled={sending}
              autoSize={{ minRows: 1, maxRows: 5 }}
            />
          </StyledTextareaWrap>
          <SendPillBtn
            type="button"
            $disabled={!replyText.trim() || sending}
            disabled={!replyText.trim() || sending}
            onClick={handleSendReply}
          >
            <Send size={14} />
            Send
          </SendPillBtn>
        </InputBarOuter>
      </ChatInputBarWrap>
    </>
  );

  return (
    <DashboardWrapper>
      <DashboardBreadcrumb title="Messages" />

      <DashboardHeader>
        <div>
          <StyledTitle>Messages</StyledTitle>
          <HeaderSubtitle>Conversations with your guests</HeaderSubtitle>
        </div>
      </DashboardHeader>

      <ResponsiveDivider />

      <div>
        <SectionTitle>
          <MessageSquare size={20} color={colors.primary} />
          Conversations
        </SectionTitle>
        <SectionDescription>
          {!mounted || isMobile
            ? "Tap a conversation to view messages."
            : "Select a conversation to view and reply."}
        </SectionDescription>
      </div>

      {/* ── Messages UI ── */}
      {loading ? (
        <ListCard>
          {[1, 2, 3, 4].map((i) => (
            <MobileRow key={i} style={{ cursor: "default" }}>
              <SkeletonBase
                $radius="50%"
                style={{ width: 38, height: 38, flexShrink: 0 }}
              />
              <RowMain>
                <SkeletonBase $width="50%" $height="14px" style={{ marginBottom: 8 }} />
                <SkeletonBase $width="70%" $height="11px" />
              </RowMain>
              <SkeletonBase $width="44px" $height="11px" />
            </MobileRow>
          ))}
        </ListCard>
        ) : list.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No conversations yet"
          style={{ padding: "48px 24px" }}
        >
          <p style={{ color: "#717171", fontSize: 14 }}>
            When guests message you, conversations will appear here.
          </p>
        </Empty>
      ) : !mounted || isMobile ? (
        /* ── Mobile: flat list ── */
        <ListCard>
          {filteredList.map((c) => (
            <MobileRow key={c.id} onClick={() => openConversation(c)}>
              <UserAvatar size={40} />
              <RowMain>
                <GuestName>{c.booker_display || "Guest"}</GuestName>
                {c.last_message_preview && <Preview>{c.last_message_preview}</Preview>}
              </RowMain>
              <ThreadTime>{formatShortTime(c.last_message_at || c.created_at)}</ThreadTime>
            </MobileRow>
          ))}
        </ListCard>
      ) : (
        /* ── Desktop: two-column layout ── */
        <MessagesLayout>
          {/* Left sidebar */}
          <ConversationSidebar>
            <SidebarTopBar>
              <FilterTabsRow>
                <FilterTab $active={filter === "all"} onClick={() => setFilter("all")}>
                  All
                </FilterTab>
                <FilterTab
                  $active={filter === "unread"}
                  onClick={() => setFilter("unread")}
                >
                  Unread
                </FilterTab>
                <MarkReadBtn
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={unreadList.length === 0 || markingAllRead}
                  style={{ opacity: unreadList.length === 0 || markingAllRead ? 0.6 : 1 }}
                >
                  {markingAllRead ? "Marking…" : "Mark all as read"}
                </MarkReadBtn>
              </FilterTabsRow>
            </SidebarTopBar>

            <ThreadListWrap>
              {filteredList.map((conv) => (
                <ThreadItem
                  key={conv.id}
                  $active={selected?.id === conv.id}
                  onClick={() => openConversation(conv)}
                >
                  <UserAvatar size={36} />
                  <ThreadContent>
                    <ThreadNameRow>
                      <ThreadName>{conv.booker_display || "Guest"}</ThreadName>
                      {conv.class_title && (
                        <ThreadBadge>{conv.class_title.split(" ")[0]}</ThreadBadge>
                      )}
                    </ThreadNameRow>
                    <ThreadPreview>
                      {conv.last_message_preview || "No messages yet"}
                    </ThreadPreview>
                  </ThreadContent>
                  <ThreadTime>
                    {formatShortTime(conv.last_message_at || conv.created_at)}
                  </ThreadTime>
                </ThreadItem>
              ))}
            </ThreadListWrap>

            <SidebarFABRow>
              <NewMessageFAB type="button" onClick={() => setNewMessageModalOpen(true)}>
                <Plus size={14} />
                New Message
              </NewMessageFAB>
            </SidebarFABRow>
          </ConversationSidebar>

          {/* Right chat panel */}
          <ChatPanel>
            {selected ? (
              <>
                <ChatPanelHeader>
                  <UserAvatar size={36} />
                  <ChatHeaderInfo>
                    <ChatName>{selected.booker_display || "Guest"}</ChatName>
                    {selected.booker_email && (
                      <ChatSubtitle>{selected.booker_email}</ChatSubtitle>
                    )}
                    {(selected.class_title || selected.booking_reference) && (
                      <ChatSubtitle>
                        {[selected.class_title, selected.booking_reference]
                          .filter(Boolean)
                          .join(" · ")}
                      </ChatSubtitle>
                    )}
                  </ChatHeaderInfo>
                </ChatPanelHeader>
                {renderChatBody()}
              </>
            ) : (
              <ChatEmptyState>
                <MessageSquare size={44} />
                <p>Select a conversation to start chatting</p>
              </ChatEmptyState>
            )}
          </ChatPanel>
        </MessagesLayout>
      )}

      {/* ── Mobile drawer ── */}
      {mounted && isMobile && selected && (
        <Drawer.Root
          open={open}
          onOpenChange={(o) => !o && closeConversation()}
          repositionInputs={false}
        >
          <Drawer.Portal>
            <Drawer.Overlay
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.4)",
                zIndex: 1000,
              }}
            />
            <VaulDrawerContent>
              <Drawer.Handle
                style={{
                  width: 40,
                  height: 4,
                  background: "#e5e7eb",
                  borderRadius: 2,
                  margin: "12px auto",
                  flexShrink: 0,
                }}
              />
              <DrawerBodyWrap>
                <DrawerHeader>
                  <UserAvatar size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 16,
                        color: colors.textPrimary,
                      }}
                    >
                      {selected.booker_display || "Guest"}
                    </div>
                    {selected.booker_email && (
                      <div style={{ fontSize: 12, color: colors.textSecondary }}>
                        {selected.booker_email}
                      </div>
                    )}
                    {(selected.class_title || selected.booking_reference) && (
                      <div style={{ fontSize: 12, color: colors.textSecondary }}>
                        {[selected.class_title, selected.booking_reference]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={closeConversation}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 4,
                    }}
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </DrawerHeader>
                {renderChatBody(colors.lightBg)}
              </DrawerBodyWrap>
            </VaulDrawerContent>
          </Drawer.Portal>
        </Drawer.Root>
        )}

      {/* New Message: select booker modal */}
      <Modal
        title="Select a guest to message"
        open={newMessageModalOpen}
        onCancel={() => setNewMessageModalOpen(false)}
        footer={null}
        width={400}
        styles={{ body: { maxHeight: 360, overflowY: "auto", padding: 0 } }}
      >
        {list.length === 0 ? (
          <Empty
            description="No conversations yet"
            style={{ padding: "24px 16px" }}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <p style={{ color: colors.textSecondary, fontSize: 13 }}>
              When guests message you, they will appear here.
            </p>
          </Empty>
        ) : (
          <div style={{ padding: "4px 0" }}>
            {list.map((conv) => (
              <div
                key={conv.id}
                role="button"
                tabIndex={0}
                onClick={() => handleNewMessageSelect(conv)}
                onKeyDown={(e) => e.key === "Enter" && handleNewMessageSelect(conv)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  cursor: "pointer",
                  borderBottom: `1px solid ${colors.border}`,
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.lightBg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <UserAvatar size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: colors.textPrimary,
                      marginBottom: 2,
                    }}
                  >
                    {conv.booker_display || "Guest"}
                  </div>
                  {conv.last_message_preview && (
                    <div
                      style={{
                        fontSize: 12,
                        color: colors.textSecondary,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {conv.last_message_preview}
                    </div>
                  )}
                </div>
                <ThreadTime>
                  {formatShortTime(conv.last_message_at || conv.created_at)}
                </ThreadTime>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </DashboardWrapper>
  );
}
