"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled, { createGlobalStyle } from "styled-components";
import { Drawer } from "vaul";
import { Modal, Empty, ConfigProvider } from "antd";
import { MessageSquare, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import ExploreHeader from "@/components/explore/ExploreHeader";
import { conversationService } from "@/services/apiService";
import { theme as globalTheme } from "@/components/theme";
import { useConversationWebSocket } from "@/hooks/useConversationWebSocket";
import FooterClient from "@/components/homepage/FooterClient";
import message from "@/lib/message";
import ConversationOverlayContent from "./ConversationOverlayContent";

const ModalGlobalStyle = createGlobalStyle`
  .guest-chat-modal .ant-modal-content {
    padding: 0 !important;
  }
`;

const StyledModal = styled(Modal)`
  .ant-modal-container {
    padding: 0 !important;
  }
`;

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const PageContainer = styled.div`
  flex-grow: 1;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 24px 48px;
  @media (max-width: 768px) {
    padding: 20px 16px 40px;
  }
`;

const HeaderSection = styled.div`
  margin-bottom: 28px;
  h1 {
    font-size: 26px;
    font-weight: 700;
    color: #334155;
    margin: 0 0 4px;
  }
  p {
    font-size: 14px;
    color: #717171;
    margin: 0;
  }
`;

const ListCard = styled(motion.div)`
  border: 1px solid #ebebeb;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
`;

const ConversationRow = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 24px;
  cursor: pointer;
  border-bottom: 1px solid #ebebeb;
  transition: background 0.15s ease;
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: #f7f7f7;
  }
  @media (max-width: 640px) {
    padding: 16px;
    gap: 12px;
  }
`;

const RowMain = styled.div`
  flex: 1;
  min-width: 0;
`;

const BusinessName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 4px;
`;

const Preview = styled.div`
  font-size: 13px;
  color: #717171;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const RowMeta = styled.div`
  font-size: 12px;
  color: #a3a3a3;
  margin-top: 4px;
`;

const ChevronWrap = styled.div`
  color: #717171;
  flex-shrink: 0;
