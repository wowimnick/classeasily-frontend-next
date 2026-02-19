"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";
import { Send, MessageSquare } from "lucide-react";
import { Input, Button, ConfigProvider, Empty } from "antd";
import message from "@/lib/message";
import { guestMessageService } from "@/services/apiService";
import ExploreHeader from "@/components/explore/ExploreHeader";
import { theme as globalTheme } from "@/components/theme";
import FooterClient from "@/components/homepage/FooterClient";
import EmojiQuickPick from "@/components/chat/EmojiQuickPick";

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const PageContent = styled.div`
  flex-grow: 1;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 24px 48px;
  @media (max-width: 768px) {
    padding: 20px 16px 40px;
  }
`;

const ConvHeader = styled.div`
  margin-bottom: 24px;
  h1 {
    font-size: 22px;
    font-weight: 700;
    color: #334155;
    margin: 0 0 8px;
  }
  .meta {
    font-size: 13px;
    color: #717171;
  }
`;

const MessagesCard = styled.div`
  border: 1px solid #ebebeb;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
`;

const MessagesHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #ebebeb;
  font-size: 15px;
  font-weight: 600;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  max-height: 50vh;
  overflow-y: auto;
  background: #fafafa;
  @media (max-width: 768px) {
    max-height: 45vh;
    padding: 16px;
  }
`;

const MessageRow = styled.div`
  display: flex;
  justify-content: ${(p) => (p.$isGuest ? "flex-end" : "flex-start")};
`;

const Bubble = styled.div`
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 16px;
  ${(p) =>
    p.$isGuest
      ? "background: #ff3562; color: #fff; border-bottom-right-radius: 4px;"
      : "background: #fff; color: #334155; border: 1px solid #ebebeb; border-bottom-left-radius: 4px;"}
`;

const SenderLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  color: ${(p) => (p.$isGuest ? "rgba(255,255,255,0.8)" : "#717171")};
`;

const Text = styled.div`
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
`;

const Time = styled.div`
  font-size: 11px;
  margin-top: 4px;
  color: ${(p) => (p.$isGuest ? "rgba(255,255,255,0.6)" : "#a3a3a3")};
`;

const ReplyForm = styled.form`
  padding: 20px;
  border-top: 1px solid #ebebeb;
  background: #fff;
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const InputRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 26px;
  padding: 6px 6px 6px 16px;
  background: #fff;
  &:focus-within {
    border-color: #ff3562;
    box-shadow: 0 0 0 3px rgba(255, 53, 98, 0.1);
  }
  .ant-input {
    padding: 8px 0 !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    resize: none;
  }
`;

const SendBtn = styled(Button)`
  height: 36px !important;
  width: 36px !important;
  min-width: 36px !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border: ${(p) => (p.disabled ? "1px solid #e5e7eb" : "none")} !important;
  background: ${(p) => (p.disabled ? "#f1f5f9" : "#ff3562")} !important;
  color: ${(p) => (p.disabled ? "#94a3b8" : "#fff")} !important;
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")} !important;
  &:hover {
    background: ${(p) => (p.disabled ? "#f1f5f9" : "#e01b46")} !important;
    border-color: ${(p) => (p.disabled ? "#e5e7eb" : "transparent")} !important;
  }
`;

const TokenError = styled.div`
  padding: 24px;
  text-align: center;
  color: #717171;
  background: #fafafa;
  border-radius: 16px;
  border: 1px solid #ebebeb;
`;

const POLL_INTERVAL_MS = 15000;

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

function GuestInboxContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") || "";
  const [conv, setConv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokenError, setTokenError] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchDetail = useCallback(async () => {
    if (!token) {
      setTokenError("Missing conversation link.");
      setLoading(false);
      return;
    }
    const result = await guestMessageService.getInbox(token);
    if (result.success) {
      setConv(result.data);
      setTokenError(null);
    } else {
      setConv(null);
      setTokenError(result.error || "Invalid or expired link.");
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setTokenError("Missing conversation link.");
      return;
    }
    setLoading(true);
    fetchDetail();
  }, [token, fetchDetail]);

  useEffect(() => {
    if (!token || !conv) return;
    const t = setInterval(fetchDetail, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [token, conv, fetchDetail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv?.messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !token) return;
    setSending(true);
    const result = await guestMessageService.sendMessage(token, replyText.trim());
    if (result.success) {
      setReplyText("");
      fetchDetail();
    } else {
      message.error(result.error || "Failed to send message");
    }
    setSending(false);
  };

  if (loading && !conv) {
    return (
      <ConfigProvider theme={globalTheme}>
        <PageWrapper>
          <ExploreHeader showOptionsWrapper={false} />
          <PageContent>
            <div style={{ padding: "48px", textAlign: "center", color: "#717171" }}>
              Loading conversation…
            </div>
          </PageContent>
          <FooterClient />
        </PageWrapper>
      </ConfigProvider>
    );
  }

  if (tokenError && !conv) {
    return (
      <ConfigProvider theme={globalTheme}>
        <PageWrapper>
          <ExploreHeader showOptionsWrapper={false} />
          <PageContent>
            <TokenError>
              <p style={{ margin: "0 0 8px", fontWeight: 600 }}>This link is invalid or has expired.</p>
              <p style={{ margin: 0, fontSize: 14 }}>
                Ask the host to send you a new reply from their dashboard, or contact them by email.
              </p>
            </TokenError>
          </PageContent>
          <FooterClient />
        </PageWrapper>
      </ConfigProvider>
    );
  }

  const messages = conv?.messages || [];

  return (
    <ConfigProvider theme={globalTheme}>
      <PageWrapper>
        <ExploreHeader showOptionsWrapper={false} />
        <PageContent>
          <ConvHeader>
            <h1>{conv?.business_name || "Host"}</h1>
            {(conv?.class_title || conv?.booking_reference) && (
              <div className="meta">
                {[conv.class_title, conv.booking_reference].filter(Boolean).join(" · ")}
              </div>
            )}
          </ConvHeader>

          <MessagesCard>
            <MessagesHeader>
              <MessageSquare size={18} />
              Conversation
            </MessagesHeader>

            <MessagesContainer>
              {messages.length === 0 ? (
                <Empty description="No messages yet." style={{ padding: 24 }} />
              ) : (
                messages.map((msg) => {
                  const isGuest = msg.sender_type === "booker";
                  return (
                    <MessageRow key={msg.id} $isGuest={isGuest}>
                      <Bubble $isGuest={isGuest}>
                        <SenderLabel $isGuest={isGuest}>
                          {isGuest ? "You" : msg.sender_display || "Host"}
                        </SenderLabel>
                        <Text>{msg.text}</Text>
                        <Time $isGuest={isGuest}>{formatTime(msg.created_at)}</Time>
                      </Bubble>
                    </MessageRow>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </MessagesContainer>

            <ReplyForm onSubmit={handleSend}>
              <EmojiQuickPick onInsert={(emoji) => setReplyText((prev) => prev + emoji)} />
              <InputRow>
                <Input.TextArea
                  placeholder="Type your message…"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={sending}
                  autoSize={{ minRows: 1, maxRows: 5 }}
                  style={{ flex: 1, minWidth: 0 }}
                />
                <SendBtn
                  htmlType="submit"
                  type="primary"
                  shape="circle"
                  icon={<Send size={18} />}
                  disabled={!replyText.trim() || sending}
                  loading={sending}
                />
              </InputRow>
            </ReplyForm>
          </MessagesCard>
        </PageContent>
        <FooterClient />
      </PageWrapper>
    </ConfigProvider>
  );
}

export default function GuestInboxPage() {
  return (
    <Suspense
      fallback={
        <ConfigProvider theme={globalTheme}>
          <PageWrapper>
            <ExploreHeader showOptionsWrapper={false} />
            <PageContent>
              <div style={{ padding: "48px", textAlign: "center", color: "#717171" }}>
                Loading…
              </div>
            </PageContent>
            <FooterClient />
          </PageWrapper>
        </ConfigProvider>
      }
    >
      <GuestInboxContent />
    </Suspense>
  );
}
