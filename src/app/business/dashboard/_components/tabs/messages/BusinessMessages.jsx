"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";
import { MessageSquare, ChevronRight, Send, X } from "lucide-react";
import { Empty, Drawer, Input, Button, ConfigProvider } from "antd";
import message from "@/lib/message";
import { businessConversationService } from "@/services/apiService";
import { theme as globalTheme } from "@/components/theme";

const PageWrap = styled.div`
  padding: 0;
  min-height: 0;
`;

const DashboardHeader = styled.div`
  margin-bottom: 24px;
  h1 {
    font-size: 24px;
    font-weight: 700;
    color: #222;
    margin: 0 0 4px;
  }
  .sub {
    font-size: 15px;
    color: #64748b;
  }
`;

const ListCard = styled.div`
  border: 1px solid #ebebeb;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  cursor: pointer;
  border-bottom: 1px solid #ebebeb;
  transition: background 0.15s ease;
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: #f7f7f7;
  }
`;

const RowMain = styled.div`
  flex: 1;
  min-width: 0;
`;

const GuestName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 2px;
`;

const Preview = styled.div`
  font-size: 13px;
  color: #717171;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Meta = styled.div`
  font-size: 12px;
  color: #a3a3a3;
  margin-top: 2px;
`;

const DrawerBody = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
`;

const DrawerHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #ebebeb;
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
`;

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MsgRow = styled.div`
  display: flex;
  justify-content: ${(p) => (p.$isBusiness ? "flex-end" : "flex-start")};
`;

const Bubble = styled.div`
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.45;
  ${(p) =>
    p.$isBusiness
      ? "background: #ff3562; color: #fff; border-bottom-right-radius: 4px;"
      : "background: #fff; color: #334155; border: 1px solid #ebebeb; border-bottom-left-radius: 4px;"}
`;

const MsgTime = styled.div`
  font-size: 11px;
  margin-top: 4px;
  color: ${(p) => (p.$isBusiness ? "rgba(255,255,255,0.7)" : "#a3a3a3")};
`;

const ReplyForm = styled.form`
  padding: 16px 20px;
  border-top: 1px solid #ebebeb;
  background: #fff;
`;

const InputWrap = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 24px;
  padding: 6px 6px 6px 14px;
  &:focus-within {
    border-color: #ff3562;
    box-shadow: 0 0 0 2px rgba(255, 53, 98, 0.1);
  }
  .ant-input {
    border: none !important;
    box-shadow: none !important;
    resize: none;
  }
`;

const SendBtn = styled(Button)`
  height: 34px !important;
  width: 34px !important;
  min-width: 34px !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border: none !important;
  background: ${(p) => (p.disabled ? "#f5f5f5" : "#ff3562")} !important;
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
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const hasAutoOpenedRef = useRef(false);

  const fetchList = useCallback(async () => {
    const result = await businessConversationService.getList();
    if (result.success) setList(result.data || []);
    setLoading(false);
  }, []);

  const fetchDetail = useCallback(async (id) => {
    if (!id) return;
    const result = await businessConversationService.getDetail(id);
    if (result.success) setSelected(result.data);
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (loading || !openBookingId || hasAutoOpenedRef.current || list.length === 0) return;
    const bid = Number(openBookingId);
    const conv = list.find((c) => c.booking === bid || c.booking === openBookingId);
    if (conv) {
      hasAutoOpenedRef.current = true;
      openConversation(conv);
    }
  }, [loading, openBookingId, list]);

  useEffect(() => {
    if (!selected?.id) return;
    const t = setInterval(() => fetchDetail(selected.id), POLL_MS);
    return () => clearInterval(t);
  }, [selected?.id, fetchDetail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages]);

  const openConversation = (conv) => {
    setSelected(conv);
    setDrawerOpen(true);
    setReplyText("");
    fetchDetail(conv.id);
  };

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
    <ConfigProvider theme={globalTheme}>
      <PageWrap>
        <DashboardHeader>
          <h1>Messages</h1>
          <div className="sub">Conversations with guests</div>
        </DashboardHeader>

        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#717171" }}>
            Loading…
          </div>
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
                <div style={{ color: "#ff3562" }}>
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

        <Drawer
          title={null}
          placement="right"
          width={420}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          closable={false}
          styles={{ body: { padding: 0, display: "flex", flexDirection: "column", height: "100%" } }}
          extra={
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          }
        >
          {selected && (
            <DrawerBody>
              <DrawerHeader>
                <h3>{selected.booker_display || "Guest"}</h3>
                {selected.booker_email && (
                  <div className="sub">{selected.booker_email}</div>
                )}
                {(selected.class_title || selected.booking_reference) && (
                  <div className="sub">
                    {[selected.class_title, selected.booking_reference].filter(Boolean).join(" · ")}
                  </div>
                )}
              </DrawerHeader>

              <MessagesArea>
                {(selected.messages || []).length === 0 ? (
                  <Empty description="No messages yet" style={{ margin: "auto" }} />
                ) : (
                  (selected.messages || []).map((msg) => (
                    <MsgRow key={msg.id} $isBusiness={msg.sender_type === "business"}>
                      <Bubble $isBusiness={msg.sender_type === "business"}>
                        <div>{msg.text}</div>
                        <MsgTime $isBusiness={msg.sender_type === "business"}>
                          {formatTime(msg.created_at)}
                        </MsgTime>
                      </Bubble>
                    </MsgRow>
                  ))
                )}
                <div ref={messagesEndRef} />
              </MessagesArea>

              <ReplyForm onSubmit={handleSendReply}>
                <InputWrap>
                  <Input.TextArea
                    placeholder="Type your reply…"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={sending}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    style={{ flex: 1, minWidth: 0 }}
                  />
                  <SendBtn
                    htmlType="submit"
                    type="primary"
                    shape="circle"
                    icon={<Send size={16} />}
                    disabled={!replyText.trim() || sending}
                    loading={sending}
                  />
                </InputWrap>
              </ReplyForm>
            </DrawerBody>
          )}
        </Drawer>
      </PageWrap>
    </ConfigProvider>
  );
}
