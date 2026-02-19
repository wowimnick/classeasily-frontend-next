"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styled, { createGlobalStyle } from "styled-components";
import { Drawer } from "vaul";
import { Modal, ConfigProvider } from "antd";
import { X } from "lucide-react";
import { conversationService, guestMessageService } from "@/services/apiService";
import message from "@/lib/message";
import { theme as globalTheme } from "@/components/theme";
import ConversationOverlayContent from "@/app/my-messages/_components/ConversationOverlayContent";
import { useConversationWebSocket } from "@/hooks/useConversationWebSocket";

const ModalGlobalStyle = createGlobalStyle`
  .homepage-conversation-modal .ant-modal-content {
    padding: 0 !important;
    border-radius: 16px !important;
    overflow: hidden;
  }
`;

const StyledModal = styled(Modal)`
  .ant-modal-container {
    padding: 0 !important;
  }
`;

const DRAWER_BREAKPOINT = 768;
const POLL_INTERVAL_MS = 12000;
const GUEST_POLL_INTERVAL_MS = 15000;
const POLL_MS_WHEN_WS = 60000;

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

const OverlayHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #ebebeb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #334155;
  }
  button[data-close] {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    color: #717171;
    display: flex;
    align-items: center;
    justify-content: center;
    &:hover {
      color: #ff385c;
    }
  }
`;

const TokenErrorBox = styled.div`
  padding: 24px 20px;
  text-align: center;
  color: #717171;
  background: #fafafa;
  margin: 20px;
  border-radius: 12px;
  border: 1px solid #ebebeb;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

function HomepageConversationOverlayInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversation_id");
  const guestInboxToken = searchParams.get("guest_inbox_token");

  const [mounted, setMounted] = useState(false);
  const [conv, setConv] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tokenError, setTokenError] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isGuest = !!guestInboxToken;
  const isOpen = mounted && (!!conversationId || !!guestInboxToken);

  const effectiveConvId = conv?.id ?? conversationId;
  const ws = useConversationWebSocket({
    conversationId: effectiveConvId ?? null,
    guestInboxToken: isGuest ? guestInboxToken : null,
    initialMessages: conv?.messages ?? [],
    initialReadStatus: conv
      ? { last_read_by_booker_at: conv.last_read_by_booker_at ?? null, last_read_by_business_at: conv.last_read_by_business_at ?? null }
      : null,
  });
  const displayMessages = effectiveConvId && ws.messages?.length ? ws.messages : (conv?.messages ?? []);

  const handleClose = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("conversation_id");
    params.delete("guest_inbox_token");
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }, [router, searchParams]);

  const fetchDetailLoggedIn = useCallback(async (id, isInitialLoad = false) => {
    if (!id) return;
    if (isInitialLoad) setDetailLoading(true);
    const result = await conversationService.getDetail(id);
    if (result.success) setConv(result.data);
    else if (result.error) {
      message.error(result.error);
      handleClose();
    }
    if (isInitialLoad) setDetailLoading(false);
  }, [handleClose]);

  const fetchDetailGuest = useCallback(async (token, isInitialLoad = false) => {
    if (!token) return;
    if (isInitialLoad) setDetailLoading(true);
    const result = await guestMessageService.getInbox(token);
    if (result.success) {
      setConv(result.data);
      setTokenError(null);
    } else {
      setConv(null);
      setTokenError(result.error || "Invalid or expired link.");
      if (isInitialLoad) message.error(result.error || "Invalid or expired link.");
    }
    if (isInitialLoad) setDetailLoading(false);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= DRAWER_BREAKPOINT);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (conversationId) fetchDetailLoggedIn(conversationId, true);
    else if (guestInboxToken) fetchDetailGuest(guestInboxToken, true);
  }, [conversationId, guestInboxToken, fetchDetailLoggedIn, fetchDetailGuest]);

  useEffect(() => {
    const interval = ws.connected ? POLL_MS_WHEN_WS : null;
    if (conversationId) {
      const ms = interval ?? POLL_INTERVAL_MS;
      const t = setInterval(() => fetchDetailLoggedIn(conversationId, false), ms);
      return () => clearInterval(t);
    }
    if (guestInboxToken && conv) {
      const ms = interval ?? GUEST_POLL_INTERVAL_MS;
      const t = setInterval(() => fetchDetailGuest(guestInboxToken, false), ms);
      return () => clearInterval(t);
    }
  }, [conversationId, guestInboxToken, conv, fetchDetailLoggedIn, fetchDetailGuest, ws.connected]);

  const hasMarkedReadRef = useRef(false);
  useEffect(() => {
    if (isOpen && effectiveConvId && !hasMarkedReadRef.current) {
      hasMarkedReadRef.current = true;
      ws.sendMarkRead();
    }
    if (!isOpen) hasMarkedReadRef.current = false;
  }, [isOpen, effectiveConvId, ws.sendMarkRead]);

  const handleSend = useCallback(
    async (e) => {
      e.preventDefault();
      if (!replyText.trim()) return;
      setSending(true);
      if (conversationId) {
        const result = await conversationService.sendMessage(conversationId, replyText.trim());
        if (result.success) {
          setReplyText("");
          fetchDetailLoggedIn(conversationId, false);
        } else {
          message.error(result.error || "Failed to send message");
        }
      } else if (guestInboxToken) {
        const result = await guestMessageService.sendMessage(guestInboxToken, replyText.trim());
        if (result.success) {
          setReplyText("");
          fetchDetailGuest(guestInboxToken, false);
        } else {
          message.error(result.error || "Failed to send message");
        }
      }
      setSending(false);
    },
    [replyText, conversationId, guestInboxToken, fetchDetailLoggedIn, fetchDetailGuest]
  );

  if (!isOpen) return null;

  const showError = isGuest && tokenError && !conv;
  const overlayContent = showError ? (
    <OverlayPanel>
      <OverlayHeader>
        <h2>Conversation</h2>
        <button type="button" onClick={handleClose} data-close aria-label="Close">
          <X size={20} />
        </button>
      </OverlayHeader>
      <TokenErrorBox>
        <p style={{ margin: "0 0 8px", fontWeight: 600 }}>This link is invalid or has expired.</p>
        <p style={{ margin: 0, fontSize: 14 }}>
          Ask the host to send you a new reply from their dashboard, or contact them by email.
        </p>
      </TokenErrorBox>
    </OverlayPanel>
  ) : (
    <>
      <ConversationOverlayContent
        conv={conv}
        onClose={handleClose}
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
    </>
  );

  return (
    <ConfigProvider theme={globalTheme}>
      <ModalGlobalStyle />
      {isMobile ? (
        <Drawer.Root open={true} onOpenChange={(open) => !open && handleClose()} repositionInputs={false}>
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
              <Drawer.Title style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}>
                Conversation
              </Drawer.Title>
              <Drawer.Description style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }} aria-describedby={undefined} />
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
          onCancel={handleClose}
          footer={null}
          centered
          width={480}
          closable={false}
          className="homepage-conversation-modal"
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
      )}
    </ConfigProvider>
  );
}

export default function HomepageConversationOverlay() {
  return (
    <Suspense fallback={null}>
      <HomepageConversationOverlayInner />
    </Suspense>
  );
}