`;

const DRAWER_BREAKPOINT = 768;
const POLL_INTERVAL_MS = 12000;
const POLL_INTERVAL_MS_WHEN_WS = 60000;

const formatTime = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const OverlayPanel = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

const DrawerContentInner = styled(Drawer.Content)`
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
`;

const DrawerBodyWrap = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export default function MyMessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get("conversation_id");

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [conv, setConv] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hasOpenedFromUrlRef = useRef(false);

  const ws = useConversationWebSocket({
    conversationId: selectedId ?? null,
    guestInboxToken: null,
    initialMessages: conv?.messages ?? [],
    initialReadStatus: conv
      ? { last_read_by_booker_at: conv.last_read_by_booker_at ?? null, last_read_by_business_at: conv.last_read_by_business_at ?? null }
      : null,
  });
  const displayMessages = selectedId && ws.messages?.length ? ws.messages : (conv?.messages ?? []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    const result = await conversationService.getList();
    if (result.success) setConversations(result.data || []);
    setLoading(false);
  }, []);

  const fetchDetail = useCallback(async (id, isInitialLoad = false) => {
    if (!id) return;
    if (isInitialLoad) setDetailLoading(true);
    const result = await conversationService.getDetail(id);
    if (result.success) setConv(result.data);
    else if (result.error) {
      message.error(result.error);
      setSelectedId(null);
      setConv(null);
    }
    if (isInitialLoad) setDetailLoading(false);
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= DRAWER_BREAKPOINT);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (loading || hasOpenedFromUrlRef.current || !conversationIdFromUrl) return;
    const found = conversations.some((c) => String(c.id) === conversationIdFromUrl);
    if (found) {
      hasOpenedFromUrlRef.current = true;
      setSelectedId(conversationIdFromUrl);
      fetchDetail(conversationIdFromUrl, true);
    }
  }, [loading, conversationIdFromUrl, conversations, fetchDetail]);

  useEffect(() => {
    if (!selectedId) return;
    const interval = ws.connected ? POLL_INTERVAL_MS_WHEN_WS : POLL_INTERVAL_MS;
    const t = setInterval(() => fetchDetail(selectedId, false), interval);
    return () => clearInterval(t);
  }, [selectedId, fetchDetail, ws.connected]);

  const openConversation = useCallback(
    (c) => {
      setSelectedId(c.id);
      setReplyText("");
      setConv(null);
      fetchDetail(c.id, true);
      router.replace(`/my-messages?conversation_id=${c.id}`, { scroll: false });
    },
    [fetchDetail, router]
  );

  const closeConversation = useCallback(() => {
    setSelectedId(null);
    setConv(null);
    setReplyText("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("conversation_id");
    const qs = params.toString();
    router.replace(qs ? `/my-messages?${qs}` : "/my-messages", { scroll: false });
  }, [router, searchParams]);

  const handleSend = useCallback(
    async (e) => {
      e.preventDefault();
      if (!replyText.trim() || !selectedId) return;
      setSending(true);
      const result = await conversationService.sendMessage(selectedId, replyText.trim());
      if (result.success) {
        setReplyText("");
        fetchDetail(selectedId, false);
      } else {
        message.error(result.error || "Failed to send message");
      }
      setSending(false);
    },
    [replyText, selectedId, fetchDetail]
  );

  const isOverlayOpen = selectedId != null;

  useEffect(() => {
    if (isOverlayOpen && selectedId) ws.sendMarkRead();
  }, [isOverlayOpen, selectedId]);

  const overlayContent = (
    <ConversationOverlayContent
      conv={conv}
      onClose={closeConversation}
      replyText={replyText}
      setReplyText={setReplyText}
      sending={sending}
      onSend={handleSend}
      loading={detailLoading && !conv}
      messagesOverride={displayMessages}
      typing={ws.typing}
      readStatus={ws.readStatus}
      onInputFocus={ws.sendTypingStart}
      onInputBlur={ws.sendTypingStop}
      onMessagesViewed={ws.sendMarkRead}
    />
  );

  return (
    <ConfigProvider theme={globalTheme}>
      <ModalGlobalStyle />
      <PageWrapper>
        <ExploreHeader showOptionsWrapper={false} />
        <PageContainer>
          <HeaderSection>
            <h1>Messages</h1>
            <p>Your conversations with hosts</p>
          </HeaderSection>

          {loading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#717171" }}>
              Loading…
            </div>
          ) : conversations.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No messages yet"
              style={{ padding: "48px 24px" }}
            >
              <p style={{ color: "#717171", fontSize: 14 }}>
                When you book a class, you can message the host from your booking or from here.
              </p>
            </Empty>
          ) : (
            <ListCard>
              {conversations.map((c) => (
                <ConversationRow
                  key={c.id}
                  onClick={() => openConversation(c)}
                  whileHover={{ x: 2 }}
                >
                  <div style={{ fontSize: 24, color: "#ff385c" }}>
                    <MessageSquare size={28} />
                  </div>
                  <RowMain>
                    <BusinessName>{c.business_name || "Host"}</BusinessName>
                    {(c.class_title || c.booking_reference) && (
                      <RowMeta>
                        {[c.class_title, c.booking_reference].filter(Boolean).join(" · ")}
                      </RowMeta>
                    )}
                    {c.last_message_preview && (
                      <Preview>{c.last_message_preview}</Preview>
                    )}
                  </RowMain>
                  <div style={{ fontSize: 12, color: "#a3a3a3", flexShrink: 0 }}>
                    {formatTime(c.last_message_at || c.created_at)}
                  </div>
                  <ChevronWrap>
                    <ChevronRight size={20} />
                  </ChevronWrap>
                </ConversationRow>
              ))}
            </ListCard>
          )}
        </PageContainer>
        <FooterClient />
      </PageWrapper>

      {isOverlayOpen &&
        (isMobile ? (
          <Drawer.Root
            open={true}
            onOpenChange={(open) => !open && closeConversation()}
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
              <DrawerContentInner>
                <div
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
                  <OverlayPanel>{overlayContent}</OverlayPanel>
                </DrawerBodyWrap>
              </DrawerContentInner>
            </Drawer.Portal>
          </Drawer.Root>
        ) : (
          <StyledModal
            open={true}
            onCancel={closeConversation}
            footer={null}
            centered
            width={480}
            closable={false}
            className="guest-chat-modal"
            styles={{
              body: {
                padding: 0,
                height: "85vh",
                maxHeight: "85vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              },
            }}
          >
            <OverlayPanel>{overlayContent}</OverlayPanel>
          </StyledModal>
        ))}
    </ConfigProvider>
  );
}
