"use client";

import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { Drawer } from "vaul";
import { Empty, Drawer as AntDrawer, ConfigProvider, Input, Select, Button } from "antd";
import { MessageSquare, ChevronRight, X, Copy, ExternalLink, FileText, Mail } from "lucide-react";
import { adminConversationsService, businessManagementService } from "@/services/adminDash";
import { theme as globalTheme } from "@/components/theme";
import message from "@/lib/message";

const MODAL_DRAWER_BREAKPOINT = 768;

const PageWrap = styled.div`
  padding: 24px;
  min-height: 100%;
  @media (max-width: 768px) {
    padding: 16px;
  }
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

const FiltersRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  .ant-select { min-width: 200px; }
  .ant-input { max-width: 280px; }
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
  &:last-child { border-bottom: none; }
  &:hover { background: #f7f7f7; }
  @media (max-width: 640px) {
    padding: 12px 16px;
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

const ConversationPanel = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 0;
`;

const PanelHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #ebebeb;
  flex-shrink: 0;
  h3 { margin: 0 0 4px; font-size: 18px; font-weight: 600; color: #334155; }
  .sub { font-size: 13px; color: #717171; }
`;

const AdminActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
  .ant-btn { font-size: 12px; }
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
  max-height: 90vh;
  min-height: 70vh;
`;

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
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

export default function AdminConversationsTab() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [businessFilter, setBusinessFilter] = useState(undefined);
  const [businesses, setBusinesses] = useState([]);
  const [search, setSearch] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth <= MODAL_DRAWER_BREAKPOINT);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (businessFilter) params.business_id = businessFilter;
    const result = await adminConversationsService.getList(params);
    if (result.success) setList(result.data || []);
    setLoading(false);
  }, [businessFilter]);

  const fetchBusinesses = useCallback(async () => {
    const res = await businessManagementService.getBusinesses();
    if (res.success && Array.isArray(res.data?.results)) setBusinesses(res.data.results);
    else if (res.success && Array.isArray(res.data)) setBusinesses(res.data);
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const fetchDetail = useCallback(async (id) => {
    if (!id) return;
    const result = await adminConversationsService.getDetail(id);
    if (result.success) setSelected(result.data);
  }, []);

  const openConversation = (conv) => {
    setSelected(conv);
    setOpen(true);
    fetchDetail(conv.id);
  };

  const closeConversation = () => setOpen(false);

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      () => message.success(`${label} copied`),
      () => message.error("Copy failed")
    );
  };

  const getBusinessMessagesUrl = () => {
    if (!selected?.id) return null;
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/business/dashboard/messages?conversation_id=${selected.id}`;
  };

  const copyConversationAsText = () => {
    if (!selected?.messages?.length) {
      message.info("No messages to copy");
      return;
    }
    const lines = (selected.messages || []).map((m) => {
      const from = m.sender_type === "business" ? "Business" : (selected.booker_display || "Guest");
      const time = formatTime(m.created_at);
      return `[${time}] ${from}: ${(m.text || "").replace(/\n/g, " ")}`;
    });
    copyToClipboard(lines.join("\n"), "Conversation");
  };

  const filteredList = search.trim()
    ? list.filter(
        (c) =>
          (c.booker_display || "").toLowerCase().includes(search.toLowerCase()) ||
          (c.booker_email || "").toLowerCase().includes(search.toLowerCase())
      )
    : list;

  return (
    <ConfigProvider theme={globalTheme}>
      <PageWrap>
        <DashboardHeader>
          <h1>Conversations</h1>
          <div className="sub">Guest–business messages (read-only)</div>
        </DashboardHeader>

        <FiltersRow>
          <Select
            placeholder="All businesses"
            allowClear
            value={businessFilter}
            onChange={setBusinessFilter}
            options={businesses.map((b) => ({
              label: b.businessName || `Business #${b.businessId}`,
              value: b.businessId,
            }))}
            style={{ minWidth: 200 }}
          />
          <Input
            placeholder="Search by guest name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ maxWidth: 280 }}
          />
        </FiltersRow>

        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#717171" }}>
            Loading…
          </div>
        ) : filteredList.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No conversations found"
            style={{ padding: "48px 24px" }}
          />
        ) : (
          <ListCard>
            {filteredList.map((c) => (
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

        {mounted && selected && (
          <>
            {isMobile ? (
              <Drawer.Root open={open} onOpenChange={(o) => !o && closeConversation()}>
                <Drawer.Portal>
                  <Drawer.Overlay style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 1000 }} />
                  <VaulDrawerContent>
                    <div style={{ width: 40, height: 4, background: "#e5e7eb", borderRadius: 2, margin: "12px auto", flexShrink: 0 }} />
                    <ConversationPanel>
                      <PanelHeader style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3>{selected.booker_display || "Guest"}</h3>
                          {selected.booker_email && <div className="sub">{selected.booker_email}</div>}
                          {(selected.class_title || selected.booking_reference) && (
                            <div className="sub">{[selected.class_title, selected.booking_reference].filter(Boolean).join(" · ")}</div>
                          )}
                          <AdminActionsRow>
                            {selected.booker_email && (
                              <Button size="small" icon={<Mail size={14} />} onClick={() => copyToClipboard(selected.booker_email, "Email")}>
                                Copy email
                              </Button>
                            )}
                            {getBusinessMessagesUrl() && (
                              <Button size="small" icon={<ExternalLink size={14} />} href={getBusinessMessagesUrl()} target="_blank" rel="noopener noreferrer">
                                Open in business dashboard
                              </Button>
                            )}
                            {selected.booking && (
                              <Button size="small" icon={<FileText size={14} />} href={`/admin/all-bookings?booking_id=${selected.booking}`} target="_blank" rel="noopener noreferrer">
                                View booking
                              </Button>
                            )}
                            <Button size="small" icon={<Copy size={14} />} onClick={copyConversationAsText}>
                              Copy conversation
                            </Button>
                          </AdminActionsRow>
                        </div>
                        <button type="button" onClick={closeConversation} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }} aria-label="Close">
                          <X size={20} />
                        </button>
                      </PanelHeader>
                      <MessagesArea>
                        {(selected.messages || []).length === 0 ? (
                          <Empty description="No messages" style={{ margin: "auto" }} />
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
                      </MessagesArea>
                    </ConversationPanel>
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
                    <AdminActionsRow>
                      {selected.booker_email && (
                        <Button size="small" icon={<Mail size={14} />} onClick={() => copyToClipboard(selected.booker_email, "Email")}>
                          Copy email
                        </Button>
                      )}
                      {getBusinessMessagesUrl() && (
                        <Button size="small" icon={<ExternalLink size={14} />} href={getBusinessMessagesUrl()} target="_blank" rel="noopener noreferrer">
                          Open in business dashboard
                        </Button>
                      )}
                      {selected.booking && (
                        <Button size="small" icon={<FileText size={14} />} href={`/admin/all-bookings?booking_id=${selected.booking}`} target="_blank" rel="noopener noreferrer">
                          View booking
                        </Button>
                      )}
                      <Button size="small" icon={<Copy size={14} />} onClick={copyConversationAsText}>
                        Copy conversation
                      </Button>
                    </AdminActionsRow>
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
                <MessagesArea style={{ flex: 1, minHeight: 0 }}>
                  {(selected.messages || []).length === 0 ? (
                    <Empty description="No messages" style={{ margin: "auto" }} />
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
                </MessagesArea>
              </AntDrawer>
            )}
          </>
        )}
      </PageWrap>
    </ConfigProvider>
  );
}
