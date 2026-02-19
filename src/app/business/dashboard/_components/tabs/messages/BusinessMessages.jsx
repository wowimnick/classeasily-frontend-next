"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import styled, { keyframes } from "styled-components";
import { Drawer } from "vaul";
import { MessageSquare, ChevronRight, Send, X, Inbox, MessageCircle } from "lucide-react";
import { Empty, Drawer as AntDrawer, Input, Button, ConfigProvider, Card, Typography, Skeleton } from "antd";
import message from "@/lib/message";
import { businessConversationService } from "@/services/apiService";
import EmojiQuickPick from "@/components/chat/EmojiQuickPick";

const { Text } = Typography;

const MODAL_DRAWER_BREAKPOINT = 768;

const colors = {
  primary: "#ff385c",
  textPrimary: "#1f2937",
  textSecondary: "#64748b",
  border: "#f1f5f9",
  lightBg: "#f8fafc",
  chart: { blue: "#3b82f6", purple: "#8b5cf6", teal: "#14b8a6" },
};

const localAntDTheme = {
  token: {
    colorPrimary: colors.primary,
    borderRadius: 16,
  },
  components: {
    Card: { borderRadiusLG: 16, paddingLG: 20 },
    Button: { borderRadius: 12, controlHeight: 40 },
  },
};

const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/* --- Layout (aligned with Overview) --- */
const DashboardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 24px;
  background-color: #fff;
  box-shadow: inset 0px -1px 11px 1px #0000000d;
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

/* --- Metric cards (Overview-style) --- */
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
`;

const StatCardBase = styled(Card)`
  border-radius: ${localAntDTheme.token.borderRadius}px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
  margin-bottom: 0;
  height: 100%;
  min-height: 140px;
  transition: all 0.2s ease;
  .ant-card-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
  }
  @media (max-width: 768px) {
    min-height: 120px;
    border-radius: 12px;
    .ant-card-body {
      padding: 16px;
    }
  }
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
`;

const IconContainer = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(p) => p.$background || hexToRgba(colors.chart.blue, 0.1)};
  color: ${(p) => p.$iconcolor || colors.chart.blue};
  flex-shrink: 0;
  svg {
    width: 18px;
    height: 18px;
  }
  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const MetricValue = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: ${colors.textPrimary};
  display: flex;
  align-items: baseline;
  line-height: 1.2;
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const StatLabel = styled(Text)`
  font-size: 13px;
  color: ${colors.textSecondary};
  display: block;
  line-height: 1.3;
  margin-bottom: auto;
  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

/* --- Conversation list (Overview-style card) --- */
const ListCard = styled.div`
  border-radius: ${localAntDTheme.token.borderRadius}px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid ${colors.border};
  background: #fff;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  cursor: pointer;
  border-bottom: 1px solid ${colors.border};
  transition: background-color 0.2s ease;
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background-color: ${colors.lightBg};
  }
  @media (max-width: 640px) {
    padding: 14px 16px;
    gap: 12px;
  }
`;

const RowMain = styled.div`
  flex: 1;
  min-width: 0;
`;

const GuestName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin-bottom: 2px;
`;

const Preview = styled.div`
  font-size: 13px;
  color: ${colors.textSecondary};
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Meta = styled.div`
  font-size: 12px;
  color: ${colors.textSecondary};
  margin-top: 2px;
  opacity: 0.85;
`;

const ConversationPanel = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 0;
  overflow: hidden;
`;


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
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  h3 {
    margin: 0 0 4px;
    font-size: 18px;
    font-weight: 600;
    color: #334155;
  }
  .sub {
    font-size: 13px;
    color: #717171;
  }
  @media (max-width: 480px) {
    padding: 16px 20px;
    h3 { font-size: 16px; }
  }
`;

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const MsgRow = styled.div`
  display: flex;
  justify-content: ${(p) => (p.$isBusiness ? "flex-end" : "flex-start")};
`;

const Bubble = styled.div`
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
  ${(p) =>
    p.$isBusiness
      ? `background: ${colors.primary}; color: #fff; border-bottom-right-radius: 4px;`
      : `background: #fff; color: ${colors.textPrimary}; border: 1px solid ${colors.border}; border-bottom-left-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);`}
  @media (max-width: 480px) {
    max-width: 90%;
    padding: 10px 12px;
    font-size: 13px;
  }
`;

const MsgTime = styled.div`
  font-size: 11px;
  margin-top: 4px;
  color: ${(p) => (p.$isBusiness ? "rgba(255,255,255,0.7)" : "#a3a3a3")};
