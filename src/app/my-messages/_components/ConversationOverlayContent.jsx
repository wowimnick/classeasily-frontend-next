"use client";

import React, { useRef, useEffect } from "react";
import styled from "styled-components";
import { Send, X } from "lucide-react";
import { Input, Button, Empty } from "antd";
import EmojiQuickPick from "@/components/chat/EmojiQuickPick";

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
  .meta {
    font-size: 13px;
    color: #717171;
    margin-top: 2px;
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

const MessagesScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 16px;
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
      ? "background: #ff385c; color: #fff; border-bottom-right-radius: 4px;"
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

const ReadStatus = styled.span`
  font-size: 10px;
  margin-left: 6px;
  color: ${(p) => (p.$isBooker ? "rgba(255,255,255,0.7)" : "#a3a3a3")};
`;

const TypingIndicator = styled.div`
  padding: 8px 16px;
  font-size: 13px;
  color: #717171;
  font-style: italic;
`;

const ReplyForm = styled.form`
  padding: 16px 20px;
  border-top: 1px solid #ebebeb;
  background: #fff;
  flex-shrink: 0;
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
    border-color: #ff385c;
    box-shadow: 0 0 0 3px rgba(255, 56, 92, 0.1);
  }
  .ant-input,
  textarea {
    padding: 8px 0 !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    resize: none;
    font-size: 14px;
  }
  @media (max-width: 768px) {
    .ant-input,
    textarea {
      font-size: 16px !important; /* Prevents iOS zoom on focus */
    }
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
  background: ${(p) => (p.disabled ? "#f1f5f9" : "#ff385c")} !important;
  color: ${(p) => (p.disabled ? "#94a3b8" : "#fff")} !important;
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")} !important;
  &:hover {
    background: ${(p) => (p.disabled ? "#f1f5f9" : "#e01b46")} !important;
    border-color: ${(p) => (p.disabled ? "#e5e7eb" : "transparent")} !important;
  }
`;

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

export default function ConversationOverlayContent({
  conv,
  onClose,
  replyText,
  setReplyText,
  sending,
  onSend,
  loading,
  messagesOverride,
  typing,
  readStatus,
  onInputFocus,
  onInputBlur,
  onMessagesViewed,
}) {
  const messagesEndRef = useRef(null);
  const scrollRef = useRef(null);

  const messages = messagesOverride !== undefined && Array.isArray(messagesOverride) ? messagesOverride : (conv?.messages || []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      <OverlayHeader>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2>{conv?.business_name || "Host"}</h2>
          {(conv?.class_title || conv?.booking_reference) && (
            <div className="meta">
              {[conv?.class_title, conv?.booking_reference].filter(Boolean).join(" · ")}
            </div>
          )}
        </div>
        <button type="button" onClick={onClose} data-close aria-label="Close">
          <X size={20} />
        </button>
      </OverlayHeader>

      <MessagesScroll ref={scrollRef}>
        {loading && !messages.length ? (
          <div style={{ padding: "24px", textAlign: "center", color: "#717171" }}>
            Loading conversation…
          </div>
        ) : messages.length === 0 ? (
          <Empty description="No messages yet. Say hello!" style={{ padding: 24, margin: "auto" }} />
        ) : (
          messages.map((msg) => {
            const isBooker = msg.sender_type === "booker";
            const createdAt = msg.created_at ? new Date(msg.created_at).getTime() : 0;
            const lastReadByOther = isBooker ? readStatus?.last_read_by_business_at : readStatus?.last_read_by_booker_at;
            const readAt = lastReadByOther ? new Date(lastReadByOther).getTime() : 0;
            const isRead = readAt >= createdAt;
            return (
              <MessageRow key={msg.id} $isBooker={isBooker}>
                <Bubble $isBooker={isBooker}>
                  <SenderLabel $isBooker={isBooker}>
                    {isBooker ? "You" : msg.sender_display || "Host"}
                  </SenderLabel>
                  <Text>{msg.text}</Text>
                  <Time $isBooker={isBooker}>
                    {formatTime(msg.created_at)}
                    {isBooker && isRead && <ReadStatus $isBooker={isBooker}> · Read</ReadStatus>}
                  </Time>
                </Bubble>
              </MessageRow>
            );
          })
        )}
        {/* Only show other party typing (this overlay is always booker/guest view) */}
        {typing?.business?.active && (
          <TypingIndicator>{typing.business.displayName || "Host"} is typing…</TypingIndicator>
        )}
        <div ref={messagesEndRef} />
      </MessagesScroll>

      <ReplyForm onSubmit={onSend}>
        <EmojiQuickPick onInsert={(emoji) => setReplyText((prev) => prev + emoji)} />
        <InputRow>
          <Input.TextArea
            placeholder="Type your message…"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onFocus={onInputFocus}
            onBlur={onInputBlur}
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
    </>
  );
}
