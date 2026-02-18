"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import styled from "styled-components";
import { ArrowLeft, Send, MessageSquare } from "lucide-react";
import { Input, Button, ConfigProvider, Empty } from "antd";
import message from "@/lib/message";
import { conversationService } from "@/services/apiService";
import ExploreHeader from "@/components/explore/ExploreHeader";
import { theme as globalTheme } from "@/components/theme";
import FooterClient from "@/components/homepage/FooterClient";

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

const BackButton = styled.button`
  background: none;
  border: none;
  color: #717171;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 0;
  margin-bottom: 20px;
  &:hover {
    color: #ff3562;
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
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
`;

const MessagesHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #ebebeb;
  font-size: 15px;
  font-weight: 600;
  color: #334155;
`;

const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  max-height: 50vh;
  overflow-y: auto;
  background: #fafafa;
`;

const MessageRow = styled.div`
  display: flex;
  justify-content: ${(p) => (p.$isBooker ? "flex-end" : "flex-start")};
`;

const Bubble = styled.div`
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 16px;
  ${(p) =>
    p.$isBooker
      ? "background: #ff3562; color: #fff; border-bottom-right-radius: 4px;"
      : "background: #fff; color: #334155; border: 1px solid #ebebeb; border-bottom-left-radius: 4px;"}
`;

const SenderLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  color: ${(p) => (p.$isBooker ? "rgba(255,255,255,0.8)" : "#717171")};
`;

const Text = styled.div`
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
`;

const Time = styled.div`
  font-size: 11px;
  margin-top: 4px;
  color: ${(p) => (p.$isBooker ? "rgba(255,255,255,0.6)" : "#a3a3a3")};
`;

const ReplyForm = styled.form`
  padding: 20px;
  border-top: 1px solid #ebebeb;
  background: #fff;
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
  border: none !important;
  background: ${(p) => (p.disabled ? "#f5f5f5" : "#ff3562")} !important;
  &:hover {
    background: ${(p) => (p.disabled ? "#f5f5f5" : "#e01b46")} !important;
  }
`;

const POLL_INTERVAL_MS = 12000;

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

function ConversationDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [conv, setConv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    const result = await conversationService.getDetail(id);
    if (result.success) setConv(result.data);
    else if (result.error) {
      message.error(result.error);
      router.push("/my-messages");
    }
  }, [id, router]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchDetail().finally(() => setLoading(false));
  }, [id, fetchDetail]);

  useEffect(() => {
    if (!id) return;
    const t = setInterval(fetchDetail, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [id, fetchDetail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv?.messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !id) return;
    setSending(true);
    const result = await conversationService.sendMessage(id, replyText.trim());
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

  if (!conv) {
    return (
      <ConfigProvider theme={globalTheme}>
        <PageWrapper>
          <ExploreHeader showOptionsWrapper={false} />
          <PageContent>
            <Empty description="Conversation not found" />
          </PageContent>
          <FooterClient />
        </PageWrapper>
      </ConfigProvider>
    );
  }

  const messages = conv.messages || [];

  return (
    <ConfigProvider theme={globalTheme}>
      <PageWrapper>
        <ExploreHeader showOptionsWrapper={false} />
        <PageContent>
          <BackButton onClick={() => router.push("/my-messages")}>
            <ArrowLeft size={16} /> Back to messages
          </BackButton>

          <ConvHeader>
            <h1>{conv.business_name || "Host"}</h1>
            {(conv.class_title || conv.booking_reference) && (
              <div className="meta">
                {[conv.class_title, conv.booking_reference].filter(Boolean).join(" · ")}
              </div>
            )}
          </ConvHeader>

          <MessagesCard>
            <MessagesHeader>
              <MessageSquare size={18} style={{ marginRight: 8, verticalAlign: "middle" }} />
              Conversation
            </MessagesHeader>

            <MessagesContainer>
              {messages.length === 0 ? (
                <Empty description="No messages yet. Say hello!" style={{ padding: 24 }} />
              ) : (
                messages.map((msg) => {
                  const isBooker = msg.sender_type === "booker";
                  return (
                    <MessageRow key={msg.id} $isBooker={isBooker}>
                      <Bubble $isBooker={isBooker}>
                        <SenderLabel $isBooker={isBooker}>
                          {isBooker ? "You" : msg.sender_display || "Host"}
                        </SenderLabel>
                        <Text>{msg.text}</Text>
                        <Time $isBooker={isBooker}>{formatTime(msg.created_at)}</Time>
                      </Bubble>
                    </MessageRow>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </MessagesContainer>

            <ReplyForm onSubmit={handleSend}>
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

function LoadingFallback() {
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

export default function ConversationDetailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ConversationDetailContent />
    </Suspense>
  );
}
