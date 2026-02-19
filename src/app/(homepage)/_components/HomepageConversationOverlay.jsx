"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styled, { createGlobalStyle } from "styled-components";
import { Drawer } from "vaul";
import { Modal, ConfigProvider } from "antd";
import { conversationService } from "@/services/apiService";
import message from "@/lib/message";
import { theme as globalTheme } from "@/components/theme";
import ConversationOverlayContent from "@/app/my-messages/_components/ConversationOverlayContent";

const ModalGlobalStyle = createGlobalStyle`
  .homepage-conversation-modal .ant-modal-content {
    padding: 0 !important;
  }
`;

const StyledModal = styled(Modal)`
  .ant-modal-container {
    padding: 0 !important;
  }
`;

const DRAWER_BREAKPOINT = 768;
const POLL_INTERVAL_MS = 12000;

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

function HomepageConversationOverlayInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversation_id");

  const [conv, setConv] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const fetchDetail = useCallback(async (id, isInitialLoad = false) => {
    if (!id) return;
    if (isInitialLoad) setDetailLoading(true);
    const result = await conversationService.getDetail(id);
    if (result.success) setConv(result.data);
    else if (result.error) {
      message.error(result.error);
      handleClose();
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
    if (!conversationId) return;
    fetchDetail(conversationId, true);
  }, [conversationId, fetchDetail]);

  useEffect(() => {
    if (!conversationId) return;
    const t = setInterval(() => fetchDetail(conversationId, false), POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [conversationId, fetchDetail]);

  const handleClose = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("conversation_id");
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }, [router, searchParams]);

  const handleSend = useCallback(
    async (e) => {
      e.preventDefault();
      if (!replyText.trim() || !conversationId) return;
      setSending(true);
      const result = await conversationService.sendMessage(conversationId, replyText.trim());
      if (result.success) {
        setReplyText("");
        fetchDetail(conversationId, false);
      } else {
        message.error(result.error || "Failed to send message");
      }
      setSending(false);
    },
    [replyText, conversationId, fetchDetail]
  );

  if (!conversationId) return null;

  const overlayContent = (
    <ConversationOverlayContent
      conv={conv}
      onClose={handleClose}
      replyText={replyText}
      setReplyText={setReplyText}
      sending={sending}
      onSend={handleSend}
      loading={detailLoading && !conv}
    />
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