`;

const ReplyForm = styled.form`
  padding: 20px;
  border-top: 1px solid #ebebeb;
  background: #fff;
  flex-shrink: 0;
  margin-top: auto;
  @media (max-width: 480px) {
    padding: 16px 20px;
  }
`;

const InputContainer = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 26px;
  background: #fff;
  padding: 6px 6px 6px 16px;
  transition: all 0.2s ease;

  &:focus-within {
    border-color: ${colors.primary};
    box-shadow: 0 0 0 3px ${hexToRgba(colors.primary, 0.1)};
  }

  .ant-input {
    padding: 8px 0 !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    resize: none;
    font-size: 14px;
    line-height: 1.5;
  }
`;

const ReplyTextareaWrapper = styled.div`
  flex: 1;
  min-width: 0;
  padding-bottom: 2px;
`;

const SendBtn = styled(Button)`
  height: 36px !important;
  width: 36px !important;
  min-width: 36px !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border: none !important;
  background: ${(p) => (p.disabled ? "#f5f5f5" : colors.primary)} !important;
  &:hover {
    background: ${(p) => (p.disabled ? "#f5f5f5" : "#e01b46")} !important;
  }
  svg {
    color: ${(p) => (p.disabled ? "#d9d9d9" : "#fff")};
  }
`;

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
  margin-bottom: ${(p) => p.$mb ?? "0"};
`;

const ListSkeletonCard = styled(ListCard)``;
const RowSkeleton = styled(Row)`
  cursor: default;
  &:hover { background: #fff; }
`;

const ConversationSkeletonWrap = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 0;
  overflow: hidden;
`;
const ConvHeaderSkeleton = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 12px;
`;
const MessagesSkeletonArea = styled.div`
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8fafc;
  min-height: 0;
`;
const BubbleSkeleton = styled(SkeletonBase)`
  max-width: 70%;
  height: 48px;
  border-radius: 16px;
`;
const ReplySkeletonBar = styled.div`
  padding: 20px;
  border-top: 1px solid #ebebeb;
  background: #fff;
`;
const InputCapsuleSkeleton = styled(SkeletonBase)`
  height: 48px;
  border-radius: 26px;
`;

const POLL_MS = 12000;

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
  const messagesEndRef = useRef(null);
  const hasAutoOpenedRef = useRef(false);

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

  useEffect(() => {
    if (loading || hasAutoOpenedRef.current || list.length === 0) return;
    if (openConversationId) {
      const conv = list.find((c) => String(c.id) === openConversationId);
      if (conv) {
        hasAutoOpenedRef.current = true;
        openConversation(conv);
      }
    } else if (openBookingId) {
      const bid = Number(openBookingId);
      const conv = list.find((c) => c.booking === bid || c.booking === openBookingId);
      if (conv) {
        hasAutoOpenedRef.current = true;
        openConversation(conv);
      }
    }
  }, [loading, openBookingId, openConversationId, list]);

  useEffect(() => {
    if (!selected?.id) return;
    const t = setInterval(() => fetchDetail(selected.id, false), POLL_MS);
    return () => clearInterval(t);
  }, [selected?.id, fetchDetail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages]);

  const openConversation = (conv) => {
    setSelected(conv);
    setOpen(true);
    setReplyText("");
    fetchDetail(conv.id, true);
  };

  const closeConversation = () => setOpen(false);

  const stats = useMemo(() => {
    const total = list.length;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = list.filter(
      (c) => new Date(c.last_message_at || c.created_at || 0).getTime() >= weekAgo
    ).length;
    return { total, recent };
  }, [list]);

  const handleSendReply = async (e) => {
    e.preventDefault();
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

  return (
    <ConfigProvider theme={localAntDTheme}>
      <DashboardWrapper>
        <DashboardHeader>
          <div>
            <StyledTitle>Messages</StyledTitle>
            <HeaderSubtitle>Conversations with guests</HeaderSubtitle>
          </div>
        </DashboardHeader>

        <ResponsiveDivider />

        <div>
          <SectionTitle>
            <MessageCircle size={20} color={colors.primary} />
            Conversation overview
          </SectionTitle>
          <SectionDescription>
            Key metrics and recent conversations with your guests.
          </SectionDescription>
        </div>

        <StatsGrid>
          {loading ? (
            <>
              <StatCardBase>
                <Skeleton active paragraph={{ rows: 2 }} />
              </StatCardBase>
              <StatCardBase>
                <Skeleton active paragraph={{ rows: 2 }} />
              </StatCardBase>
            </>
          ) : (
            <>
              <StatCardBase>
                <div>
                  <StatHeader>
                    <IconContainer
                      $background={hexToRgba(colors.chart.blue, 0.1)}
                      $iconcolor={colors.chart.blue}
                    >
                      <MessageSquare size={18} />
                    </IconContainer>
                  </StatHeader>
                  <StatLabel>Total conversations</StatLabel>
                </div>
                <div>
                  <MetricValue>{stats.total}</MetricValue>
                </div>
              </StatCardBase>
              <StatCardBase>
                <div>
                  <StatHeader>
                    <IconContainer
                      $background={hexToRgba(colors.chart.teal, 0.1)}
                      $iconcolor={colors.chart.teal}
                    >
                      <Inbox size={18} />
                    </IconContainer>
                  </StatHeader>
                  <StatLabel>Active (last 7 days)</StatLabel>
                </div>
                <div>
                  <MetricValue>{stats.recent}</MetricValue>
                </div>
              </StatCardBase>
            </>
          )}
        </StatsGrid>

        <ResponsiveDivider />

        <div>
          <SectionTitle>
            <MessageSquare size={20} color={colors.primary} />
            Recent conversations
          </SectionTitle>
          <SectionDescription>
            Click a conversation to view and reply to messages.
          </SectionDescription>
        </div>

        {loading ? (
          <ListSkeletonCard>
            {[1, 2, 3, 4, 5].map((i) => (
              <RowSkeleton key={i}>
                <SkeletonBase $width={32} $height={32} $radius="8px" />
                <RowMain>
                  <SkeletonBase $width="50%" $height={16} $mb="8px" />
                  <SkeletonBase $width="70%" $height={12} />
                </RowMain>
                <SkeletonBase $width={64} $height={14} />
              </RowSkeleton>
            ))}
          </ListSkeletonCard>
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
        ) : (
          <ListCard>
            {list.map((c) => (
              <Row key={c.id} onClick={() => openConversation(c)}>
                <div style={{ color: colors.primary }}>
                  <MessageSquare size={24} />
                </div>
                <RowMain>
                  <GuestName>{c.booker_display || "Guest"}</GuestName>
                  {(c.class_title || c.booking_reference) && (
                    <Meta>
                      {[c.class_title, c.booking_reference].filter(Boolean).join(" · ")}
                    </Meta>
                  )}
                  {c.last_message_preview && (
                    <Preview>{c.last_message_preview}</Preview>
                  )}
                </RowMain>
                <div style={{ fontSize: 12, color: "#a3a3a3" }}>
                  {formatTime(c.last_message_at || c.created_at)}
                </div>
                <ChevronRight size={18} color="#717171" />
              </Row>
            ))}
          </ListCard>
        )}

        {mounted && selected && (
          <>
            {isMobile ? (
              <Drawer.Root open={open} onOpenChange={(o) => !o && closeConversation()} repositionInputs={false}>
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
                    <div style={{ width: 40, height: 4, background: "#e5e7eb", borderRadius: 2, margin: "12px auto", flexShrink: 0 }} />
                    <DrawerBodyWrap>
                      {detailLoading ? (
                        <ConversationSkeletonWrap>
                          <ConvHeaderSkeleton>
                            <SkeletonBase $width="120px" $height="18px" $mb="0" />
                            <SkeletonBase $width="160px" $height="12px" $mb="0" />
                          </ConvHeaderSkeleton>
                          <MessagesSkeletonArea>
                            <div style={{ display: "flex", justifyContent: "flex-start" }}>
                              <BubbleSkeleton style={{ width: "70%" }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                              <BubbleSkeleton style={{ width: "60%" }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-start" }}>
                              <BubbleSkeleton style={{ width: "50%" }} />
                            </div>
                          </MessagesSkeletonArea>
                          <ReplySkeletonBar>
                            <InputCapsuleSkeleton />
                          </ReplySkeletonBar>
                        </ConversationSkeletonWrap>
                      ) : (
                        <ConversationPanel>
                          <DrawerHeader style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h3>{selected.booker_display || "Guest"}</h3>
                              {selected.booker_email && <div className="sub">{selected.booker_email}</div>}
                              {(selected.class_title || selected.booking_reference) && (
                                <div className="sub">
                                  {[selected.class_title, selected.booking_reference].filter(Boolean).join(" · ")}
                                </div>
                              )}
                            </div>
                            <button type="button" onClick={closeConversation} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }} aria-label="Close">
                              <X size={20} />
                            </button>
                          </DrawerHeader>
                          <MessagesArea>
                            {(selected.messages || []).length === 0 ? (
                              <Empty description="No messages yet" style={{ margin: "auto" }} />
                            ) : (
                              (selected.messages || []).map((msg) => (
                                <MsgRow key={msg.id} $isBusiness={msg.sender_type === "business"}>
                                  <Bubble $isBusiness={msg.sender_type === "business"}>
                                    <div>{msg.text}</div>
                                    <MsgTime $isBusiness={msg.sender_type === "business"}>{formatTime(msg.created_at)}</MsgTime>
                                  </Bubble>
                                </MsgRow>
                              ))
                            )}
                            <div ref={messagesEndRef} />
                          </MessagesArea>
                          <ReplyForm onSubmit={handleSendReply}>
                            <EmojiQuickPick onInsert={(emoji) => setReplyText((prev) => prev + emoji)} />
                            <InputContainer>
                              <ReplyTextareaWrapper>
                                <Input.TextArea placeholder="Type your reply…" value={replyText} onChange={(e) => setReplyText(e.target.value)} disabled={sending} autoSize={{ minRows: 1, maxRows: 5 }} />
                              </ReplyTextareaWrapper>
                              <SendBtn htmlType="submit" type="primary" shape="circle" icon={<Send size={18} />} disabled={!replyText.trim() || sending} loading={sending} />
                            </InputContainer>
                          </ReplyForm>
                        </ConversationPanel>
                      )}
                    </DrawerBodyWrap>
                  </VaulDrawerContent>
                </Drawer.Portal>
              </Drawer.Root>
            ) : (
              <AntDrawer
                open={open}
                onClose={closeConversation}
                placement="right"
                width={480}
                height="100%"
                title={
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 18, color: "#334155", marginBottom: 4 }}>
                      {selected.booker_display || "Guest"}
                    </div>
                    {selected.booker_email && (
                      <div style={{ fontSize: 13, color: "#717171" }}>{selected.booker_email}</div>
                    )}
                    {(selected.class_title || selected.booking_reference) && (
                      <div style={{ fontSize: 13, color: "#717171" }}>
                        {[selected.class_title, selected.booking_reference].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </div>
                }
                styles={{
                  body: {
                    padding: 0,
                    height: "calc(100% - 56px)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  },
                }}
              >
                {detailLoading ? (
                  <ConversationSkeletonWrap>
                    <MessagesSkeletonArea style={{ flex: 1, minHeight: 0 }}>
                      <div style={{ display: "flex", justifyContent: "flex-start" }}>
                        <BubbleSkeleton style={{ width: "70%" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <BubbleSkeleton style={{ width: "60%" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-start" }}>
                        <BubbleSkeleton style={{ width: "50%" }} />
                      </div>
                    </MessagesSkeletonArea>
                    <ReplySkeletonBar>
                      <InputCapsuleSkeleton />
                    </ReplySkeletonBar>
                  </ConversationSkeletonWrap>
                ) : (
                <ConversationPanel>
                  <MessagesArea style={{ flex: 1, minHeight: 0 }}>
                    {(selected.messages || []).length === 0 ? (
                      <Empty description="No messages yet" style={{ margin: "auto" }} />
                    ) : (
                      (selected.messages || []).map((msg) => (
                        <MsgRow key={msg.id} $isBusiness={msg.sender_type === "business"}>
                          <Bubble $isBusiness={msg.sender_type === "business"}>
                            <div>{msg.text}</div>
                            <MsgTime $isBusiness={msg.sender_type === "business"}>{formatTime(msg.created_at)}</MsgTime>
                          </Bubble>
                        </MsgRow>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </MessagesArea>
                  <ReplyForm onSubmit={handleSendReply}>
                    <EmojiQuickPick onInsert={(emoji) => setReplyText((prev) => prev + emoji)} />
                    <InputContainer>
                      <ReplyTextareaWrapper>
                        <Input.TextArea placeholder="Type your reply…" value={replyText} onChange={(e) => setReplyText(e.target.value)} disabled={sending} autoSize={{ minRows: 1, maxRows: 5 }} />
                      </ReplyTextareaWrapper>
                      <SendBtn htmlType="submit" type="primary" shape="circle" icon={<Send size={18} />} disabled={!replyText.trim() || sending} loading={sending} />
                    </InputContainer>
                  </ReplyForm>
                </ConversationPanel>
                )}
              </AntDrawer>
            )}
          </>
        )}
      </DashboardWrapper>
    </ConfigProvider>
  );
}
